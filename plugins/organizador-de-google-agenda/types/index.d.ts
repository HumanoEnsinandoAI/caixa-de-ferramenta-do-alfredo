export type CalendarOption = {
  id: string
  name: string
  // Short extra text shown dimmed, such as "read-only" or "holidays".
  note?: string
}

export type ClassificationItem = {
  id: string
  // The yes/no question, already in Portuguese.
  question: string
  // Dimmed line under the question, such as example event titles.
  detail?: string
}

export type ClassificationAnswer = { id: string; isYes: boolean }

export type PaletteMode = 'light' | 'dark'

export type Palette = {
  id: string
  // Shown to the user, so Portuguese.
  name: string
  mode: PaletteMode
  // Short mood text, also Portuguese.
  description: string
  // 3 distinct hex colors, handed out to categories in order: work, personal, routines.
  // They are Google's own fixed event colors, so each one has an exact colorId.
  colors: string[]
  // Google event color ids ("1" to "11"), same order as `colors`. This is what create_event/update_event take as colorId.
  colorIds: string[]
  // Google's names for those colors (Lavender, Sage, ...), same order.
  colorNames: string[]
}
