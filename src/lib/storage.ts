import { getDefaultPlannerInputs } from './planner'
import {
  deleteSnapshot as deleteSnapshotFromList,
  normalizeSnapshots,
  upsertSnapshot,
} from './snapshots'
import type { PlannerInputs } from '../types/planner'
import type { DailySnapshot } from '../types/snapshots'

export type Locale = 'en' | 'ja'

const PRODUCT_STORAGE_PREFIX = 'anki-workload-planner:'

export const STORAGE_KEYS = {
  inputs: 'anki-workload-planner:inputs:v1',
  snapshots: 'anki-workload-planner:snapshots:v1',
  locale: 'anki-workload-planner:locale:v1',
} as const

type NumericPlannerField = {
  [Field in keyof PlannerInputs]: PlannerInputs[Field] extends number ? Field : never
}[keyof PlannerInputs]

const NUMBER_FIELDS: ReadonlyArray<NumericPlannerField> = [
  'overdueBacklog',
  'typicalDailyReviews',
  'dueToday',
  'schedulerQueueNow',
  'dailyMinutes',
  'averageSecondsPerReview',
  'newCardsPerDay',
  'newCardReviewEquivalent',
  'hardCardCount',
  'hardCardReviewsPerDay',
  'extraSecondsPerHardReview',
  'plannedAdditionalCards',
  'plannedAdditionalCardsDays',
  'potentiallyTriagedCards',
]

export function loadStoredInputs(
  storage?: Storage | null,
  today = new Date(),
): PlannerInputs {
  const defaults = getDefaultPlannerInputs(today)
  const parsed = readJson(STORAGE_KEYS.inputs, storage)
  if (!isRecord(parsed)) return defaults

  const result = { ...defaults }
  for (const field of NUMBER_FIELDS) {
    const value = parsed[field]
    if (isNonNegativeFiniteNumber(value)) result[field] = value
  }

  if (typeof parsed.targetDate === 'string' && isValidLocalDate(parsed.targetDate)) {
    result.targetDate = parsed.targetDate
  }
  if (Array.isArray(parsed.daysOff)) {
    result.daysOff = normalizeDaysOff(parsed.daysOff)
  }

  return result
}

export function saveInputs(
  inputs: PlannerInputs,
  storage?: Storage | null,
): boolean {
  return writeJson(STORAGE_KEYS.inputs, inputs, storage)
}

export function clearStoredInputs(storage?: Storage | null): boolean {
  return removeItem(STORAGE_KEYS.inputs, storage)
}

export function loadSnapshots(storage?: Storage | null): DailySnapshot[] {
  return normalizeSnapshots(readJson(STORAGE_KEYS.snapshots, storage))
}

export const loadStoredSnapshots = loadSnapshots

export function saveSnapshots(
  snapshots: readonly DailySnapshot[],
  storage?: Storage | null,
): boolean {
  return writeJson(
    STORAGE_KEYS.snapshots,
    normalizeSnapshots(snapshots),
    storage,
  )
}

export const saveStoredSnapshots = saveSnapshots

export function upsertStoredSnapshot(
  snapshot: DailySnapshot,
  storage?: Storage | null,
): DailySnapshot[] {
  const next = upsertSnapshot(loadSnapshots(storage), snapshot)
  saveSnapshots(next, storage)
  return next
}

export function deleteStoredSnapshot(
  snapshotId: string,
  storage?: Storage | null,
): DailySnapshot[] {
  const next = deleteSnapshotFromList(loadSnapshots(storage), snapshotId)
  saveSnapshots(next, storage)
  return next
}

export function loadLocale(storage?: Storage | null): Locale | null {
  const value = readItem(STORAGE_KEYS.locale, storage)
  return value === 'en' || value === 'ja' ? value : null
}

export function saveLocale(
  locale: Locale,
  storage?: Storage | null,
): boolean {
  if (locale !== 'en' && locale !== 'ja') return false
  return writeItem(STORAGE_KEYS.locale, locale, storage)
}

export function clearAllLocalData(storage?: Storage | null): boolean {
  const target = resolveStorage(storage)
  if (!target) return false

  try {
    const productKeys: string[] = []
    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index)
      if (key?.startsWith(PRODUCT_STORAGE_PREFIX)) productKeys.push(key)
    }
    for (const key of productKeys) target.removeItem(key)
    return true
  } catch {
    return false
  }
}

function readJson(key: string, storage?: Storage | null): unknown {
  const raw = readItem(key, storage)
  if (raw === null) return null

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeJson(
  key: string,
  value: unknown,
  storage?: Storage | null,
): boolean {
  try {
    return writeItem(key, JSON.stringify(value), storage)
  } catch {
    return false
  }
}

function readItem(key: string, storage?: Storage | null): string | null {
  const target = resolveStorage(storage)
  if (!target) return null

  try {
    return target.getItem(key)
  } catch {
    return null
  }
}

function writeItem(
  key: string,
  value: string,
  storage?: Storage | null,
): boolean {
  const target = resolveStorage(storage)
  if (!target) return false

  try {
    target.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function removeItem(key: string, storage?: Storage | null): boolean {
  const target = resolveStorage(storage)
  if (!target) return false

  try {
    target.removeItem(key)
    return true
  } catch {
    return false
  }
}

function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function normalizeDaysOff(value: readonly unknown[]): number[] {
  return [...new Set(value.filter(isDayOff))].sort((left, right) => left - right)
}

function isDayOff(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0 && value <= 6
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isValidLocalDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
