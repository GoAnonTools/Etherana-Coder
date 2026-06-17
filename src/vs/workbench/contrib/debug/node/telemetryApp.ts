/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Server } from '../../../../base/parts/ipc/node/ipc.cp.js';
import { TelemetryAppenderChannel } from '../../../../platform/telemetry/common/telemetryIpc.js';

const appender = {
	log(): void {
		// Etherana Coder privacy-first: debug telemetry appender is disabled.
	},
	flush(): Promise<void> {
		return Promise.resolve();
	}
};

process.once('exit', () => void appender.flush());

const channel = new TelemetryAppenderChannel([appender]);
const server = new Server('telemetry');
server.registerChannel('telemetryAppender', channel);
