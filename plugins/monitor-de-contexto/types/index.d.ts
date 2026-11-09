export type Percent = number | null

declare module 'claude-code' {
  interface PluginState {
    'monitor-de-contexto': {
      percent: Percent
      total: number | null
      messages: number | null
      // Number of user sends in the session, used to pick the phrase.
      sends: number
      // Character length of the last three sends.
      recent: number[]
      // Number of parallel agents still working.
      agents: number
      // The icon is fading out, after the last agent finished.
      fading: boolean
    }
  }
}
