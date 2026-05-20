/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export type SafetyMode = 'observe' | 'edit' | 'agent';

export const safetyModes: SafetyMode[] = ['observe', 'edit', 'agent'];

export const displayInfoOfSafetyMode = (mode: SafetyMode) => {
	switch (mode) {
		case 'observe':
			return {
				title: 'Observe',
				description: 'Read-only mode. AI can inspect context and suggest, but cannot modify files or run write actions.'
			};
		case 'edit':
			return {
				title: 'Edit',
				description: 'AI can apply approved edits to files. No terminal command-running autonomy.'
			};
		case 'agent':
			return {
				title: 'Agent',
				description: 'AI can edit files and run terminal commands. Full autonomy for approved actions.'
			};
	}
};
