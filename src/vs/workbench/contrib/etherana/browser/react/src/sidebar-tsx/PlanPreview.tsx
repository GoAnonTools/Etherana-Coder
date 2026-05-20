/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useMemo } from 'react';
import { PlanEntry } from '../../../../common/chatThreadServiceTypes.js';
import { useAccessor } from '../util/services.js';
import { ShieldCheck, ShieldAlert, Shield, FileJson, Terminal, Brain, Check, X } from 'lucide-react';

interface PlanPreviewProps {
	plan: PlanEntry;
	threadId: string;
	messageIdx: number;
}

export const PlanPreview = ({ plan, threadId, messageIdx }: PlanPreviewProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const accessor = useAccessor();
	const chatThreadService = accessor.get('IChatThreadService');

	const riskColor = useMemo(() => {
		switch (plan.risk) {
			case 'high': return 'text-red-500';
			case 'medium': return 'text-amber-500';
			case 'low': return 'text-green-500';
			default: return 'text-zinc-500';
		}
	}, [plan.risk]);

	const ShieldIcon = plan.risk === 'high' ? ShieldAlert : plan.risk === 'medium' ? Shield : ShieldCheck;

	if (plan.isApproved) {
		return (
			<div className="px-4 py-2 mb-4 bg-etherana-bg-2/30 border border-etherana-border-2 rounded-lg flex items-center gap-2 opacity-60">
				<Check className="size-3 text-green-500" />
				<span className="text-xs font-medium uppercase tracking-wider">Plan Executed</span>
			</div>
		);
	}

	return (
		<div className={`mb-4 rounded-xl border overflow-hidden transition-all
			${plan.risk === 'high' ? 'border-red-500/30 bg-red-500/5' :
				plan.risk === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
					'border-green-500/30 bg-green-500/5'}`}>

			<div className="p-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<ShieldIcon className={`size-4 ${riskColor}`} />
						<span className={`text-xs font-bold uppercase tracking-widest ${riskColor}`}>
							{plan.risk} Risk Plan
						</span>
					</div>
					<div className="text-xs text-etherana-fg-4 bg-white/5 px-2 py-0.5 rounded">
						{plan.modelName}
					</div>
				</div>

				<h4 className="text-sm font-bold mb-1">{plan.summary}</h4>
				<p className="text-xs text-etherana-fg-3 mb-4">
					{plan.filesToEdit.length} file{plan.filesToEdit.length !== 1 ? 's' : ''} to edit · {plan.checkpointAvailable ? 'Rollback enabled' : 'No rollback'}
				</p>

				<div className="flex items-center gap-2">
					<button
						className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
						onClick={() => chatThreadService.approvePlan(threadId, messageIdx)}
					>
						Proceed
					</button>
					<button
						className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? 'Hide Details' : 'Review Plan'}
					</button>
					<button
						className="p-2 rounded-lg text-etherana-fg-3 hover:bg-white/10 transition-colors"
						onClick={() => chatThreadService.rejectPlan(threadId, messageIdx)}
						title="Cancel Plan"
					>
						<X className="size-4" />
					</button>
				</div>
			</div>

			{isExpanded && (
				<div className="border-t border-current border-opacity-10 bg-white/5 p-4 space-y-4">
					{plan.filesToEdit.length > 0 &&
						<div>
							<div className="text-xs font-bold uppercase tracking-wider text-etherana-fg-4 mb-2">Files to Edit</div>
							<div className="space-y-1">
								{plan.filesToEdit.map(f =>
									<div key={f} className="flex items-center gap-2 text-xs">
										<FileJson className="size-3 opacity-50" />
										{f}
									</div>
								)}
							</div>
						</div>
					}

					{plan.commandsToRun.length > 0 &&
						<div>
							<div className="text-xs font-bold uppercase tracking-wider text-etherana-fg-4 mb-2">Commands to Run</div>
							<div className="space-y-1">
								{plan.commandsToRun.map(c =>
									<div key={c} className="flex items-center gap-2 text-xs bg-black/20 p-1 rounded font-mono">
										<Terminal className="size-3 opacity-50" />
										{c}
									</div>
								)}
							</div>
						</div>
					}

					<div className="grid grid-cols-2 gap-4 pt-2">
						<div className="space-y-1">
							<div className="text-xs font-bold uppercase tracking-wider text-etherana-fg-4">Memory</div>
							<div className="flex items-center gap-2 text-xs opacity-70">
								<Brain className="size-3" />
								Project Memory: {plan.memoryIncluded.project ? 'Included' : 'Off'}
							</div>
							<div className="flex items-center gap-2 text-xs opacity-70">
								<Terminal className="size-3" />
								Terminal Memory: {plan.memoryIncluded.terminal ? 'Included' : 'Off'}
							</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs font-bold uppercase tracking-wider text-etherana-fg-4">Risk Details</div>
							<div className="text-xs opacity-70 leading-relaxed">
								{plan.riskDetails}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
