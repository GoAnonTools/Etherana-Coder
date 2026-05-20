/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { ProxyChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';
import { EtheranaCheckUpdateRespose } from './etheranaUpdateServiceTypes.js';



export interface IEtheranaUpdateService {
	readonly _serviceBrand: undefined;
	check: (explicit: boolean) => Promise<EtheranaCheckUpdateRespose>;
}


export const IEtheranaUpdateService = createDecorator<IEtheranaUpdateService>('EtheranaUpdateService');


// implemented by calling channel
export class EtheranaUpdateService implements IEtheranaUpdateService {

	readonly _serviceBrand: undefined;
	private readonly etheranaUpdateService: IEtheranaUpdateService;

	constructor(
		@IMainProcessService mainProcessService: IMainProcessService, // (only usable on client side)
	) {
		// creates an IPC proxy to use metricsMainService.ts
		this.etheranaUpdateService = ProxyChannel.toService<IEtheranaUpdateService>(mainProcessService.getChannel('etherana-channel-update'));
	}


	// anything transmitted over a channel must be async even if it looks like it doesn't have to be
	check: IEtheranaUpdateService['check'] = async (explicit) => {
		const res = await this.etheranaUpdateService.check(explicit)
		return res
	}
}

registerSingleton(IEtheranaUpdateService, EtheranaUpdateService, InstantiationType.Eager);


