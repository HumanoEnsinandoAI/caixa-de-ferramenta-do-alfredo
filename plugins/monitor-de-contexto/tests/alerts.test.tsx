import { expect, test } from 'claude-code/testing'

import { alert } from '../utils/alerts'

const SHORT = 100 // characters: 25 tokens, under the 30-token limit
const LONG = 2000 // characters: 500 tokens

test('up to 200k tokens nothing shows, even with short sends', async () => {
  expect(alert({ total: 150_000, messages: 120_000, recent: [SHORT, SHORT, SHORT] })).toBe('free')
})

test('above 600k tokens it is always compact', async () => {
  expect(alert({ total: 600_000, messages: 100_000, recent: [LONG] })).toBe('compact')
})

test('between 250k and 600k, with messages as the majority, the last send decides', async () => {
  expect(alert({ total: 300_000, messages: 200_000, recent: [LONG, LONG, LONG] })).toBe('attention')
  expect(alert({ total: 300_000, messages: 200_000, recent: [LONG, SHORT] })).toBe('short')
})

test('between 250k and 600k, with messages as the minority, it is free', async () => {
  expect(alert({ total: 300_000, messages: 100_000, recent: [SHORT] })).toBe('free')
})

test('between 200k and 250k, three short sends in a row trigger the pattern', async () => {
  expect(alert({ total: 220_000, messages: 150_000, recent: [LONG, SHORT, SHORT, SHORT] })).toBe('approaching')
  expect(alert({ total: 220_000, messages: 150_000, recent: [SHORT, SHORT, LONG] })).toBe('free')
})

test('with no data, the alert is free', async () => {
  expect(alert({ total: null, messages: null, recent: [] })).toBe('free')
  expect(alert({ total: 300_000, messages: null, recent: [SHORT] })).toBe('free')
})
