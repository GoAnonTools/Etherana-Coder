/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IEditCodeService } from '../editCodeServiceInterface.js';
import { URI } from '../../../../../base/common/uri.js';
import { CheckpointEntry, ThreadType } from '../../common/chatThreadServiceTypes.js';
import { EtheranaFileSnapshot } from '../../common/editCodeServiceTypes.js';
import { findLastIdx } from '../../../../../base/common/arraysFind.js';
import { IEtheranaModelService } from '../../common/etheranaModelService.js';

export class SnapshotManager {
	constructor(
		private readonly _editCodeService: IEditCodeService,
		private readonly _etheranaModelService: IEtheranaModelService,
	) { }

	public computeNewCheckpointInfo(thread: ThreadType): { etheranaFileSnapshotOfURI: { [fsPath: string]: EtheranaFileSnapshot | undefined } } | undefined {
		const lastCheckpointIdx = findLastIdx(thread.messages, (m) => m.role === 'checkpoint') ?? -1;
		if (lastCheckpointIdx === -1) return;

		const etheranaFileSnapshotOfURI: { [fsPath: string]: EtheranaFileSnapshot | undefined } = {};
		const { lastIdxOfURI } = this.getCheckpointsBetween(thread, 0, lastCheckpointIdx) || {};

		for (const fsPath in lastIdxOfURI ?? {}) {
			const { model } = this._etheranaModelService.getModelFromFsPath(fsPath);
			if (!model) continue;
			const checkpoint = thread.messages[lastIdxOfURI[fsPath]] as CheckpointEntry;
			if (!checkpoint) continue;

			const res = this.getCheckpointInfo(checkpoint, fsPath, { includeUserModifiedChanges: false });
			if (!res) continue;
			const { etheranaFileSnapshot: oldEtheranaFileSnapshot } = res;

			const etheranaFileSnapshot = this._editCodeService.getEtheranaFileSnapshot(URI.file(fsPath));
			if (oldEtheranaFileSnapshot === etheranaFileSnapshot) continue;
			etheranaFileSnapshotOfURI[fsPath] = etheranaFileSnapshot;
		}

		return { etheranaFileSnapshotOfURI };
	}

	public getCheckpointInfo(checkpoint: CheckpointEntry, fsPath: string, opts: { includeUserModifiedChanges: boolean }): { etheranaFileSnapshot: EtheranaFileSnapshot | null } {
		const etheranaFileSnapshot = checkpoint.etheranaFileSnapshotOfURI ? checkpoint.etheranaFileSnapshotOfURI[fsPath] ?? null : null;
		if (!opts.includeUserModifiedChanges) { return { etheranaFileSnapshot }; }

		const userModifiedEtheranaFileSnapshot = fsPath in checkpoint.userModifications.etheranaFileSnapshotOfURI ? checkpoint.userModifications.etheranaFileSnapshotOfURI[fsPath] ?? null : null;
		return { etheranaFileSnapshot: userModifiedEtheranaFileSnapshot ?? etheranaFileSnapshot };
	}

	public getCheckpointsBetween(thread: ThreadType, loIdx: number, hiIdx: number) {
		const lastIdxOfURI: { [fsPath: string]: number } = {};
		for (let i = loIdx; i <= hiIdx; i += 1) {
			const message = thread.messages[i];
			if (message?.role !== 'checkpoint') continue;
			for (const fsPath in message.etheranaFileSnapshotOfURI) {
				lastIdxOfURI[fsPath] = i;
			}
		}
		return { lastIdxOfURI };
	}

	public getCheckpointBeforeMessage(thread: ThreadType, messageIdx: number): [CheckpointEntry, number] | undefined {
		for (let i = messageIdx; i >= 0; i--) {
			const message = thread.messages[i];
			if (message.role === 'checkpoint') {
				return [message, i];
			}
		}
		return undefined;
	}

	public restoreSnapshot(fsPath: string, snapshot: EtheranaFileSnapshot) {
		this._editCodeService.restoreEtheranaFileSnapshot(URI.file(fsPath), snapshot);
	}
}
