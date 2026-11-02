import { expect, test } from 'claude-code/testing'

import { FRASES, FRASES_CURTAS } from '../hooks/frases'
import { cor, frase, nivel } from '../hooks/register'

const DICA = {
  plugin: 'humano-janela-contexto',
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
    expect((await ui.find({ type: 'Text', text: /tranquilo/ }))?.text).toBe(FRASES[1][0])
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
  expect(FRASES.length).toBe(11)
  expect(FRASES_CURTAS.length).toBe(6)
  for (const lista of [...FRASES, ...FRASES_CURTAS]) {
    expect(lista.length).toBe(20)
    expect(lista.every(f => f.length <= 72 && !f.includes('chat novo'))).toBe(true)
  }
})

test('a frase troca a cada envio e muda de lista com mensagens curtas', async () => {
  const curtas = { quantidade: 4, caracteres: 200 }
  const longas = { quantidade: 4, caracteres: 4000 }
  expect(frase(60_000, curtas)).toBe(FRASES_CURTAS[1][4])
  expect(frase(60_000, longas)).toBe(FRASES[1][4])
  expect(frase(60_000, { quantidade: 5, caracteres: 5000 })).toBe(FRASES[1][5])
  expect(frase(400_000, curtas)).toBe(FRASES[8][4])
})
