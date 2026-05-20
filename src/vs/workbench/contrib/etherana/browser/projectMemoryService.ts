/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { ETHERANA_PROJECT_MEMORY_STORAGE_KEY } from '../common/storageKeys.js';
import { ProjectMemoryEntry, ProjectMemoryState, INITIAL_PROJECT_MEMORY_STATE } from '../common/projectMemoryTypes.js';
import { generateUuid } from '../../../../base/common/uuid.js';

export interface IProjectMemoryService {
	readonly _serviceBrand: undefined;
	readonly state: ProjectMemoryState;
	onDidChangeState: Event<void>;

	addEntry(entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'enabled'>): string;
	updateEntry(id: string, update: Partial<ProjectMemoryEntry>): boolean;
	deleteEntry(id: string): boolean;
	toggleEntryEnabled(id: string): boolean;
	markEntryUsed(id: string): boolean;
	markEntriesUsed(ids: string[]): void;

	getRelevantEntries(options: {
		filePaths?: string[],
		query?: string,
		limit?: number,
		includeDisabled?: boolean,
		preferUserConfirmed?: boolean
	}): ProjectMemoryEntry[];
}

export const IProjectMemoryService = createDecorator<IProjectMemoryService>('ProjectMemoryService');

export class ProjectMemoryService extends Disposable implements IProjectMemoryService {
	readonly _serviceBrand: undefined;

	private _state: ProjectMemoryState = INITIAL_PROJECT_MEMORY_STATE;
	private readonly _onDidChangeState = this._register(new Emitter<void>());
	readonly onDidChangeState = this._onDidChangeState.event;

	constructor(
		@IStorageService private readonly storageService: IStorageService,
	) {
		super();
		this._loadState();
	}

	get state(): ProjectMemoryState {
		return this._state;
	}

	private _loadState(): void {
		const stored = this.storageService.get(ETHERANA_PROJECT_MEMORY_STORAGE_KEY, StorageScope.WORKSPACE);
		if (stored) {
			try {
				this._state = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse project memory state:', e);
				this._state = INITIAL_PROJECT_MEMORY_STATE;
			}
		} else {
			this._state = INITIAL_PROJECT_MEMORY_STATE;
		}
	}

	private _saveState(): void {
		this._state.updatedAt = Date.now();
		this.storageService.store(
			ETHERANA_PROJECT_MEMORY_STORAGE_KEY,
			JSON.stringify(this._state),
			StorageScope.WORKSPACE,
			StorageTarget.MACHINE
		);
		this._onDidChangeState.fire();
	}

	addEntry(entry: Omit<ProjectMemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'enabled'>): string {
		const id = generateUuid();
		const now = Date.now();
		const newEntry: ProjectMemoryEntry = {
			...entry,
			id,
			createdAt: now,
			updatedAt: now,
			enabled: true
		};

		this._state.entries.push(newEntry);
		this._saveState();
		return id;
	}

	updateEntry(id: string, update: Partial<ProjectMemoryEntry>): boolean {
		const index = this._state.entries.findIndex(e => e.id === id);
		if (index === -1) return false;

		this._state.entries[index] = {
			...this._state.entries[index],
			...update,
			updatedAt: Date.now()
		};
		this._saveState();
		return true;
	}

	deleteEntry(id: string): boolean {
		const index = this._state.entries.findIndex(e => e.id === id);
		if (index === -1) return false;

		this._state.entries.splice(index, 1);
		this._saveState();
		return true;
	}

	toggleEntryEnabled(id: string): boolean {
		const entry = this._state.entries.find(e => e.id === id);
		if (!entry) return false;

		entry.enabled = !entry.enabled;
		entry.updatedAt = Date.now();
		this._saveState();
		return true;
	}

	markEntryUsed(id: string): boolean {
		const entry = this._state.entries.find(e => e.id === id);
		if (!entry) return false;

		entry.lastUsedAt = Date.now();
		this._saveState();
		return true;
	}

	markEntriesUsed(ids: string[]): void {
		const now = Date.now();
		let changed = false;
		for (const id of ids) {
			const entry = this._state.entries.find(e => e.id === id);
			if (entry) {
				entry.lastUsedAt = now;
				changed = true;
			}
		}
		if (changed) {
			this._saveState();
		}
	}

	getRelevantEntries(options: {
		filePaths?: string[],
		query?: string,
		limit?: number,
		includeDisabled?: boolean,
		preferUserConfirmed?: boolean
	}): ProjectMemoryEntry[] {
		let entries = this._state.entries;

		// Filter enabled
		if (!options.includeDisabled) {
			entries = entries.filter(e => e.enabled);
		}

		// Sort by relevance (simple matching for now)
		const scoredEntries = entries.map(entry => {
			let score = 0;

			// Priority to user-confirmed
			if (entry.confidence === 'user-confirmed') score += 100;

			// Match file paths
			if (options.filePaths) {
				for (const filePath of options.filePaths) {
					if (entry.relatedFiles.some(rf => filePath.includes(rf) || rf.includes(filePath))) {
						score += 50;
					}
				}
			}

			// Match query in title/summary/tags
			if (options.query) {
				const q = options.query.toLowerCase();
				if (entry.title.toLowerCase().includes(q)) score += 30;
				if (entry.summary.toLowerCase().includes(q)) score += 20;
				if (entry.tags.some(t => t.toLowerCase().includes(q))) score += 10;
			}

			// Recency boost
			if (entry.lastUsedAt) {
				const daysSinceUsed = (Date.now() - entry.lastUsedAt) / (1000 * 60 * 60 * 24);
				if (daysSinceUsed < 7) score += (7 - daysSinceUsed);
			}

			return { entry, score };
		});

		scoredEntries.sort((a, b) => b.score - a.score);

		const result = scoredEntries.map(se => se.entry);
		return options.limit ? result.slice(0, options.limit) : result;
	}
}

registerSingleton(IProjectMemoryService, ProjectMemoryService, InstantiationType.Delayed);
