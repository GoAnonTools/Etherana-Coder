import { ILLMMessageService } from '../../common/sendLLMMessageService.js';
import { ModelSelection, ModelSelectionOptions } from '../../common/etheranaSettingsTypes.js';
import { LLMChatMessage, RawToolCallObj, AnthropicReasoning } from '../../common/sendLLMMessageTypes.js';

export type LLMResponse =
	| { type: 'llmDone', toolCall?: RawToolCallObj, info: { fullText: string, fullReasoning: string, anthropicReasoning: AnthropicReasoning[] | null } }
	| { type: 'llmError', error?: { message: string; fullError: Error | null; } }
	| { type: 'llmAborted' };

export class LLMStreamer {
	constructor(
		private readonly _llmMessageService: ILLMMessageService,
	) {}

	public sendLLMMessage(opts: {
		messages: LLMChatMessage[],
		modelSelection: ModelSelection | null,
		modelSelectionOptions: ModelSelectionOptions | undefined,
		safetyMode: string,
		separateSystemMessage: string | undefined,
		overridesOfModel: any,
		loggingName: string,
		loggingExtras: any,
		onText: (data: { fullText: string, fullReasoning: string, toolCall?: RawToolCallObj }) => void,
		onFinalMessage: (data: { fullText: string, fullReasoning: string, toolCall?: RawToolCallObj, anthropicReasoning: AnthropicReasoning[] | null }) => Promise<void>,
		onError: (error: any) => Promise<void>,
		onAbort: () => void,
	}) {
		return this._llmMessageService.sendLLMMessage({
			messagesType: 'chatMessages',
			messages: opts.messages,
			modelSelection: opts.modelSelection,
			modelSelectionOptions: opts.modelSelectionOptions,
			safetyMode: opts.safetyMode as any,
			separateSystemMessage: opts.separateSystemMessage,
			overridesOfModel: opts.overridesOfModel,
			logging: { loggingName: opts.loggingName, loggingExtras: opts.loggingExtras },
			onText: opts.onText,
			onFinalMessage: opts.onFinalMessage,
			onError: opts.onError,
			onAbort: opts.onAbort,
		});
	}
}
