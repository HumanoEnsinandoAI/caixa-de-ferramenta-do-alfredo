// Levels from the Messages line of /context: one per 50k tokens, up to 500k, the combined ceiling before compaction.
const STEP = 50_000
const CEILING = 500_000
const LEVELS = CEILING / STEP

export const level = (tokens: number) => Math.min(LEVELS, Math.floor(tokens / STEP))

// A send is short when it is under 30 tokens (4 characters per token).
export const SHORT_LIMIT = 30
const SEQUENCE = 3

export const isShort = (characters: number) => characters / 4 < SHORT_LIMIT

// Short-message pattern: the last three sends are all short. Used by the alert and by the phrase.
export const hasShortStreak = (recent: number[]) =>
  recent.length >= SEQUENCE && recent.slice(-SEQUENCE).every(isShort)
