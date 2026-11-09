import { expect, test } from 'claude-code/testing'

import { agentesAtivos, iconeAgentesSvg } from '../utils/agents'

test('conta só os agentes que ainda estão trabalhando', async () => {
  expect(agentesAtivos([])).toBe(0)
  expect(agentesAtivos([{ status: 'running' }, { status: 'pending' }, { status: 'waiting' }])).toBe(3)
  expect(agentesAtivos([{ status: 'completed' }, { status: 'failed' }, { status: 'killed' }])).toBe(0)
  expect(agentesAtivos([{ status: 'running' }, { status: 'completed' }])).toBe(1)
})

test('o ícone tem o bot, o brilho animado e o fade in ou out conforme o estado', async () => {
  const entrando = iconeAgentesSvg('#888780', false)
  const saindo = iconeAgentesSvg('#888780', true)

  expect(entrando).toContain('<rect width="16" height="12" x="4" y="8" rx="2"/>')
  expect(entrando).toContain('attributeName="x1"')
  expect(entrando).toContain('attributeName="opacity" from="0" to="1"')
  expect(saindo).toContain('attributeName="opacity" from="1" to="0"')
})
