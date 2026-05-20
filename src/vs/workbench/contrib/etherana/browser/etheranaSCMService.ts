/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { ThemeIcon } from '../../../../base/common/themables.js'
import { localize2 } from '../../../../nls.js'
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js'
import { ContextKeyExpr, IContextKey, IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js'
import { ISCMService } from '../../scm/common/scm.js'
import { ProxyChannel } from '../../../../base/parts/ipc/common/ipc.js'
import { IEtheranaSCMService } from '../common/etheranaSCMTypes.js'
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js'
import { IEtheranaSettingsService } from '../common/etheranaSettingsService.js'
import { IConvertToLLMMessageService } from './convertToLLMMessageService.js'
import { ILLMMessageService } from '../common/sendLLMMessageService.js'
import { ModelSelection, OverridesOfModel, ModelSelectionOptions } from '../common/etheranaSettingsTypes.js'
import { gitCommitMessage_systemMessage, gitCommitMessage_userMessage } from '../common/prompt/prompts.js'
import { LLMChatMessage } from '../common/sendLLMMessageTypes.js'
import { generateUuid } from '../../../../base/common/uuid.js'
import { ThrottledDelayer } from '../../../../base/common/async.js'
import { CancellationError, isCancellationError } from '../../../../base/common/errors.js'
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js'
import { createDecorator, ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js'
import { Disposable } from '../../../../base/common/lifecycle.js'
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js'
import { ICommandService } from '../../../../platform/commands/common/commands.js'

interface ModelOptions {
	modelSelection: ModelSelection | null
	modelSelectionOptions?: ModelSelectionOptions
	overridesOfModel: OverridesOfModel
}

export interface IGenerateCommitMessageService {
	readonly _serviceBrand: undefined
	generateCommitMessage(): Promise<void>
	commitAndPush(): Promise<void>
	abort(): void
}

export const IGenerateCommitMessageService = createDecorator<IGenerateCommitMessageService>('voidGenerateCommitMessageService');

const loadingContextKey = 'etheranaSCMGenerateCommitMessageLoading'

class GenerateCommitMessageService extends Disposable implements IGenerateCommitMessageService {
	readonly _serviceBrand: undefined;
	private readonly execute = new ThrottledDelayer(300)
	private llmRequestId: string | null = null
	private currentRequestId: string | null = null
	private etheranaSCM: IEtheranaSCMService
	private loadingContextKey: IContextKey<boolean>

	constructor(
		@ISCMService private readonly scmService: ISCMService,
		@IMainProcessService mainProcessService: IMainProcessService,
		@IEtheranaSettingsService private readonly etheranaSettingsService: IEtheranaSettingsService,
		@IConvertToLLMMessageService private readonly convertToLLMMessageService: IConvertToLLMMessageService,
		@ILLMMessageService private readonly llmMessageService: ILLMMessageService,
		@IContextKeyService private readonly contextKeyService: IContextKeyService,
		@INotificationService private readonly notificationService: INotificationService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super()
		this.loadingContextKey = this.contextKeyService.createKey(loadingContextKey, false)
		this.etheranaSCM = ProxyChannel.toService<IEtheranaSCMService>(mainProcessService.getChannel('etherana-channel-scm'))
	}

	override dispose() {
		this.execute.dispose()
		super.dispose()
	}

	async generateCommitMessage() {
		this.loadingContextKey.set(true)
		this.execute.trigger(async () => {
			const requestId = generateUuid()
			this.currentRequestId = requestId


			try {
				const { path, repo } = this.gitRepoInfo()
				const [stat, sampledDiffs, branch, log] = await Promise.all([
					this.etheranaSCM.gitStat(path),
					this.etheranaSCM.gitSampledDiffs(path),
					this.etheranaSCM.gitBranch(path),
					this.etheranaSCM.gitLog(path)
				])

				if (!this.isCurrentRequest(requestId)) { throw new CancellationError() }

				const modelSelection = this.etheranaSettingsService.state.modelSelectionOfFeature['SCM'] ?? null
				const modelSelectionOptions = modelSelection ? this.etheranaSettingsService.state.optionsOfModelSelection['SCM'][modelSelection?.providerName]?.[modelSelection.modelName] : undefined
				const overridesOfModel = this.etheranaSettingsService.state.overridesOfModel

				const modelOptions: ModelOptions = { modelSelection, modelSelectionOptions, overridesOfModel }

				const prompt = gitCommitMessage_userMessage(stat, sampledDiffs, branch, log)

				const simpleMessages = [{ role: 'user', content: prompt } as const]
				const { messages, separateSystemMessage } = this.convertToLLMMessageService.prepareLLMSimpleMessages({
					simpleMessages,
					systemMessage: gitCommitMessage_systemMessage,
					modelSelection: modelOptions.modelSelection,
					featureName: 'SCM',
				})

				const { commitMessage, branchName } = await this.sendLLMMessage(messages, separateSystemMessage!, modelOptions)

				if (!this.isCurrentRequest(requestId)) { throw new CancellationError() }

				repo.input.setValue(commitMessage, false)

				if (branchName && branchName !== branch) {
					this.notificationService.prompt(
						Severity.Info,
						localize2('voidSuggestedBranch', 'Suggested Branch: {0}', branchName).value,
						[
							{
								label: localize2('voidCheckoutBranch', 'Checkout').value,
								run: async () => {
									try {
										await this.etheranaSCM.gitCheckoutBranch(path, branchName)
										this.notificationService.info(localize2('voidBranchCheckedOut', 'Checked out to {0}', branchName).value)

										if (this.etheranaSettingsService.state.globalSettings.autoPushAfterCommit) {
											this.notificationService.info(localize2('voidAutoPushEnabled', 'Auto-push is enabled. It will trigger after your next commit.').value)
										}
									} catch (e: any) {
										this.notificationService.error(e.message)
									}
								}
							}
						]
					)
				}

			} catch (error) {
				this.onError(error)
			} finally {
				if (this.isCurrentRequest(requestId)) {
					this.loadingContextKey.set(false)
				}
			}
		})
	}

	abort() {
		if (this.llmRequestId) {
			this.llmMessageService.abort(this.llmRequestId)
		}
		this.execute.cancel()
		this.loadingContextKey.set(false)
		this.currentRequestId = null
	}

	async commitAndPush() {
		try {
			const { path, repo } = this.gitRepoInfo()
			const message = repo.input.value
			if (!message) {
				this.notificationService.warn(localize2('voidNoCommitMessage', 'No commit message found.').value)
				return
			}

			// We need a way to commit.
			const command = repo.provider.acceptInputCommand;
			if (command) {
				await this.commandService.executeCommand(command.id, ...(command.arguments || []));
			}

			// Now push
			await this.etheranaSCM.gitPush(path)
			this.notificationService.info(localize2('voidPushSuccessful', 'Committed and pushed successfully').value)

		} catch (error) {
			this.onError(error)
		}
	}

	private gitRepoInfo() {
		const repo = Array.from(this.scmService.repositories || []).find((r: any) => r.provider.contextValue === 'git')
		if (!repo) { throw new Error('No git repository found') }
		if (!repo.provider.rootUri?.fsPath) { throw new Error('No git repository root path found') }
		return { path: repo.provider.rootUri.fsPath, repo }
	}

	/** LLM Functions */

	private sendLLMMessage(messages: LLMChatMessage[], separateSystemMessage: string, modelOptions: ModelOptions): Promise<{ commitMessage: string, branchName: string }> {
		return new Promise((resolve, reject) => {

			this.llmRequestId = this.llmMessageService.sendLLMMessage({
				messagesType: 'chatMessages',
				messages,
				separateSystemMessage,
				safetyMode: null,
				modelSelection: modelOptions.modelSelection,
				modelSelectionOptions: modelOptions.modelSelectionOptions,
				overridesOfModel: modelOptions.overridesOfModel,
				onText: () => { },
				onFinalMessage: (params: { fullText: string }) => {
					const commitMatch = params.fullText.match(/<output>([\s\S]*?)<\/output>/i)
					const commitMessage = commitMatch ? commitMatch[1].trim() : ''

					const branchMatch = params.fullText.match(/<branch>([\s\S]*?)<\/branch>/i)
					const branchName = branchMatch ? branchMatch[1].trim() : ''

					resolve({ commitMessage, branchName })
				},
				onError: (error) => {
					console.error(error)
					reject(error)
				},
				onAbort: () => {
					reject(new CancellationError())
				},
				logging: { loggingName: 'EtheranaSCM - Commit Message' },
			})
		})
	}


	/** Request Helpers */

	private isCurrentRequest(requestId: string) {
		return requestId === this.currentRequestId
	}


	/** UI Functions */

	private onError(error: any) {
		if (!isCancellationError(error)) {
			console.error(error)
			this.notificationService.error(localize2('voidFailedToGenerateCommitMessage', 'Failed to generate commit message.').value)
		}
	}
}

class GenerateCommitMessageAction extends Action2 {
	constructor() {
		super({
			id: 'etherana.generateCommitMessageAction',
			title: localize2('voidCommitMessagePrompt', 'Etherana Coder: Generate Commit Message'),
			icon: ThemeIcon.fromId('sparkle'),
			tooltip: localize2('voidCommitMessagePromptTooltip', 'Etherana Coder: Generate Commit Message'),
			f1: true,
			menu: [{
				id: MenuId.SCMInputBox,
				when: ContextKeyExpr.and(ContextKeyExpr.equals('scmProvider', 'git'), ContextKeyExpr.equals(loadingContextKey, false)),
				group: 'inline'
			}]
		})
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const generateCommitMessageService = accessor.get(IGenerateCommitMessageService)
		generateCommitMessageService.generateCommitMessage()
	}
}

class LoadingGenerateCommitMessageAction extends Action2 {
	constructor() {
		super({
			id: 'etherana.loadingGenerateCommitMessageAction',
			title: localize2('voidCommitMessagePromptCancel', 'Etherana Coder: Cancel Commit Message Generation'),
			icon: ThemeIcon.fromId('stop-circle'),
			tooltip: localize2('voidCommitMessagePromptCancelTooltip', 'Etherana Coder: Cancel Commit Message Generation'),
			f1: false, //Having a cancel command in the command palette is more confusing than useful.
			menu: [{
				id: MenuId.SCMInputBox,
				when: ContextKeyExpr.and(ContextKeyExpr.equals('scmProvider', 'git'), ContextKeyExpr.equals(loadingContextKey, true)),
				group: 'inline'
			}]
		})
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const generateCommitMessageService = accessor.get(IGenerateCommitMessageService)
		generateCommitMessageService.abort()
	}
}

class CommitAndPushAction extends Action2 {
	constructor() {
		super({
			id: 'etherana.commitAndPushAction',
			title: localize2('voidCommitAndPush', 'Etherana Coder: Commit & Push'),
			icon: ThemeIcon.fromId('cloud-upload'),
			tooltip: localize2('voidCommitAndPushTooltip', 'Etherana Coder: Commit & Push'),
			f1: true,
			menu: [{
				id: MenuId.SCMInputBox,
				when: ContextKeyExpr.and(ContextKeyExpr.equals('scmProvider', 'git'), ContextKeyExpr.equals(loadingContextKey, false)),
				group: 'inline'
			}]
		})
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const generateCommitMessageService = accessor.get(IGenerateCommitMessageService)
		generateCommitMessageService.commitAndPush()
	}
}

registerAction2(GenerateCommitMessageAction)
registerAction2(LoadingGenerateCommitMessageAction)
registerAction2(CommitAndPushAction)
registerSingleton(IGenerateCommitMessageService, GenerateCommitMessageService, InstantiationType.Delayed)
