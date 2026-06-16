/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { IAssignmentService } from '../../../../platform/assignment/common/assignment.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { BaseAssignmentService } from '../../../../platform/assignment/common/assignmentService.js';
import { workbenchConfigurationNodeBase } from '../../../common/configuration.js';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope } from '../../../../platform/configuration/common/configurationRegistry.js';
import { IEnvironmentService } from '../../../../platform/environment/common/environment.js';

export const IWorkbenchAssignmentService = createDecorator<IWorkbenchAssignmentService>('WorkbenchAssignmentService');

export interface IWorkbenchAssignmentService extends IAssignmentService {
	getCurrentExperiments(): Promise<string[] | undefined>;
}

export class WorkbenchAssignmentService extends BaseAssignmentService {

	constructor(
		@IConfigurationService configurationService: IConfigurationService,
		@IProductService productService: IProductService,
		@IEnvironmentService environmentService: IEnvironmentService
	) {
		super(
			'etherana-coder',
			configurationService,
			productService,
			environmentService
		);
	}

	protected override get experimentsEnabled(): boolean {
		return false;
	}

	override async getTreatment<T>(name: string): Promise<T | undefined> {
		// Etherana Coder is privacy-first: no Microsoft TAS / experimentation lookups.
		void name;
		return undefined;
	}

	async getCurrentExperiments(): Promise<string[] | undefined> {
		return undefined;
	}
}

registerSingleton(IWorkbenchAssignmentService, WorkbenchAssignmentService, InstantiationType.Delayed);

const registry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
registry.registerConfiguration({
	...workbenchConfigurationNodeBase,
	'properties': {
		'workbench.enableExperiments': {
			'type': 'boolean',
			'description': localize('workbench.enableExperiments', "Microsoft online experiments are disabled in Etherana Coder."),
			'default': false,
			'scope': ConfigurationScope.APPLICATION,
			'restricted': true,
			'tags': ['usesOnlineServices']
		}
	}
});
