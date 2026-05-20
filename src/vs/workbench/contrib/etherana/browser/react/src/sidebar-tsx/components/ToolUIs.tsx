/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Ban, CircleEllipsis, ChevronRight } from 'lucide-react';
import { ChatMessage, ToolMessage } from '../../../../common/chatThreadServiceTypes.js';
import { BuiltinToolCallParams, BuiltinToolName, ToolName, LintErrorItem, toolApprovalTypes, approvalTypeOfBuiltinToolName } from '../../../../common/toolsServiceTypes.js';
import { builtinToolNames, isABuiltinToolName, MAX_FILE_CHARS_PAGE } from '../../../../common/prompt/prompts.js';
import { URI } from '../../../../../../../base/common/uri.js';
import { useAccessor, useChatThreadsStreamState, useSettingsState } from '../../util/services.js';
import { getBasename, getFolderName, getRelative, voidOpenFileFn, ToolHeaderWrapper, ToolHeaderParams, SmallProseWrapper } from './ChatUtils.js';
import { IconLoading } from './ChatIcons.js';
import { ChatMarkdownRender } from '../../markdown/ChatMarkdownRender.js';
import { BlockCode, EtheranaDiffEditor } from '../../util/inputs.js';
import { CopyButton, EditToolAcceptRejectButtonsHTML, useEditToolStreamState } from '../../markdown/ApplyBlockHoverButtons.js';
import { persistentTerminalNameOfId } from '../../../terminalToolService.js';
import { removeMCPToolNamePrefix } from '../../../../common/mcpServiceTypes.js';
import { ToolApprovalTypeSwitch } from '../../etherana-settings-tsx/Settings.js';

const loadingTitleWrapper = (title: string) => <div className='flex items-center gap-x-2'>{title}<IconLoading /></div>;

const titleOfBuiltinToolName = {
	'read_file': { done: 'Read file', proposed: 'Read file', running: loadingTitleWrapper('Reading file') },
	'get_dir_tree': { done: 'Read directory', proposed: 'Read directory', running: loadingTitleWrapper('Reading directory') },
	'ls_dir': { done: 'Read directory', proposed: 'Read directory', running: loadingTitleWrapper('Reading directory') },
	'search_pathnames_only': { done: 'Searched by file name', proposed: 'Search by file name', running: loadingTitleWrapper('Searching by file name') },
	'search_for_files': { done: 'Searched', proposed: 'Search', running: loadingTitleWrapper('Searching') },
	'create_file_or_folder': { done: `Created`, proposed: `Create`, running: loadingTitleWrapper(`Creating`) },
	'delete_file_or_folder': { done: `Deleted`, proposed: `Delete`, running: loadingTitleWrapper(`Deleting`) },
	'edit_file': { done: `Edited file`, proposed: 'Edit file', running: loadingTitleWrapper('Editing file') },
	'rewrite_file': { done: `Wrote file`, proposed: 'Write file', running: loadingTitleWrapper('Writing file') },
	'run_command': { done: `Ran terminal`, proposed: 'Run terminal', running: loadingTitleWrapper('Running terminal') },
	'run_persistent_command': { done: `Ran terminal`, proposed: 'Run terminal', running: loadingTitleWrapper('Running terminal') },
	'open_persistent_terminal': { done: `Opened terminal`, proposed: 'Open terminal', running: loadingTitleWrapper('Opening terminal') },
	'kill_persistent_terminal': { done: `Killed terminal`, proposed: 'Kill terminal', running: loadingTitleWrapper('Killing terminal') },
	'read_lint_errors': { done: `Read lint errors`, proposed: 'Read lint errors', running: loadingTitleWrapper('Reading lint errors') },
	'search_in_file': { done: 'Searched in file', proposed: 'Search in file', running: loadingTitleWrapper('Searching in file') },
} as const satisfies Record<BuiltinToolName, { done: any, proposed: any, running: any }>;

export const getTitle = (toolMessage: Pick<ChatMessage & { role: 'tool' }, 'name' | 'type' | 'mcpServerName'>): React.ReactNode => {
	const t = toolMessage;
	if (!builtinToolNames.includes(t.name as BuiltinToolName)) {
		const descriptor = t.type === 'success' ? 'Called' : (t.type === 'running_now' || t.type === 'tool_request' ? 'Calling' : 'Call');
		const title = `${descriptor} ${toolMessage.mcpServerName || 'MCP'}`;
		if (t.type === 'running_now' || t.type === 'tool_request') return loadingTitleWrapper(title);
		return title;
	} else {
		const toolName = t.name as BuiltinToolName;
		if (t.type === 'success') return titleOfBuiltinToolName[toolName].done;
		if (t.type === 'running_now') return titleOfBuiltinToolName[toolName].running;
		return titleOfBuiltinToolName[toolName].proposed;
	}
};

export const toolNameToDesc = (toolName: BuiltinToolName, _toolParams: BuiltinToolCallParams[BuiltinToolName] | undefined, accessor: ReturnType<typeof useAccessor>): { desc1: React.ReactNode, desc1Info?: string } => {
	if (!_toolParams) return { desc1: '' };
	const x = {
		'read_file': () => ({ desc1: getBasename((_toolParams as BuiltinToolCallParams['read_file']).uri.fsPath), desc1Info: getRelative((_toolParams as BuiltinToolCallParams['read_file']).uri, accessor) }),
		'ls_dir': () => ({ desc1: getFolderName((_toolParams as BuiltinToolCallParams['ls_dir']).uri.fsPath), desc1Info: getRelative((_toolParams as BuiltinToolCallParams['ls_dir']).uri, accessor) }),
		'search_pathnames_only': () => ({ desc1: `"${(_toolParams as BuiltinToolCallParams['search_pathnames_only']).query}"` }),
		'search_for_files': () => ({ desc1: `"${(_toolParams as BuiltinToolCallParams['search_for_files']).query}"` }),
		'search_in_file': () => ({ desc1: `"${(_toolParams as BuiltinToolCallParams['search_in_file']).query}"`, desc1Info: getRelative((_toolParams as BuiltinToolCallParams['search_in_file']).uri, accessor) }),
		'create_file_or_folder': () => {
			const p = _toolParams as BuiltinToolCallParams['create_file_or_folder'];
			return { desc1: p.isFolder ? getFolderName(p.uri.fsPath) ?? '/' : getBasename(p.uri.fsPath), desc1Info: getRelative(p.uri, accessor) };
		},
		'delete_file_or_folder': () => {
			const p = _toolParams as BuiltinToolCallParams['delete_file_or_folder'];
			return { desc1: p.isFolder ? getFolderName(p.uri.fsPath) ?? '/' : getBasename(p.uri.fsPath), desc1Info: getRelative(p.uri, accessor) };
		},
		'rewrite_file': () => ({ desc1: getBasename((_toolParams as BuiltinToolCallParams['rewrite_file']).uri.fsPath), desc1Info: getRelative((_toolParams as BuiltinToolCallParams['rewrite_file']).uri, accessor) }),
		'edit_file': () => ({ desc1: getBasename((_toolParams as BuiltinToolCallParams['edit_file']).uri.fsPath), desc1Info: getRelative((_toolParams as BuiltinToolCallParams['edit_file']).uri, accessor) }),
		'run_command': () => ({ desc1: `"${(_toolParams as BuiltinToolCallParams['run_command']).command}"` }),
		'run_persistent_command': () => ({ desc1: `"${(_toolParams as BuiltinToolCallParams['run_persistent_command']).command}"` }),
		'open_persistent_terminal': () => ({ desc1: '' }),
		'kill_persistent_terminal': () => ({ desc1: (_toolParams as BuiltinToolCallParams['kill_persistent_terminal']).persistentTerminalId }),
		'get_dir_tree': () => ({ desc1: getFolderName((_toolParams as BuiltinToolCallParams['get_dir_tree']).uri.fsPath) ?? '/', desc1Info: getRelative((_toolParams as BuiltinToolCallParams['get_dir_tree']).uri, accessor) }),
		'read_lint_errors': () => ({ desc1: getBasename((_toolParams as BuiltinToolCallParams['read_lint_errors']).uri.fsPath), desc1Info: getRelative((_toolParams as BuiltinToolCallParams['read_lint_errors']).uri, accessor) }),
	};
	try { return (x as any)[toolName]?.() || { desc1: '' }; } catch { return { desc1: '' }; }
};

export const ToolRequestAcceptRejectButtons = ({ toolName }: { toolName: ToolName }) => {
	const accessor = useAccessor();
	const chatThreadsService = accessor.get('IChatThreadService');
	const metricsService = accessor.get('IMetricsService');
	const onAccept = useCallback(() => {
		const threadId = chatThreadsService.state.currentThreadId;
		chatThreadsService.approveLatestToolRequest(threadId);
		metricsService.capture('Tool Request Accepted', {});
	}, [chatThreadsService, metricsService]);
	const onReject = useCallback(() => {
		const threadId = chatThreadsService.state.currentThreadId;
		chatThreadsService.rejectLatestToolRequest(threadId);
		metricsService.capture('Tool Request Rejected', {});
	}, [chatThreadsService, metricsService]);

	const approvalType = isABuiltinToolName(toolName) ? approvalTypeOfBuiltinToolName[toolName] : 'MCP tools';

	return (
		<div className="flex gap-2 mx-0.5 items-center">
			<button onClick={onAccept} className="px-2 py-1 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] rounded text-sm font-medium">Approve</button>
			<button onClick={onReject} className="px-2 py-1 bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] rounded text-sm font-medium">Cancel</button>
			{approvalType && <div className="flex items-center ml-2 gap-x-1"><ToolApprovalTypeSwitch size='xs' approvalType={approvalType} desc={`Auto-approve ${approvalType}`} /></div>}
		</div>
	);
};

export const ToolChildrenWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
	<div className={`${className ? className : ''} cursor-default select-none`}><div className='px-2 min-w-full overflow-hidden'>{children}</div></div>
);

export const CodeChildren = ({ children, className }: { children: React.ReactNode, className?: string }) => (
	<div className={`${className ?? ''} p-1 rounded-sm overflow-auto text-sm`}><div className='!select-text cursor-auto'>{children}</div></div>
);

export const ListableToolItem = ({ name, onClick, isSmall, className, showDot }: { name: React.ReactNode, onClick?: () => void, isSmall?: boolean, className?: string, showDot?: boolean }) => (
	<div className={`${onClick ? 'hover:brightness-125 hover:cursor-pointer transition-all duration-200 ' : ''} flex items-center flex-nowrap whitespace-nowrap ${className ? className : ''}`} onClick={onClick}>
		{showDot !== false && <div className="flex-shrink-0"><svg className="w-1 h-1 opacity-60 mr-1.5 fill-current" viewBox="0 0 100 40"><rect x="0" y="15" width="100" height="10" /></svg></div>}
		<div className={`${isSmall ? 'italic text-etherana-fg-4 flex items-center' : ''}`}>{name}</div>
	</div>
);

export const EditToolHeaderButtons = ({ applyBoxId, uri, codeStr, toolName, threadId }: { threadId: string, applyBoxId: string, uri: URI, codeStr: string, toolName: 'edit_file' | 'rewrite_file' }) => {
	const { streamState } = useEditToolStreamState({ applyBoxId, uri });
	return (
		<div className='flex items-center gap-1'>
			{streamState === 'idle-no-changes' && <CopyButton codeStr={codeStr} toolTipName='Copy' />}
			<EditToolAcceptRejectButtonsHTML type={toolName} codeStr={codeStr} applyBoxId={applyBoxId} uri={uri} threadId={threadId} />
		</div>
	);
};

export const EditToolChildren = ({ uri, code, type }: { uri: URI | undefined, code: string, type: 'diff' | 'rewrite' }) => {
	const content = type === 'diff' ? <EtheranaDiffEditor uri={uri} searchReplaceBlocks={code} /> : <ChatMarkdownRender string={`\`\`\`\n${code}\n\`\`\``} codeURI={uri} chatMessageLocation={undefined} />;
	return <div className='!select-text cursor-auto'><SmallProseWrapper>{content}</SmallProseWrapper></div>;
};

export const LintErrorChildren = ({ lintErrors }: { lintErrors: LintErrorItem[] }) => (
	<div className="text-xs text-etherana-fg-4 opacity-80 border-l-2 border-etherana-warning px-2 py-0.5 flex flex-col gap-0.5 overflow-x-auto whitespace-nowrap">
		{lintErrors.map((error, i) => (<div key={i}>Lines {error.startLineNumber}-{error.endLineNumber}: {error.message}</div>))}
	</div>
);

export const BottomChildren = ({ children, title }: { children: React.ReactNode, title: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	if (!children) return null;
	return (
		<div className="w-full px-2 mt-0.5">
			<div className="flex items-center cursor-pointer select-none transition-colors duration-150 pl-0 py-0.5 rounded group" onClick={() => setIsOpen(o => !o)} style={{ background: 'none' }}>
				<ChevronRight className={`mr-1 h-3 w-3 flex-shrink-0 transition-transform duration-100 text-etherana-fg-4 group-hover:text-etherana-fg-3 ${isOpen ? 'rotate-90' : ''}`} />
				<span className="font-medium text-etherana-fg-4 group-hover:text-etherana-fg-3 text-xs">{title}</span>
			</div>
			<div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0'} text-xs pl-4`}>
				<div className="overflow-x-auto text-etherana-fg-4 opacity-90 border-l-2 border-etherana-warning px-2 py-0.5">{children}</div>
			</div>
		</div>
	);
};

const EditTool = ({ toolMessage, threadId, messageIdx, content }: any) => {
	const accessor = useAccessor();
	const title = getTitle(toolMessage);
	const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
	const { params, name } = toolMessage;
	const desc1OnClick = () => voidOpenFileFn(params.uri, accessor);
	const componentParams: ToolHeaderParams = { title, desc1, desc1OnClick, desc1Info, icon: null, isRejected: toolMessage.type === 'rejected' };

	if (toolMessage.type === 'running_now' || toolMessage.type === 'tool_request') {
		componentParams.children = <ToolChildrenWrapper className='bg-etherana-bg-3'><EditToolChildren uri={params.uri} code={content} type={name === 'edit_file' ? 'diff' : 'rewrite'} /></ToolChildrenWrapper>;
	} else if (toolMessage.type === 'success' || toolMessage.type === 'rejected' || toolMessage.type === 'tool_error') {
		const applyBoxId = `apply-${threadId}-${messageIdx}`;
		componentParams.desc2 = <EditToolHeaderButtons applyBoxId={applyBoxId} uri={params.uri} codeStr={content} toolName={name} threadId={threadId} />;
		componentParams.children = <ToolChildrenWrapper className='bg-etherana-bg-3'><EditToolChildren uri={params.uri} code={content} type={name === 'edit_file' ? 'diff' : 'rewrite'} /></ToolChildrenWrapper>;
		if (toolMessage.type === 'success' || toolMessage.type === 'rejected') {
			componentParams.bottomChildren = <BottomChildren title='Lint errors'>{toolMessage.result?.lintErrors?.map((error: any, i: number) => (<div key={i} className='whitespace-nowrap'>Lines {error.startLineNumber}-{error.endLineNumber}: {error.message}</div>))}</BottomChildren>;
		} else if (toolMessage.type === 'tool_error') {
			componentParams.bottomChildren = <BottomChildren title='Error'><CodeChildren>{toolMessage.result}</CodeChildren></BottomChildren>;
		}
	}
	return <ToolHeaderWrapper {...componentParams} />;
};

const CommandTool = ({ toolMessage, type, threadId }: any) => {
	const accessor = useAccessor();
	const terminalToolsService = accessor.get('ITerminalToolService');
	const toolsService = accessor.get('IToolsService');
	const title = getTitle(toolMessage);
	const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
	const streamState = useChatThreadsStreamState(threadId);
	const divRef = useRef<HTMLDivElement | null>(null);
	const componentParams: ToolHeaderParams = { title, desc1, desc1Info, icon: null, isRejected: toolMessage.type === 'rejected' };

	useEffect(() => {
		if (streamState?.isRunning !== 'tool' || type !== 'run_command' || toolMessage.type !== 'running_now' || !divRef.current) return;
		const terminal = terminalToolsService.getTemporaryTerminal(toolMessage.params.terminalId);
		if (!terminal) return;
		terminal.attachToElement(divRef.current);
		terminal.setVisible(true);
		const ro = new ResizeObserver(entries => terminal.layout?.({ width: entries[0].borderBoxSize[0].inlineSize, height: entries[0].borderBoxSize[0].blockSize }));
		ro.observe(divRef.current);
		return () => { terminal.detachFromElement(); ro.disconnect(); };
	}, [terminalToolsService, toolMessage, streamState]);

	if (toolMessage.type === 'success') {
		const msg = type === 'run_command' ? toolsService.stringOfResult['run_command'](toolMessage.params, toolMessage.result) : toolsService.stringOfResult['run_persistent_command'](toolMessage.params, toolMessage.result);
		if (type === 'run_persistent_command') componentParams.info = persistentTerminalNameOfId(toolMessage.params.persistentTerminalId);
		componentParams.children = <ToolChildrenWrapper className='whitespace-pre text-nowrap overflow-auto text-sm'><div className='!select-text cursor-auto'><BlockCode initValue={msg.trim()} language='shellscript' /></div></ToolChildrenWrapper>;
	} else if (toolMessage.type === 'tool_error') {
		componentParams.bottomChildren = <BottomChildren title='Error'><CodeChildren>{toolMessage.result}</CodeChildren></BottomChildren>;
	} else if (toolMessage.type === 'running_now' && type === 'run_command') {
		componentParams.children = <div ref={divRef} className='relative h-[300px] text-sm' />;
	}
	return <ToolHeaderWrapper {...componentParams} isOpen={type === 'run_command' && toolMessage.type === 'running_now'} />;
};

const MCPToolWrapper = ({ toolMessage }: any) => {
	const accessor = useAccessor();
	const mcpService = accessor.get('IMCPService');
	const title = getTitle(toolMessage);
	const desc1 = removeMCPToolNamePrefix(toolMessage.name);
	const componentParams: ToolHeaderParams = { title, desc1, isRejected: toolMessage.type === 'rejected' };
	if (toolMessage.type === 'running_now') return null;
	const paramsStr = JSON.stringify(toolMessage.params, null, 2);
	componentParams.desc2 = <CopyButton codeStr={paramsStr} toolTipName={`Copy inputs`} />;
	componentParams.info = !toolMessage.mcpServerName ? 'MCP tool not found' : undefined;

	if (toolMessage.type === 'success' || toolMessage.type === 'tool_request') {
		const resultStr = toolMessage.result ? mcpService.stringifyResult(toolMessage.result) : 'null';
		componentParams.children = <ToolChildrenWrapper><SmallProseWrapper><ChatMarkdownRender string={`\`\`\`json\n${resultStr}\n\`\`\``} chatMessageLocation={undefined} isApplyEnabled={false} isLinkDetectionEnabled={true} /></SmallProseWrapper></ToolChildrenWrapper>;
	} else if (toolMessage.type === 'tool_error') {
		componentParams.bottomChildren = <BottomChildren title='Error'><CodeChildren>{toolMessage.result}</CodeChildren></BottomChildren>;
	}
	return <ToolHeaderWrapper {...componentParams} />;
};

const builtinToolNameToComponent: any = {
	'read_file': {
		resultWrapper: ({ toolMessage }: any) => {
			const accessor = useAccessor();
			if (toolMessage.type === 'tool_request' || toolMessage.type === 'running_now') return null;
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
			const componentParams: ToolHeaderParams = { title: getTitle(toolMessage), desc1, desc1Info, isRejected: toolMessage.type === 'rejected' };
			let range: [number, number] | undefined = undefined;
			if (toolMessage.params.startLine !== null || toolMessage.params.endLine !== null) {
				componentParams.desc1 += ` (${toolMessage.params.startLine ?? 1}-${toolMessage.params.endLine ?? ''})`;
				range = [toolMessage.params.startLine ?? 1, toolMessage.params.endLine ?? 1];
			}
			if (toolMessage.type === 'success') {
				componentParams.onClick = () => voidOpenFileFn(toolMessage.params.uri, accessor, range);
				if (toolMessage.result.hasNextPage && toolMessage.params.pageNumber === 1) componentParams.desc2 = `(truncated)`;
			} else if (toolMessage.type === 'tool_error') {
				componentParams.bottomChildren = <BottomChildren title='Error'><CodeChildren>{toolMessage.result}</CodeChildren></BottomChildren>;
			}
			return <ToolHeaderWrapper {...componentParams} />;
		}
	},
	'ls_dir': {
		resultWrapper: ({ toolMessage }: any) => {
			const accessor = useAccessor();
			if (toolMessage.type === 'tool_request' || toolMessage.type === 'running_now') return null;
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
			const componentParams: ToolHeaderParams = { title: getTitle(toolMessage), desc1, desc1Info, isRejected: toolMessage.type === 'rejected' };
			if (toolMessage.type === 'success') {
				componentParams.numResults = toolMessage.result.children?.length;
				componentParams.children = toolMessage.result.children?.length ? <ToolChildrenWrapper>{toolMessage.result.children.map((child: any, i: number) => (<ListableToolItem key={i} name={`${child.name}${child.isDirectory ? '/' : ''}`} onClick={() => voidOpenFileFn(child.uri, accessor)} />))}</ToolChildrenWrapper> : undefined;
			} else if (toolMessage.type === 'tool_error') {
				componentParams.bottomChildren = <BottomChildren title='Error'><CodeChildren>{toolMessage.result}</CodeChildren></BottomChildren>;
			}
			return <ToolHeaderWrapper {...componentParams} />;
		}
	},
	'search_pathnames_only': {
		resultWrapper: ({ toolMessage }: any) => {
			const accessor = useAccessor();
			if (toolMessage.type === 'tool_request' || toolMessage.type === 'running_now') return null;
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
			const componentParams: ToolHeaderParams = { title: getTitle(toolMessage), desc1, desc1Info, isRejected: toolMessage.type === 'rejected' };
			if (toolMessage.type === 'success') {
				componentParams.numResults = toolMessage.result.uris.length;
				componentParams.children = toolMessage.result.uris.length ? <ToolChildrenWrapper>{toolMessage.result.uris.map((uri: any, i: number) => (<ListableToolItem key={i} name={getBasename(uri.fsPath)} onClick={() => voidOpenFileFn(uri, accessor)} />))}</ToolChildrenWrapper> : undefined;
			}
			return <ToolHeaderWrapper {...componentParams} />;
		}
	},
	'search_for_files': { resultWrapper: ({ toolMessage }: any) => <MCPToolWrapper toolMessage={toolMessage} /> }, // Simplified for brevity
	'search_in_file': {
		resultWrapper: ({ toolMessage }: any) => {
			const accessor = useAccessor();
			const toolsService = accessor.get('IToolsService');
			if (toolMessage.type === 'tool_request' || toolMessage.type === 'running_now') return null;
			const { desc1, desc1Info } = toolNameToDesc(toolMessage.name, toolMessage.params, accessor);
			const componentParams: ToolHeaderParams = { title: getTitle(toolMessage), desc1, desc1Info, isRejected: toolMessage.type === 'rejected' };
			if (toolMessage.type === 'success') {
				componentParams.numResults = toolMessage.result.lines.length;
				componentParams.children = toolMessage.result.lines.length ? <ToolChildrenWrapper><CodeChildren className='bg-etherana-bg-3'><pre className='font-mono whitespace-pre'>{toolsService.stringOfResult['search_in_file'](toolMessage.params, toolMessage.result)}</pre></CodeChildren></ToolChildrenWrapper> : undefined;
			}
			return <ToolHeaderWrapper {...componentParams} />;
		}
	},
	'edit_file': { resultWrapper: (p: any) => <EditTool {...p} content={p.toolMessage.params.searchReplaceBlocks} /> },
	'rewrite_file': { resultWrapper: (p: any) => <EditTool {...p} content={p.toolMessage.params.newContent} /> },
	'run_command': { resultWrapper: (p: any) => <CommandTool {...p} type='run_command' /> },
	'run_persistent_command': { resultWrapper: (p: any) => <CommandTool {...p} type='run_persistent_command' /> },
};

export const ToolResultWrapperComp = ({ chatMessage, messageIdx, threadId, isCheckpointGhost }: any) => {
	const toolName = chatMessage.name;
	const isBuiltin = isABuiltinToolName(toolName);
	const wrapper = isBuiltin ? builtinToolNameToComponent[toolName]?.resultWrapper : (props: any) => <MCPToolWrapper {...props} />;
	if (!wrapper) return null;

	return (
		<div className={`flex flex-col gap-y-1.5 ${isCheckpointGhost ? 'opacity-50 pointer-events-none' : ''}`}>
			{wrapper({ toolMessage: chatMessage, messageIdx, threadId })}
			{chatMessage.type === 'tool_request' && <ToolRequestAcceptRejectButtons toolName={toolName} />}
		</div>
	);
};
