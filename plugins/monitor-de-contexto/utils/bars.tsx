import { VAZIA } from './colors'

// As barras enchem pela janela inteira; a cor vem da faixa do nível.
export const BARRAS = 4

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
