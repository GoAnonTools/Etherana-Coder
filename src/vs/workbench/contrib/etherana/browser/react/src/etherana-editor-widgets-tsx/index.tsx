/*--------------------------------------------------------------------------------------
 *  © 2026 GoAnon. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { mountFnGenerator } from '../util/mountFnGenerator.js'
import { EtheranaCommandBarMain } from './EtheranaCommandBar.js'
import { EtheranaSelectionHelperMain } from './EtheranaSelectionHelper.js'

export const mountEtheranaCommandBar = mountFnGenerator(EtheranaCommandBarMain)

export const mountEtheranaSelectionHelper = mountFnGenerator(EtheranaSelectionHelperMain)

