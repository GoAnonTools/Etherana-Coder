/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import { useAccessor, useSettingsState, useIsOptedOut } from '../util/services.js';
import { FeatureName, featureNames, localProviderNames, nonlocalProviderNames, displayInfoOfFeatureName, displayInfoOfProviderName } from '../../../../common/etheranaSettingsTypes.js';
import { Shield, ShieldCheck, ShieldAlert, Cpu, Cloud, Zap, Info, Terminal, Database, Activity, Eye, EyeOff } from 'lucide-react';

const StatusCard = ({ title, icon: Icon, children, color = 'blue' }: { title: string; icon: any; children: React.ReactNode; color?: 'blue' | 'green' | 'amber' | 'indigo' | 'zinc' }) => {
	const colorClasses = {
		blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-400',
		green: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-900/30 dark:text-green-400',
		amber: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/10 dark:border-amber-900/30 dark:text-amber-400',
		indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/10 dark:border-indigo-900/30 dark:text-indigo-400',
		zinc: 'bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-800/10 dark:border-zinc-800/30 dark:text-zinc-400',
	};

	return (
		<div className={`p-4 rounded-lg border ${colorClasses[color]} mb-4`}>
			<div className="flex items-center gap-2 mb-3">
				<Icon className="size-4" />
				<h3 className="text-sm font-semibold">{title}</h3>
			</div>
			<div className="space-y-2 text-xs">
				{children}
			</div>
		</div>
	);
};

const DetailRow = ({ label, value, icon: Icon, secondary }: { label: string; value: React.ReactNode; icon?: any; secondary?: string }) => (
	<div className="flex items-start justify-between">
		<div className="flex items-center gap-1.5">
			{Icon && <Icon className="size-3 opacity-70" />}
			<span className="opacity-80">{label}</span>
		</div>
		<div className="text-right">
			<div className="font-medium">{value}</div>
			{secondary && <div className="text-[10px] opacity-60">{secondary}</div>}
		</div>
	</div>
);

export const PrivacyDashboard = () => {
	const settings = useSettingsState();
	const isOptedOut = useIsOptedOut();

	const features = useMemo(() => {
		const list: FeatureName[] = ['Chat', 'Gather', 'Agent', 'Autocomplete', 'Review'];
		return list.map(f => {
			const selection = settings.modelSelectionOfFeature[f];
			const isLocal = selection ? localProviderNames.includes(selection.providerName as any) : false;
			const isCloud = selection ? nonlocalProviderNames.includes(selection.providerName as any) : false;

			return {
				name: f,
				displayName: displayInfoOfFeatureName(f),
				selection,
				isLocal,
				isCloud,
				settings: settings.globalSettings
			};
		});
	}, [settings]);

	const modeInfo = useMemo(() => {
		const cloudF = features.filter(f => f.isCloud);
		const localF = features.filter(f => f.isLocal);

		if (cloudF.length === 0 && localF.length > 0) {
			return {
				label: 'Local-only mode',
				icon: ShieldCheck,
				color: 'green' as const,
				desc: 'The main configured AI features shown below are using local models. No cloud model is selected for these features.'
			};
		} else if (cloudF.length > 0 && localF.length > 0) {
			return {
				label: 'Hybrid mode',
				icon: Zap,
				color: 'indigo' as const,
				desc: 'Your AI workflow is split between local and cloud models. Some data may be sent to remote providers.'
			};
		} else if (cloudF.length > 0) {
			return {
				label: 'Cloud-assisted mode',
				icon: Cloud,
				color: 'amber' as const,
				desc: 'You are using cloud-based AI. Data is sent to the selected providers for processing.'
			};
		}
		return {
			label: 'Disconnected',
			icon: ShieldAlert,
			color: 'zinc' as const,
			desc: 'No AI features are currently active or configured.'
		};
	}, [features]);

	const terminalSettings = settings.globalSettings.terminalMemory;
	const projectMemory = settings.globalSettings.projectMemory;

	return (
		<div className="max-w-3xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-2">Privacy Dashboard</h2>
				<p className="text-sm text-fg-3">
					A transparent overview of how your data is handled and what leaves your machine.
				</p>
			</div>

			{/* Overall Mode Card */}
			<div className={`p-6 rounded-xl border mb-8 flex items-center gap-4
				${modeInfo.color === 'green' ? 'bg-green-500/5 border-green-500/20' :
					modeInfo.color === 'amber' ? 'bg-amber-500/5 border-amber-500/20' :
						modeInfo.color === 'indigo' ? 'bg-indigo-500/5 border-indigo-500/20' :
							'bg-zinc-500/5 border-zinc-500/20'}`}>
				<div className={`p-3 rounded-full
					${modeInfo.color === 'green' ? 'bg-green-500/10 text-green-600' :
						modeInfo.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
							modeInfo.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600' :
								'bg-zinc-500/10 text-zinc-600'}`}>
					<modeInfo.icon className="size-8" />
				</div>
				<div>
					<div className="text-lg font-bold">{modeInfo.label}</div>
					<div className="text-sm opacity-80">{modeInfo.desc}</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* AI Features Activity */}
				<div className="space-y-4">
					<h3 className="text-sm font-bold uppercase tracking-wider text-fg-4 px-1">AI Features Activity</h3>

					{features.map(f => (
						<StatusCard key={f.name} title={f.displayName} icon={f.isLocal ? Cpu : f.isCloud ? Cloud : Info} color={f.isLocal ? 'green' : f.isCloud ? 'amber' : 'zinc'}>
							{!f.selection ? (
								<div className="italic opacity-60">Not configured</div>
							) : (
								<>
									<DetailRow label="Provider" value={f.selection.providerName} secondary={f.selection.modelName} />
									<DetailRow label="Connection" value={f.isLocal ? 'Local Machine' : 'Cloud API'} />
									<DetailRow label="Data" value={f.isLocal ? 'Data: Stay local' : 'May leave machine'} />
									<div className="mt-2 pt-2 border-t border-current border-opacity-10">
										<DetailRow label="Code Context" value="Sent if included" />
										{(() => {
											const memoryEnabledForFeature =
												f.name === 'Chat' ? projectMemory.includeInChat :
													f.name === 'Gather' ? projectMemory.includeInGather :
														f.name === 'Agent' ? projectMemory.includeInAgent :
															f.name === 'Autocomplete' ? projectMemory.includeInAutocomplete :
																projectMemory.includeInChat; // Fallback to Chat for secondary features

											return (
												<DetailRow
													label="Project Memory"
													value={projectMemory.enabled && memoryEnabledForFeature ? (f.name === 'Autocomplete' ? 'On (max 3)' : 'On') : 'Off'}
												/>
											);
										})()}
										{f.name !== 'Autocomplete' && (
											<DetailRow label="Terminal Memory" value={f.settings.terminalMemory.enabled ? 'On' : 'Off'} />
										)}
									</div>
								</>
							)}
						</StatusCard>
					))}
				</div>

				{/* Memory & System Stats */}
				<div className="space-y-4">
					<h3 className="text-sm font-bold uppercase tracking-wider text-fg-4 px-1">System & Memory</h3>

					<StatusCard title="Terminal Memory" icon={Terminal} color={terminalSettings.enabled ? 'indigo' : 'zinc'}>
						<DetailRow label="Status" value={terminalSettings.enabled ? 'Enabled' : 'Disabled'} />
						{terminalSettings.enabled && (
							<>
								<DetailRow label="Privacy" value="Redacted before LLM" icon={ShieldCheck} />
								<DetailRow label="Ask before Cloud" value={terminalSettings.askBeforeCloud ? 'Yes' : 'No'} />
								<DetailRow label="Context Depth" value={`${terminalSettings.maxLines} lines`} />
							</>
						)}
					</StatusCard>

					<StatusCard title="Project Memory" icon={Database} color={projectMemory.enabled ? 'indigo' : 'zinc'}>
						<DetailRow label="Status" value={projectMemory.enabled ? 'Enabled' : 'Disabled'} />
						{projectMemory.enabled && (
							<>
								<DetailRow label="Storage" value="Local Workspace" />
								<DetailRow label="Max Entries" value={projectMemory.maxEntriesPerRequest} />
								<DetailRow label="Preference" value={projectMemory.preferUserConfirmed ? 'User-confirmed' : 'Auto-inferred'} />
							</>
						)}
					</StatusCard>

					<StatusCard title="Flight Recorder" icon={Activity} color="zinc">
						<DetailRow label="Logging" value="Session events only" />
						<DetailRow label="Storage" value="Local disk" />
						<DetailRow label="Privacy" value="Stores AI action metadata locally by design" icon={ShieldCheck} />
					</StatusCard>

					<StatusCard title="Telemetry & Privacy" icon={isOptedOut ? EyeOff : Eye} color={isOptedOut ? 'green' : 'zinc'}>
						<DetailRow label="Ethereana Telemetry" value="None detected" icon={ShieldCheck} />
						<DetailRow label="Third-party" value="Provider logs apply" />
						<div className="mt-2 p-2 bg-white/10 rounded text-[10px] leading-relaxed opacity-80">
							Ethereana-specific AI features do not add telemetry here. Upstream editor, extensions, or providers may have their own behavior. Your AI providers may log requests based on their individual terms of service. Local models such as Ollama or LM Studio keep AI processing on your machine, unless your setup routes requests elsewhere.
						</div>
					</StatusCard>
				</div>
			</div>
		</div>
	);
};
