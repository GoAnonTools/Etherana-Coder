/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { promisify } from 'util'
import { execFile as _execFile } from 'child_process'
import { IEtheranaSCMService } from '../common/etheranaSCMTypes.js'

interface NumStat {
	file: string
	added: number
	removed: number
}

const execFile = promisify(_execFile)

//8000 and 10 were chosen after some experimentation on small-to-moderately sized changes
const MAX_DIFF_LENGTH = 8000
const MAX_DIFF_FILES = 10

const git = async (args: string[], path: string): Promise<string> => {
	const { stdout, stderr } = await execFile('git', args, { cwd: path })
	if (stderr) {
		throw new Error(String(stderr))
	}
	return String(stdout).trim()
}

const stagedArgs = (useStagedChanges: boolean): string[] => useStagedChanges ? ['--staged'] : []

const assertSafeGitRef = (value: string, label: string): void => {
	if (!value || value.startsWith('-') || /[\0\r\n]/.test(value)) {
		throw new Error(`Unsafe ${label}`)
	}
}

const getNumStat = async (path: string, useStagedChanges: boolean): Promise<NumStat[]> => {
	const output = await git(['diff', '--numstat', ...stagedArgs(useStagedChanges)], path)
	return output
		.split('\n')
		.map((line) => {
			const [added, removed, file] = line.split('\t')
			return {
				file,
				added: parseInt(added, 10) || 0,
				removed: parseInt(removed, 10) || 0,
			}
		})
}

const getSampledDiff = async (file: string, path: string, useStagedChanges: boolean): Promise<string> => {
	const diff = await git(['diff', '--unified=0', '--no-color', ...stagedArgs(useStagedChanges), '--', file], path)
	return diff.slice(0, MAX_DIFF_LENGTH)
}

const hasStagedChanges = async (path: string): Promise<boolean> => {
	const output = await git(['diff', '--staged', '--name-only'], path)
	return output.length > 0
}

export class EtheranaSCMService implements IEtheranaSCMService {
	readonly _serviceBrand: undefined

	async gitStat(path: string): Promise<string> {
		const useStagedChanges = await hasStagedChanges(path)
		return git(['diff', '--stat', ...stagedArgs(useStagedChanges)], path)
	}

	async gitSampledDiffs(path: string): Promise<string> {
		const useStagedChanges = await hasStagedChanges(path)
		const numStatList = await getNumStat(path, useStagedChanges)
		const topFiles = numStatList
			.sort((a, b) => (b.added + b.removed) - (a.added + a.removed))
			.slice(0, MAX_DIFF_FILES)
		const diffs = await Promise.all(topFiles.map(async ({ file }) => ({ file, diff: await getSampledDiff(file, path, useStagedChanges) })))
		return diffs.map(({ file, diff }) => `==== ${file} ====\n${diff}`).join('\n\n')
	}

	gitBranch(path: string): Promise<string> {
		return git(['branch', '--show-current'], path)
	}

	gitLog(path: string): Promise<string> {
		return git(['log', '--pretty=format:%h|%s|%ad', '--date=short', '--no-merges', '-n', '5'], path)
	}

	async gitCheckoutBranch(path: string, branchName: string): Promise<void> {
		// Use -B to forcefully create/reset the branch if it exists, but usually the AI suggests a new name.
		// However, for safety in this automated context, we check if we're already on that branch first.
		const current = await this.gitBranch(path)
		if (current === branchName) return
		assertSafeGitRef(branchName, 'branch name')
		await git(['checkout', '-b', branchName], path)
	}

	async gitPush(path: string): Promise<void> {
		const branch = await this.gitBranch(path)
		// Push the current branch to origin
		assertSafeGitRef(branch, 'branch name')
		await git(['push', 'origin', branch], path)
	}
}
