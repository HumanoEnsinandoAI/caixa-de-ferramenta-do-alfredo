import { contextQuotes, shortMessageQuotes } from './quotes'
import { hasShortStreak } from './levels'

// One phrase from the level's list; it changes on each send and stays still between sends.
// Up to yellow (6 lists), whoever keeps sending short messages gets the list that suggests the microphone.
export const phrase = (level: number, sends: number, recent: number[]) => {
  const list = (hasShortStreak(recent) ? shortMessageQuotes[level] : undefined) ?? contextQuotes[level] ?? []

  return list[sends % list.length] ?? ''
}
