import { hasShortStreak, isShort } from './levels'

// Token limits on the total used in the window (the context line of /context).
const APPROACHING = 200_000
const ATTENTION = 250_000
const COMPACT = 600_000

// The Messages line must be at least this share of the total to count as "most of it".
const HALF = 0.5

export type Alert = 'free' | 'approaching' | 'attention' | 'short' | 'compact'

export type Input = {
  total: number | null
  messages: number | null
  // Character length of the recent sends, oldest to newest.
  recent: number[]
}

export const alert = ({ total, messages, recent }: Input): Alert => {
  if (total === null) {
    return 'free'
  }

  if (total >= COMPACT) {
    return 'compact'
  }

  if (total >= ATTENTION) {
    if (messages === null || messages / total < HALF) {
      return 'free'
    }

    const last = recent[recent.length - 1]
    return last !== undefined && isShort(last) ? 'short' : 'attention'
  }

  if (total >= APPROACHING) {
    return hasShortStreak(recent) ? 'approaching' : 'free'
  }

  return 'free'
}

// Support phrases for each alert, all up to 72 characters. They are shown to the user, so they stay in Portuguese.
export const alertPhrases: Record<Exclude<Alert, 'free'>, string> = {
  approaching: 'Suas últimas mensagens foram curtas e a janela está quase no limite',
  attention: 'A janela já está grande e vale compactar quando a tarefa terminar',
  short: 'Juntar o que falta num envio só evita reler a janela inteira',
  compact: 'A janela chegou a 600 mil tokens e precisa ser compactada agora',
}
