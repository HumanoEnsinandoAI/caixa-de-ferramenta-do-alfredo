import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { nivel } from '../utils/levels'
import { alerta, frasesDeAlerta } from '../utils/alerts'
import { BARRAS, barrasRaster, barrasSvg, cheias } from '../utils/bars'
import { cor } from '../utils/colors'
import { frase } from '../utils/phrases'

const percent = atom({ plugin: 'monitor-de-contexto', key: 'percent' } as const, null)
const total = atom({ plugin: 'monitor-de-contexto', key: 'total' } as const, null)
const mensagens = atom({ plugin: 'monitor-de-contexto', key: 'mensagens' } as const, null)
const envios = atom({ plugin: 'monitor-de-contexto', key: 'envios' } as const, 0)
// Tamanho em caracteres dos três últimos envios, para o padrão de mensagens curtas (alerta e frase).
const recentes = atom({ plugin: 'monitor-de-contexto', key: 'recentes' } as const, [] as number[])

const medir = async ($: EngineInterface) => {
  const { context } = await $.session.usage({ breakdown: 'summary' })

  if (context.percent !== undefined) {
    await update($, percent, () => context.percent ?? null)
  }

  await update($, total, () => context.tokens ?? null)

  // A linha Messages junta o que o aluno digita, as respostas do Claude e o que as ferramentas devolvem.
  const linha = context.breakdown?.categories.find(c => c.kind === 'used' && c.name === 'Messages')

  if (linha) {
    await update($, mensagens, () => linha.tokens)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await medir($)

    return result
  })

  // Cada mensagem que o aluno envia; comandos e textos que ele não digitou ficam de fora.
  on('prompt.submit', async ($, e, next) => {
    if (!e.command && !e.isMeta) {
      await update($, envios, atual => atual + 1)
      await update($, recentes, atual => [...atual, e.text.length].slice(-3))
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await medir($)

    return result
  })

  // Depois de cada turno e de cada compactação, quando a contagem chega.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      await medir($)
    }

    return next(e)
  })

  // A faixa acima do prompt: barras na cor do nível, porcentagem e uma frase de apoio em cinza. O desktop não desenha a linha de dica embaixo do prompt.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    // Sem contagem ainda (logo depois de um /reload-plugins), mede agora; a gravação redesenha a faixa.
    // Se a medição falhar, a faixa continua mostrando "sem medida" em vez de um 0% enganoso.
    const medido = await read($, percent)

    if (medido === null) {
      void medir($).catch(() => undefined)
    }

    const legenda = medido === null ? 'sem medida' : `${medido}%`
    const n = cheias(medido ?? 0)
    // Os números de mensagens e envios ficam por baixo: só escolhem a cor e a frase.
    const mensagensLidas = await read($, mensagens)
    const tokens = mensagensLidas ?? 0
    const enviados = await read($, envios)
    const ultimos = await read($, recentes)
    // O alerta usa o total, a parte de mensagens e os últimos envios; sem total ainda, fica livre.
    const aviso = alerta({ total: await read($, total), mensagens: mensagensLidas, recentes: ultimos })
    const faixa = nivel(tokens)
    const tinta = cor(faixa)
    const { Box, Text } = $.ui.resolve(e)
    let barras

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      barras = <Raster key="barras" columns={BARRAS} rows={1} cells={barrasRaster(n, tinta)} />
    } else {
      const { Svg } = $.ui.resolve(e)
      barras = <Svg source={barrasSvg(n, tinta)} alt={`contexto ${legenda}`} />
    }

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        {barras}
        <Text>{legenda}</Text>
        <Text dimColor>{aviso === 'livre' ? frase(faixa, enviados, ultimos) : frasesDeAlerta[aviso]}</Text>
      </Box>
    )
  })
}
