import type { AgentStatus } from 'claude-code'

// States in which an agent is still working; completed, failed and killed no longer count.
const ACTIVE: AgentStatus[] = ['pending', 'running', 'waiting']

export const activeAgents = (list: { status: AgentStatus }[]) => list.filter(a => ACTIVE.includes(a.status)).length

// Fade-out time: the icon fades out before it leaves the bar.
export const FADE_OUT_MS = 500

// Bot icon (lucide), with the outline lit by a glint that sweeps from side to side, looping.
// `fading` makes the icon fade in (when mounted) or fade out.
export const agentIconSvg = (base: string, fading: boolean) => {
  const fade = fading
    ? '<animate attributeName="opacity" from="1" to="0" dur="0.4s" fill="freeze"/>'
    : '<animate attributeName="opacity" from="0" to="1" dur="0.4s" fill="freeze"/>'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${base}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`
    + `<defs><linearGradient id="glint" gradientUnits="userSpaceOnUse" x1="-24" y1="0" x2="0" y2="0">`
    + `<stop offset="0" stop-color="${base}"/><stop offset="0.5" stop-color="#FFFFFF"/><stop offset="1" stop-color="${base}"/>`
    + `<animate attributeName="x1" from="-24" to="24" dur="1.6s" repeatCount="indefinite"/>`
    + `<animate attributeName="x2" from="0" to="48" dur="1.6s" repeatCount="indefinite"/>`
    + `</linearGradient></defs>`
    + `<g stroke="url(#glint)">`
    + `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`
    + `</g>`
    + fade
    + `</svg>`
}
