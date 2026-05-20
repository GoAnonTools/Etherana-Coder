/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ITerminalToolService } from './terminalToolService.js';
import { IEtheranaSettingsService } from '../common/etheranaSettingsService.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { ITerminalService } from '../../../../workbench/contrib/terminal/browser/terminal.js';
import { redactSecrets } from './terminalRedactor.js';
import { IDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { ProviderName, localProviderNames } from '../common/etheranaSettingsTypes.js';

export interface ITerminalMemoryService {
	readonly _serviceBrand: undefined;
	getRecentTerminalContext(opts: { providerName: ProviderName }): Promise<{ content: string; metadata: any } | null>;
}

export const ITerminalMemoryService = createDecorator<ITerminalMemoryService>('TerminalMemoryService');

export class TerminalMemoryService extends Disposable implements ITerminalMemoryService {
	readonly _serviceBrand: undefined;

	constructor(
		@ITerminalToolService private readonly terminalToolService: ITerminalToolService,
		@IEtheranaSettingsService private readonly settingsService: IEtheranaSettingsService,
		@ITerminalService private readonly terminalService: ITerminalService,
		@IDialogService private readonly dialogService: IDialogService,
	) {
		super();
	}

	private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
		return await Promise.race([
			promise,
			new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
		]);
	}

	async getRecentTerminalContext(opts: { providerName: ProviderName }): Promise<{ content: string; metadata: any } | null> {
		const settings = this.settingsService.state.globalSettings.terminalMemory;
		if (!settings || !settings.enabled) return null;

		const activeInstance = this.terminalService.activeInstance;
		if (!activeInstance) {
			console.warn('[TerminalMemory] No active terminal instance found.');
			return { content: '', metadata: { terminalMemoryStatus: 'empty' } };
		}

		const isLocal = (localProviderNames as string[]).includes(opts.providerName);
		if (!isLocal && settings.askBeforeCloud) {
			const confirmation = await this.dialogService.confirm({
				message: `Terminal output may contain secrets, tokens, paths, or private data.\nSend the last ${settings.maxLines} lines to this cloud model (${opts.providerName}) for this request?`,
				primaryButton: 'Send Once',
				cancelButton: 'Cancel',
				checkbox: { label: 'Always allow for future requests', checked: false }
			});

			if (!confirmation.confirmed) {
				return { content: '', metadata: { terminalMemoryStatus: 'cancelled' } };
			}

			if (confirmation.checkboxChecked) {
				this.settingsService.setGlobalSetting('terminalMemory', {
					...settings,
					askBeforeCloud: false
				});
			}
		}

		try {
			const terminalId = this.terminalToolService.getTerminalId(activeInstance);

			// 2000ms timeout to ensure we never block the main LLM request
			const rawContent = await this.withTimeout(
				this.terminalToolService.readTerminal(terminalId, settings.maxLines),
				2000
			);

			if (rawContent === null) {
				console.warn('[TerminalMemory] Timeout reading terminal context (2000ms exceeded).');
				return { content: '', metadata: { terminalMemoryStatus: 'timeout' } };
			}

			let content = rawContent;
			if (!content.trim()) {
				console.warn('[TerminalMemory] Terminal context is empty.');
				return { content: '', metadata: { terminalMemoryStatus: 'empty' } };
			}

			let redactionApplied = false;
			if (settings.redactSecrets) {
				const { redactedText, count } = redactSecrets(content);
				content = redactedText;
				redactionApplied = count > 0;
			}

			return {
				content: content,
				metadata: {
					terminalId: activeInstance.instanceId,
					lines: settings.maxLines,
					redactionApplied,
					providerName: opts.providerName,
					isLocal,
					terminalMemoryStatus: 'included'
				}
			};
		} catch (e) {
			console.warn('[TerminalMemory] Error reading terminal context:', e);
			return { content: '', metadata: { terminalMemoryStatus: 'error' } };
		}
	}
}

registerSingleton(ITerminalMemoryService, TerminalMemoryService, InstantiationType.Delayed);
