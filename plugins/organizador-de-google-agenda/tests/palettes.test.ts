import { expect, test } from 'claude-code/testing'

import { GOOGLE_COLORS, darkPalettes, lightPalettes, PALETTES } from '../utils/palettes'

const HEX = /^#[0-9A-F]{6}$/

test('every palette has 3 distinct colors, all valid hex', async () => {
  for (const palette of PALETTES) {
    expect(palette.colors).toHaveLength(3)
    expect(new Set(palette.colors).size).toBe(palette.colors.length)
    for (const color of palette.colors) {
      expect(color).toMatch(HEX)
    }
  }
})

test('ids are unique and every palette has a name and a description', async () => {
  const ids = PALETTES.map(palette => palette.id)

  expect(new Set(ids).size).toBe(ids.length)
  for (const palette of PALETTES) {
    expect(palette.id).toMatch(/^[a-z0-9-]+$/)
    expect(palette.name.length).toBeGreaterThan(0)
    expect(palette.description.length).toBeGreaterThan(0)
  }
})

test('each list holds only its own mode, and both modes exist', async () => {
  expect(lightPalettes.length).toBeGreaterThan(0)
  expect(darkPalettes.length).toBeGreaterThan(0)
  expect(lightPalettes.every(palette => palette.mode === 'light')).toBe(true)
  expect(darkPalettes.every(palette => palette.mode === 'dark')).toBe(true)
  expect(PALETTES.length).toBe(lightPalettes.length + darkPalettes.length)
})

test('palette names are unique, because the picker chooses by name', async () => {
  const names = PALETTES.map(palette => palette.name.toLowerCase())

  expect(new Set(names).size).toBe(names.length)
})

test('colors, ids and names come from the 11 Google event colors and agree with each other', async () => {
  const known = Object.entries(GOOGLE_COLORS)

  for (const palette of PALETTES) {
    expect(palette.colorIds).toHaveLength(3)
    expect(palette.colorNames).toHaveLength(3)
    palette.colors.forEach((hex, index) => {
      const match = known.find(([name]) => name === palette.colorNames[index])

      expect(match).toBeDefined()
      expect(match?.[1].hex).toBe(hex)
      expect(match?.[1].id).toBe(palette.colorIds[index])
    })
  }
})

test('the connector takes colorId 1 to 11 only', async () => {
  const ids = Object.values(GOOGLE_COLORS).map(color => Number(color.id)).sort((a, b) => a - b)

  expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
})

test('no two palettes of the same mode share the same colors in the same order', async () => {
  const keys = PALETTES.map(palette => `${palette.mode}:${palette.colorIds.join('-')}`)

  expect(new Set(keys).size).toBe(keys.length)
})

test('dark palettes avoid Graphite, which nearly disappears on a dark background', async () => {
  expect(darkPalettes.every(palette => !palette.colorNames.includes('Graphite'))).toBe(true)
})
