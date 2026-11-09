import { expect, test } from 'claude-code/testing'

import { contextQuotes, shortMessageQuotes } from '../utils/quotes'
import { nivel } from '../utils/levels'
import { cor } from '../utils/colors'
import { frase } from '../utils/phrases'

const DICA = {
  plugin: 'monitor-de-contexto',
  component: 'AbovePrompt',
  props: { hasSurvey: false },
} as const

const BREAKDOWN = {
  categories: [{ name: 'Messages', tokens: 96000, color: 'permission', isDeferred: false, kind: 'used' }],
}

test('as barras, a porcentagem e a frase aparecem acima do prompt', async ($, on) => {
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, tokens: 96000, percent: 48, breakdown: BREAKDOWN }, rateLimits: [] } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...DICA, surface })
    expect((await ui.find({ type: 'Text', text: /48%/ }))?.text).toBe('48%')
    expect((await ui.find({ type: 'Text', text: /tranquilo/ }))?.text).toBe(contextQuotes[1][0])
    await ui.unmount()
  }
})

test('o nível sobe a cada 50k e para em 500k', async () => {
  expect(nivel(49_999)).toBe(0)
  expect(nivel(150_000)).toBe(3)
  expect(nivel(900_000)).toBe(10)
})

test('a cor muda por faixa', async () => {
  expect(cor(2)).toBe('#639922')
  expect(cor(5)).toBe('#BA7517')
  expect(cor(8)).toBe('#D85A30')
  expect(cor(10)).toBe('#E24B4A')
})

test('cada nível tem cerca de 20 frases curtas o bastante', async () => {
  expect(contextQuotes.length).toBe(11)
  expect(shortMessageQuotes.length).toBe(6)
  for (const lista of [...contextQuotes, ...shortMessageQuotes]) {
    expect(lista.length).toBe(20)
    expect(lista.every(f => f.length <= 72 && !f.includes('chat novo'))).toBe(true)
  }
})

test('a frase troca a cada envio e muda de lista com mensagens curtas', async () => {
  const recentesCurtas = [100, 100, 100] // 25 tokens cada
  const recentesLongas = [2000, 2000, 2000] // 500 tokens cada
  expect(frase(1, 4, recentesCurtas)).toBe(shortMessageQuotes[1][4])
  expect(frase(1, 4, recentesLongas)).toBe(contextQuotes[1][4])
  expect(frase(1, 5, recentesLongas)).toBe(contextQuotes[1][5])
  expect(frase(8, 4, recentesCurtas)).toBe(contextQuotes[8][4])
})
