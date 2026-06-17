/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import Severity from '../../../../base/common/severity.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { INotificationActions, INotificationHandle, INotificationService } from '../../../../platform/notification/common/notification.js';
import { IMetricsService } from '../common/metricsService.js';
import { IEtheranaUpdateService } from '../common/etheranaUpdateService.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { IUpdateService } from '../../../../platform/update/common/update.js';
import { EtheranaCheckUpdateRespose } from '../common/etheranaUpdateServiceTypes.js';
import { IAction } from '../../../../base/common/actions.js';




const notifyUpdate = (res: EtheranaCheckUpdateRespose & { message: string }, notifService: INotificationService, updateService: IUpdateService): INotificationHandle => {
	const message = res?.message || 'This is a very old version of Etherana, please download the latest version!'

	let actions: INotificationActions | undefined

	if (res?.action) {
		const primary: IAction[] = []



		if (res.action === 'download') {
			primary.push({
				label: `Download`,
				id: 'etherana.updater.download',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					updateService.downloadUpdate()
				}
			})
		}


		if (res.action === 'apply') {
			primary.push({
				label: `Apply`,
				id: 'etherana.updater.apply',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					updateService.applyUpdate()
				}
			})
		}

		if (res.action === 'restart') {
			primary.push({
				label: `Restart`,
				id: 'etherana.updater.restart',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					updateService.quitAndInstall()
				}
			})
		}



		actions = {
			primary: primary,
			secondary: [{
				id: 'etherana.updater.close',
				enabled: true,
				label: `Keep current version`,
				tooltip: '',
				class: undefined,
				run: () => {
					notifController.close()
				}
			}]
		}
	}
	else {
		actions = undefined
	}

	const notifController = notifService.notify({
		severity: Severity.Info,
		message: message,
		sticky: true,
		progress: actions ? { worked: 0, total: 100 } : undefined,
		actions: actions,
	})

	return notifController
	// const d = notifController.onDidClose(() => {
	// 	notifyYesUpdate(notifService, res)
	// 	d.dispose()
	// })
}
const notifyErrChecking = (notifService: INotificationService): INotificationHandle => {
	const message = `Etherana Error: There was an error checking for updates. If this persists, please get in touch or reinstall Etherana!`
	const notifController = notifService.notify({
		severity: Severity.Info,
		message: message,
		sticky: true,
	})
	return notifController
}


const performEtheranaCheck = async (
	explicit: boolean,
	notifService: INotificationService,
	etheranaUpdateService: IEtheranaUpdateService,
	metricsService: IMetricsService,
	updateService: IUpdateService,
): Promise<INotificationHandle | null> => {

	const metricsTag = explicit ? 'Manual' : 'Auto'

	metricsService.capture(`Etherana Update ${metricsTag}: Checking...`, {})
	const res = await etheranaUpdateService.check(explicit)
	if (!res) {
		const notifController = notifyErrChecking(notifService);
		metricsService.capture(`Etherana Update ${metricsTag}: Error`, { res })
		return notifController
	}
	else {
		if (res.message) {
			const notifController = notifyUpdate(res, notifService, updateService)
			metricsService.capture(`Etherana Update ${metricsTag}: Yes`, { res })
			return notifController
		}
		else {
			metricsService.capture(`Etherana Update ${metricsTag}: No`, { res })
			return null
		}
	}
}


// Action
let lastNotifController: INotificationHandle | null = null


registerAction2(class extends Action2 {
	constructor() {
		super({
			f1: true,
			id: 'etherana.voidCheckUpdate',
			title: localize2('voidCheckUpdate', 'Etherana Coder: Check for Updates'),
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const etheranaUpdateService = accessor.get(IEtheranaUpdateService)
		const notifService = accessor.get(INotificationService)
		const metricsService = accessor.get(IMetricsService)
		const updateService = accessor.get(IUpdateService)

		const currNotifController = lastNotifController

		const newController = await performEtheranaCheck(true, notifService, etheranaUpdateService, metricsService, updateService)

		if (newController) {
			currNotifController?.close()
			lastNotifController = newController
		}
	}
})

// on mount
class EtheranaUpdateWorkbenchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.etherana.etheranaUpdate'
	constructor(
		@IEtheranaUpdateService etheranaUpdateService: IEtheranaUpdateService,
		@IMetricsService metricsService: IMetricsService,
		@INotificationService notifService: INotificationService,
		@IUpdateService updateService: IUpdateService,
	) {
		super()

		// Etherana Coder privacy-first: do not schedule automatic update polling.
		// The manual update command remains available and returns a local disabled-update message.

	}
}
registerWorkbenchContribution2(EtheranaUpdateWorkbenchContribution.ID, EtheranaUpdateWorkbenchContribution, WorkbenchPhase.BlockRestore);
