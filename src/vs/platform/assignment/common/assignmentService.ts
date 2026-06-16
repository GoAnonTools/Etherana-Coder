/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConfigurationService } from '../../configuration/common/configuration.js';
import { IEnvironmentService } from '../../environment/common/environment.js';
import { IProductService } from '../../product/common/productService.js';
import { IAssignmentService } from './assignment.js';

// Compatibility interfaces retained so callers do not need the TAS client package.
export interface IExperimentationTelemetry {
	readonly assignmentContext?: string[] | undefined;
	setSharedProperty?(name: string, value: string): void;
	postEvent?(eventName: string, props: Map<string, string>): void;
}

export interface IKeyValueStorage {
	getValue?<T>(key: string, defaultValue?: T): Promise<T | undefined>;
	setValue?<T>(key: string, value: T): void;
}

export abstract class BaseAssignmentService implements IAssignmentService {

	declare readonly _serviceBrand: undefined;

	protected tasClient: Promise<never> | undefined = undefined;
	protected get experimentsEnabled(): boolean {
		return false;
	}

	constructor(
		private readonly machineId: string,
		protected readonly configurationService: IConfigurationService,
		protected readonly productService: IProductService,
		protected readonly environmentService: IEnvironmentService,
		protected telemetry?: IExperimentationTelemetry,
		private keyValueStorage?: IKeyValueStorage
	) {
		// Etherana Coder is privacy-first: Microsoft TAS / experimentation is disabled.
		// Keep constructor parameters for API compatibility with upstream services.
		void this.machineId;
		void this.configurationService;
		void this.productService;
		void this.environmentService;
		void this.telemetry;
		void this.keyValueStorage;
	}

	async getTreatment<T>(name: string): Promise<T | undefined> {
		// Do not read overrides, initialize TAS, fetch experiments, or log assignment telemetry.
		void name;
		return undefined;
	}
}
