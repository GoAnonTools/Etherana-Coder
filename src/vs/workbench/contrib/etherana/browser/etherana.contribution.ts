/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/


// register inline diffs
import './editCodeService.js'

// register Sidebar pane, state, actions (keybinds, menus) (Ctrl+L)
import './sidebarActions.js'
import './sidebarPane.js'

// register quick edit (Ctrl+K)
import './quickEditActions.js'


// register Autocomplete
import './autocompleteService.js'

// register Context services
// import './contextGatheringService.js'
// import './contextUserChangesService.js'

// settings pane
import './etheranaSettingsPane.js'

// register css
import './media/etherana.css'

// update (frontend part, also see platform/)
import './etheranaUpdateActions.js'

import './convertToLLMMessageWorkbenchContrib.js'

// tools
import './toolsService.js'
import './terminalToolService.js'

// register Thread History
import './chatThreadService.js'


// helper services
import './helperServices/consistentItemService.js'

// register selection helper
import './etheranaSelectionHelperWidget.js'

// register tooltip service
import './tooltipService.js'

// register onboarding service
import './etheranaOnboardingService.js'

// register misc service
import './miscWorkbenchContrib.js'

// register file service (for explorer context menu)
import './fileService.js'

// register source control management
import './etheranaSCMService.js'

// ---------- common (unclear if these actually need to be imported, because they're already imported wherever they're used) ----------

// llmMessage
import '../common/sendLLMMessageService.js'

// etheranaSettings
import '../common/etheranaSettingsService.js'

// refreshModel
import '../common/refreshModelService.js'

// metrics
import '../common/metricsService.js'

// updates
import '../common/etheranaUpdateService.js'

// model service
import '../common/etheranaModelService.js'
