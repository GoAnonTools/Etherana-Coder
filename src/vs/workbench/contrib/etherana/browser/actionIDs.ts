// Normally you'd want to put these exports in the files that register them, but if you do that you'll get an import order error if you import them in certain cases.
// (importing them runs the whole file to get the ID, causing an import error). I guess it's best practice to separate out IDs, pretty annoying...

export const ETHERANA_CTRL_L_ACTION_ID = 'etherana.ctrlLAction'

export const ETHERANA_CTRL_K_ACTION_ID = 'etherana.ctrlKAction'

export const ETHERANA_ACCEPT_DIFF_ACTION_ID = 'etherana.acceptDiff'

export const ETHERANA_REJECT_DIFF_ACTION_ID = 'etherana.rejectDiff'

export const ETHERANA_GOTO_NEXT_DIFF_ACTION_ID = 'etherana.goToNextDiff'

export const ETHERANA_GOTO_PREV_DIFF_ACTION_ID = 'etherana.goToPrevDiff'

export const ETHERANA_GOTO_NEXT_URI_ACTION_ID = 'etherana.goToNextUri'

export const ETHERANA_GOTO_PREV_URI_ACTION_ID = 'etherana.goToPrevUri'

export const ETHERANA_ACCEPT_FILE_ACTION_ID = 'etherana.acceptFile'

export const ETHERANA_REJECT_FILE_ACTION_ID = 'etherana.rejectFile'

export const ETHERANA_ACCEPT_ALL_DIFFS_ACTION_ID = 'etherana.acceptAllDiffs'

export const ETHERANA_REJECT_ALL_DIFFS_ACTION_ID = 'etherana.rejectAllDiffs'


// --- Legacy Aliases for React Compatibility ---
export const VOID_CTRL_L_ACTION_ID = ETHERANA_CTRL_L_ACTION_ID
export const VOID_CTRL_K_ACTION_ID = ETHERANA_CTRL_K_ACTION_ID
export const VOID_ACCEPT_DIFF_ACTION_ID = ETHERANA_ACCEPT_DIFF_ACTION_ID
export const VOID_REJECT_DIFF_ACTION_ID = ETHERANA_REJECT_DIFF_ACTION_ID
export const VOID_GOTO_NEXT_DIFF_ACTION_ID = ETHERANA_GOTO_NEXT_DIFF_ACTION_ID
export const VOID_GOTO_PREV_DIFF_ACTION_ID = ETHERANA_GOTO_PREV_DIFF_ACTION_ID
export const VOID_GOTO_NEXT_URI_ACTION_ID = ETHERANA_GOTO_NEXT_URI_ACTION_ID
export const VOID_GOTO_PREV_URI_ACTION_ID = ETHERANA_GOTO_PREV_URI_ACTION_ID
export const VOID_ACCEPT_FILE_ACTION_ID = ETHERANA_ACCEPT_FILE_ACTION_ID
export const VOID_REJECT_FILE_ACTION_ID = ETHERANA_REJECT_FILE_ACTION_ID
export const VOID_ACCEPT_ALL_DIFFS_ACTION_ID = ETHERANA_ACCEPT_ALL_DIFFS_ACTION_ID
export const VOID_REJECT_ALL_DIFFS_ACTION_ID = ETHERANA_REJECT_ALL_DIFFS_ACTION_ID
