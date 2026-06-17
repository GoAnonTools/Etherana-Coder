/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

export interface IExperimentationService {
	getTreatmentVariable<T>(_namespace: string, _name: string): T | undefined;
}

const noOpExperimentationService: IExperimentationService = {
	getTreatmentVariable<T>(): T | undefined {
		return undefined;
	}
};

export async function createExperimentationService(
	context: vscode.ExtensionContext,
	experimentationTelemetry: unknown,
	isPreRelease: boolean,
): Promise<IExperimentationService> {
	void context;
	void experimentationTelemetry;
	void isPreRelease;
	return noOpExperimentationService;
}
