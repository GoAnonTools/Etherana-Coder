/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IEtheranaModelService } from '../common/etheranaModelService.js';

class ConvertContribWorkbenchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.etherana.convertcontrib'
	_serviceBrand: undefined;

	constructor(
		@IEtheranaModelService private readonly etheranaModelService: IEtheranaModelService,
		@IWorkspaceContextService private readonly workspaceContext: IWorkspaceContextService,
		@IFileService private readonly fileService: IFileService,
	) {
		super()

		const initializeURI = async (uri: URI) => {
			const etheranaRulesURI = URI.joinPath(uri, '.etheranarules')
			try {
				await this.fileService.stat(etheranaRulesURI)
				await this.etheranaModelService.initializeModel(etheranaRulesURI)
			}
			catch {
				// .etheranarules is optional. Missing rules should not create startup noise.
			}
		}

		// call
		this._register(this.workspaceContext.onDidChangeWorkspaceFolders((e) => {
			[...e.changed, ...e.added].forEach(w => { void initializeURI(w.uri) })
		}))
		this.workspaceContext.getWorkspace().folders.forEach(w => { void initializeURI(w.uri) })
	}
}


registerWorkbenchContribution2(ConvertContribWorkbenchContribution.ID, ConvertContribWorkbenchContribution, WorkbenchPhase.BlockRestore);
