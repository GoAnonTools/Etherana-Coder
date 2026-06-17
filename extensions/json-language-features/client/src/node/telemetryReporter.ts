export default class TelemetryReporter {
	public sendTelemetryEvent(_eventName: string, _properties?: Record<string, string>, _measurements?: Record<string, number>): void {
		// Etherana Coder privacy-first: built-in extension telemetry is disabled.
	}

	public sendTelemetryErrorEvent(_eventName: string, _properties?: Record<string, string>, _measurements?: Record<string, number>, _errorProps?: string[]): void {
		// Etherana Coder privacy-first: built-in extension telemetry is disabled.
	}

	public dispose(): Promise<void> {
		return Promise.resolve();
	}
}
