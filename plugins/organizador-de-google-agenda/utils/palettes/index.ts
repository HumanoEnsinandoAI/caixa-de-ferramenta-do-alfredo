import { darkPalettes } from './dark-palettes'
import { lightPalettes } from './light-palettes'

export * from './dark-palettes'
export * from './google-colors'
export * from './light-palettes'

// Every palette, light first. The widget and the name picker both read this list.
export const PALETTES = [...lightPalettes, ...darkPalettes]
