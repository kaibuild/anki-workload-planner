import { describe, expect, it } from 'vitest'
import { countWorkingDays } from './dates'

describe('countWorkingDays', () => {
  it('counts an inclusive local-date range and excludes selected weekdays', () => {
    const thursday = new Date(2026, 6, 16)
    expect(countWorkingDays(thursday, '2026-07-19', [4, 5])).toBe(2)
  })

  it('is not shifted by a daylight-saving transition', () => {
    const beforeDst = new Date(2026, 2, 7)
    expect(countWorkingDays(beforeDst, '2026-03-10', [])).toBe(4)
  })

  it('handles a multi-century range without walking every date', () => {
    const start = new Date(2026, 0, 1)
    const result = countWorkingDays(start, '9999-12-31', [5, 6])
    expect(result).not.toBeNull()
    expect(result).toBeGreaterThan(2_000_000)
  })

  it('ignores duplicate and out-of-range day-off values', () => {
    const monday = new Date(2026, 6, 20)
    expect(countWorkingDays(monday, '2026-07-26', [0, 0, -1, 7])).toBe(6)
  })
})
