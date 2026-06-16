/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AbstractOneDataSystemAppender, IAppInsightsCore } from '../common/1dsAppender.js';

export class OneDataSystemWebAppender extends AbstractOneDataSystemAppender {

	constructor(
		isInternalTelemetry: boolean,
		eventPrefix: string,
		defaultData: { [key: string]: any } | null,
		iKeyOrClientFactory: string | (() => IAppInsightsCore),
	) {
		super(isInternalTelemetry, eventPrefix, defaultData, iKeyOrClientFactory);

		// Etherana Coder is privacy-first: do not ping Microsoft 1DS health endpoints.
		this._aiCoreOrKey = undefined;
	}
}
