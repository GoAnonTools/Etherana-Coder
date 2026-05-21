import { LLMChatMessage } from '../../common/sendLLMMessageTypes.js';

export class ContextManager {
    public static injectTerminalContext(messages: LLMChatMessage[], terminalContent: string) {
        if (messages.length === 0) return;

        const terminalMsg = `[TERMINAL MEMORY]\n${terminalContent}\n[END TERMINAL MEMORY]`;
        const lastIdx = messages.length - 1;
        const lastMsg = { ...messages[lastIdx] } as any;

        if ('content' in lastMsg) {
            if (typeof lastMsg.content === 'string') {
                lastMsg.content = `${terminalMsg}\n\n${lastMsg.content}`;
            } else if (Array.isArray(lastMsg.content)) {
                lastMsg.content = [{ type: 'text', text: terminalMsg }, ...lastMsg.content];
            }
        } else if ('parts' in lastMsg) {
            lastMsg.parts = [{ text: terminalMsg }, ...lastMsg.parts];
        }
        
        messages[lastIdx] = lastMsg;
    }

    public static injectProjectMemoryContext(messages: LLMChatMessage[], memoryContent: string) {
        if (messages.length === 0) return;

        const memoryMsg = `[PROJECT MEMORY]\n${memoryContent}\n[END PROJECT MEMORY]`;
        const lastIdx = messages.length - 1;
        const lastMsg = { ...messages[lastIdx] } as any;

        if ('content' in lastMsg) {
            if (typeof lastMsg.content === 'string') {
                lastMsg.content = `${memoryMsg}\n\n${lastMsg.content}`;
            } else if (Array.isArray(lastMsg.content)) {
                lastMsg.content = [{ type: 'text', text: memoryMsg }, ...lastMsg.content];
            }
        } else if ('parts' in lastMsg) {
            lastMsg.parts = [{ text: memoryMsg }, ...lastMsg.parts];
        }

        messages[lastIdx] = lastMsg;
    }
}
