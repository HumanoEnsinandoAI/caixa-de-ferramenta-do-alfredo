import { expect, test } from 'claude-code/testing'

import { PREFIX } from './helpers'

test('a session start registers the four tools', async ($, on) => {
  const registered: string[] = []
  on('tool.register', ((_: unknown, e: { name: string }) => {
    registered.push(e.name)
    return { value: { tool: e.name } }
  }) as never)
  on('session.start', ((_: unknown, e: { cwd: string }) => ({ cwd: e.cwd })) as never)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(registered.sort()).toEqual(['confirm_classification', 'list_palettes', 'pick_palette', 'select_calendars'])
})

test('a call to another tool passes through untouched', async ($, on) => {
  on('tool.call', () => ({ result: 'beneath' }) as never)

  const answer = await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  expect((answer as { result: unknown }).result).toBe('beneath')

  const other = await $.tool.call({ tool: `${PREFIX}unknown_tool` } as never)
  expect((other as { result: unknown }).result).toBe('beneath')
})
