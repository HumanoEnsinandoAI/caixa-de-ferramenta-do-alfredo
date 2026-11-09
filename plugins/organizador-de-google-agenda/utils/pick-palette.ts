import type { EngineInterface, ToolSpec } from 'claude-code'

import type { Palette, PaletteMode } from '../types'
import { askOne, fold } from './dialog'
import { PALETTES } from './palettes'

// Two tools. list_palettes hands Claude the palette data for the preview widget.
// pick_palette asks the user to choose one by name, never showing colors, and returns the chosen palette.
export const LIST_PALETTES_TOOL = 'list_palettes'
export const PICK_PALETTE_TOOL = 'pick_palette'

// The dialog takes 2 to 4 options. A page shows three palettes and a fourth option to see more.
const PAGE_SIZE = 3
const MORE = 'Ver mais'
const BACK = 'Voltar ao início'

const MODES: Record<string, PaletteMode> = { 'modo claro': 'light', 'modo escuro': 'dark' }
const MODE_LABELS = ['Modo claro', 'Modo escuro'] as const

export const listPalettesSpec: ToolSpec = {
  name: LIST_PALETTES_TOOL,
  description:
    'Returns every Google Calendar palette the plugin offers: { palettes: [{ id, name, mode ("light" or "dark"), description, colors: [hex], colorIds: [Google colorId], colorNames: [Google color name] }] }. ' +
    'Each palette has 3 colors, in this order: work, personal, routines. ' +
    'Read only. Use it to fill the preview widget before asking the user to choose.',
  inputSchema: { type: 'object', properties: {} },
  isDeferred: false,
}

export const pickPaletteSpec: ToolSpec = {
  name: PICK_PALETTE_TOOL,
  description:
    'Asks the user in the engine dialog to choose a Google Calendar palette by name: first light or dark, then the names of that mode, a few at a time. ' +
    'It shows names only, never colors: the colors are shown in a widget beforehand. ' +
    'Returns { status: "confirmed", palette: { id, name, mode, description, colors, colorIds, colorNames } } or { status: "cancelled" }.',
  inputSchema: { type: 'object', properties: {} },
  isDeferred: false,
}

// The data for the widget: read only, nothing opens.
export function listPalettesCall() {
  return { result: JSON.stringify({ palettes: PALETTES }) }
}

const cancelled = () => ({ result: JSON.stringify({ status: 'cancelled' }) })

// Walks the pages of one mode. Resolves the palette chosen, 'back' to return to the mode question, or null if dismissed.
async function choose($: EngineInterface, mode: PaletteMode): Promise<Palette | 'back' | null> {
  const items = PALETTES.filter(palette => palette.mode === mode)
  const pages = Math.ceil(items.length / PAGE_SIZE)

  for (let page = 0; ; page = (page + 1) % pages) {
    const shown = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    // "Ver mais" when there is another page; "Voltar ao início" when the page has room left (the last page, or the only one).
    const extras = [...(pages > 1 ? [MORE] : []), ...(shown.length < PAGE_SIZE || pages === 1 ? [BACK] : [])]
    const options = [...shown.map(palette => palette.name), ...extras]
    const title = mode === 'light' ? 'modo claro' : 'modo escuro'
    const answer = await askOne($, `Qual paleta do ${title}? (${page + 1} de ${pages})`, options, 'Paleta')

    if (answer === null) {
      return null
    }
    if (answer === MORE) {
      continue
    }
    if (answer === BACK) {
      return 'back'
    }

    // A label from the page, or a name typed under "Other" that matches any palette of this mode.
    const found = items.find(palette => fold(palette.name) === fold(answer))
    if (found) {
      return found
    }
  }
}

// Asks the mode, then the palette. Returns the tool result.
export async function pickPaletteCall($: EngineInterface) {
  for (;;) {
    const mode = await askOne($, 'Qual modo de cores você quer?', MODE_LABELS, 'Modo')
    const chosenMode = mode === null ? undefined : MODES[fold(mode)]

    if (mode === null) {
      return cancelled()
    }
    if (chosenMode === undefined) {
      continue
    }

    const palette = await choose($, chosenMode)

    if (palette === null) {
      return cancelled()
    }
    if (palette !== 'back') {
      return { result: JSON.stringify({ status: 'confirmed', palette }) }
    }
  }
}
