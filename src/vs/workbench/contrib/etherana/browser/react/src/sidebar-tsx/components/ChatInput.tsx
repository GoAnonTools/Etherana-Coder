/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { FeatureName, isFeatureNameDisabled } from '../../../../../../../workbench/contrib/etherana/common/etheranaSettingsTypes.js';
import { SafetyMode, safetyModes, displayInfoOfSafetyMode } from '../../../../common/safetyModeTypes.js';
import { getModelCapabilities, getIsReasoningEnabledState } from '../../../../common/modelCapabilities.js';
import { StagingSelectionItem } from '../../../../common/chatThreadServiceTypes.js';
import { useAccessor, useChatThreadsState, useChatThreadsStreamState, useSettingsState, useCommandBarState } from '../../util/services.js';
import { EtheranaCustomDropdownBox, EtheranaSlider, EtheranaSwitch } from '../../util/inputs.js';
import { ModelDropdown } from '../../etherana-settings-tsx/ModelDropdown.js';
import { IconArrowUp, IconSquare, IconX, ButtonSubmit, ButtonStop } from './ChatIcons.js';
import { SelectedFiles } from './ChatSelectedFiles.js';
import { getBasename, voidOpenFileFn } from './ChatUtils.js';
import { IconShell1, StatusIndicator } from '../../markdown/ApplyBlockHoverButtons.js';

const ReasoningOptionSlider = ({ featureName }: { featureName: FeatureName }) => {
	const accessor = useAccessor();
	const etheranaSettingsService = accessor.get('IEtheranaSettingsService');
	const etheranaSettingsState = useSettingsState();
	const modelSelection = etheranaSettingsState.modelSelectionOfFeature[featureName];
	if (!modelSelection) return null;
	const { modelName, providerName } = modelSelection;
	const { reasoningCapabilities } = getModelCapabilities(providerName, modelName, etheranaSettingsState.overridesOfModel);
	const { canTurnOffReasoning, reasoningSlider: reasoningBudgetSlider } = reasoningCapabilities || {};
	const modelSelectionOptions = etheranaSettingsState.optionsOfModelSelection[featureName][providerName]?.[modelName];
	const isReasoningEnabled = getIsReasoningEnabledState(featureName, providerName, modelName, modelSelectionOptions, etheranaSettingsState.overridesOfModel);

	if (canTurnOffReasoning && !reasoningBudgetSlider) {
		return (
			<div className='flex items-center gap-x-2'>
				<span className='text-etherana-fg-3 text-xs pointer-events-none inline-block w-10 pr-1'>Thinking</span>
				<EtheranaSwitch size='xxs' value={isReasoningEnabled} onChange={(newVal: boolean) => etheranaSettingsService.setOptionsOfModelSelection(featureName, providerName, modelName, { reasoningEnabled: newVal })} />
			</div>
		);
	}

	if (reasoningBudgetSlider?.type === 'budget_slider') {
		const { min: min_, max, default: defaultVal } = reasoningBudgetSlider;
		const stepSize = Math.round((max - min_) / 8);
		const valueIfOff = min_ - stepSize;
		const value = isReasoningEnabled ? etheranaSettingsState.optionsOfModelSelection[featureName][providerName]?.[modelName]?.reasoningBudget ?? defaultVal : valueIfOff;
		return (
			<div className='flex items-center gap-x-2'>
				<span className='text-etherana-fg-3 text-xs pointer-events-none inline-block w-10 pr-1'>Thinking</span>
				<EtheranaSlider width={50} size='xs' min={canTurnOffReasoning ? valueIfOff : min_} max={max} step={stepSize} value={value} onChange={(newVal: number) => etheranaSettingsService.setOptionsOfModelSelection(featureName, providerName, modelName, { reasoningEnabled: !(canTurnOffReasoning && newVal === valueIfOff), reasoningBudget: newVal })} />
				<span className='text-etherana-fg-3 text-xs pointer-events-none'>{isReasoningEnabled ? `${value} tokens` : 'Thinking disabled'}</span>
			</div>
		);
	}
	return null;
};

const SafetyModeDropdown = ({ className }: { className: string }) => {
	const accessor = useAccessor();
	const etheranaSettingsService = accessor.get('IEtheranaSettingsService');
	const settingsState = useSettingsState();
	return (
		<EtheranaCustomDropdownBox
			className={className}
			options={safetyModes}
			selectedOption={settingsState.globalSettings.safetyMode}
			onChangeOption={(newVal: SafetyMode) => etheranaSettingsService.setGlobalSetting('safetyMode', newVal)}
			getOptionDisplayName={(val: SafetyMode) => displayInfoOfSafetyMode(val).title}
			getOptionDropdownName={(val: SafetyMode) => displayInfoOfSafetyMode(val).title}
			getOptionDropdownDetail={(val: SafetyMode) => displayInfoOfSafetyMode(val).description}
			getOptionsEqual={(a: SafetyMode, b: SafetyMode) => a === b}
		/>
	);
};

export const EtheranaChatArea: React.FC<any> = ({
	children, onSubmit, onAbort, onClose, onClickAnywhere, divRef, isStreaming = false, isDisabled = false, className = '', showModelDropdown = true, showSelections = false, showProspectiveSelections = false, selections, setSelections, featureName, loadingIcon,
}) => (
	<div ref={divRef} className={`gap-x-1 flex flex-col p-2 relative input text-left shrink-0 rounded-md bg-etherana-bg-1 transition-all duration-200 border border-etherana-border-3 focus-within:border-etherana-border-1 hover:border-etherana-border-1 max-h-[80vh] overflow-y-auto ${className}`} onClick={() => onClickAnywhere?.()}>
		{showSelections && selections && setSelections && <SelectedFiles type='staging' selections={selections} setSelections={setSelections} showProspectiveSelections={showProspectiveSelections} />}
		<div className="relative w-full">{children}{onClose && <div className='absolute -top-1 -right-1 cursor-pointer z-1'><IconX size={12} className="stroke-[2] opacity-80 text-etherana-fg-3 hover:brightness-95" onClick={onClose} /></div>}</div>
		<div className='flex flex-row justify-between items-end gap-1'>
			{showModelDropdown && (
				<div className='flex flex-col gap-y-1'>
					<ReasoningOptionSlider featureName={featureName} />
					<div className='flex items-center flex-wrap gap-x-2 gap-y-1 text-nowrap '>
						{featureName === 'Chat' && <SafetyModeDropdown className='text-xs text-etherana-fg-3 bg-etherana-bg-1 border border-etherana-border-2 rounded py-0.5 px-1' />}
						<ModelDropdown featureName={featureName} className='text-xs text-etherana-fg-3 bg-etherana-bg-1 rounded' />
					</div>
				</div>
			)}
			<div className="flex items-center gap-2">{isStreaming && loadingIcon}{isStreaming ? <ButtonStop onClick={onAbort} /> : <ButtonSubmit onClick={onSubmit} disabled={isDisabled} />}</div>
		</div>
	</div>
);

export const CommandBarInChat = () => {
	const accessor = useAccessor();
	const editCodeService = accessor.get('IEditCodeService');
	const chatThreadsState = useChatThreadsState();
	const commandBarState = useCommandBarState();
	const chatThreadsStreamState = useChatThreadsStreamState(chatThreadsState.currentThreadId);
	const numFilesChanged = commandBarState.sortedURIs.length;
	const [fileDetailsOpened, setFileDetailsOpened] = useState(false);

	useEffect(() => {
		if (numFilesChanged === 0) setFileDetailsOpened(false);
		else if (numFilesChanged > 0 && !fileDetailsOpened) setFileDetailsOpened(true);
	}, [numFilesChanged]);

	const isFinished = numFilesChanged > 0 && commandBarState.sortedURIs.every(uri => !commandBarState.stateOfURI[uri.fsPath]?.isStreaming);
	const threadStatus = chatThreadsStreamState?.isRunning === 'awaiting_user' ? { title: 'Needs Approval', color: 'yellow' as const } : (chatThreadsStreamState?.isRunning ? { title: 'Running', color: 'orange' as const } : { title: 'Done', color: 'dark' as const });

	return (
		<>
			<div className={`px-2 flex w-full rounded-t-lg bg-etherana-bg-3 text-etherana-fg-3 text-xs overflow-hidden transition-all duration-200 ${fileDetailsOpened ? 'max-h-24' : 'max-h-0'}`}>
				<div className="px-2 gap-1 w-full overflow-y-auto">
					{commandBarState.sortedURIs.map((uri, i) => (
						<div key={i} className="flex justify-between items-center">
							<div className="flex items-center gap-1.5 text-etherana-fg-3 cursor-pointer" onClick={() => voidOpenFileFn(uri as any, accessor)}>{getBasename((uri as any).fsPath)}</div>
							<div className="flex items-center gap-2">
								<div className={`flex items-center gap-0.5 ${!commandBarState.stateOfURI[(uri as any).fsPath]?.isStreaming ? '' : 'opacity-0 pointer-events-none'}`}>
									<IconShell1 Icon={X} onClick={() => editCodeService.acceptOrRejectAllDiffAreas({ uri: uri as any, removeCtrlKs: true, behavior: "reject", _addToHistory: true })} data-tooltip-id='etherana-tooltip' data-tooltip-content='Reject file' />
									<IconShell1 Icon={Check} onClick={() => editCodeService.acceptOrRejectAllDiffAreas({ uri: uri as any, removeCtrlKs: true, behavior: "accept", _addToHistory: true })} data-tooltip-id='etherana-tooltip' data-tooltip-content='Accept file' />
								</div>
								<StatusIndicator indicatorColor={!commandBarState.stateOfURI[(uri as any).fsPath]?.isStreaming ? 'dark' : 'orange'} title={!commandBarState.stateOfURI[(uri as any).fsPath]?.isStreaming ? 'Done' : 'Running'} />
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="select-none flex w-full rounded-t-lg bg-etherana-bg-3 text-etherana-fg-3 text-xs border-t border-l border-r border-zinc-300/10 px-2 py-1 justify-between">
				<button className="flex items-center gap-1 cursor-pointer" onClick={() => setFileDetailsOpened(!fileDetailsOpened)} disabled={numFilesChanged === 0}>
					<svg className="size-3.5" style={{ transform: fileDetailsOpened ? 'rotate(180deg)' : 'rotate(0deg)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
					{numFilesChanged === 0 ? 'No files with changes' : `${numFilesChanged} files with changes`}
				</button>
				<div className="flex gap-2 items-center">
					<div className={`flex items-center gap-0.5 ${isFinished ? '' : 'opacity-0 pointer-events-none'}`}>
						<IconShell1 Icon={X} onClick={() => commandBarState.sortedURIs.forEach((uri: any) => editCodeService.acceptOrRejectAllDiffAreas({ uri, removeCtrlKs: true, behavior: "reject", _addToHistory: true }))} data-tooltip-id='etherana-tooltip' data-tooltip-content='Reject all' />
						<IconShell1 Icon={Check} onClick={() => commandBarState.sortedURIs.forEach((uri: any) => editCodeService.acceptOrRejectAllDiffAreas({ uri, removeCtrlKs: true, behavior: "accept", _addToHistory: true }))} data-tooltip-id='etherana-tooltip' data-tooltip-content='Accept all' />
					</div>
					<StatusIndicator indicatorColor={threadStatus.color} title={threadStatus.title} />
				</div>
			</div>
		</>
	);
};
