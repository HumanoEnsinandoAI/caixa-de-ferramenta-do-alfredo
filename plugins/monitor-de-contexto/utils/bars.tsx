import { EMPTY } from './colors'

// The bars fill across the whole window; the colour comes from the level band.
export const BARS = 4

export const filledBars = (pct: number) => Math.min(BARS, Math.ceil(pct / (100 / BARS)))

// Desktop: the 4 bars drawn as SVG, side by side.
const WIDTH = 5
const HEIGHT = 12
const GAP = 3

export const barsSvg = (n: number, filled: string) => {
  const w = BARS * WIDTH + (BARS - 1) * GAP
  const rects = Array.from({ length: BARS }, (_, i) =>
    `<rect x="${i * (WIDTH + GAP)}" y="0" width="${WIDTH}" height="${HEIGHT}" rx="1.5" fill="${i < n ? filled : EMPTY}"/>`,
  )

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${HEIGHT}" viewBox="0 0 ${w} ${HEIGHT}">${rects.join('')}</svg>`
}

// Terminal: one cell per bar, a coloured half block over the terminal background.
const hex = (color: string) => parseInt(color.slice(1), 16)
const DEFAULT_BG = 0x01000000

export const barsRaster = (n: number, filled: string) => {
  const words = new Uint32Array(BARS * 3)

  for (let i = 0; i < BARS; i++) {
    words.set([0x258c, hex(i < n ? filled : EMPTY), DEFAULT_BG], i * 3)
  }

  // The engine has Uint8Array.toBase64; the es2023 lib types do not declare it yet.
  return (new Uint8Array(words.buffer) as Uint8Array & { toBase64: () => string }).toBase64()
}
