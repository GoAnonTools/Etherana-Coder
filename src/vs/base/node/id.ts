/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Etherana Coder privacy-first:
 * - Do not hash MAC addresses.
 * - Do not read Windows SQM identifiers.
 * - Do not import OS/device identifier packages.
 * - Do not inspect network interfaces for VM/MAC hints.
 */

export const virtualMachineHint: { value(): number } = new class {
	value(): number {
		return 0;
	}
};

const LOCAL_MACHINE_ID = 'etherana-local-machine-id';
const LOCAL_DEV_DEVICE_ID = 'etherana-local-device-id';

let machineId: Promise<string>;
export async function getMachineId(errorLogger: (error: any) => void): Promise<string> {
	void errorLogger;
	if (!machineId) {
		machineId = Promise.resolve(LOCAL_MACHINE_ID);
	}
	return machineId;
}

export async function getSqmMachineId(errorLogger: (error: any) => void): Promise<string> {
	void errorLogger;
	return '';
}

export async function getdevDeviceId(errorLogger: (error: any) => void): Promise<string> {
	void errorLogger;
	return LOCAL_DEV_DEVICE_ID;
}
