/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../../base/common/lifecycle.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../../platform/storage/common/storage.js';
import { URI } from '../../../../../base/common/uri.js';
import { generateUuid } from '../../../../../base/common/uuid.js';
import { THREAD_STORAGE_KEY } from '../../common/storageKeys.js';
import { ChatThreads, ThreadType } from '../../common/chatThreadServiceTypes.js';

export class ThreadStore extends Disposable {
	constructor(
		private readonly _storageService: IStorageService,
	) {
		super();
	}

	public readAllThreads(): ChatThreads | null {
		const threadsStr = this._storageService.get(THREAD_STORAGE_KEY, StorageScope.APPLICATION);
		if (!threadsStr) return null;
		return this._convertThreadDataFromStorage(threadsStr);
	}

	public storeAllThreads(threads: ChatThreads) {
		const serializedThreads = JSON.stringify(threads, (key, value) => {
			if (value instanceof Set) {
				return Array.from(value);
			}
			return value;
		});
		this._storageService.store(
			THREAD_STORAGE_KEY,
			serializedThreads,
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
	}

	private _convertThreadDataFromStorage(threadsStr: string): ChatThreads {
		return JSON.parse(threadsStr, (key, value) => {
			if (value && typeof value === 'object' && value.$mid === 1) {
				return URI.from(value);
			}
			if (key === 'filesWithUserChanges' && Array.isArray(value)) {
				return new Set(value);
			}
			return value;
		});
	}

	public createNewThread(): ThreadType {
		const now = new Date().toISOString();
		return {
			id: generateUuid(),
			createdAt: now,
			lastModified: now,
			messages: [],
			state: {
				currCheckpointIdx: null,
				stagingSelections: [],
				focusedMessageIdx: undefined,
				linksOfMessageIdx: {},
				autoApprovePlanId: null,
			},
			filesWithUserChanges: new Set()
		} satisfies ThreadType;
	}

	public deleteThread(threads: ChatThreads, threadId: string): ChatThreads {
		const newThreads = { ...threads };
		delete newThreads[threadId];
		this.storeAllThreads(newThreads);
		return newThreads;
	}

	public duplicateThread(threads: ChatThreads, threadId: string): { newThreads: ChatThreads, newThreadId: string } {
		const oldThread = threads[threadId];
		if (!oldThread) return { newThreads: threads, newThreadId: threadId };

		const now = new Date().toISOString();
		const newThreadId = generateUuid();
		const newThread: ThreadType = {
			...oldThread,
			id: newThreadId,
			createdAt: now,
			lastModified: now,
		};

		const newThreads = {
			...threads,
			[newThreadId]: newThread
		};

		this.storeAllThreads(newThreads);
		return { newThreads, newThreadId };
	}
}
