import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { agentesAtivos, DESAPARECE_MS, iconeAgentesSvg } from '../utils/agents'
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
// Agentes em paralelo ainda trabalhando, e se o ícone está saindo (fade out) depois do último.
const agentes = atom({ plugin: 'monitor-de-contexto', key: 'agentes' } as const, 0)
const saindo = atom({ plugin: 'monitor-de-contexto', key: 'saindo' } as const, false)

// Vigia que lê o status dos agentes a cada segundo, enquanto houver algum; o timer de sumir é separado.
let vigia: Timer | null = null
let apagar: Timer | null = null

const sumir = async ($: EngineInterface) => {
  apagar = null
  await update($, agentes, () => 0)
  await update($, saindo, () => false)
}

const conferir = async ($: EngineInterface) => {
  const ativos = agentesAtivos(await $.agent.list())

  if (ativos > 0) {
    await update($, agentes, () => ativos)
    return
  }

  // Ninguém mais trabalhando: para a vigia e faz o ícone sair.
  vigia?.cancel()
  vigia = null

  if ((await read($, agentes)) > 0 && !(await read($, saindo))) {
    await update($, saindo, () => true)
    apagar = $.clock.after(DESAPARECE_MS, () => {
      void sumir($)
    })
  }
}

const vigiar = ($: EngineInterface) => {
  if (!vigia) {
    vigia = $.clock.every(1000, () => {
      void conferir($).catch(() => undefined)
    })
  }
}

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
  // O monitor nunca pode travar a sessão: falhas dele ficam de fora, e o next sempre roda.
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await medir($).catch(() => undefined)

    return result
  })

  // Cada mensagem que o aluno envia; comandos e textos que ele não digitou ficam de fora.
  on('prompt.submit', async ($, e, next) => {
    if (!e.command && !e.isMeta) {
      await update($, envios, atual => atual + 1).catch(() => undefined)
      await update($, recentes, atual => [...atual, e.text.length].slice(-3)).catch(() => undefined)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await medir($).catch(() => undefined)

    return result
  })

  // Cada agente disparado conta logo; a vigia corrige o número com o status real.
  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)

    apagar?.cancel()
    apagar = null
    await update($, saindo, () => false)
    await update($, agentes, atual => atual + 1)
    vigiar($)

    return result
  })

  // Depois de cada turno e de cada compactação, quando a contagem chega.
  on('session.measure', async ($, e, next) => {
    const result = await next(e)

    if (e.changed.includes('context')) {
      await medir($).catch(() => undefined)
    }

    return result
  })

  // A faixa acima do prompt: barras na cor do nível, porcentagem e uma frase de apoio em cinza. O desktop não desenha a linha de dica embaixo do prompt.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    // Sem contagem, a faixa mostra "sem medida" em vez de um 0% enganoso. Desenhar não pode gravar estado:
    // o host recusa, então a medição acontece só nos eventos de sessão e de turno.
    const medido = await read($, percent)
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
    const agentesN = await read($, agentes)
    const agentesSaindo = await read($, saindo)
    const mostraAgentes = agentesN > 0 || agentesSaindo
    const { Box, Text } = $.ui.resolve(e)
    let barras
    let icone = null

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      barras = <Raster key="barras" columns={BARRAS} rows={1} cells={barrasRaster(n, tinta)} />
    } else {
      const { Svg } = $.ui.resolve(e)
      barras = <Svg source={barrasSvg(n, tinta)} alt={`contexto ${legenda}`} />
      // O ícone só aparece no desktop: o terminal não anima SVG. A chave muda entre entrar e sair, para o fade rodar de novo.
      if (mostraAgentes) {
        icone = <Svg key={agentesSaindo ? 'saindo' : 'entrando'} source={iconeAgentesSvg('#888780', agentesSaindo)} alt={`${agentesN} agentes em paralelo`} />
      }
    }

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        {barras}
        <Text>{legenda}</Text>
        <Text dimColor>{aviso === 'livre' ? frase(faixa, enviados, ultimos) : frasesDeAlerta[aviso]}</Text>
        {mostraAgentes ? (
          <Box flexDirection="row" alignItems="center" gap={1}>
            {icone}
            <Text>{agentesN}</Text>
          </Box>
        ) : null}
      </Box>
    )
  })
}
