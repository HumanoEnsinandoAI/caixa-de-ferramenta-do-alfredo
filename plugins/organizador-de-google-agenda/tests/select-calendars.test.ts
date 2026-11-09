import { expect, test } from 'claude-code/testing'

import { PREFIX, parseResult, playUser, start } from './helpers'

const TOOL = `${PREFIX}select_calendars`
const CALENDARS = [
  { id: 'a', name: 'Pessoal' },
  { id: 'b', name: 'Trabalho' },
  { id: 'c', name: 'Feriados', note: 'somente leitura' },
]

test('each calendar is asked about, and the answer follows the list order', async ($, on) => {
  const asked = playUser(on, ['Sim', 'Não', 'Sim'])
  await start($, on)

  const answer = parseResult(await $.tool.call({ tool: TOOL, calendars: CALENDARS } as never))

  expect(answer).toEqual({ status: 'confirmed', selected: ['a', 'c'] })
  expect(asked).toHaveLength(3)
  expect(asked[2].question).toContain('Feriados')
  expect(asked[2].question).toContain('somente leitura')
  expect(asked[0].options).toEqual(['Sim', 'Não'])
})

test('saying no to every calendar, or closing the dialog, cancels', async ($, on) => {
  playUser(on, ['Não', 'Não', 'Não'])
  await start($, on)
  expect(parseResult(await $.tool.call({ tool: TOOL, calendars: CALENDARS } as never))).toEqual({ status: 'cancelled', selected: [] })
})

test('closing the dialog midway cancels', async ($, on) => {
  playUser(on, ['Sim', 'DISMISS'])
  await start($, on)
  expect(parseResult(await $.tool.call({ tool: TOOL, calendars: CALENDARS } as never))).toEqual({ status: 'cancelled', selected: [] })
})

test('free text is read as yes or no, and anything else is asked once more', async ($, on) => {
  const asked = playUser(on, ['SIM', 'nao', 'talvez', 'sim'])
  await start($, on)

  const answer = parseResult(await $.tool.call({ tool: TOOL, calendars: CALENDARS } as never))

  expect(answer).toEqual({ status: 'confirmed', selected: ['a', 'c'] })
  expect(asked[3].question).toMatch(/Não entendi/)
})

test('an answer that is still unclear after one more try cancels', async ($, on) => {
  playUser(on, ['talvez', 'quem sabe'])
  await start($, on)
  expect(parseResult(await $.tool.call({ tool: TOOL, calendars: CALENDARS } as never)).status).toBe('cancelled')
})

test('malformed input is refused and repeated ids count once', async ($, on) => {
  const asked = playUser(on, ['Sim', 'Sim'])
  await start($, on)

  for (const calendars of ['nope', [], [{ name: 'Sem id' }, 7, null]]) {
    const refused = await $.tool.call({ tool: TOOL, calendars } as never)
    expect((refused as { deny?: string }).deny).toMatch(/at least one calendar/)
  }

  const answer = parseResult(await $.tool.call({ tool: TOOL, calendars: [...CALENDARS.slice(0, 2), { id: 'a', name: 'Repetida' }] } as never))

  expect(answer.selected).toEqual(['a', 'b'])
  expect(asked).toHaveLength(2)
})
