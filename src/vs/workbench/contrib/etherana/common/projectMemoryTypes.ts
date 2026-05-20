/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export type ProjectMemoryEntryType =
	| 'rule'
	| 'command'
	| 'architecture'
	| 'risk'
	| 'preference'
	| 'bug'
	| 'decision'
	| 'note';

export type ProjectMemorySource =
	| 'user'
	| 'ai'
	| 'terminal'
	| 'flight-recorder'
	| 'manual';

export type ProjectMemoryConfidence =
	| 'user-confirmed'
	| 'inferred'
	| 'temporary';

export interface ProjectMemoryEntry {
	id: string;
	createdAt: number;
	updatedAt: number;
	type: ProjectMemoryEntryType;
	title: string;
	summary: string;
	source: ProjectMemorySource;
	confidence: ProjectMemoryConfidence;
	tags: string[];
	relatedFiles: string[]; // paths relative to workspace root
	lastUsedAt?: number;
	enabled: boolean;
}

export interface ProjectMemoryState {
	entries: ProjectMemoryEntry[];
	updatedAt: number;
	version: number;
}

export const INITIAL_PROJECT_MEMORY_STATE: ProjectMemoryState = {
	entries: [],
	updatedAt: Date.now(),
	version: 1,
};
