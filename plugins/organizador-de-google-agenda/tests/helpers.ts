// Shared by the tests. Nothing sits beneath the plugin, so a test plays the engine's AskUserQuestion dialog.

type Hook = (name: string, fn: (...args: never[]) => unknown) => void

export const PREFIX = 'mcp__organizador-de-google-agenda__'

export type Asked = { question: string; options: string[]; header?: string }

// Answers each question in turn from `script`; the word DISMISS closes the dialog without an answer.
// `asked` collects every question the plugin put to the user, so a test can check what was shown.
export function playUser(on: Hook, script: string[]) {
  const asked: Asked[] = []
  let next = 0

  on('tool.call', ((_: unknown, e: { tool: string; questions?: { question: string; header?: string; options: { label: string }[] }[] }) => {
    if (e.tool !== 'AskUserQuestion' || !e.questions) {
      return { result: {} }
    }
    const [{ question, header, options }] = e.questions
    asked.push({ question, header, options: options.map(option => option.label) })
    const answer = script[next++]

    if (answer === undefined || answer === 'DISMISS') {
      return { deny: 'dismissed' }
    }

    return { result: { questions: [], answers: { [question]: answer } } }
  }) as never)

  return asked
}

// Registers the plugin's tools the way a session start does.
export async function start($: { session: { start: (input: never) => Promise<unknown> } }, on: Hook) {
  on('tool.register', (() => ({ value: { tool: 'x' } })) as never)
  on('session.start', ((_: unknown, e: { cwd: string }) => ({ cwd: e.cwd })) as never)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true } as never)
}

export const parseResult = (answer: unknown) => JSON.parse(String((answer as { result: unknown }).result))
