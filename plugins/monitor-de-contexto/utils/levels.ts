// Níveis pela linha Messages do /context: um a cada 50k tokens, até 500k, o teto combinado para a compactação.
const PASSO = 50_000
const TETO = 500_000
const NIVEIS = TETO / PASSO

export const nivel = (tokens: number) => Math.min(NIVEIS, Math.floor(tokens / PASSO))

// Um envio é curto quando fica abaixo de 30 tokens (4 caracteres por token).
export const CURTA = 30
const SEQUENCIA = 3

export const curtoEm = (caracteres: number) => caracteres / 4 < CURTA

// Padrão de mensagens curtas: os três últimos envios são todos curtos. Usado pelo alerta e pela frase.
export const curtas = (recentes: number[]) => recentes.length >= SEQUENCIA && recentes.slice(-SEQUENCIA).every(curtoEm)
