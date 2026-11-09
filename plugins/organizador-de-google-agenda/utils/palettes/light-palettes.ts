import type { Palette } from '../../types'
import { palette } from './google-colors'

// Palettes for Google Calendar in light mode, each with 3 of Google's 11 fixed event colors, in this order: work, personal, routines.
// To add one: append a palette(...) call with a unique id and a unique set of colors. Nothing else needs to change.
// Names and descriptions are user-facing, so they stay in Portuguese.

export const lightPalettes: Palette[] = [
  palette('floresta', 'Floresta', 'light', 'Verdes vivos e fundos, cheios de vida.', ['Basil', 'Sage', 'Graphite']),
  palette('ceu-cinzento', 'Céu Cinzento', 'light', 'Nuvens suaves sobre um mar calmo.', ['Peacock', 'Lavender', 'Graphite']),
  palette('hora-azul', 'Hora Azul', 'light', 'O céu logo depois do pôr do sol.', ['Blueberry', 'Peacock', 'Lavender']),
  palette('pessego-e-ceu', 'Pêssego e Céu', 'light', 'Doce de pêssego sob um céu aberto.', ['Flamingo', 'Peacock', 'Graphite']),
  palette('framboesa', 'Framboesa', 'light', 'Frutas vermelhas com um toque de roxo.', ['Grape', 'Flamingo', 'Graphite']),
  palette('fim-de-verao', 'Fim de Verão', 'light', 'Laranja e amarelo de uma tarde longa.', ['Tangerine', 'Banana', 'Flamingo']),
  palette('jardim-de-lavanda', 'Jardim de Lavanda', 'light', 'Roxos suaves, de campo aberto.', ['Lavender', 'Grape', 'Graphite']),
  palette('argila', 'Argila', 'light', 'Terracota, barro e terra seca.', ['Tomato', 'Tangerine', 'Graphite']),
]
