/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccessor, useChatThreadsState, useChatThreadsStreamState, useSettingsState } from '../util/services.js';
import { ETHERANA_CTRL_L_ACTION_ID } from '../../../actionIDs.js';
import { ETHERANA_OPEN_SETTINGS_ACTION_ID } from '../../../etheranaSettingsPane.js';
import { FeatureName, isFeatureNameDisabled } from '../../../../../../../workbench/contrib/etherana/common/etheranaSettingsTypes.js';
import { StagingSelectionItem } from '../../../../common/chatThreadServiceTypes.js';
import { WarningBox } from '../etherana-settings-tsx/WarningBox.js';
import { ErrorDisplay } from './ErrorDisplay.js';
import { PastThreadsList } from './SidebarThreadSelector.js';
import ErrorBoundary from './ErrorBoundary.js';
import { EtheranaInputBox2, TextAreaFns } from '../util/inputs.js';

// New Modular Components
import { IconLoading } from './components/ChatIcons.js';
import { ProseWrapper, ScrollToBottomContainer, scrollToBottom } from './components/ChatUtils.js';
import { ChatBubble } from './components/ChatMessages.js';
import { CheckpointTimeline } from './components/Timeline.js';
import { EtheranaChatArea, CommandBarInChat } from './components/ChatInput.js';
import { FeatureBrief } from './FeatureBrief.js';
import { Share2 } from 'lucide-react';

export { EtheranaChatArea }; // Export for sub-components until fully decoupled

export const SidebarChat = () => {
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
	const textAreaFnsRef = useRef<TextAreaFns | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const accessor = useAccessor();
	const commandService = accessor.get('ICommandService');
	const chatThreadsService = accessor.get('IChatThreadService');
	const settingsState = useSettingsState();
	const chatThreadsState = useChatThreadsState();
	const threadId = chatThreadsState.currentThreadId;
	const currentThread = chatThreadsService.getCurrentThread();
	const previousMessages = currentThread?.messages ?? [];
	const selections = currentThread.state.stagingSelections;
	const setSelections = (s: StagingSelectionItem[]) => chatThreadsService.setCurrentThreadState({ stagingSelections: s });

	const currThreadStreamState = useChatThreadsStreamState(threadId);
	const isRunning = currThreadStreamState?.isRunning;
	const latestError = currThreadStreamState?.error;
	const { displayContentSoFar, reasoningSoFar } = currThreadStreamState?.llmInfo ?? {};

	const [instructionsAreEmpty, setInstructionsAreEmpty] = useState(true);
	const [showBrief, setShowBrief] = useState(false);
	const isDisabled = instructionsAreEmpty || !!isFeatureNameDisabled('Chat', settingsState);

	const onSubmit = useCallback(async (_forceSubmit?: string) => {
		if ((isDisabled && !_forceSubmit) || isRunning) return;
		const userMessage = _forceSubmit || textAreaRef.current?.value || '';
		try {
			await chatThreadsService.addUserMessageAndStreamResponse({ userMessage, threadId });
		} catch (e) { console.error('Error while sending message:', e); }
		setSelections([]);
		textAreaFnsRef.current?.setValue('');
		textAreaRef.current?.focus();
	}, [chatThreadsService, isDisabled, isRunning, threadId, setSelections]);

	const onAbort = () => chatThreadsService.abortRunning(threadId);

	const keybindingString = accessor.get('IKeybindingService').lookupKeybinding(ETHERANA_CTRL_L_ACTION_ID)?.getLabel();
	const currCheckpointIdx = chatThreadsState.allThreads[threadId]?.state?.currCheckpointIdx ?? undefined;

	useEffect(() => {
		const mountedInfo = chatThreadsState.allThreads[threadId]?.state.mountedInfo;
		if (!mountedInfo?.mountedIsResolvedRef.current) {
			mountedInfo?._whenMountedResolver?.({
				textAreaRef: textAreaRef,
				scrollToBottom: () => scrollToBottom(scrollContainerRef),
			});
		}
	}, [chatThreadsState, threadId]);

	const previousMessagesHTML = useMemo(() => (
		previousMessages.map((message, i) => (
			<ChatBubble
				key={i}
				currCheckpointIdx={currCheckpointIdx}
				chatMessage={message}
				messageIdx={i}
				isCommitted={true}
				chatIsRunning={isRunning}
				threadId={threadId}
				_scrollToBottom={() => scrollToBottom(scrollContainerRef)}
			/>
		))
	), [previousMessages, threadId, currCheckpointIdx, isRunning]);

	const currStreamingMessageHTML = (reasoningSoFar || displayContentSoFar || isRunning) ? (
		<ChatBubble
			key={'curr-streaming-msg'}
			currCheckpointIdx={currCheckpointIdx}
			chatMessage={{
				role: 'assistant',
				displayContent: displayContentSoFar ?? '',
				reasoning: reasoningSoFar ?? '',
			} as any}
			messageIdx={previousMessagesHTML.length}
			isCommitted={false}
			chatIsRunning={isRunning}
			threadId={threadId}
			_scrollToBottom={null}
		/>
	) : null;

	const messagesHTML = (
		<ScrollToBottomContainer
			key={'messages' + threadId}
			scrollContainerRef={scrollContainerRef}
			className={`flex flex-col px-4 py-4 space-y-4 w-full h-full overflow-x-hidden overflow-y-auto ${previousMessagesHTML.length === 0 && !displayContentSoFar ? 'hidden' : ''}`}
		>
			{previousMessagesHTML}
			{currStreamingMessageHTML}
			{(isRunning === 'LLM' || isRunning === 'tool' || isRunning === 'idle') && (
				<ProseWrapper><IconLoading className='opacity-50 text-sm' /></ProseWrapper>
			)}
			{latestError && (
				<div className='px-2 my-1'>
					<ErrorDisplay message={latestError.message} fullError={latestError.fullError} onDismiss={() => chatThreadsService.dismissStreamError(threadId)} showDismiss={true} />
					<WarningBox className='text-sm my-2 mx-4' onClick={() => commandService.executeCommand(ETHERANA_OPEN_SETTINGS_ACTION_ID)} text='Open settings' />
				</div>
			)}
		</ScrollToBottomContainer>
	);

	const isLandingPage = previousMessages.length === 0;

	const inputComponent = (
		<EtheranaChatArea
			featureName='Chat'
			onSubmit={() => onSubmit()}
			onAbort={onAbort}
			isStreaming={!!isRunning}
			isDisabled={isDisabled}
			showSelections={true}
			selections={selections}
			setSelections={setSelections}
			onClickAnywhere={() => textAreaRef.current?.focus()}
		>
			<EtheranaInputBox2
				enableAtToMention
				className='min-h-[81px] px-0.5 py-0.5'
				placeholder={`@ to mention, ${keybindingString ? `${keybindingString} to add. ` : ''}Enter instructions...`}
				onChangeText={(text: string) => setInstructionsAreEmpty(!text)}
				onKeyDown={(e: any) => {
					if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) onSubmit();
					else if (e.key === 'Escape' && isRunning) onAbort();
				}}
				onFocus={() => chatThreadsService.setCurrentlyFocusedMessageIdx(undefined)}
				ref={textAreaRef}
				fnsRef={textAreaFnsRef}
				multiline={true}
			/>
		</EtheranaChatArea>
	);

	if (isLandingPage) {
		return (
			<div className='w-full h-full flex flex-col overflow-auto px-4'>
				<div className='pt-8'>{inputComponent}</div>
				<div className='pt-8 mb-2 text-etherana-fg-3 text-root select-none pointer-events-none'>
					{Object.keys(chatThreadsState.allThreads).length > 1 ? 'Previous Threads' : 'Suggestions'}
				</div>
				{Object.keys(chatThreadsState.allThreads).length > 1 ? <PastThreadsList /> : (
					<div className='flex flex-col gap-2 w-full text-etherana-fg-3 select-none'>
						{['Summarize my codebase', 'How do types work in Rust?', 'Create a .etheranarules file'].map((text, i) => (
							<div key={i} className='py-1 px-2 rounded text-sm bg-zinc-300/5 hover:bg-zinc-300/10 cursor-pointer opacity-80' onClick={() => onSubmit(text)}>{text}</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className='w-full h-full flex flex-col overflow-hidden'>
			<div className="flex items-center justify-between px-4 py-2 border-b border-etherana-border-2 bg-etherana-bg-1/50 backdrop-blur-sm sticky top-0 z-10">
				<ErrorBoundary><CheckpointTimeline threadId={threadId} /></ErrorBoundary>
				{!isLandingPage && (
					<button
						onClick={() => setShowBrief(true)}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/20"
						title="Share Session Brief"
					>
						<Share2 size={12} />
						Brief
					</button>
				)}
			</div>
			{showBrief && <FeatureBrief threadId={threadId} onClose={() => setShowBrief(false)} />}
			<ErrorBoundary>{messagesHTML}</ErrorBoundary>
			<div className='px-4'><ErrorBoundary><CommandBarInChat /></ErrorBoundary></div>
			<div className='px-2 pb-2'><ErrorBoundary>{inputComponent}</ErrorBoundary></div>
		</div>
	);
};
