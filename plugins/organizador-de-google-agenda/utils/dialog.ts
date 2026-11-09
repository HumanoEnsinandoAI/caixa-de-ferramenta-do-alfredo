import type { EngineInterface } from 'claude-code'

// One question in the engine's own AskUserQuestion dialog.
// The wait happens inside a `$` call, which does not count against a hook's 10 s of its own time,
// so the user can take as long as they like.
// Resolves to the label chosen, or the text typed under "Other". Resolves null when the user
// dismisses the dialog, or when nobody can be asked (a non-interactive run).
export async function askOne(
  $: EngineInterface,
  question: string,
  options: readonly string[],
  header?: string,
): Promise<string | null> {
  try {
    return await $.ui.ask(question, { options, header })
  } catch {
    return null
  }
}

// Folds case and accents, so "Não", "nao" and "NÃO" are the same answer.
export const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
