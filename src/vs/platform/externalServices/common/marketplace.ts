/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IHeaders } from '../../../base/parts/request/common/request.js';
import { IConfigurationService } from '../../configuration/common/configuration.js';
import { IEnvironmentService } from '../../environment/common/environment.js';
import { IFileService } from '../../files/common/files.js';
import { IProductService } from '../../product/common/productService.js';
import { IStorageService } from '../../storage/common/storage.js';
import { ITelemetryService } from '../../telemetry/common/telemetry.js';

export async function resolveMarketplaceHeaders(version: string,
	productService: IProductService,
	environmentService: IEnvironmentService,
	configurationService: IConfigurationService,
	fileService: IFileService,
	storageService: IStorageService | undefined,
	telemetryService: ITelemetryService): Promise<IHeaders> {

	// Etherana Coder privacy-first: marketplace requests must not include
	// service-machine, session, telemetry, or hardware-derived identifiers.
	void environmentService;
	void configurationService;
	void fileService;
	void storageService;
	void telemetryService;

	const headers: IHeaders = {
		'X-Market-Client-Id': `Etherana Coder ${version}`,
		'User-Agent': `${productService.nameShort} ${version}`
	};

	return headers;
}
