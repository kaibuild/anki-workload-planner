import { describe, expect, it } from 'vitest'
import type { DailySnapshot } from '../types/snapshots'
import {
  calculateSnapshotTrend,
  deleteSnapshot,
  getSnapshotsWithChanges,
  normalizeSnapshots,
  upsertSnapshot,
} from './snapshots'

function snapshot(
  id: string,
  date: string,
  overdueBacklog: number,
  context: Partial<DailySnapshot> = {},
): DailySnapshot {
  return { id, date, overdueBacklog, ...context }
}

describe('snapshot collection', () => {
  it('updates the same local date without adding a duplicate', () => {
    const initial = [snapshot('original-id', '2026-07-16', 1200)]
    const result = upsertSnapshot(
      initial,
      snapshot('new-id', '2026-07-16', 1100, { note: 'updated' }),
    )

    expect(result).toEqual([
      snapshot('original-id', '2026-07-16', 1100, { note: 'updated' }),
    ])
  })

  it('orders snapshots newest-first and deletion is immutable', () => {
    const original = [
      snapshot('old', '2026-07-14', 1300),
      snapshot('new', '2026-07-16', 1100),
      snapshot('middle', '2026-07-15', 1200),
    ]

    expect(upsertSnapshot(original, snapshot('latest', '2026-07-17', 1000)).map((s) => s.id)).toEqual([
      'latest',
      'new',
      'middle',
      'old',
    ])
    expect(deleteSnapshot(original, 'middle').map((s) => s.id)).toEqual(['new', 'old'])
    expect(original).toHaveLength(3)
  })

  it('reports the change from the previous saved date', () => {
    const rows = getSnapshotsWithChanges([
      snapshot('third', '2026-07-16', 950),
      snapshot('first', '2026-07-14', 1200),
      snapshot('second', '2026-07-15', 1000),
    ])

    expect(rows.map(({ snapshot: item, changeFromPrevious }) => [item.id, changeFromPrevious])).toEqual([
      ['third', -50],
      ['second', -200],
      ['first', null],
    ])
  })

  it('filters malformed entries and consolidates duplicate dates', () => {
    const result = normalizeSnapshots([
      snapshot('one', '2026-07-16', 100),
      snapshot('replacement', '2026-07-16', 90),
      { id: 'invalid-date', date: '2026-02-30', overdueBacklog: 20 },
      { id: 'negative', date: '2026-07-15', overdueBacklog: -1 },
      null,
    ])

    expect(result).toEqual([snapshot('one', '2026-07-16', 90)])
  })
})

describe('backlog trend', () => {
  it('uses overdueBacklog only, ignoring due-today and queue context', () => {
    const baseline = [
      snapshot('new', '2026-07-16', 900, {
        dueToday: 1,
        schedulerQueueNow: 1,
      }),
      snapshot('old', '2026-07-15', 1000, {
        dueToday: 999_999,
        schedulerQueueNow: 999_999,
      }),
    ]

    expect(calculateSnapshotTrend(baseline)).toEqual({
      direction: 'down',
      latestChange: -100,
      sevenDayAverage: null,
    })
  })

  it('calculates the average of the most recent seven backlog samples', () => {
    const snapshots = Array.from({ length: 8 }, (_, index) =>
      snapshot(
        String(index),
        `2026-07-${String(index + 1).padStart(2, '0')}`,
        (index + 1) * 100,
      ),
    )

    expect(calculateSnapshotTrend(snapshots)).toEqual({
      direction: 'up',
      latestChange: 100,
      sevenDayAverage: 500,
    })
  })

  it('returns an explicit empty trend', () => {
    expect(calculateSnapshotTrend([])).toEqual({
      direction: 'flat',
      latestChange: null,
      sevenDayAverage: null,
    })
  })
})
