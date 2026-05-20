import { LLMChatMessage } from '../../common/sendLLMMessageTypes.js';

export class ContextManager {
    public static injectTerminalContext(messages: LLMChatMessage[], terminalContent: string) {
        const terminalMsg = `[TERMINAL MEMORY]\n${terminalContent}\n[END TERMINAL MEMORY]`;
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        if ('content' in lastMsg) {
            if (typeof lastMsg.content === 'string') {
                lastMsg.content = `${terminalMsg}\n\n${lastMsg.content}`;
            } else if (Array.isArray(lastMsg.content)) {
                lastMsg.content.unshift({ type: 'text', text: terminalMsg });
            }
        } else if ('parts' in lastMsg) {
            lastMsg.parts.unshift({ text: terminalMsg });
        }
    }

    public static injectProjectMemoryContext(messages: LLMChatMessage[], memoryContent: string) {
        const memoryMsg = `[PROJECT MEMORY]\n${memoryContent}\n[END PROJECT MEMORY]`;
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        if ('content' in lastMsg) {
            if (typeof lastMsg.content === 'string') {
                lastMsg.content = `${memoryMsg}\n\n${lastMsg.content}`;
            } else if (Array.isArray(lastMsg.content)) {
                lastMsg.content.unshift({ type: 'text', text: memoryMsg });
            }
        } else if ('parts' in lastMsg) {
            lastMsg.parts.unshift({ text: memoryMsg });
        }
    }
}
