/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRequestService } from '../../request/common/request.js';
import { AbstractOneDataSystemAppender, IAppInsightsCore } from '../common/1dsAppender.js';

export class OneDataSystemAppender extends AbstractOneDataSystemAppender {

	constructor(
		requestService: IRequestService | undefined,
		isInternalTelemetry: boolean,
		eventPrefix: string,
		defaultData: { [key: string]: any } | null,
		iKeyOrClientFactory: string | (() => IAppInsightsCore),
	) {
		void requestService;

		// Etherana Coder is privacy-first: never create a telemetry HTTP override.
		super(isInternalTelemetry, eventPrefix, defaultData, iKeyOrClientFactory);
		this._aiCoreOrKey = undefined;
	}
}
