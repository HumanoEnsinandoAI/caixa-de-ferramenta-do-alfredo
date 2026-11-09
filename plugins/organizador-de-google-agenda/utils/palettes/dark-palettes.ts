import type { Palette } from '../../types'
import { palette } from './google-colors'

// Palettes for Google Calendar in dark mode, each with 3 of Google's 11 fixed event colors, in this order: work, personal, routines.
// Graphite is left out on purpose: it nearly disappears on a dark background.
// To add one: append a palette(...) call with a unique id and a unique set of colors. Nothing else needs to change.
// Names and descriptions are user-facing, so they stay in Portuguese.

export const darkPalettes: Palette[] = [
  palette('prado-ao-luar', 'Prado ao Luar', 'dark', 'Verde sereno sob a luz da lua.', ['Basil', 'Sage', 'Lavender']),
  palette('chuva-da-meia-noite', 'Chuva da Meia-noite', 'dark', 'Azuis e violetas numa noite chuvosa.', ['Blueberry', 'Grape', 'Lavender']),
  palette('mar-profundo', 'Mar Profundo', 'dark', 'Azuis que brilham no fundo escuro.', ['Peacock', 'Blueberry', 'Lavender']),
  palette('entardecer', 'Entardecer', 'dark', 'O céu pegando fogo antes de escurecer.', ['Tangerine', 'Flamingo', 'Banana']),
  palette('vinho-e-brasa', 'Vinho e Brasa', 'dark', 'Vermelhos fundos com brasas de laranja.', ['Tomato', 'Grape', 'Tangerine']),
  palette('cidade-neon', 'Cidade Neon', 'dark', 'Letreiros acesos numa noite de chuva.', ['Peacock', 'Grape', 'Flamingo']),
  palette('aurora-austral', 'Aurora Austral', 'dark', 'Azuis e violetas dançando no céu.', ['Blueberry', 'Grape', 'Peacock']),
  palette('sakura-noturna', 'Sakura Noturna', 'dark', 'Cerejeiras rosadas sob um céu profundo.', ['Flamingo', 'Lavender', 'Blueberry']),
]
