/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import { useAccessor, useProjectMemoryState, useSettingsState } from '../util/services.js';
import { ProjectMemoryEntry, ProjectMemoryEntryType, ProjectMemoryConfidence, ProjectMemorySource } from '../../../../common/projectMemoryTypes.js';
import { Trash2, Edit2, Plus, Info, CheckCircle, AlertCircle, FileText, ChevronDown, ChevronUp, Power } from 'lucide-react';
import { EtheranaButtonBgDarken, EtheranaInputBox2, EtheranaSwitch, EtheranaSimpleInputBox } from '../util/inputs.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';

export const ProjectMemoryPanel = () => {
	const accessor = useAccessor();
	const projectMemoryService = accessor.get('IProjectMemoryService');
	const projectMemoryState = useProjectMemoryState();
	const settingsState = useSettingsState();

	const [isAdding, setIsAdding] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const entries = projectMemoryState.entries;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-light">Project Memory</h2>
					<p className="text-etherana-fg-3 text-sm mt-1">Local workspace knowledge used to improve AI context.</p>
				</div>
				<EtheranaButtonBgDarken
					className="flex items-center gap-2 px-3 py-1.5"
					onClick={() => setIsAdding(true)}
				>
					<Plus size={16} />
					<span>Add Memory</span>
				</EtheranaButtonBgDarken>
			</div>

			<div className="space-y-4">
				{isAdding && (
					<MemoryEntryEditForm
						onSave={(entry) => {
							projectMemoryService.addEntry(entry);
							setIsAdding(false);
						}}
						onCancel={() => setIsAdding(false)}
					/>
				)}

				{entries.length === 0 && !isAdding ? (
					<div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-etherana-border-1 rounded-lg text-center">
						<FileText size={48} className="text-etherana-fg-3 opacity-20 mb-4" />
						<p className="text-etherana-fg-2 font-medium">No project memory yet.</p>
						<p className="text-etherana-fg-3 text-sm mt-1 max-w-xs">
							Add rules, commands, or notes to help Ethereana understand this workspace.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4">
						{entries.map(entry => (
							editingId === entry.id ? (
								<MemoryEntryEditForm
									key={entry.id}
									initialEntry={entry}
									onSave={(updated) => {
										projectMemoryService.updateEntry(entry.id, updated);
										setEditingId(null);
									}}
									onCancel={() => setEditingId(null)}
								/>
							) : (
								<MemoryEntryCard
									key={entry.id}
									entry={entry}
									onEdit={() => setEditingId(entry.id)}
									onDelete={() => projectMemoryService.deleteEntry(entry.id)}
									onToggle={() => projectMemoryService.toggleEntryEnabled(entry.id)}
								/>
							)
						))}
					</div>
				)}
			</div>
		</div>
	);
};

const MemoryEntryCard = ({ entry, onEdit, onDelete, onToggle }: {
	entry: ProjectMemoryEntry,
	onEdit: () => void,
	onDelete: () => void,
	onToggle: () => void
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const typeColors: Record<ProjectMemoryEntryType, string> = {
		rule: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
		command: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
		architecture: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
		risk: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
		preference: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
		bug: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
		decision: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
		note: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
	};

	const confidenceIcons = {
		'user-confirmed': <CheckCircle size={14} className="text-emerald-500" />,
		'inferred': <Info size={14} className="text-blue-500" />,
		'temporary': <AlertCircle size={14} className="text-amber-500" />,
	};

	return (
		<div className={`
			group border border-etherana-border-1 rounded-lg transition-all
			${entry.enabled ? 'bg-etherana-bg-1' : 'bg-etherana-bg-2 opacity-60'}
			hover:shadow-sm
		`}>
			<div className="p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${typeColors[entry.type]}`}>
								{entry.type}
							</span>
							<h3 className="font-medium text-etherana-fg-1 truncate">{entry.title}</h3>
						</div>
						<p className={`text-sm text-etherana-fg-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
							{entry.summary}
						</p>
					</div>
					<div className="flex flex-col items-end gap-2 shrink-0">
						<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button onClick={onEdit} className="p-1 hover:bg-black/5 rounded text-etherana-fg-3">
								<Edit2 size={14} />
							</button>
							<button onClick={onDelete} className="p-1 hover:bg-rose-500/10 rounded text-rose-500">
								<Trash2 size={14} />
							</button>
						</div>
						<EtheranaSwitch
							size="xs"
							value={entry.enabled}
							onChange={onToggle}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between mt-3 pt-3 border-t border-etherana-border-1/50">
					<div className="flex items-center gap-3 text-[11px] text-etherana-fg-3">
						<div className="flex items-center gap-1">
							{confidenceIcons[entry.confidence]}
							<span className="capitalize">{entry.confidence.replace('-', ' ')}</span>
						</div>
						{entry.relatedFiles.length > 0 && (
							<div className="flex items-center gap-1">
								<FileText size={14} />
								<span>{entry.relatedFiles.length} files</span>
							</div>
						)}
						{entry.lastUsedAt && (
							<span>Used {new Date(entry.lastUsedAt).toLocaleDateString()}</span>
						)}
					</div>
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-etherana-fg-3 hover:text-etherana-fg-2 p-1"
					>
						{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>
				</div>

				{isExpanded && entry.relatedFiles.length > 0 && (
					<div className="mt-3 pt-3 border-t border-etherana-border-1/50">
						<h4 className="text-[10px] uppercase tracking-wider font-bold text-etherana-fg-3 mb-2">Related Files</h4>
						<div className="flex flex-wrap gap-2">
							{entry.relatedFiles.map(file => (
								<span key={file} className="text-[11px] bg-black/5 px-2 py-0.5 rounded font-mono">
									{file}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

const MemoryEntryEditForm = ({ initialEntry, onSave, onCancel }: {
	initialEntry?: ProjectMemoryEntry,
	onSave: (entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'enabled'>) => void,
	onCancel: () => void
}) => {
	const [type, setType] = useState<ProjectMemoryEntryType>(initialEntry?.type || 'note');
	const [title, setTitle] = useState(initialEntry?.title || '');
	const [summary, setSummary] = useState(initialEntry?.summary || '');
	const [confidence, setConfidence] = useState<ProjectMemoryConfidence>(initialEntry?.confidence || 'user-confirmed');
	const [filesInput, setFilesInput] = useState(initialEntry?.relatedFiles.join(', ') || '');

	const entryTypes: ProjectMemoryEntryType[] = ['rule', 'command', 'architecture', 'risk', 'preference', 'bug', 'decision', 'note'];

	const handleSave = () => {
		if (!title.trim() || !summary.trim()) return;

		const relatedFiles = filesInput.split(',').map(f => f.trim()).filter(f => f.length > 0);

		onSave({
			type,
			title,
			summary,
			confidence,
			source: initialEntry?.source || 'user',
			tags: initialEntry?.tags || [],
			relatedFiles
		});
	};

	return (
		<div className="border border-[#0e70c0]/30 bg-[#0e70c0]/5 rounded-lg p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<label className="text-[11px] uppercase font-bold text-etherana-fg-3">Type</label>
					<select
						value={type}
						onChange={(e) => setType(e.target.value as ProjectMemoryEntryType)}
						className="w-full bg-etherana-bg-1 border border-etherana-border-1 rounded px-2 py-1 text-sm outline-none focus:border-[#0e70c0]"
					>
						{entryTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
					</select>
				</div>
				<div className="space-y-1">
					<label className="text-[11px] uppercase font-bold text-etherana-fg-3">Confidence</label>
					<select
						value={confidence}
						onChange={(e) => setConfidence(e.target.value as ProjectMemoryConfidence)}
						className="w-full bg-etherana-bg-1 border border-etherana-border-1 rounded px-2 py-1 text-sm outline-none focus:border-[#0e70c0]"
					>
						<option value="user-confirmed">User Confirmed</option>
						<option value="inferred">Inferred</option>
						<option value="temporary">Temporary</option>
					</select>
				</div>
			</div>

			<div className="space-y-1">
				<label className="text-[11px] uppercase font-bold text-etherana-fg-3">Title</label>
				<EtheranaSimpleInputBox
					value={title}
					onChangeValue={setTitle}
					placeholder="Short, descriptive title"
				/>
			</div>

			<div className="space-y-1">
				<label className="text-[11px] uppercase font-bold text-etherana-fg-3">Summary</label>
				<textarea
					value={summary}
					onChange={(e) => setSummary(e.target.value)}
					rows={3}
					placeholder="What should Ethereana remember about this project?"
					className="w-full bg-etherana-bg-1 border border-etherana-border-1 rounded px-3 py-2 text-sm outline-none focus:border-[#0e70c0] resize-none"
				/>
			</div>

			<div className="space-y-1">
				<label className="text-[11px] uppercase font-bold text-etherana-fg-3">Related Files (comma separated)</label>
				<EtheranaSimpleInputBox
					value={filesInput}
					onChangeValue={setFilesInput}
					placeholder="src/vs/..., package.json"
				/>
			</div>

			<div className="flex items-center justify-end gap-2 pt-2">
				<button onClick={onCancel} className="px-3 py-1.5 text-sm text-etherana-fg-3 hover:text-etherana-fg-1">
					Cancel
				</button>
				<EtheranaButtonBgDarken
					className="px-4 py-1.5 bg-[#0e70c0] text-white"
					onClick={handleSave}
				>
					{initialEntry ? 'Update' : 'Add Memory'}
				</EtheranaButtonBgDarken>
			</div>
		</div>
	);
};
