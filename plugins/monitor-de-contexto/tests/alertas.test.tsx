import { expect, test } from 'claude-code/testing'

import { alerta } from '../utils/alerts'

const CURTA = 100 // caracteres: 25 tokens, abaixo do limite de 30
const LONGA = 2000 // caracteres: 500 tokens

test('até 200 mil tokens nada aparece, mesmo com envios curtos', async () => {
  expect(alerta({ total: 150_000, mensagens: 120_000, recentes: [CURTA, CURTA, CURTA] })).toBe('livre')
})

test('acima de 600 mil tokens é sempre para compactar', async () => {
  expect(alerta({ total: 600_000, mensagens: 100_000, recentes: [LONGA] })).toBe('compactar')
})

test('entre 250 e 600 mil, com mensagens na maior parte, o último envio decide', async () => {
  expect(alerta({ total: 300_000, mensagens: 200_000, recentes: [LONGA, LONGA, LONGA] })).toBe('atencao')
  expect(alerta({ total: 300_000, mensagens: 200_000, recentes: [LONGA, CURTA] })).toBe('curta')
})

test('entre 250 e 600 mil, com mensagens na minoria, fica livre', async () => {
  expect(alerta({ total: 300_000, mensagens: 100_000, recentes: [CURTA] })).toBe('livre')
})

test('entre 200 e 250 mil, três envios curtos seguidos disparam o padrão', async () => {
  expect(alerta({ total: 220_000, mensagens: 150_000, recentes: [LONGA, CURTA, CURTA, CURTA] })).toBe('aproximando')
  expect(alerta({ total: 220_000, mensagens: 150_000, recentes: [CURTA, CURTA, LONGA] })).toBe('livre')
})

test('sem dados, o alerta fica livre', async () => {
  expect(alerta({ total: null, mensagens: null, recentes: [] })).toBe('livre')
  expect(alerta({ total: 300_000, mensagens: null, recentes: [CURTA] })).toBe('livre')
})
