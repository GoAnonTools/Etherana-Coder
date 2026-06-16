/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { ActiveTunnelMode, INACTIVE_TUNNEL_MODE, IRemoteTunnelService, IRemoteTunnelSession, TunnelMode, TunnelStates, TunnelStatus } from '../common/remoteTunnel.js';

/**
 * Etherana Coder is privacy-first: Remote Tunnel access is disabled.
 *
 * This no-op service preserves the upstream service contract while ensuring
 * no tunnel CLI, login flow, background tunnel service, child process,
 * or remote access endpoint can be started from the application.
 */
export class RemoteTunnelService extends Disposable implements IRemoteTunnelService {

	declare readonly _serviceBrand: undefined;

	private readonly _onDidTokenFailedEmitter = new Emitter<IRemoteTunnelSession | undefined>();
	public readonly onDidTokenFailed = this._onDidTokenFailedEmitter.event;

	private readonly _onDidChangeTunnelStatusEmitter = new Emitter<TunnelStatus>();
	public readonly onDidChangeTunnelStatus = this._onDidChangeTunnelStatusEmitter.event;

	private readonly _onDidChangeModeEmitter = new Emitter<TunnelMode>();
	public readonly onDidChangeMode = this._onDidChangeModeEmitter.event;

	private readonly disabledStatus: TunnelStatus = TunnelStates.disconnected();

	public async getTunnelStatus(): Promise<TunnelStatus> {
		return this.disabledStatus;
	}

	public async getMode(): Promise<TunnelMode> {
		return INACTIVE_TUNNEL_MODE;
	}

	public async initialize(mode: TunnelMode): Promise<TunnelStatus> {
		void mode;
		this._onDidChangeModeEmitter.fire(INACTIVE_TUNNEL_MODE);
		this._onDidChangeTunnelStatusEmitter.fire(this.disabledStatus);
		return this.disabledStatus;
	}

	public async startTunnel(mode: ActiveTunnelMode): Promise<TunnelStatus> {
		// Ignore attempts to enable Remote Tunnel access.
		void mode;
		this._onDidChangeModeEmitter.fire(INACTIVE_TUNNEL_MODE);
		this._onDidChangeTunnelStatusEmitter.fire(this.disabledStatus);
		return this.disabledStatus;
	}

	public async stopTunnel(): Promise<void> {
		this._onDidChangeModeEmitter.fire(INACTIVE_TUNNEL_MODE);
		this._onDidChangeTunnelStatusEmitter.fire(this.disabledStatus);
		return;
	}

	public async getTunnelName(): Promise<string> {
		return 'etherana-coder';
	}
}
