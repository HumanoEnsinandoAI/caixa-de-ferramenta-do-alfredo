import { expect, test } from 'claude-code/testing'

import { PREFIX, parseResult, playUser, start } from './helpers'

const TOOL = `${PREFIX}confirm_classification`
const ITEMS = [
  { id: 'cal-work', question: 'A agenda "Trabalho" é de trabalho?', detail: 'Daily, 1:1' },
  { id: 'kw-gym', question: 'Eventos com "Academia" são pessoais?' },
]

test('each question is asked, with its detail, and the answers keep the question order', async ($, on) => {
  const asked = playUser(on, ['Sim', 'Não'])
  await start($, on)

  const answer = parseResult(await $.tool.call({ tool: TOOL, items: ITEMS } as never))

  expect(answer).toEqual({
    status: 'confirmed',
    answers: [
      { id: 'cal-work', isYes: true },
      { id: 'kw-gym', isYes: false },
    ],
  })
  expect(asked[0].question).toContain('Daily, 1:1')
  expect(asked[1].question).not.toContain('\n')
})

test('closing the dialog cancels and keeps no answers', async ($, on) => {
  playUser(on, ['Sim', 'DISMISS'])
  await start($, on)

  expect(parseResult(await $.tool.call({ tool: TOOL, items: ITEMS } as never))).toEqual({ status: 'cancelled', answers: [] })
})

test('free text "não" counts, and an unclear answer is asked once more', async ($, on) => {
  const asked = playUser(on, ['Nao', 'hmm', 'sim'])
  await start($, on)

  const answer = parseResult(await $.tool.call({ tool: TOOL, items: ITEMS } as never))

  expect(answer.answers).toEqual([
    { id: 'cal-work', isYes: false },
    { id: 'kw-gym', isYes: true },
  ])
  expect(asked[2].question).toMatch(/Não entendi/)
})

test('malformed input is refused and repeated ids count once', async ($, on) => {
  playUser(on, ['Sim'])
  await start($, on)

  const refused = await $.tool.call({ tool: TOOL, items: [{ id: 'x' }, 'nope'] } as never)
  expect((refused as { deny?: string }).deny).toMatch(/at least one item/)

  const answer = parseResult(await $.tool.call({ tool: TOOL, items: [ITEMS[0], { ...ITEMS[0], question: 'Outra?' }] } as never))
  expect(answer.answers).toHaveLength(1)
})
