/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Mocha = require('mocha');

let options: Mocha.MochaOptions = {
	ui: 'tdd',
	color: true
};

export function configure(opts: Mocha.MochaOptions): void {
	options = {
		...options,
		...opts
	};
}

export function run(testsRoot: string, callback: (error: Error | null, failures?: number) => void): void {
	const mocha = new Mocha(options);

	try {
		mocha.addFile(testsRoot);

		mocha.run((failures: number) => {
			callback(null, failures);
		});
	} catch (error) {
		callback(error instanceof Error ? error : new Error(String(error)));
	}
}
