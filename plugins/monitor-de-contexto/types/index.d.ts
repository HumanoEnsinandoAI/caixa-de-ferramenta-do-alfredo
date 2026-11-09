export type Percent = number | null

declare module 'claude-code' {
  interface PluginState {
    'monitor-de-contexto': {
      percent: Percent
      total: number | null
      mensagens: number | null
      // Quantos envios do aluno na sessão, para escolher a frase.
      envios: number
      // Tamanho em caracteres dos últimos três envios.
      recentes: number[]
    }
  }
}
