import { expect, test } from 'claude-code/testing'

import { activeAgents, agentIconSvg } from '../utils/agents'

test('counts only the agents that are still working', async () => {
  expect(activeAgents([])).toBe(0)
  expect(activeAgents([{ status: 'running' }, { status: 'pending' }, { status: 'waiting' }])).toBe(3)
  expect(activeAgents([{ status: 'completed' }, { status: 'failed' }, { status: 'killed' }])).toBe(0)
  expect(activeAgents([{ status: 'running' }, { status: 'completed' }])).toBe(1)
})

test('the icon has the bot, the animated glint, and a fade in or out depending on the state', async () => {
  const entering = agentIconSvg('#888780', false)
  const fading = agentIconSvg('#888780', true)

  expect(entering).toContain('<rect width="16" height="12" x="4" y="8" rx="2"/>')
  expect(entering).toContain('attributeName="x1"')
  expect(entering).toContain('attributeName="opacity" from="0" to="1"')
  expect(fading).toContain('attributeName="opacity" from="1" to="0"')
})
