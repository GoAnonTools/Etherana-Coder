/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export interface IExperimentationTelemetryReporter extends vscode.Disposable {
	setSharedProperty(name: string, value: string): void;
	postEvent(eventName: string, props: Map<string, string>): void;
	postEventObj(eventName: string, props: Record<string, string>): void;
}

export class ExperimentationTelemetryReporter implements IExperimentationTelemetryReporter {
	constructor(_reporter?: unknown) {
		void _reporter;
	}

	setSharedProperty(_name: string, _value: string): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	postEvent(_eventName: string, _props: Map<string, string>): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	postEventObj(_eventName: string, _props: Record<string, string>): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	dispose(): void {
		// No-op.
	}
}
