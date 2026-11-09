import { expect, test } from 'claude-code/testing'

import { PALETTES } from '../utils/palettes'
import { PREFIX, parseResult, playUser, start } from './helpers'

const PICK = `${PREFIX}pick_palette`
const LIST = `${PREFIX}list_palettes`

const names = (mode: 'light' | 'dark') => PALETTES.filter(palette => palette.mode === mode).map(palette => palette.name)

test('mode first, then a name on the first page', async ($, on) => {
  const darkFirst = names('dark')[0]
  const asked = playUser(on, ['Modo escuro', darkFirst])
  await start($, on)

  const answer = parseResult(await $.tool.call({ tool: PICK } as never))

  expect(answer.status).toBe('confirmed')
  expect(answer.palette.name).toBe(darkFirst)
  expect(answer.palette.mode).toBe('dark')
  expect(answer.palette.colors).toHaveLength(3)
  expect(answer.palette.colorIds).toHaveLength(3)
  expect(asked[0].options).toEqual(['Modo claro', 'Modo escuro'])
  expect(asked[1].options).toHaveLength(4)
})

test('the dialog shows names only, never colors', async ($, on) => {
  const asked = playUser(on, ['Modo claro', 'DISMISS'])
  await start($, on)

  await $.tool.call({ tool: PICK } as never)

  expect(JSON.stringify(asked)).not.toMatch(/#[0-9A-Fa-f]{6}/)
})

test('"Ver mais" shows the next page, and every palette of a mode can be reached', async ($, on) => {
  const light = names('light')
  const lastPage = Math.ceil(light.length / 3) - 1
  const last = light[light.length - 1]
  const asked = playUser(on, ['Modo claro', ...Array(lastPage).fill('Ver mais'), last])
  await start($, on)

  const answer = parseResult(await $.tool.call({ tool: PICK } as never))

  expect(answer.palette.name).toBe(last)
  expect(asked[2].question).toContain('(2 de')
  expect(asked.slice(1).every(entry => entry.options.length >= 2 && entry.options.length <= 4)).toBe(true)
})

test('a name typed as free text is found, ignoring case and accents', async ($, on) => {
  playUser(on, ['Modo claro', 'CEU CINZENTO'])
  await start($, on)

  expect(parseResult(await $.tool.call({ tool: PICK } as never)).palette.id).toBe('ceu-cinzento')
})

test('the last page of a mode with a single leftover still offers two options', async ($, on) => {
  const dark = names('dark')
  const lastPage = Math.ceil(dark.length / 3) - 1
  const asked = playUser(on, ['Modo escuro', ...Array(lastPage).fill('Ver mais'), 'DISMISS'])
  await start($, on)

  await $.tool.call({ tool: PICK } as never)

  expect(asked.every(entry => entry.options.length >= 2)).toBe(true)
})

test('"Voltar ao início" asks the mode again, and closing the dialog cancels', async ($, on) => {
  const lastPage = Math.ceil(names('light').length / 3) - 1
  const asked = playUser(on, ['Modo claro', ...Array(lastPage).fill('Ver mais'), 'Voltar ao início', 'Modo escuro', 'DISMISS'])
  await start($, on)

  expect(parseResult(await $.tool.call({ tool: PICK } as never))).toEqual({ status: 'cancelled' })
  // Eight light palettes make three pages; the last has two names, so it has room for "Voltar ao início".
  expect(asked[1 + lastPage].options).toContain('Voltar ao início')
  expect(asked[2 + lastPage].options).toEqual(['Modo claro', 'Modo escuro'])
})

test('closing the first question cancels', async ($, on) => {
  playUser(on, ['DISMISS'])
  await start($, on)

  expect(parseResult(await $.tool.call({ tool: PICK } as never))).toEqual({ status: 'cancelled' })
})

test('list_palettes returns every palette with its colors and asks nothing', async ($, on) => {
  const asked = playUser(on, [])
  await start($, on)

  const data = parseResult(await $.tool.call({ tool: LIST } as never))

  expect(data.palettes).toHaveLength(PALETTES.length)
  expect(data.palettes.every((palette: { colors: string[] }) => palette.colors.length === 3 && palette.colorIds.length === 3)).toBe(true)
  expect(asked).toHaveLength(0)
})
