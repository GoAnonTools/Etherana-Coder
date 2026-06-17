/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, l10n, window } from 'vscode';

let warned = false;

export async function activate(context: ExtensionContext) {
	void context;

	if (!warned) {
		warned = true;
		void window.showWarningMessage(l10n.t('Microsoft account sign-in is disabled in Etherana Coder because the upstream provider depends on Microsoft-owned OAuth infrastructure.'));
	}
}

export function deactivate() {
	// No-op: Microsoft authentication is disabled in Etherana Coder.
}
