import { expect, test } from 'claude-code/testing'

import { contextQuotes, shortMessageQuotes } from '../utils/quotes'
import { level } from '../utils/levels'
import { color } from '../utils/colors'
import { phrase } from '../utils/phrases'

const HINT = {
  plugin: 'monitor-de-contexto',
  component: 'AbovePrompt',
  props: { hasSurvey: false },
} as const

const BREAKDOWN = {
  categories: [{ name: 'Messages', tokens: 96000, color: 'permission', isDeferred: false, kind: 'used' }],
}

test('the bars, the percentage and the phrase show above the prompt', async ($, on) => {
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, tokens: 96000, percent: 48, breakdown: BREAKDOWN }, rateLimits: [] } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...HINT, surface })
    expect((await ui.find({ type: 'Text', text: /48%/ }))?.text).toBe('48%')
    expect((await ui.find({ type: 'Text', text: /tranquilo/ }))?.text).toBe(contextQuotes[1][0])
    await ui.unmount()
  }
})

test('the level goes up every 50k and stops at 500k', async () => {
  expect(level(49_999)).toBe(0)
  expect(level(150_000)).toBe(3)
  expect(level(900_000)).toBe(10)
})

test('the colour changes per band', async () => {
  expect(color(2)).toBe('#639922')
  expect(color(5)).toBe('#BA7517')
  expect(color(8)).toBe('#D85A30')
  expect(color(10)).toBe('#E24B4A')
})

test('each level has about 20 short phrases that fit', async () => {
  expect(contextQuotes.length).toBe(11)
  expect(shortMessageQuotes.length).toBe(6)
  for (const list of [...contextQuotes, ...shortMessageQuotes]) {
    expect(list.length).toBe(20)
    expect(list.every(f => f.length <= 72 && !f.includes('chat novo'))).toBe(true)
  }
})

test('the phrase changes on each send and switches list with short messages', async () => {
  const shortRecent = [100, 100, 100] // 25 tokens each
  const longRecent = [2000, 2000, 2000] // 500 tokens each
  expect(phrase(1, 4, shortRecent)).toBe(shortMessageQuotes[1][4])
  expect(phrase(1, 4, longRecent)).toBe(contextQuotes[1][4])
  expect(phrase(1, 5, longRecent)).toBe(contextQuotes[1][5])
  expect(phrase(8, 4, shortRecent)).toBe(contextQuotes[8][4])
})
