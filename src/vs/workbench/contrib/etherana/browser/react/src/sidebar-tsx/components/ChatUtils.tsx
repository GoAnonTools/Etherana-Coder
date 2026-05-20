/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import { URI } from '../../../../../../../base/common/uri.js';
import { ScrollType } from '../../../../../../../editor/common/editorCommon.js';
import { useAccessor } from '../../util/services.js';
import { ChevronRight, CircleEllipsis, AlertTriangle, Ban } from 'lucide-react';

// --- Path & File Utilities ---

export const getRelative = (uri: URI, accessor: ReturnType<typeof useAccessor>) => {
	const workspaceContextService = accessor.get('IWorkspaceContextService');
	let path: string;
	const isInside = workspaceContextService.isInsideWorkspace(uri);
	if (isInside) {
		const f = workspaceContextService.getWorkspace().folders.find(f => uri.fsPath?.startsWith(f.uri.fsPath));
		if (f) { path = uri.fsPath.replace(f.uri.fsPath, ''); }
		else { path = uri.fsPath; }
	} else {
		path = uri.fsPath;
	}
	return path || undefined;
};

export const getFolderName = (pathStr: string) => {
	pathStr = pathStr.replace(/[/\\]+/g, '/');
	const parts = pathStr.split('/');
	const nonEmptyParts = parts.filter(part => part.length > 0);
	if (nonEmptyParts.length === 0) return '/';
	if (nonEmptyParts.length === 1) return nonEmptyParts[0] + '/';
	const lastTwo = nonEmptyParts.slice(-2);
	return lastTwo.join('/') + '/';
};

export const getBasename = (pathStr: string, parts: number = 1) => {
	pathStr = pathStr.replace(/[/\\]+/g, '/');
	const allParts = pathStr.split('/');
	if (allParts.length === 0) return pathStr;
	return allParts.slice(-parts).join('/');
};

export const voidOpenFileFn = (
	uri: URI,
	accessor: ReturnType<typeof useAccessor>,
	range?: [number, number]
) => {
	const commandService = accessor.get('ICommandService');
	const editorService = accessor.get('ICodeEditorService');

	let editorSelection = undefined;
	if (range) {
		editorSelection = {
			startLineNumber: range[0],
			startColumn: 1,
			endLineNumber: range[1],
			endColumn: Number.MAX_SAFE_INTEGER,
		};
	}

	commandService.executeCommand('vscode.open', uri).then(() => {
		setTimeout(() => {
			if (!editorSelection) return;
			const editor = editorService.getActiveCodeEditor();
			if (!editor) return;
			editor.setSelection(editorSelection);
			editor.revealRange(editorSelection, ScrollType.Immediate);
		}, 50);
	});
};

// --- Layout Wrappers ---

export const ProseWrapper = ({ children }: { children: React.ReactNode }) => (
	<div className='text-etherana-fg-2 prose prose-sm break-words prose-p:block prose-hr:my-4 prose-pre:my-2 marker:text-inherit prose-ol:list-outside prose-ol:list-decimal prose-ul:list-outside prose-ul:list-disc prose-li:my-0 prose-code:before:content-none prose-code:after:content-none prose-headings:prose-sm prose-headings:font-bold prose-p:leading-normal prose-ol:leading-normal prose-ul:leading-normal max-w-none'>
		{children}
	</div>
);

export const SmallProseWrapper = ({ children }: { children: React.ReactNode }) => (
	<div className='text-etherana-fg-4 prose prose-sm break-words max-w-none leading-snug text-[13px] [&>:first-child]:!mt-0 [&>:last-child]:!mb-0 prose-h1:text-[14px] prose-h1:my-4 prose-h2:text-[13px] prose-h2:my-4 prose-h3:text-[13px] prose-h3:my-3 prose-h4:text-[13px] prose-h4:my-2 prose-p:my-2 prose-p:leading-snug prose-hr:my-2 prose-ul:my-2 prose-ul:pl-4 prose-ul:list-outside prose-ul:list-disc prose-ul:leading-snug prose-ol:my-2 prose-ol:pl-4 prose-ol:list-outside prose-ol:list-decimal prose-ol:leading-snug marker:text-inherit prose-blockquote:pl-2 prose-blockquote:my-2 prose-code:text-etherana-fg-3 prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none prose-pre:text-[12px] prose-pre:p-2 prose-pre:my-2 prose-table:text-[13px]'>
		{children}
	</div>
);

export type ToolHeaderParams = {
	icon?: React.ReactNode;
	title: React.ReactNode;
	desc1: React.ReactNode;
	desc1OnClick?: () => void;
	desc2?: React.ReactNode;
	isError?: boolean;
	info?: string;
	desc1Info?: string;
	isRejected?: boolean;
	numResults?: number;
	hasNextPage?: boolean;
	children?: React.ReactNode;
	bottomChildren?: React.ReactNode;
	onClick?: () => void;
	desc2OnClick?: () => void;
	isOpen?: boolean;
	className?: string;
};

export const ToolHeaderWrapper = ({
	title,
	desc1,
	desc1OnClick,
	desc1Info,
	desc2,
	numResults,
	hasNextPage,
	children,
	info,
	bottomChildren,
	isError,
	onClick,
	desc2OnClick,
	isOpen,
	isRejected,
	className,
}: ToolHeaderParams) => {
	const [isOpen_, setIsOpen] = useState(false);
	const isExpanded = isOpen !== undefined ? isOpen : isOpen_;
	const isDropdown = children !== undefined;
	const isClickable = !!(isDropdown || onClick);
	const isDesc1Clickable = !!desc1OnClick;

	const desc1HTML = (
		<span
			className={`text-etherana-fg-4 text-xs italic truncate ml-2 ${isDesc1Clickable ? 'cursor-pointer hover:brightness-125 transition-all duration-150' : ''}`}
			onClick={desc1OnClick}
			{...desc1Info ? { 'data-tooltip-id': 'etherana-tooltip', 'data-tooltip-content': desc1Info, 'data-tooltip-place': 'top', 'data-tooltip-delay-show': 1000 } : {}}
		>
			{desc1}
		</span>
	);

	return (
		<div>
			<div className={`w-full border border-etherana-border-3 rounded px-2 py-1 bg-etherana-bg-3 overflow-hidden ${className}`}>
				<div className={`select-none flex items-center min-h-[24px]`}>
					<div className={`flex items-center w-full gap-x-2 overflow-hidden justify-between ${isRejected ? 'line-through' : ''}`}>
						<div className='ml-1 flex items-center overflow-hidden'>
							<div
								className={`flex items-center min-w-0 overflow-hidden grow ${isClickable ? 'cursor-pointer hover:brightness-125 transition-all duration-150' : ''}`}
								onClick={() => {
									if (isDropdown) setIsOpen(v => !v);
									if (onClick) onClick();
								}}
							>
								{isDropdown && (
									<ChevronRight className={`text-etherana-fg-3 mr-0.5 h-4 w-4 flex-shrink-0 transition-transform duration-100 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'rotate-90' : ''}`} />
								)}
								<span className="text-etherana-fg-3 flex-shrink-0">{title}</span>
								{!isDesc1Clickable && desc1HTML}
							</div>
							{isDesc1Clickable && desc1HTML}
						</div>
						<div className="flex items-center gap-x-2 flex-shrink-0">
							{info && <CircleEllipsis className='ml-2 text-etherana-fg-4 opacity-60 flex-shrink-0' size={14} data-tooltip-id='etherana-tooltip' data-tooltip-content={info} data-tooltip-place='top-end' />}
							{isError && <AlertTriangle className='text-etherana-warning opacity-90 flex-shrink-0' size={14} data-tooltip-id='etherana-tooltip' data-tooltip-content={'Error running tool'} data-tooltip-place='top' />}
							{isRejected && <Ban className='text-etherana-fg-4 opacity-90 flex-shrink-0' size={14} data-tooltip-id='etherana-tooltip' data-tooltip-content={'Canceled'} data-tooltip-place='top' />}
							{desc2 && <span className="text-etherana-fg-4 text-xs" onClick={desc2OnClick}>{desc2}</span>}
							{numResults !== undefined && <span className="text-etherana-fg-4 text-xs ml-auto mr-1">{`${numResults}${hasNextPage ? '+' : ''} result${numResults !== 1 ? 's' : ''}`}</span>}
						</div>
					</div>
				</div>
				<div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'opacity-100 py-1' : 'max-h-0 opacity-0'} text-etherana-fg-4 rounded-sm overflow-x-auto`}>
					{children}
				</div>
			</div>
			{bottomChildren}
		</div>
	);
};

export const scrollToBottom = (divRef: { current: HTMLElement | null }) => {
	if (divRef.current) {
		divRef.current.scrollTop = divRef.current.scrollHeight;
	}
};

export const ScrollToBottomContainer = ({ children, className, style, scrollContainerRef }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, scrollContainerRef: React.MutableRefObject<HTMLDivElement | null> }) => {
	const [isAtBottom, setIsAtBottom] = useState(true);
	const divRef = scrollContainerRef;

	const onScroll = () => {
		const div = divRef.current;
		if (!div) return;
		const isBottom = Math.abs(div.scrollHeight - div.clientHeight - div.scrollTop) < 4;
		setIsAtBottom(isBottom);
	};

	useEffect(() => {
		if (isAtBottom) scrollToBottom(divRef);
	}, [children, isAtBottom]);

	useEffect(() => {
		scrollToBottom(divRef);
	}, []);

	return (
		<div ref={divRef} onScroll={onScroll} className={className} style={style}>
			{children}
		</div>
	);
};
