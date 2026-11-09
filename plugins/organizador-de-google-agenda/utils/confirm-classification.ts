import type { EngineInterface, ToolSpec } from 'claude-code'

import type { ClassificationAnswer, ClassificationItem } from '../types'
import { askOne, fold } from './dialog'

export const CLASSIFICATION_TOOL = 'confirm_classification'

const YES = 'Sim'
const NO = 'Não'

// Keeps well-formed entries only, and the first of any repeated id.
const parse = (value: unknown): ClassificationItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const items: ClassificationItem[] = []

  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const { id, question, detail } = item as Record<string, unknown>

    if (typeof id !== 'string' || typeof question !== 'string' || seen.has(id)) {
      continue
    }
    seen.add(id)
    items.push({ id, question, detail: typeof detail === 'string' ? detail : undefined })
  }

  return items
}

export const classificationSpec: ToolSpec = {
  name: CLASSIFICATION_TOOL,
  description:
    'Asks the user a yes/no question for each item, one at a time in the engine dialog, and waits for the answers. ' +
    'Pass one item per proposed classification as { id, question, detail? }, with the question already written in Portuguese ' +
    '(for example "Esta agenda é de trabalho?"). Returns { status: "confirmed" | "cancelled", answers: [{ id, isYes }] }.',
  inputSchema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, question: { type: 'string' }, detail: { type: 'string' } },
          required: ['id', 'question'],
        },
      },
    },
    required: ['items'],
  },
  isDeferred: false,
}

// Asks each question in turn. Returns the tool result, or a deny.
export async function classificationCall($: EngineInterface, input: { items?: unknown }) {
  const items = parse(input.items)

  if (items.length === 0) {
    return { deny: 'confirm_classification needs at least one item { id, question }.' }
  }

  const answers: ClassificationAnswer[] = []

  for (const item of items) {
    const question = item.detail ? `${item.question}\n${item.detail}` : item.question
    let answer = await askOne($, question, [YES, NO], 'Classificação')

    // Free text typed under "Other": anything but yes or no is asked once more.
    if (answer !== null && !['sim', 'nao'].includes(fold(answer))) {
      answer = await askOne($, `Não entendi. ${item.question} Responda sim ou não.`, [YES, NO], 'Classificação')
    }
    if (answer === null || !['sim', 'nao'].includes(fold(answer))) {
      return { result: JSON.stringify({ status: 'cancelled', answers: [] }) }
    }
    answers.push({ id: item.id, isYes: fold(answer) === 'sim' })
  }

  return { result: JSON.stringify({ status: 'confirmed', answers }) }
}
