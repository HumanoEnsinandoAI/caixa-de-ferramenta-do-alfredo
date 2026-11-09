import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Envios } from '../types'

import { FRASES, FRASES_CURTAS } from './frases'

const percent = atom({ plugin: 'monitor-de-contexto', key: 'percent' } as const, null)
const mensagens = atom({ plugin: 'monitor-de-contexto', key: 'mensagens' } as const, null)
const envios = atom({ plugin: 'monitor-de-contexto', key: 'envios' } as const, { quantidade: 0, caracteres: 0 })

// As barras enchem pela janela inteira; a cor vem da faixa do contexto.
const BARRAS = 4
const VAZIA = '#D3D1C7'

// Níveis pela linha Messages do /context: um a cada 50k tokens, até 500k, o teto combinado para a compactação.
const PASSO = 50_000
const TETO = 500_000
const NIVEIS = TETO / PASSO

export const nivel = (tokens: number) => Math.min(NIVEIS, Math.floor(tokens / PASSO))

// Faixas: verde até 150k, amarelo até 300k, laranja até 450k, vermelho daí em diante.
export const cor = (n: number) => (n < 3 ? '#639922' : n < 6 ? '#BA7517' : n < 9 ? '#D85A30' : '#E24B4A')

// Tamanho médio de um envio em tokens, contando 4 caracteres por token.
export const mediaTokens = (e: Envios) => (e.quantidade === 0 ? 0 : Math.round(e.caracteres / 4 / e.quantidade))

// Mensagens curtas: depois de 3 envios, média abaixo de 30 tokens (uma frase curta).
const CURTA = 30
const MINIMO = 3

export const curtas = (e: Envios) => e.quantidade >= MINIMO && mediaTokens(e) < CURTA

// Uma frase da lista do nível; troca a cada envio e fica parada entre um envio e outro. Até o amarelo, quem manda mensagens curtas recebe a lista que puxa o microfone.
export const frase = (tokens: number, e: Envios) => {
  const n = nivel(tokens)
  const lista = (curtas(e) ? FRASES_CURTAS[n] : undefined) ?? FRASES[n] ?? []

  return lista[e.quantidade % lista.length] ?? ''
}

export const cheias = (pct: number) => Math.min(BARRAS, Math.ceil(pct / (100 / BARRAS)))

// Desktop: as 4 barras desenhadas em SVG, lado a lado.
const LARGURA = 5
const ALTURA = 12
const ESPACO = 3

export const barrasSvg = (n: number, cheia: string) => {
  const w = BARRAS * LARGURA + (BARRAS - 1) * ESPACO
  const rects = Array.from({ length: BARRAS }, (_, i) =>
    `<rect x="${i * (LARGURA + ESPACO)}" y="0" width="${LARGURA}" height="${ALTURA}" rx="1.5" fill="${i < n ? cheia : VAZIA}"/>`,
  )

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${ALTURA}" viewBox="0 0 ${w} ${ALTURA}">${rects.join('')}</svg>`
}

// Terminal: uma célula por barra, meio bloco colorido sobre o fundo do terminal.
const hex = (cor: string) => parseInt(cor.slice(1), 16)
const FUNDO_PADRAO = 0x01000000

export const barrasRaster = (n: number, cheia: string) => {
  const words = new Uint32Array(BARRAS * 3)

  for (let i = 0; i < BARRAS; i++) {
    words.set([0x258c, hex(i < n ? cheia : VAZIA), FUNDO_PADRAO], i * 3)
  }

  // O motor tem Uint8Array.toBase64; a lib es2023 dos tipos ainda não o declara.
  return (new Uint8Array(words.buffer) as Uint8Array & { toBase64: () => string }).toBase64()
}

const medir = async ($: EngineInterface) => {
  const { context } = await $.session.usage({ breakdown: 'summary' })

  if (context.percent !== undefined) {
    await update($, percent, () => context.percent ?? null)
  }

  // A linha Messages junta o que o aluno digita, as respostas do Claude e o que as ferramentas devolvem.
  const linha = context.breakdown?.categories.find(c => c.kind === 'used' && c.name === 'Messages')

  if (linha) {
    await update($, mensagens, () => linha.tokens)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    // Apaga o texto que uma versão de teste deixou fixo na linha de status.
    $.ui.status(undefined)
    await medir($)

    return result
  })

  // Cada mensagem que o aluno envia; comandos e textos que ele não digitou ficam de fora.
  on('prompt.submit', async ($, e, next) => {
    if (!e.command && !e.isMeta) {
      await update($, envios, atual => ({ quantidade: atual.quantidade + 1, caracteres: atual.caracteres + e.text.length }))
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
    const medido = await read($, percent)

    if (medido === null) {
      void medir($)
    }

    const pct = medido ?? 0
    const n = cheias(pct)
    // Os números de mensagens e envios ficam por baixo: só escolhem a cor e a frase.
    const tokens = (await read($, mensagens)) ?? 0
    const enviados = await read($, envios)
    const tinta = cor(nivel(tokens))
    const { Box, Text } = $.ui.resolve(e)
    let barras

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      barras = <Raster key="barras" columns={BARRAS} rows={1} cells={barrasRaster(n, tinta)} />
    } else {
      const { Svg } = $.ui.resolve(e)
      barras = <Svg source={barrasSvg(n, tinta)} alt={`contexto ${pct}%`} />
    }

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        {barras}
        <Text>{pct}%</Text>
        <Text dimColor>{frase(tokens, enviados)}</Text>
      </Box>
    )
  })
}
