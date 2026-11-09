import type { AgentStatus } from 'claude-code'

// Estados em que um agente ainda está trabalhando; completed, failed e killed já não contam.
const ATIVOS: AgentStatus[] = ['pending', 'running', 'waiting']

export const agentesAtivos = (lista: { status: AgentStatus }[]) => lista.filter(a => ATIVOS.includes(a.status)).length

// Tempo do desaparecimento: o ícone some em fade out antes de sair da barra.
export const DESAPARECE_MS = 500

// Ícone de bot (lucide), com o contorno iluminado por um brilho que passa de um lado ao outro, em loop.
// `saindo` faz o ícone entrar (fade in) ou sair (fade out) quando é montado.
export const iconeAgentesSvg = (base: string, saindo: boolean) => {
  const fade = saindo
    ? '<animate attributeName="opacity" from="1" to="0" dur="0.4s" fill="freeze"/>'
    : '<animate attributeName="opacity" from="0" to="1" dur="0.4s" fill="freeze"/>'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${base}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`
    + `<defs><linearGradient id="brilho" gradientUnits="userSpaceOnUse" x1="-24" y1="0" x2="0" y2="0">`
    + `<stop offset="0" stop-color="${base}"/><stop offset="0.5" stop-color="#FFFFFF"/><stop offset="1" stop-color="${base}"/>`
    + `<animate attributeName="x1" from="-24" to="24" dur="1.6s" repeatCount="indefinite"/>`
    + `<animate attributeName="x2" from="0" to="48" dur="1.6s" repeatCount="indefinite"/>`
    + `</linearGradient></defs>`
    + `<g stroke="url(#brilho)">`
    + `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`
    + `</g>`
    + fade
    + `</svg>`
}
