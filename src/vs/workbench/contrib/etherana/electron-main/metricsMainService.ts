/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IMetricsService } from '../common/metricsService.js';

export class MetricsMainService extends Disposable implements IMetricsService {
	_serviceBrand: undefined;

	constructor() {
		super();
		console.log('MetricsMainService: Telemetry is disabled.');
	}

	capture(event: string, params: Record<string, any>): void {
		// No-op: Telemetry is disabled.
	}

	setOptOut(newVal: boolean): void {
		// No-op: Telemetry is disabled.
	}

	async getDebuggingProperties(): Promise<object> {
		return { telemetry: 'disabled' };
	}
}



