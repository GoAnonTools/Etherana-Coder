/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IToolsService } from '../toolsService.js';
import { IMCPService } from '../../common/mcpService.js';
import { ToolName, ToolCallParams, approvalTypeOfBuiltinToolName } from '../../common/toolsServiceTypes.js';
import { isABuiltinToolName } from '../../common/prompt/prompts.js';

export class ToolOrchestrator {
	constructor(
		private readonly _toolsService: IToolsService,
		private readonly _mcpService: IMCPService,
	) { }

	public analyzeRisk(toolName: ToolName, params: any): { risk: 'low' | 'medium' | 'high', details: string } {
		if (toolName === 'delete_file_or_folder') {
			return { risk: 'high', details: 'Deletion is destructive and cannot be undone by simple edit rollback.' };
		}
		if (toolName === 'run_command' || toolName === 'run_persistent_command') {
			const cmd = (params.command || '').toLowerCase();
			const dangerousPatterns = [
				'push', 'deploy', 'rm -rf', 'publish', 'git reset', 'git clean',
				'sudo', 'chmod', 'chown', 'docker', 'kubectl', 'terraform',
				'vercel', 'netlify', 'flyctl', 'npm publish', 'pnpm publish', 'yarn publish'
			];
			if (dangerousPatterns.some(p => cmd.includes(p))) {
				return { risk: 'high', details: 'Potentially destructive or external command detected.' };
			}
			if (cmd.includes('install') || cmd.includes('add') || cmd.includes('update')) {
				return { risk: 'medium', details: 'Modifying project dependencies.' };
			}
			return { risk: 'medium', details: 'Running a terminal command.' };
		}
		if (toolName === 'edit_file' || toolName === 'rewrite_file') {
			const path = params.uri?.path?.toLowerCase() || '';
			if (path.includes('package.json') || path.includes('tsconfig.json') || path.includes('webpack') || path.includes('vite.config')) {
				return { risk: 'high', details: 'Modifying critical project configuration.' };
			}
			if (path.includes('auth') || path.includes('security') || path.includes('login') || path.includes('.env')) {
				return { risk: 'high', details: 'Modifying sensitive security/authentication code.' };
			}
			return { risk: 'low', details: 'Local file modification.' };
		}
		return { risk: 'low', details: 'Standard task.' };
	}

	public getApprovalType(toolName: ToolName): "edits" | "terminal" | "MCP tools" | undefined {
		return isABuiltinToolName(toolName) ? approvalTypeOfBuiltinToolName[toolName] : 'MCP tools';
	}

	public validateParams(toolName: ToolName, unvalidatedParams: any): any {
		if (isABuiltinToolName(toolName)) {
			return this._toolsService.validateParams[toolName](unvalidatedParams);
		}
		return unvalidatedParams;
	}

	public stringifyResult(toolName: ToolName, toolResult: any): string {
		if (isABuiltinToolName(toolName)) {
			return this._toolsService.stringOfResult[toolName](null as any, toolResult); // Tool params not always needed for stringification
		}
		return this._mcpService.stringifyResult(toolResult);
	}

	public async callTool(toolName: ToolName, params: ToolCallParams<ToolName>): Promise<{ result: Promise<any>, interruptTool?: () => void }> {
		if (isABuiltinToolName(toolName)) {
			const res = await this._toolsService.callTool[toolName](params as any);
			return {
				result: Promise.resolve(res.result),
				interruptTool: res.interruptTool
			};
		} else {
			const mcpTools = this._mcpService.getMCPTools();
			const mcpTool = mcpTools?.find(t => t.name === toolName);
			if (!mcpTool) {
				throw new Error(`MCP tool ${toolName} not found`);
			}
			const result = this._mcpService.callMCPTool({
				serverName: mcpTool.mcpServerName ?? 'unknown_mcp_server',
				toolName: toolName,
				params: params
			}).then(r => r.result);
			return { result };
		}
	}
}
