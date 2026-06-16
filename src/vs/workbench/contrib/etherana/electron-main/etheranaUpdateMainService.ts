/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IEnvironmentMainService } from '../../../../platform/environment/electron-main/environmentMainService.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { IUpdateService } from '../../../../platform/update/common/update.js';
import { IEtheranaUpdateService } from '../common/etheranaUpdateService.js';
import { EtheranaCheckUpdateRespose } from '../common/etheranaUpdateServiceTypes.js';



export class EtheranaMainUpdateService extends Disposable implements IEtheranaUpdateService {
	_serviceBrand: undefined;

	constructor(
		@IProductService private readonly _productService: IProductService,
		@IEnvironmentMainService private readonly _envMainService: IEnvironmentMainService,
		@IUpdateService private readonly _updateService: IUpdateService,
	) {
		super()
	}


	async check(explicit: boolean): Promise<EtheranaCheckUpdateRespose> {

		const isDevMode = !this._envMainService.isBuilt; // found in abstractUpdateService.ts

		// Etherana Coder privacy-first: do not perform automatic or manual online
		// update checks from the app. The injected services are retained for API
		// compatibility with the existing update channel.
		void this._productService;
		void this._updateService;

		if (isDevMode) {
			return { message: null } as const;
		}

		return this._manualCheckGHTagIfDisabled(explicit);
	}






	private async _manualCheckGHTagIfDisabled(explicit: boolean): Promise<EtheranaCheckUpdateRespose> {
		if (!explicit) {
			return { message: null } as const;
		}

		return {
			message: 'Online update checks are disabled in Etherana Coder. Please check the official release page manually if you want to update.',
			action: 'reinstall',
		} as const;
	}
}
