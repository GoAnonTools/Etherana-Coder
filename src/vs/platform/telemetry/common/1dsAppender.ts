/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITelemetryAppender } from './telemetryUtils.js';

// Keep a small compatibility interface because browser/node appenders and tests import it.
export interface IAppInsightsCore {
	pluginVersionString: string;
	track(item: unknown): void;
	unload(isAsync: boolean, unloadComplete: (unloadState: unknown) => void): void;
}

// Etherana Coder is privacy-first: the Microsoft 1DS telemetry transport is disabled.
// This class intentionally preserves the upstream constructor/API shape so callers compile,
// but it never initializes the 1DS client, imports telemetry SDKs, pings health endpoints,
// sends events, or flushes network payloads.
export abstract class AbstractOneDataSystemAppender implements ITelemetryAppender {

	protected _aiCoreOrKey: IAppInsightsCore | string | undefined;
	protected readonly endPointUrl = '';
	protected readonly endPointHealthUrl = '';

	constructor(
		private readonly _isInternalTelemetry: boolean,
		private readonly _eventPrefix: string,
		private readonly _defaultData: { [key: string]: any } | null,
		iKeyOrClientFactory: string | (() => IAppInsightsCore),
		private readonly _xhrOverride?: unknown
	) {
		void this._isInternalTelemetry;
		void this._eventPrefix;
		void this._defaultData;
		void iKeyOrClientFactory;
		void this._xhrOverride;

		this._aiCoreOrKey = undefined;
	}

	log(eventName: string, data?: any): void {
		void eventName;
		void data;
		this._aiCoreOrKey = undefined;
		return;
	}

	flush(): Promise<void> {
		this._aiCoreOrKey = undefined;
		return Promise.resolve(undefined);
	}
}
