/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { ChatMessage, CheckpointEntry, StagingSelectionItem } from '../../../../common/chatThreadServiceTypes.js';
import { useAccessor } from '../../util/services.js';
import { ChatMarkdownRender, ChatMessageLocation } from '../../markdown/ChatMarkdownRender.js';
import { EtheranaInputBox2, TextAreaFns } from '../../util/inputs.js';
import { IsRunningType } from '../../../chatThreadService.js';
import ErrorBoundary from '../ErrorBoundary.js';
import { IconLoading } from './ChatIcons.js';
import { ProseWrapper, SmallProseWrapper, ToolHeaderWrapper, voidOpenFileFn } from './ChatUtils.js';
import { SelectedFiles } from './ChatSelectedFiles.js';
import { EtheranaChatArea } from '../SidebarChat.js'; // Updated path
import { PlanPreview } from '../PlanPreview.js';
import { ToolResultWrapperComp } from './ToolUIs.js'; // Will be created next
import { Checkpoint } from './Timeline.js'; // Will be created next

export const ReasoningWrapper = ({ isDoneReasoning, isStreaming, children }: { isDoneReasoning: boolean, isStreaming: boolean, children: React.ReactNode }) => {
	const isDone = isDoneReasoning || !isStreaming;
	const isWriting = !isDone;
	const [isOpen, setIsOpen] = useState(isWriting);
	useEffect(() => {
		if (!isWriting) setIsOpen(false);
	}, [isWriting]);
	return (
		<ToolHeaderWrapper title='Reasoning' desc1={isWriting ? <IconLoading /> : ''} isOpen={isOpen} onClick={() => setIsOpen(v => !v)}>
			<div className='px-2 min-w-full overflow-hidden'>
				<div className='!select-text cursor-auto'>
					{children}
				</div>
			</div>
		</ToolHeaderWrapper>
	);
};

export const AssistantMessageComponent = ({ chatMessage, isCheckpointGhost, isCommitted, messageIdx }: { chatMessage: ChatMessage & { role: 'assistant' }, isCheckpointGhost: boolean, messageIdx: number, isCommitted: boolean }) => {
	const accessor = useAccessor();
	const chatThreadsService = accessor.get('IChatThreadService');
	const thread = chatThreadsService.getCurrentThread();
	const reasoningStr = chatMessage.reasoning?.trim() || null;
	const hasReasoning = !!reasoningStr;
	const isDoneReasoning = !!chatMessage.displayContent;
	const chatMessageLocation: ChatMessageLocation = { threadId: thread.id, messageIdx: messageIdx };

	if (!chatMessage.displayContent && !chatMessage.reasoning) return null;

	return (
		<>
			{hasReasoning && (
				<div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
					<ReasoningWrapper isDoneReasoning={isDoneReasoning} isStreaming={!isCommitted}>
						<SmallProseWrapper>
							<ChatMarkdownRender string={reasoningStr} chatMessageLocation={chatMessageLocation} isApplyEnabled={false} isLinkDetectionEnabled={true} />
						</SmallProseWrapper>
					</ReasoningWrapper>
				</div>
			)}
			{chatMessage.displayContent && (
				<div className={`${isCheckpointGhost ? 'opacity-50' : ''}`}>
					<ProseWrapper>
						<ChatMarkdownRender string={chatMessage.displayContent || ''} chatMessageLocation={chatMessageLocation} isApplyEnabled={true} isLinkDetectionEnabled={true} />
					</ProseWrapper>
				</div>
			)}
		</>
	);
};

export const UserMessageComponent = ({ chatMessage, messageIdx, isCheckpointGhost, currCheckpointIdx, _scrollToBottom }: { chatMessage: ChatMessage & { role: 'user' }, messageIdx: number, currCheckpointIdx: number | undefined, isCheckpointGhost: boolean, _scrollToBottom: (() => void) | null }) => {
	const accessor = useAccessor();
	const chatThreadsService = accessor.get('IChatThreadService');
	const _state = chatThreadsService.getCurrentMessageState(messageIdx);
	const isBeingEdited = _state.isBeingEdited;
	const stagingSelections = _state.stagingSelections;
	const setIsBeingEdited = (v: boolean) => chatThreadsService.setCurrentMessageState(messageIdx, { isBeingEdited: v });
	const setStagingSelections = (s: StagingSelectionItem[]) => chatThreadsService.setCurrentMessageState(messageIdx, { stagingSelections: s });

	const mode = isBeingEdited ? 'edit' : 'display';
	const [isFocused, setIsFocused] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isDisabled, setIsDisabled] = useState(false);
	const [textAreaRefState, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null);
	const textAreaFnsRef = useRef<TextAreaFns | null>(null);
	const _mustInitialize = useRef(true);
	const _justEnabledEdit = useRef(false);

	useEffect(() => {
		if (mode === 'edit' && textAreaRefState && (_justEnabledEdit.current || _mustInitialize.current)) {
			setStagingSelections((chatMessage.selections || []).map((s: StagingSelectionItem) => s.type === 'File' ? { ...s, state: { ...s.state, wasAddedAsCurrentFile: false } } : s));
			textAreaFnsRef.current?.setValue(chatMessage.displayContent || '');
			textAreaRefState.focus();
			_justEnabledEdit.current = false;
			_mustInitialize.current = false;
		}
	}, [chatMessage, mode, textAreaRefState]);

	const onOpenEdit = () => { setIsBeingEdited(true); chatThreadsService.setCurrentlyFocusedMessageIdx(messageIdx); _justEnabledEdit.current = true; };
	const onCloseEdit = () => { setIsFocused(false); setIsHovered(false); setIsBeingEdited(false); chatThreadsService.setCurrentlyFocusedMessageIdx(undefined); };

	const EditSymbol = isBeingEdited ? X : Pencil;

	if (mode === 'edit') {
		const onSubmit = async () => {
			if (isDisabled || !textAreaRefState) return;
			const threadId = chatThreadsService.state.currentThreadId;
			await chatThreadsService.abortRunning(threadId);
			setIsBeingEdited(false);
			chatThreadsService.setCurrentlyFocusedMessageIdx(undefined);
			try {
				await chatThreadsService.editUserMessageAndStreamResponse({ userMessage: textAreaRefState.value, messageIdx, threadId });
			} catch (e) { console.error('Error while editing message:', e); }
			await chatThreadsService.focusCurrentChat();
			requestAnimationFrame(() => _scrollToBottom?.());
		};

		return (
			<div className="relative w-full ml-auto" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
				<div className="text-left rounded-lg max-w-full">
					<EtheranaChatArea
						featureName='Chat'
						onSubmit={onSubmit}
						onAbort={() => chatThreadsService.abortRunning(chatThreadsService.state.currentThreadId)}
						isStreaming={false}
						isDisabled={isDisabled}
						showSelections={true}
						showProspectiveSelections={false}
						selections={stagingSelections}
						setSelections={setStagingSelections}
					>
						<EtheranaInputBox2
							enableAtToMention
							ref={setTextAreaRef}
							className='min-h-[81px] max-h-[500px] px-0.5'
							placeholder="Edit your message..."
							onChangeText={(text) => setIsDisabled(!text)}
							onFocus={() => { setIsFocused(true); chatThreadsService.setCurrentlyFocusedMessageIdx(messageIdx); }}
							onBlur={() => setIsFocused(false)}
							onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
								if (e.key === 'Escape') onCloseEdit();
								if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) onSubmit();
							}}
							fnsRef={textAreaFnsRef}
							multiline={true}
						/>
					</EtheranaChatArea>
				</div>
				<div className="absolute -top-1 -right-1 z-1">
					<EditSymbol size={18} className={`cursor-pointer p-[2px] bg-etherana-bg-1 border border-etherana-border-1 rounded-md transition-opacity duration-200 ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}`} onClick={onCloseEdit} />
				</div>
			</div>
		);
	}

	const isMsgAfterCheckpoint = currCheckpointIdx !== undefined && currCheckpointIdx === messageIdx - 1;

	return (
		<div className={`relative ml-auto self-end w-fit max-w-full whitespace-pre-wrap ${isCheckpointGhost && !isMsgAfterCheckpoint ? 'opacity-50 pointer-events-none' : ''}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
			<div className="text-left rounded-lg max-w-full p-2 flex flex-col bg-etherana-bg-1 text-etherana-fg-1 overflow-x-auto cursor-pointer" onClick={onOpenEdit}>
				<SelectedFiles type='past' messageIdx={messageIdx} selections={chatMessage.selections || []} />
				<span className='px-0.5'>{chatMessage.displayContent}</span>
			</div>
			<div className="absolute -top-1 -right-1 z-1">
				<EditSymbol size={18} className={`cursor-pointer p-[2px] bg-etherana-bg-1 border border-etherana-border-1 rounded-md transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} onClick={onOpenEdit} />
			</div>
		</div>
	);
};

export interface ChatBubbleProps {
	chatMessage: ChatMessage,
	messageIdx: number,
	isCommitted: boolean,
	chatIsRunning: IsRunningType,
	threadId: string,
	currCheckpointIdx: number | undefined,
	_scrollToBottom: (() => void) | null,
}

export const ChatBubble = (props: ChatBubbleProps) => (
	<ErrorBoundary>
		<_ChatBubble {...props} />
	</ErrorBoundary>
);

const _ChatBubble = ({ threadId, chatMessage, currCheckpointIdx, isCommitted, messageIdx, chatIsRunning, _scrollToBottom }: ChatBubbleProps) => {
	const role = chatMessage.role;
	const isCheckpointGhost = messageIdx > (currCheckpointIdx ?? Infinity) && !chatIsRunning;

	if (role === 'user') {
		return <UserMessageComponent chatMessage={chatMessage} isCheckpointGhost={isCheckpointGhost} currCheckpointIdx={currCheckpointIdx} messageIdx={messageIdx} _scrollToBottom={_scrollToBottom} />;
	} else if (role === 'assistant') {
		return <AssistantMessageComponent chatMessage={chatMessage} isCheckpointGhost={isCheckpointGhost} messageIdx={messageIdx} isCommitted={isCommitted} />;
	} else if (role === 'tool') {
		return <ToolResultWrapperComp chatMessage={chatMessage} messageIdx={messageIdx} threadId={threadId} isCheckpointGhost={isCheckpointGhost} />;
	} else if (role === 'interrupted_streaming_tool') {
		return null; // Will add CanceledTool later
	} else if (role === 'plan') {
		return <PlanPreview plan={chatMessage} threadId={threadId} messageIdx={messageIdx} />;
	} else if (role === 'checkpoint') {
		return <Checkpoint threadId={threadId} message={chatMessage} messageIdx={messageIdx} isCheckpointGhost={isCheckpointGhost} threadIsRunning={!!chatIsRunning} />;
	}
	return null;
};
