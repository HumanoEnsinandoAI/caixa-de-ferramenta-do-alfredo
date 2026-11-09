import type { Register } from 'claude-code'

import { CLASSIFICATION_TOOL, classificationCall, classificationSpec } from '../utils/confirm-classification'
import { LIST_PALETTES_TOOL, PICK_PALETTE_TOOL, listPalettesCall, listPalettesSpec, pickPaletteCall, pickPaletteSpec } from '../utils/pick-palette'
import { CALENDARS_TOOL, calendarsCall, calendarsSpec } from '../utils/select-calendars'
import { toolName } from '../utils/tool-name'

// One hooks module for the plugin: it registers the four tools and hands each call to utils/.
// The questions are asked with the engine's own dialog ($.ui.ask), whose wait does not count
// against a hook's time, so the user can answer as slowly as they like.
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register(calendarsSpec)
    await $.tool.register(classificationSpec)
    await $.tool.register(listPalettesSpec)
    await $.tool.register(pickPaletteSpec)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    switch (e.tool) {
      case toolName(CALENDARS_TOOL):
        return calendarsCall($, e as unknown as { calendars?: unknown })
      case toolName(CLASSIFICATION_TOOL):
        return classificationCall($, e as unknown as { items?: unknown })
      case toolName(LIST_PALETTES_TOOL):
        return listPalettesCall()
      case toolName(PICK_PALETTE_TOOL):
        return pickPaletteCall($)
      default:
        return next(e)
    }
  }).catch(($, e, next) => next(e))
}
