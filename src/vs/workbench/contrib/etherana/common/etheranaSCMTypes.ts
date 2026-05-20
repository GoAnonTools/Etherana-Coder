/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export interface IEtheranaSCMService {
	readonly _serviceBrand: undefined;
	/**
	 * Get git diff --stat
	 *
	 * @param path Path to the git repository
	 */
	gitStat(path: string): Promise<string>
	/**
	 * Get git diff --stat for the top 10 most significantly changed files according to lines added/removed
	 *
	 * @param path Path to the git repository
	 */
	gitSampledDiffs(path: string): Promise<string>
	/**
	 * Get the current git branch
	 *
	 * @param path Path to the git repository
	 */
	gitBranch(path: string): Promise<string>
	/**
	 * Get the last 5 commits excluding merges
	 *
	 * @param path Path to the git repository
	 */
	gitLog(path: string): Promise<string>
	/**
	 * Create and checkout a new branch
	 *
	 * @param path Path to the git repository
	 * @param branchName Name of the new branch
	 */
	gitCheckoutBranch(path: string, branchName: string): Promise<void>
	/**
	 * Push the current branch to origin
	 *
	 * @param path Path to the git repository
	 */
	gitPush(path: string): Promise<void>
}

export const IEtheranaSCMService = createDecorator<IEtheranaSCMService>('etheranaSCMService')
