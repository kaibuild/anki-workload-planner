import { describe, expect, it } from 'vitest'
import { getDefaultPlannerInputs } from './planner'
import {
  STORAGE_KEYS,
  clearAllLocalData,
  deleteStoredSnapshot,
  loadLocale,
  loadSnapshots,
  loadStoredInputs,
  saveInputs,
  saveLocale,
  saveSnapshots,
  upsertStoredSnapshot,
} from './storage'
import type { DailySnapshot } from '../types/snapshots'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const TODAY = new Date(2026, 6, 16)

function sample(id: string, date: string, overdueBacklog: number): DailySnapshot {
  return { id, date, overdueBacklog }
}

describe('input persistence', () => {
  it('round-trips planner input through the versioned key', () => {
    const storage = new MemoryStorage()
    const inputs = { ...getDefaultPlannerInputs(TODAY), overdueBacklog: 22_000 }

    expect(saveInputs(inputs, storage)).toBe(true)
    expect(storage.getItem(STORAGE_KEYS.inputs)).not.toBeNull()
    expect(loadStoredInputs(storage, TODAY)).toEqual(inputs)
  })

  it('falls back safely when localStorage contains malformed JSON', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEYS.inputs, '{ definitely not json')

    expect(loadStoredInputs(storage, TODAY)).toEqual(getDefaultPlannerInputs(TODAY))
  })

  it('recovers valid fields while replacing invalid stored fields', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      STORAGE_KEYS.inputs,
      JSON.stringify({
        overdueBacklog: 3000,
        dailyMinutes: -10,
        targetDate: '2026-02-30',
        daysOff: [6, 1, 1, 8, '2'],
      }),
    )

    const result = loadStoredInputs(storage, TODAY)
    expect(result.overdueBacklog).toBe(3000)
    expect(result.dailyMinutes).toBe(45)
    expect(result.targetDate).toBe('2026-07-30')
    expect(result.daysOff).toEqual([1, 6])
  })
})

describe('snapshot and locale persistence', () => {
  it('stores newest-first and upserts a matching date without duplication', () => {
    const storage = new MemoryStorage()
    saveSnapshots([sample('old', '2026-07-15', 1200)], storage)
    upsertStoredSnapshot(sample('today', '2026-07-16', 1100), storage)
    const updated = upsertStoredSnapshot(
      sample('replacement', '2026-07-16', 1050),
      storage,
    )

    expect(updated).toEqual([
      sample('today', '2026-07-16', 1050),
      sample('old', '2026-07-15', 1200),
    ])
    expect(loadSnapshots(storage)).toEqual(updated)
  })

  it('deletes one stored snapshot', () => {
    const storage = new MemoryStorage()
    saveSnapshots(
      [sample('one', '2026-07-15', 1200), sample('two', '2026-07-16', 1100)],
      storage,
    )

    expect(deleteStoredSnapshot('two', storage)).toEqual([
      sample('one', '2026-07-15', 1200),
    ])
  })

  it('accepts only a supported locale', () => {
    const storage = new MemoryStorage()
    expect(loadLocale(storage)).toBeNull()
    expect(saveLocale('ja', storage)).toBe(true)
    expect(loadLocale(storage)).toBe('ja')
    storage.setItem(STORAGE_KEYS.locale, 'fr')
    expect(loadLocale(storage)).toBeNull()
  })

  it('removes every key in this product namespace and preserves unrelated data', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEYS.inputs, '{}')
    storage.setItem(STORAGE_KEYS.snapshots, '[]')
    storage.setItem(STORAGE_KEYS.locale, 'en')
    storage.setItem('anki-workload-planner:inputs:v0', '{"legacy":true}')
    storage.setItem('anki-workload-planner:future-feature:v2', 'owned')
    storage.setItem('anki-workload-planner-other:inputs:v1', 'different product')
    storage.setItem('unrelated', 'preserved')

    expect(clearAllLocalData(storage)).toBe(true)
    expect(storage.getItem(STORAGE_KEYS.inputs)).toBeNull()
    expect(storage.getItem(STORAGE_KEYS.snapshots)).toBeNull()
    expect(storage.getItem(STORAGE_KEYS.locale)).toBeNull()
    expect(storage.getItem('anki-workload-planner:inputs:v0')).toBeNull()
    expect(storage.getItem('anki-workload-planner:future-feature:v2')).toBeNull()
    expect(storage.getItem('anki-workload-planner-other:inputs:v1')).toBe('different product')
    expect(storage.getItem('unrelated')).toBe('preserved')
  })
})
