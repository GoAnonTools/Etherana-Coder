/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export class ExperimentationTelemetry {
	private sharedProperties: Record<string, string> = {};

	constructor(_context: vscode.ExtensionContext, _baseReporter?: unknown) {
		void _context;
		void _baseReporter;
	}

	async sendTelemetryEvent(_eventName: string, _properties?: Record<string, string>, _measurements?: Record<string, number>) {
		// No-op: Etherana Coder disables extension telemetry.
	}

	async sendTelemetryErrorEvent(
		_eventName: string,
		_properties?: Record<string, string>,
		_measurements?: Record<string, number>
	) {
		// No-op: Etherana Coder disables extension telemetry.
	}

	setSharedProperty(name: string, value: string): void {
		this.sharedProperties[name] = value;
	}

	postEvent(_eventName: string, _props: Map<string, string>): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	dispose(): Promise<void> {
		return Promise.resolve();
	}
}
