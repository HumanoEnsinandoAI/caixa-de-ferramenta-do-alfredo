import type { Palette, PaletteMode } from '../../types'

// The 11 event colors Google Calendar gives an event through `colorId`. The connector takes only these ids (1 to 11):
// a live test rejected "12", "13", "24" and hex strings. The hex values are what the Google Calendar interface shows today.
export const GOOGLE_COLORS = {
  Lavender: { id: '1', hex: '#7986CB' },
  Sage: { id: '2', hex: '#33B679' },
  Grape: { id: '3', hex: '#8E24AA' },
  Flamingo: { id: '4', hex: '#E67C73' },
  Banana: { id: '5', hex: '#F6BF26' },
  Tangerine: { id: '6', hex: '#F4511E' },
  Peacock: { id: '7', hex: '#039BE5' },
  Graphite: { id: '8', hex: '#616161' },
  Blueberry: { id: '9', hex: '#3F51B5' },
  Basil: { id: '10', hex: '#0B8043' },
  Tomato: { id: '11', hex: '#D50000' },
} as const

export type GoogleColorName = keyof typeof GOOGLE_COLORS

// Builds a palette from Google color names, so the hex and the colorId can never drift apart.
// Order matters: work, personal, routines.
export function palette(id: string, name: string, mode: PaletteMode, description: string, names: [GoogleColorName, GoogleColorName, GoogleColorName]): Palette {
  return {
    id,
    name,
    mode,
    description,
    colors: names.map(color => GOOGLE_COLORS[color].hex),
    colorIds: names.map(color => GOOGLE_COLORS[color].id),
    colorNames: [...names],
  }
}
