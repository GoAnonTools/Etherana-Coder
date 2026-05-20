/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILanguageFeaturesService } from '../../../../editor/common/services/languageFeatures.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { EndOfLinePreference, ITextModel } from '../../../../editor/common/model.js';
import { Position } from '../../../../editor/common/core/position.js';
import { InlineCompletion } from '../../../../editor/common/languages.js';
import { Range } from '../../../../editor/common/core/range.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { isCodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { EditorResourceAccessor, EditorsOrder } from '../../../common/editor.js';
import { IModelService } from '../../../../editor/common/services/model.js';
import { extractCodeFromRegular } from '../common/helpers/extractCodeFromResult.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ILLMMessageService } from '../common/sendLLMMessageService.js';
import { isWindows } from '../../../../base/common/platform.js';
import { IEtheranaSettingsService } from '../common/etheranaSettingsService.js';
import { FeatureName } from '../common/etheranaSettingsTypes.js';
import { IConvertToLLMMessageService } from './convertToLLMMessageService.js';
import { IContextGatheringService } from './contextGatheringService.js';
import { URI } from '../../../../base/common/uri.js';
import { IProjectMemoryService } from './projectMemoryService.js';

const allLinebreakSymbols = ['\r\n', '\n'];
const _ln = isWindows ? allLinebreakSymbols[0] : allLinebreakSymbols[1];

class LRUCache<K, V> {
	public items: Map<K, V>;
	private keyOrder: K[];
	private maxSize: number;
	private disposeCallback?: (value: V, key?: K) => void;

	constructor(maxSize: number, disposeCallback?: (value: V, key?: K) => void) {
		if (maxSize <= 0) throw new Error('Cache size must be greater than 0');

		this.items = new Map();
		this.keyOrder = [];
		this.maxSize = maxSize;
		this.disposeCallback = disposeCallback;
	}

	set(key: K, value: V): void {
		if (this.items.has(key)) {
			this.keyOrder = this.keyOrder.filter(k => k !== key);
		} else if (this.items.size >= this.maxSize) {
			const key = this.keyOrder[0];
			const value = this.items.get(key);
			if (this.disposeCallback && value !== undefined) {
				this.disposeCallback(value, key);
			}
			this.items.delete(key);
			this.keyOrder.shift();
		}
		this.items.set(key, value);
		this.keyOrder.push(key);
	}

	delete(key: K): boolean {
		const value = this.items.get(key);
		if (value !== undefined) {
			if (this.disposeCallback) {
				this.disposeCallback(value, key);
			}
			this.items.delete(key);
			this.keyOrder = this.keyOrder.filter(k => k !== key);
			return true;
		}
		return false;
	}

	clear(): void {
		if (this.disposeCallback) {
			for (const [key, value] of this.items.entries()) {
				this.disposeCallback(value, key);
			}
		}
		this.items.clear();
		this.keyOrder = [];
	}

	get size(): number {
		return this.items.size;
	}

	has(key: K): boolean {
		return this.items.has(key);
	}
}

type AutocompletionPredictionType =
	| 'single-line-fill-middle'
	| 'single-line-redo-suffix'
	| 'multi-line-start-on-next-line'
	| 'do-not-predict';

type Autocompletion = {
	id: number,
	prefix: string,
	suffix: string,
	llmPrefix: string,
	llmSuffix: string,
	startTime: number,
	endTime: number | undefined,
	status: 'pending' | 'finished' | 'error',
	type: AutocompletionPredictionType,
	llmPromise: Promise<string> | undefined,
	insertText: string,
	requestId: string | null,
	_newlineCount: number,
};

const DEBOUNCE_TIME = 500;
const TIMEOUT_TIME = 60000;
const MAX_CACHE_SIZE = 20;
const MAX_PENDING_REQUESTS = 2;

const processStartAndEndSpaces = (resultText: string) => {
	const [extracted,] = extractCodeFromRegular({ text: resultText, recentlyAddedTextLen: resultText.length });
	const hasLeadingSpace = extracted.startsWith(' ');
	const hasTrailingSpace = extracted.endsWith(' ');
	return (hasLeadingSpace ? ' ' : '') + extracted.trim() + (hasTrailingSpace ? ' ' : '');
};

const removeLeftTabsAndTrimEnds = (s: string): string => {
	const trimmedString = s.trimEnd();
	const trailingEnd = s.slice(trimmedString.length);
	if (trailingEnd.includes(_ln)) {
		s = trimmedString + _ln;
	}
	s = s.replace(/^\s+/gm, '');
	return s;
};

const removeAllWhitespace = (str: string): string => str.replace(/\s+/g, '');

function getIsSubsequence({ of, subsequence }: { of: string, subsequence: string }): [boolean, string] {
	if (subsequence.length === 0) return [true, ''];
	if (of.length === 0) return [false, ''];
	let subsequenceIndex = 0;
	let lastMatchChar = '';
	for (let i = 0; i < of.length; i++) {
		if (of[i] === subsequence[subsequenceIndex]) {
			lastMatchChar = of[i];
			subsequenceIndex++;
		}
		if (subsequenceIndex === subsequence.length) {
			return [true, lastMatchChar];
		}
	}
	return [false, lastMatchChar];
}

function getStringUpToUnbalancedClosingParenthesis(s: string, prefix: string): string {
	const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
	let stack: string[] = [];
	const firstOpenIdx = prefix.search(/[[({]/);
	if (firstOpenIdx !== -1) {
		const brackets = prefix.slice(firstOpenIdx).split('').filter(c => '()[]{}'.includes(c));
		for (const bracket of brackets) {
			if (bracket === '(' || bracket === '{' || bracket === '[') {
				stack.push(bracket);
			} else {
				if (stack.length > 0 && stack[stack.length - 1] === pairs[bracket]) {
					stack.pop();
				} else {
					stack.push(bracket);
				}
			}
		}
	}
	for (let i = 0; i < s.length; i++) {
		const char = s[i];
		if (char === '(' || char === '{' || char === '[') { stack.push(char); }
		else if (char === ')' || char === '}' || char === ']') {
			if (stack.length === 0 || stack.pop() !== pairs[char]) { return s.substring(0, i); }
		}
	}
	return s;
}

const postprocessAutocompletion = ({ autocompletionMatchup, autocompletion, prefixAndSuffix }: { autocompletionMatchup: AutocompletionMatchupBounds, autocompletion: Autocompletion, prefixAndSuffix: PrefixAndSuffixInfo }) => {
	const { prefix, prefixToTheLeftOfCursor, suffixToTheRightOfCursor } = prefixAndSuffix;
	const generatedMiddle = autocompletion.insertText;
	let startIdx = autocompletionMatchup.startIdx;
	let endIdx = generatedMiddle.length;
	const charToLeftOfCursor = prefixToTheLeftOfCursor.slice(-1)[0] || '';
	const userHasAddedASpace = charToLeftOfCursor === ' ' || charToLeftOfCursor === '\t';
	const rawFirstNonspaceIdx = generatedMiddle.slice(startIdx).search(/[^\t ]/);
	if (rawFirstNonspaceIdx > -1 && userHasAddedASpace) {
		startIdx = Math.max(startIdx, rawFirstNonspaceIdx + startIdx);
	}
	const numStartingNewlines = generatedMiddle.slice(startIdx).match(new RegExp(`^${_ln}+`))?.[0].length || 0;
	if (!prefixToTheLeftOfCursor.trim() && !suffixToTheRightOfCursor.trim() && numStartingNewlines > 0) {
		startIdx += numStartingNewlines;
	}
	if (autocompletion.type === 'single-line-fill-middle' && suffixToTheRightOfCursor.trim()) {
		const rawMatchIndex = generatedMiddle.slice(startIdx).lastIndexOf(suffixToTheRightOfCursor.trim()[0]);
		if (rawMatchIndex > -1) {
			const matchIdx = rawMatchIndex + startIdx;
			const matchChar = generatedMiddle[matchIdx];
			if (`{}()[]<>\`'"`.includes(matchChar)) {
				endIdx = Math.min(endIdx, matchIdx);
			}
		}
	}
	const restOfLineToGenerate = generatedMiddle.slice(startIdx).split(_ln)[0] ?? '';
	if (prefixToTheLeftOfCursor.trim() && !suffixToTheRightOfCursor.trim() && restOfLineToGenerate.trim()) {
		const rawNewlineIdx = generatedMiddle.slice(startIdx).indexOf(_ln);
		if (rawNewlineIdx > -1) {
			endIdx = Math.min(endIdx, rawNewlineIdx + startIdx);
		}
	}
	let completionStr = generatedMiddle.slice(startIdx, endIdx);
	completionStr = getStringUpToUnbalancedClosingParenthesis(completionStr, prefix);
	return completionStr;
};

const toInlineCompletions = ({ autocompletionMatchup, autocompletion, prefixAndSuffix, position }: { autocompletionMatchup: AutocompletionMatchupBounds, autocompletion: Autocompletion, prefixAndSuffix: PrefixAndSuffixInfo, position: Position }): { insertText: string, range: Range }[] => {
	let trimmedInsertText = postprocessAutocompletion({ autocompletionMatchup, autocompletion, prefixAndSuffix });
	let rangeToReplace: Range = new Range(position.lineNumber, position.column, position.lineNumber, position.column);
	if (autocompletion.type === 'single-line-redo-suffix') {
		const oldSuffix = prefixAndSuffix.suffixToTheRightOfCursor;
		const newSuffix = autocompletion.insertText;
		const [isSubseq, lastMatchingChar] = getIsSubsequence({
			subsequence: removeAllWhitespace(oldSuffix),
			of: removeAllWhitespace(newSuffix),
		});
		if (isSubseq) {
			rangeToReplace = new Range(position.lineNumber, position.column, position.lineNumber, Number.MAX_SAFE_INTEGER);
		} else {
			const lastMatchupIdx = trimmedInsertText.lastIndexOf(lastMatchingChar);
			trimmedInsertText = trimmedInsertText.slice(0, lastMatchupIdx + 1);
			const numCharsToReplace = oldSuffix.lastIndexOf(lastMatchingChar) + 1;
			rangeToReplace = new Range(position.lineNumber, position.column, position.lineNumber, position.column + numCharsToReplace);
		}
	}
	return [{ insertText: trimmedInsertText, range: rangeToReplace }];
};

type PrefixAndSuffixInfo = { prefix: string, suffix: string, prefixLines: string[], suffixLines: string[], prefixToTheLeftOfCursor: string, suffixToTheRightOfCursor: string };
const getPrefixAndSuffixInfo = (model: ITextModel, position: Position): PrefixAndSuffixInfo => {
	const fullText = model.getValue(EndOfLinePreference.LF);
	const cursorOffset = model.getOffsetAt(position);
	const prefix = fullText.substring(0, cursorOffset);
	const suffix = fullText.substring(cursorOffset);
	const prefixLines = prefix.split(_ln);
	const suffixLines = suffix.split(_ln);
	const prefixToTheLeftOfCursor = prefixLines.slice(-1)[0] ?? '';
	const suffixToTheRightOfCursor = suffixLines[0] ?? '';
	return { prefix, suffix, prefixLines, suffixLines, prefixToTheLeftOfCursor, suffixToTheRightOfCursor };
};

const getIndex = (str: string, line: number, char: number) => {
	return str.split(_ln).slice(0, line).join(_ln).length + (line > 0 ? 1 : 0) + char;
};
const getLastLine = (s: string): string => {
	const matches = s.match(new RegExp(`[^${_ln}]*$`));
	return matches ? matches[0] : '';
};

type AutocompletionMatchupBounds = {
	startLine: number,
	startCharacter: number,
	startIdx: number,
};

const getAutocompletionMatchup = ({ prefix, autocompletion }: { prefix: string, autocompletion: Autocompletion }): AutocompletionMatchupBounds | undefined => {
	const trimmedCurrentPrefix = removeLeftTabsAndTrimEnds(prefix);
	const trimmedCompletionPrefix = removeLeftTabsAndTrimEnds(autocompletion.prefix);
	const trimmedCompletionMiddle = removeLeftTabsAndTrimEnds(autocompletion.insertText);
	if (trimmedCurrentPrefix.length < trimmedCompletionPrefix.length) return undefined;
	if (!(trimmedCompletionPrefix + trimmedCompletionMiddle).startsWith(trimmedCurrentPrefix)) return undefined;
	const lineStart = trimmedCurrentPrefix.split(_ln).length - trimmedCompletionPrefix.split(_ln).length;
	if (lineStart < 0) return undefined;
	const currentPrefixLine = getLastLine(trimmedCurrentPrefix);
	const completionPrefixLine = lineStart === 0 ? getLastLine(trimmedCompletionPrefix) : '';
	const completionMiddleLine = autocompletion.insertText.split(_ln)[lineStart];
	const fullCompletionLine = completionPrefixLine + completionMiddleLine;
	const charMatchIdx = fullCompletionLine.indexOf(currentPrefixLine);
	if (charMatchIdx < 0) return undefined;
	const character = charMatchIdx + currentPrefixLine.length - completionPrefixLine.length;
	const startIdx = getIndex(autocompletion.insertText, lineStart, character);
	return { startLine: lineStart, startCharacter: character, startIdx };
};

type CompletionOptions = {
	predictionType: AutocompletionPredictionType,
	shouldGenerate: boolean,
	llmPrefix: string,
	llmSuffix: string,
	stopTokens: string[],
};

const getCompletionOptions = (prefixAndSuffix: PrefixAndSuffixInfo, relevantContext: string, justAcceptedAutocompletion: boolean): CompletionOptions => {
	let { prefix, suffix, prefixToTheLeftOfCursor, suffixToTheRightOfCursor, suffixLines, prefixLines } = prefixAndSuffix;
	suffixLines = suffix.split(_ln).slice(0, 25);
	prefixLines = prefix.split(_ln).slice(-25);
	prefix = prefixLines.join(_ln);
	suffix = suffixLines.join(_ln);
	let completionOptions: CompletionOptions;
	const isLineEmpty = !prefixToTheLeftOfCursor.trim() && !suffixToTheRightOfCursor.trim();
	const isLinePrefixEmpty = removeAllWhitespace(prefixToTheLeftOfCursor).length === 0;
	const isLineSuffixEmpty = removeAllWhitespace(suffixToTheRightOfCursor).length === 0;
	if (justAcceptedAutocompletion && isLineSuffixEmpty) {
		completionOptions = {
			predictionType: 'multi-line-start-on-next-line',
			shouldGenerate: true,
			llmPrefix: prefix + _ln,
			llmSuffix: suffix,
			stopTokens: [`${_ln}${_ln}`]
		};
	} else if (isLineEmpty) {
		completionOptions = {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: allLinebreakSymbols
		};
	} else if (removeAllWhitespace(suffixToTheRightOfCursor).length <= 3) {
		const suffixLinesIgnoringLine = suffixLines.slice(1);
		const suffixStringIgnoringLine = suffixLinesIgnoringLine.length === 0 ? '' : _ln + suffixLinesIgnoringLine.join(_ln);
		completionOptions = {
			predictionType: 'single-line-redo-suffix',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffixStringIgnoringLine,
			stopTokens: allLinebreakSymbols
		};
	} else if (!isLinePrefixEmpty) {
		completionOptions = {
			predictionType: 'single-line-fill-middle',
			shouldGenerate: true,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: allLinebreakSymbols
		};
	} else {
		completionOptions = {
			predictionType: 'do-not-predict',
			shouldGenerate: false,
			llmPrefix: prefix,
			llmSuffix: suffix,
			stopTokens: []
		};
	}
	return completionOptions;
};

export interface IAutocompleteService {
	readonly _serviceBrand: undefined;
}

export const IAutocompleteService = createDecorator<IAutocompleteService>('AutocompleteService');

export class AutocompleteService extends Disposable implements IAutocompleteService {
	static readonly ID = 'etherana.autocompleteService';
	_serviceBrand: undefined;
	private _autocompletionId: number = 0;
	private _autocompletionsOfDocument: { [docUriStr: string]: LRUCache<number, Autocompletion> } = {};
	private _lastCompletionStart = 0;
	private _lastCompletionAccept = 0;

	constructor(
		@ILanguageFeaturesService private readonly _langFeaturesService: ILanguageFeaturesService,
		@ILLMMessageService private readonly _llmMessageService: ILLMMessageService,
		@IEtheranaSettingsService private readonly _settingsService: IEtheranaSettingsService,
		@IConvertToLLMMessageService private readonly _convertToLLMMessageService: IConvertToLLMMessageService,
		@IModelService private readonly _modelService: IModelService,
		@IEditorService private readonly _editorService: IEditorService,
		@IContextGatheringService private readonly _contextGatheringService: IContextGatheringService,
		@IProjectMemoryService private readonly _projectMemoryService: IProjectMemoryService,
	) {
		super();
		this._register(this._langFeaturesService.inlineCompletionsProvider.register({ pattern: '**' }, {
			provideInlineCompletions: async (model, position) => {
				const items = await this._provideInlineCompletionItems(model, position);
				return { items };
			},
			freeInlineCompletions: () => {
				const activePane = this._editorService.activeEditorPane;
				if (!activePane) return;
				const control = activePane.getControl();
				if (!control || !isCodeEditor(control)) return;
				const position = control.getPosition();
				if (!position) return;
				const resource = EditorResourceAccessor.getCanonicalUri(this._editorService.activeEditor);
				if (!resource) return;
				const model = this._modelService.getModel(resource);
				if (!model) return;
				const docUriStr = resource.fsPath;
				if (!this._autocompletionsOfDocument[docUriStr]) return;
				const { prefix } = getPrefixAndSuffixInfo(model, position);
				this._autocompletionsOfDocument[docUriStr].items.forEach((autocompletion: Autocompletion) => {
					if (removeAllWhitespace(prefix) === removeAllWhitespace(autocompletion.prefix + autocompletion.insertText)) {
						this._lastCompletionAccept = Date.now();
						this._autocompletionsOfDocument[docUriStr].delete(autocompletion.id);
					}
				});
			}
		}));
	}

	private async _gatherRelevantContext(model: ITextModel, position: Position): Promise<string> {
		try {
			await this._contextGatheringService.updateCache(model, position);
			const snippets = this._contextGatheringService.getCachedSnippets();
			const otherTabsContext = await this._getOtherTabsContext(model.uri);
			const memoryContext = await this._getProjectMemoryContext(model);
			return [...snippets, ...otherTabsContext, ...memoryContext].join('\n-------------------------------\n');
		} catch (e) {
			console.error('Error gathering context for autocomplete:', e);
			return '';
		}
	}

	private async _getOtherTabsContext(currentUri: URI): Promise<string[]> {
		const editors = this._editorService.getEditors(EditorsOrder.MOST_RECENTLY_ACTIVE);
		const contextLines: string[] = [];
		let count = 0;
		for (const identifier of editors) {
			if (count >= 2) break;
			const resource = identifier.editor.resource;
			if (resource && resource.toString() !== currentUri.toString()) {
				const otherModel = this._modelService.getModel(resource);
				if (otherModel) {
					const text = otherModel.getValue().substring(0, 400);
					if (text.trim()) {
						contextLines.push(`/* From ${resource.fsPath} */\n${text}`);
						count++;
					}
				}
			}
		}
		return contextLines;
	}

	private async _getProjectMemoryContext(model: ITextModel): Promise<string[]> {
		const settings = this._settingsService.state.globalSettings.projectMemory;
		if (!settings || !settings.enabled || !settings.includeInAutocomplete) return [];

		const entries = this._projectMemoryService.getRelevantEntries({
			filePaths: [model.uri.fsPath],
			limit: 3, // Keep it small for autocomplete performance
			preferUserConfirmed: settings.preferUserConfirmed
		});

		if (entries.length === 0) return [];

		// Mark as used
		this._projectMemoryService.markEntriesUsed(entries.map(e => e.id));

		return entries.map(e => `/* Project Memory: ${e.title} */\n${e.summary}`);
	}

	async _provideInlineCompletionItems(model: ITextModel, position: Position): Promise<InlineCompletion[]> {
		if (!this._settingsService.state.globalSettings.enableAutocomplete) return [];
		const docUriStr = model.uri.fsPath;
		const prefixAndSuffix = getPrefixAndSuffixInfo(model, position);
		const { prefix, suffix } = prefixAndSuffix;
		if (!this._autocompletionsOfDocument[docUriStr]) {
			this._autocompletionsOfDocument[docUriStr] = new LRUCache<number, Autocompletion>(MAX_CACHE_SIZE, (ac) => { if (ac.requestId) this._llmMessageService.abort(ac.requestId); });
		}
		let cachedAutocompletion: Autocompletion | undefined;
		let autocompletionMatchup: AutocompletionMatchupBounds | undefined;
		for (const ac of this._autocompletionsOfDocument[docUriStr].items.values()) {
			autocompletionMatchup = getAutocompletionMatchup({ prefix, autocompletion: ac });
			if (autocompletionMatchup !== undefined) {
				cachedAutocompletion = ac;
				break;
			}
		}
		if (cachedAutocompletion && autocompletionMatchup) {
			if (cachedAutocompletion.status === 'finished') {
				return toInlineCompletions({ autocompletionMatchup, autocompletion: cachedAutocompletion, prefixAndSuffix, position });
			} else if (cachedAutocompletion.status === 'pending') {
				try {
					await cachedAutocompletion.llmPromise;
					return toInlineCompletions({ autocompletionMatchup, autocompletion: cachedAutocompletion, prefixAndSuffix, position });
				} catch (e) {
					this._autocompletionsOfDocument[docUriStr].delete(cachedAutocompletion.id);
				}
			}
			return [];
		}
		const thisTime = Date.now();
		const justAccepted = thisTime - this._lastCompletionAccept < 500;
		this._lastCompletionStart = thisTime;
		if (await new Promise(res => setTimeout(() => res(this._lastCompletionStart !== thisTime), DEBOUNCE_TIME))) return [];
		let numPending = 0;
		let oldestPending: Autocompletion | undefined;
		for (const ac of this._autocompletionsOfDocument[docUriStr].items.values()) {
			if (ac.status === 'pending') {
				numPending++;
				if (!oldestPending) oldestPending = ac;
				if (numPending >= MAX_PENDING_REQUESTS) {
					this._autocompletionsOfDocument[docUriStr].delete(oldestPending.id);
					break;
				}
			}
		}
		const relevantContext = await this._gatherRelevantContext(model, position);
		const { shouldGenerate, predictionType, llmPrefix, llmSuffix, stopTokens } = getCompletionOptions(prefixAndSuffix, relevantContext, justAccepted);
		if (!shouldGenerate) return [];
		const newAutocompletion: Autocompletion = { id: this._autocompletionId++, prefix, suffix, llmPrefix, llmSuffix, startTime: Date.now(), endTime: undefined, type: predictionType, status: 'pending', llmPromise: undefined, insertText: '', requestId: null, _newlineCount: 0 };
		(newAutocompletion as any).relevantContext = relevantContext;
		const featureName: FeatureName = 'Autocomplete';
		const overridesOfModel = this._settingsService.state.overridesOfModel;
		const modelSelection = this._settingsService.state.modelSelectionOfFeature[featureName];
		const modelSelectionOptions = modelSelection ? this._settingsService.state.optionsOfModelSelection[featureName][modelSelection.providerName]?.[modelSelection.modelName] : undefined;
		newAutocompletion.llmPromise = new Promise((resolve, reject) => {
			const requestId = this._llmMessageService.sendLLMMessage({
				messagesType: 'FIMMessage',
				messages: this._convertToLLMMessageService.prepareFIMMessage({
					messages: { prefix: llmPrefix, suffix: llmSuffix, stopTokens, relevantContext: (newAutocompletion as any).relevantContext }
				}),
				modelSelection, modelSelectionOptions, overridesOfModel, logging: { loggingName: 'Autocomplete' }, onText: () => { },
				onFinalMessage: ({ fullText }) => {
					newAutocompletion.endTime = Date.now();
					newAutocompletion.status = 'finished';
					const [text,] = extractCodeFromRegular({ text: fullText, recentlyAddedTextLen: 0 });
					newAutocompletion.insertText = processStartAndEndSpaces(text);
					if (newAutocompletion.type === 'multi-line-start-on-next-line') newAutocompletion.insertText = _ln + newAutocompletion.insertText;
					resolve(newAutocompletion.insertText);
				},
				onError: ({ message }) => { newAutocompletion.endTime = Date.now(); newAutocompletion.status = 'error'; reject(message); },
				onAbort: () => reject('Aborted autocomplete'),
			});
			newAutocompletion.requestId = requestId;
			setTimeout(() => { if (newAutocompletion.status === 'pending') reject('Timeout receiving message to LLM.'); }, TIMEOUT_TIME);
		});
		this._autocompletionsOfDocument[docUriStr].set(newAutocompletion.id, newAutocompletion);
		try {
			await newAutocompletion.llmPromise;
			const matchup: AutocompletionMatchupBounds = { startIdx: 0, startLine: 0, startCharacter: 0 };
			return toInlineCompletions({ autocompletionMatchup: matchup, autocompletion: newAutocompletion, prefixAndSuffix, position });
		} catch (e) {
			this._autocompletionsOfDocument[docUriStr].delete(newAutocompletion.id);
			return [];
		}
	}
}

registerWorkbenchContribution2(AutocompleteService.ID, AutocompleteService, WorkbenchPhase.BlockRestore);
