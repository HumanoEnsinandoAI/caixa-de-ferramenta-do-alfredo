import type { EngineInterface, ToolSpec } from 'claude-code'

import type { CalendarOption } from '../types'
import { askOne, fold } from './dialog'

export const CALENDARS_TOOL = 'select_calendars'

const YES = 'Sim'
const NO = 'Não'

// Keeps well-formed entries only, and the first of any repeated id.
const parse = (value: unknown): CalendarOption[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const options: CalendarOption[] = []

  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const { id, name, note } = item as Record<string, unknown>

    if (typeof id !== 'string' || typeof name !== 'string' || seen.has(id)) {
      continue
    }
    seen.add(id)
    options.push({ id, name, note: typeof note === 'string' ? note : undefined })
  }

  return options
}

export const calendarsSpec: ToolSpec = {
  name: CALENDARS_TOOL,
  description:
    'Asks the user, one calendar at a time in the engine dialog, which calendars to integrate, and waits for the answers. ' +
    'Pass every calendar found as { id, name, note? }. Returns { status: "confirmed" | "cancelled", selected: [calendar ids] }.',
  inputSchema: {
    type: 'object',
    properties: {
      calendars: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, name: { type: 'string' }, note: { type: 'string' } },
          required: ['id', 'name'],
        },
      },
    },
    required: ['calendars'],
  },
  isDeferred: false,
}

// Asks about each calendar in turn. Returns the tool result, or a deny.
export async function calendarsCall($: EngineInterface, input: { calendars?: unknown }) {
  const calendars = parse(input.calendars)

  if (calendars.length === 0) {
    return { deny: 'select_calendars needs at least one calendar { id, name }.' }
  }

  const selected: string[] = []

  for (const calendar of calendars) {
    const note = calendar.note ? ` (${calendar.note})` : ''
    let answer = await askOne($, `Incluir a agenda "${calendar.name}"${note} na integração?`, [YES, NO], 'Agenda')

    // Free text typed under "Other": anything but yes or no is asked once more.
    if (answer !== null && !['sim', 'nao'].includes(fold(answer))) {
      answer = await askOne($, `Não entendi. Incluir a agenda "${calendar.name}" na integração? Responda sim ou não.`, [YES, NO], 'Agenda')
    }
    if (answer === null || !['sim', 'nao'].includes(fold(answer))) {
      return { result: JSON.stringify({ status: 'cancelled', selected: [] }) }
    }
    if (fold(answer) === 'sim') {
      selected.push(calendar.id)
    }
  }

  // Nothing ticked is not an integration: the skill asks again.
  if (selected.length === 0) {
    return { result: JSON.stringify({ status: 'cancelled', selected: [] }) }
  }

  return { result: JSON.stringify({ status: 'confirmed', selected }) }
}
