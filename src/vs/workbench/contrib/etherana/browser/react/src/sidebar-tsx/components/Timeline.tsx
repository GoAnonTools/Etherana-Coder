/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import { Undo2 } from 'lucide-react';
import { CheckpointEntry } from '../../../../common/chatThreadServiceTypes.js';
import { useAccessor, useChatThreadsState, useChatThreadsStreamState, useFullChatThreadsStreamState } from '../../util/services.js';
import { EtheranaSlider } from '../../util/inputs.js';

export const Checkpoint = ({ message, threadId, messageIdx, isCheckpointGhost, threadIsRunning }: { message: CheckpointEntry, threadId: string; messageIdx: number, isCheckpointGhost: boolean, threadIsRunning: boolean }) => {
	const accessor = useAccessor();
	const chatThreadService = accessor.get('IChatThreadService');
	const streamState = useFullChatThreadsStreamState();
	const isRunning = useChatThreadsStreamState(threadId)?.isRunning;

	const isDisabled = useMemo(() => {
		if (isRunning) return true;
		return !!Object.keys(streamState).find((threadId2) => streamState[threadId2]?.isRunning);
	}, [isRunning, streamState]);

	return (
		<div className={`flex items-center justify-center px-2 `}>
			<div
				className={`text-xs text-etherana-fg-3 select-none ${isCheckpointGhost ? 'opacity-50' : 'opacity-100'} ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
				style={{ position: 'relative', display: 'inline-block' }}
				onClick={() => {
					if (threadIsRunning || isDisabled) return;
					chatThreadService.jumpToCheckpointBeforeMessageIdx({
						threadId,
						messageIdx,
						jumpToUserModified: messageIdx === (chatThreadService.state.allThreads[threadId]?.messages.length ?? 0) - 1
					});
				}}
				{...isDisabled ? { 'data-tooltip-id': 'etherana-tooltip', 'data-tooltip-content': `Disabled ${isRunning ? 'when running' : 'because another thread is running'}`, 'data-tooltip-place': 'top' } : {}}
			>
				Checkpoint
			</div>
		</div>
	);
};

export const CheckpointTimeline = ({ threadId }: { threadId: string }) => {
	const accessor = useAccessor();
	const chatThreadService = accessor.get('IChatThreadService');
	const chatThreadsState = useChatThreadsState();
	const thread = chatThreadsState.allThreads[threadId];

	if (!thread) return null;

	const messages = thread.messages;
	const checkpoints = messages.map((m, i) => ({ m, i })).filter(({ m }: { m: any }) => m.role === 'checkpoint');

	if (checkpoints.length === 0) return null;

	const currCheckpointIdx = thread.state?.currCheckpointIdx ?? undefined;
	const isAtPresent = currCheckpointIdx === undefined;
	const currentCPIndex = isAtPresent ? -1 : checkpoints.findIndex((cp: any) => cp.i === currCheckpointIdx);;

	return (
		<div className="px-4 py-2 bg-etherana-bg-1 border-b border-etherana-border-2 flex flex-col gap-1 shrink-0">
			<div className="flex justify-between items-center text-[10px] text-etherana-fg-3 uppercase tracking-wider font-semibold">
				<span>Checkpoint Timeline</span>
				<span>{isAtPresent ? 'Current Version' : `Version ${currentCPIndex + 1} / ${checkpoints.length}`}</span>
			</div>
			<div className="flex items-center gap-3">
				<EtheranaSlider
					min={0}
					max={checkpoints.length}
					step={1}
					value={isAtPresent ? checkpoints.length : (currentCPIndex === -1 ? 0 : currentCPIndex)}
					onChange={(val: number) => {
						if (val === checkpoints.length) {
							chatThreadService.jumpToCheckpointBeforeMessageIdx({ threadId, messageIdx: messages.length - 1, jumpToUserModified: true });
						} else {
							const target = checkpoints[val];
							chatThreadService.jumpToCheckpointBeforeMessageIdx({ threadId, messageIdx: target.i, jumpToUserModified: false });
						}
					}}
					width={160}
					size="xxs"
				/>
				{!isAtPresent && (
					<button
						className="p-1 hover:bg-white/10 rounded-md text-etherana-fg-3 transition-colors"
						onClick={() => {
							chatThreadService.jumpToCheckpointBeforeMessageIdx({ threadId, messageIdx: messages.length - 1, jumpToUserModified: true });
						}}
						title="Reset to Present"
					>
						<Undo2 size={12} />
					</button>
				)}
			</div>
		</div>
	);
};
