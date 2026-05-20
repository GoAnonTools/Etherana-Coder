/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { SafetyMode } from '../common/safetyModeTypes.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';

export interface IFlightRecorderEvent {
	id: string;
	timestamp: number;
	threadId: string;
	messageId?: string;
	safetyMode: SafetyMode;
	actionType: 'chat' | 'tool_call' | 'tool_result' | 'command' | 'rollback';
	actionSummary: string;
	params?: any; // Parameters of the tool or command
	result?: any; // Result of the tool or command
	status: 'running' | 'success' | 'error' | 'cancelled' | 'blocked';
	errorMessage?: string;

	// Phase 2 fields
	modelInfo?: {
		provider: string;
		model: string;
	};
	tokenUsage?: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
	};
	relatedCheckpointId?: string;
	filesCount?: number;
	commandsCount?: number;
}

export interface IFlightRecorderService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeEvents: Event<void>;
	recordEvent(event: Omit<IFlightRecorderEvent, 'id' | 'timestamp'>): Promise<string>;
	getEvents(threadId?: string): Promise<IFlightRecorderEvent[]>;
}

export const IFlightRecorderService = createDecorator<IFlightRecorderService>('FlightRecorderService');

const FLIGHT_RECORDER_STORAGE_KEY = 'etherana.flightRecorder.events';

export class FlightRecorderService extends Disposable implements IFlightRecorderService {
	readonly _serviceBrand: undefined;

	private readonly _onDidChangeEvents = this._register(new Emitter<void>());
	readonly onDidChangeEvents = this._onDidChangeEvents.event;

	private _events: IFlightRecorderEvent[] = [];

	constructor(
		@IStorageService private readonly storageService: IStorageService
	) {
		super();
		this._loadEvents();
	}

	private _loadEvents(): void {
		const stored = this.storageService.get(FLIGHT_RECORDER_STORAGE_KEY, StorageScope.APPLICATION);
		if (stored) {
			try {
				this._events = JSON.parse(stored);
			} catch (e) {
				console.error('Error loading flight recorder events:', e);
				this._events = [];
			}
		}
	}

	private _persistEvents(): void {
		// Limit to last 500 events for Phase 1 to keeps things simple and performant
		const eventsToPersist = this._events.slice(-500);
		this.storageService.store(
			FLIGHT_RECORDER_STORAGE_KEY,
			JSON.stringify(eventsToPersist),
			StorageScope.APPLICATION,
			StorageTarget.USER
		);
	}

	async recordEvent(event: Omit<IFlightRecorderEvent, 'id' | 'timestamp'>): Promise<string> {
		const id = generateUuid();
		const timestamp = Date.now();
		const fullEvent: IFlightRecorderEvent = {
			...event,
			id,
			timestamp
		};

		this._events.push(fullEvent);
		this._persistEvents();
		this._onDidChangeEvents.fire();

		return id;
	}

	async getEvents(threadId?: string): Promise<IFlightRecorderEvent[]> {
		if (threadId) {
			return this._events.filter(e => e.threadId === threadId);
		}
		return [...this._events];
	}
}

registerSingleton(IFlightRecorderService, FlightRecorderService, InstantiationType.Delayed);
