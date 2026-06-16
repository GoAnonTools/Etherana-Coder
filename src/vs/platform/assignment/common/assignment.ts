/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as platform from '../../../base/common/platform.js';

export const ASSIGNMENT_STORAGE_KEY = 'VSCode.ABExp.FeatureData';
export const ASSIGNMENT_REFETCH_INTERVAL = 0;

export interface IAssignmentService {
	readonly _serviceBrand: undefined;
	getTreatment<T>(name: string): Promise<T | undefined>;
}

export enum TargetPopulation {
	Insiders = 'insider',
	Public = 'public',
	Exploration = 'exploration'
}

export enum Filters {
	Market = 'X-MSEdge-Market',
	CorpNet = 'X-FD-Corpnet',
	ApplicationVersion = 'X-VSCode-AppVersion',
	Build = 'X-VSCode-Build',
	ClientId = 'X-MSEdge-ClientId',
	ExtensionName = 'X-VSCode-ExtensionName',
	ExtensionVersion = 'X-VSCode-ExtensionVersion',
	Language = 'X-VSCode-Language',
	TargetPopulation = 'X-VSCode-TargetPopulation',
}

// Compatibility interface retained so no TAS package is needed.
export interface IExperimentationFilterProvider {
	getFilterValue(filter: string): string | null;
	getFilters(): Map<string, string | null>;
}

export class AssignmentFilterProvider implements IExperimentationFilterProvider {

	constructor(
		private version: string,
		private appName: string,
		private machineId: string,
		private targetPopulation: TargetPopulation
	) { }

	private static trimVersionSuffix(version: string): string {
		const regex = /\-[a-zA-Z0-9]+$/;
		const result = version.split(regex);
		return result[0];
	}

	getFilterValue(filter: string): string | null {
		switch (filter) {
			case Filters.ApplicationVersion:
				return AssignmentFilterProvider.trimVersionSuffix(this.version);
			case Filters.Build:
				return this.appName;
			case Filters.ClientId:
				return this.machineId;
			case Filters.Language:
				return platform.language;
			case Filters.ExtensionName:
				return 'vscode-core';
			case Filters.ExtensionVersion:
				return '999999.0';
			case Filters.TargetPopulation:
				return this.targetPopulation;
			default:
				return '';
		}
	}

	getFilters(): Map<string, string | null> {
		const filters = new Map<string, string | null>();
		for (const value of Object.values(Filters)) {
			filters.set(value, this.getFilterValue(value));
		}
		return filters;
	}
}
