/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

export interface TelemetryReporter {
	dispose(): void;
	sendTelemetryEvent(eventName: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }): void;
	sendTelemetryErrorEvent(eventName: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }, errorProps?: string[]): void;
}

const nullReporter: TelemetryReporter = new class NullTelemetryReporter implements TelemetryReporter {
	public dispose(): void {
		// No-op.
	}

	public sendTelemetryEvent(_eventName: string, _properties?: { [key: string]: string }, _measurements?: { [key: string]: number }): void {
		// Etherana Coder privacy-first: built-in extension telemetry is disabled.
	}

	public sendTelemetryErrorEvent(_eventName: string, _properties?: { [key: string]: string }, _measurements?: { [key: string]: number }, _errorProps?: string[]): void {
		// Etherana Coder privacy-first: built-in extension telemetry is disabled.
	}
};

export function loadDefaultTelemetryReporter(): TelemetryReporter {
	return nullReporter;
}
