/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const enum MicrosoftAccountType {
	AAD = 'aad',
	MSA = 'msa',
	Unknown = 'unknown'
}

type TelemetryEventProperties = Record<string, string | number | boolean | undefined>;

class NoOpTelemetryReporter {
	sendTelemetryEvent(_eventName: string, _properties?: TelemetryEventProperties, _measurements?: Record<string, number>): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	sendTelemetryErrorEvent(_eventName: string, _properties?: TelemetryEventProperties, _measurements?: Record<string, number>): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	dispose(): Promise<void> {
		return Promise.resolve();
	}
}

export class MicrosoftAuthenticationTelemetryReporter {
	private sharedProperties: Record<string, string> = {};
	protected _telemetryReporter = new NoOpTelemetryReporter();

	constructor(_aiKey?: string) {
		void _aiKey;
	}

	get telemetryReporter(): any {
		return this._telemetryReporter;
	}

	setSharedProperty(name: string, value: string): void {
		this.sharedProperties[name] = value;
	}

	postEvent(_eventName: string, _props: Map<string, string>): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	sendLoginEvent(_scopes: readonly string[]): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	sendLoginFailedEvent(): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	sendLogoutEvent(): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	sendLogoutFailedEvent(): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	sendAccountEvent(_scopes: string[], _accountType: MicrosoftAccountType): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	protected _scrubGuids(scopes: readonly string[]): string[] {
		return scopes.map(s => s.replace(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i, '{guid}'));
	}
}

export class MicrosoftSovereignCloudAuthenticationTelemetryReporter extends MicrosoftAuthenticationTelemetryReporter {
	override sendLoginEvent(_scopes: string[]): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	override sendLoginFailedEvent(): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	override sendLogoutEvent(): void {
		// No-op: Etherana Coder disables extension telemetry.
	}

	override sendLogoutFailedEvent(): void {
		// No-op: Etherana Coder disables extension telemetry.
	}
}
