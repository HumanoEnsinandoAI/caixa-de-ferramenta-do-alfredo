import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { activeAgents, FADE_OUT_MS, agentIconSvg } from '../utils/agents'
import { level } from '../utils/levels'
import { alert, alertPhrases } from '../utils/alerts'
import { BARS, barsRaster, barsSvg, filledBars } from '../utils/bars'
import { color } from '../utils/colors'
import { phrase } from '../utils/phrases'

const percent = atom({ plugin: 'monitor-de-contexto', key: 'percent' } as const, null)
const total = atom({ plugin: 'monitor-de-contexto', key: 'total' } as const, null)
const messages = atom({ plugin: 'monitor-de-contexto', key: 'messages' } as const, null)
const sends = atom({ plugin: 'monitor-de-contexto', key: 'sends' } as const, 0)
// Character length of the last three sends, for the short-message pattern (alert and phrase).
const recent = atom({ plugin: 'monitor-de-contexto', key: 'recent' } as const, [] as number[])
// Agents running in parallel, and whether the icon is fading out (after the last one).
const agents = atom({ plugin: 'monitor-de-contexto', key: 'agents' } as const, 0)
const fading = atom({ plugin: 'monitor-de-contexto', key: 'fading' } as const, false)

// Watch that reads the agent status every second while any agent runs; the hide timer is separate.
let watch: Timer | null = null
let hide: Timer | null = null

const hideAgents = async ($: EngineInterface) => {
  hide = null
  // If an agent arrived while the fade was running, fading is already false: do not reset the counter.
  if (!(await read($, fading))) {
    return
  }
  await update($, agents, () => 0)
  await update($, fading, () => false)
}

const checkAgents = async ($: EngineInterface) => {
  const active = activeAgents(await $.agent.list())

  if (active > 0) {
    // An agent is working: cancel a pending fade, even if the spawn did not go through here.
    if (await read($, fading)) {
      hide?.cancel()
      hide = null
      await update($, fading, () => false)
    }
    // Only write when the number changes: the watch runs every second and each write redraws.
    if ((await read($, agents)) !== active) {
      await update($, agents, () => active)
    }
    return
  }

  // Nobody is working any more: stop the watch and make the icon leave.
  watch?.cancel()
  watch = null

  if ((await read($, agents)) > 0 && !(await read($, fading))) {
    await update($, fading, () => true)
    hide = $.clock.after(FADE_OUT_MS, () => {
      void hideAgents($)
    })
  }
}

const watchAgents = ($: EngineInterface) => {
  if (!watch) {
    watch = $.clock.every(1000, () => {
      void checkAgents($).catch(() => undefined)
    })
  }
}

const measure = async ($: EngineInterface) => {
  const { context } = await $.session.usage({ breakdown: 'summary' })

  if (context.percent !== undefined) {
    await update($, percent, () => context.percent ?? null)
  }

  await update($, total, () => context.tokens ?? null)

  // The Messages line joins what the student types, Claude's replies and what the tools return.
  const line = context.breakdown?.categories.find(c => c.kind === 'used' && c.name === 'Messages')

  if (line) {
    await update($, messages, () => line.tokens)
  }
}

export const register: Register = on => {
  // The monitor must never block the session: its failures are swallowed, and next always runs.
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await measure($).catch(() => undefined)

    return result
  })

  // Each message the student sends; commands and text they did not type are left out.
  on('prompt.submit', async ($, e, next) => {
    if (!e.command && !e.isMeta) {
      await update($, sends, current => current + 1).catch(() => undefined)
      await update($, recent, current => [...current, e.text.length].slice(-3)).catch(() => undefined)
    }

    return next(e)
  }).catch(($, e, next) => next(e)) // If the monitor fails, the student's send goes through as if nothing happened.

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await measure($).catch(() => undefined)

    return result
  })

  // Each agent spawned counts right away; the watch corrects the number with the real status.
  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)

    // A refused spawn ({ deny }) starts no agent, so it does not count.
    if (!('deny' in (result as object))) {
      hide?.cancel()
      hide = null
      await update($, fading, () => false).catch(() => undefined)
      await update($, agents, current => current + 1).catch(() => undefined)
      watchAgents($)
    }

    return result
  }).catch(($, e, next) => next(e)) // If the counter fails, the spawn goes ahead untouched.

  // After each turn and each compaction, once the count arrives.
  on('session.measure', async ($, e, next) => {
    const result = await next(e)

    if (e.changed.includes('context')) {
      await measure($).catch(() => undefined)
    }

    return result
  })

  // The band above the prompt: bars in the level colour, the percentage and a grey support phrase.
  // The desktop does not draw the hint line below the prompt.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    // Without a count, the band shows "sem medida" (no measure) instead of a misleading 0%.
    // Drawing cannot write state: the host refuses it, so measuring happens only on session and turn events.
    const measured = await read($, percent)
    const caption = measured === null ? 'sem medida' : `${measured}%`
    const filled = filledBars(measured ?? 0)
    // The message and send numbers stay in the background: they only choose the colour and the phrase.
    const messagesRead = await read($, messages)
    const tokens = messagesRead ?? 0
    const sent = await read($, sends)
    const last = await read($, recent)
    // The alert uses the total, the messages share and the recent sends; with no total yet, it stays free.
    const warning = alert({ total: await read($, total), messages: messagesRead, recent: last })
    const band = level(tokens)
    const ink = color(band)
    const agentsN = await read($, agents)
    const agentsFading = await read($, fading)
    const showAgents = agentsN > 0 || agentsFading
    const { Box, Text } = $.ui.resolve(e)
    let bars
    let icon = null

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      bars = <Raster key="bars" columns={BARS} rows={1} cells={barsRaster(filled, ink)} />
    } else {
      const { Svg } = $.ui.resolve(e)
      bars = <Svg source={barsSvg(filled, ink)} alt={`contexto ${caption}`} />
      // The icon only appears on the desktop: the terminal does not animate SVG.
      // The key changes between entering and leaving, so the fade runs again.
      if (showAgents) {
        icon = <Svg key={agentsFading ? 'fading' : 'entering'} source={agentIconSvg('#888780', agentsFading)} alt={`${agentsN} agentes em paralelo`} />
      }
    }

    // Left group: bars, percentage and phrase. Right group: the agent icon and its count, pinned to the right edge.
    return (
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Box flexDirection="row" alignItems="center" gap={1}>
          {bars}
          <Text>{caption}</Text>
          <Text dimColor>{warning === 'free' ? phrase(band, sent, last) : alertPhrases[warning]}</Text>
        </Box>
        {showAgents ? (
          <Box flexDirection="row" alignItems="center" gap={1}>
            {icon}
            <Text>{agentsN}</Text>
          </Box>
        ) : null}
      </Box>
    )
  })
}
