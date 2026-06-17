/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

import { IExperimentationTelemetryReporter } from './experimentTelemetryReporter';

interface ExperimentTypes {
	// None for now.
}

interface NoOpExperimentationService {
	getTreatmentVariableAsync<T>(_namespace: string, _name: string, _checkCache?: boolean): Promise<T | undefined>;
}

const noOpExperimentationService: NoOpExperimentationService = {
	async getTreatmentVariableAsync<T>(): Promise<T | undefined> {
		return undefined;
	}
};

export class ExperimentationService {
	private readonly _experimentationServicePromise: Promise<NoOpExperimentationService>;

	constructor(telemetryReporter: IExperimentationTelemetryReporter, id: string, version: string, globalState: vscode.Memento) {
		void telemetryReporter;
		void id;
		void version;
		void globalState;
		this._experimentationServicePromise = Promise.resolve(noOpExperimentationService);
	}

	public async getTreatmentVariable<K extends keyof ExperimentTypes>(name: K, defaultValue: ExperimentTypes[K]): Promise<ExperimentTypes[K]> {
		void name;
		const experimentationService = await this._experimentationServicePromise;
		try {
			const treatmentVariable = await experimentationService.getTreatmentVariableAsync<ExperimentTypes[K]>('etherana', String(name), true);
			return treatmentVariable ?? defaultValue;
		} catch {
			return defaultValue;
		}
	}
}

export async function createTasExperimentationService(
	reporter: IExperimentationTelemetryReporter,
	id: string,
	version: string,
	globalState: vscode.Memento): Promise<NoOpExperimentationService> {
	void reporter;
	void id;
	void version;
	void globalState;
	return noOpExperimentationService;
}
