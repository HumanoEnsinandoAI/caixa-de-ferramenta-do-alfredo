export type Percent = number | null

// Os envios do aluno na sessão: quantos e quantos caracteres ao todo, para comparar tamanho e quantidade.
export type Envios = { quantidade: number; caracteres: number }

declare module 'claude-code' {
  interface PluginState {
    'humano-janela-contexto': { percent: Percent; mensagens: number | null; envios: Envios }
  }
}
