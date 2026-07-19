import type { DailySnapshot, SnapshotTrend, TrendDirection } from '../types/snapshots'

export type SnapshotWithChange = {
  snapshot: DailySnapshot
  changeFromPrevious: number | null
}

type SnapshotDraft = Omit<DailySnapshot, 'id'> & { id?: string }

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Returns a new array ordered newest-first. Invalid snapshots are omitted and
 * duplicate dates are consolidated because a date represents one daily sample.
 */
export function normalizeSnapshots(value: unknown): DailySnapshot[] {
  if (!Array.isArray(value)) return []

  return value.reduce<DailySnapshot[]>((result, candidate) => {
    if (!isDailySnapshot(candidate)) return result
    return upsertSnapshot(result, candidate)
  }, [])
}

export function sortSnapshotsNewestFirst(
  snapshots: readonly DailySnapshot[],
): DailySnapshot[] {
  return [...snapshots].sort(
    (left, right) =>
      right.date.localeCompare(left.date) || right.id.localeCompare(left.id),
  )
}

/**
 * Inserts or updates the one snapshot for a local calendar date.
 * The existing id is kept when updating a date so UI row identity stays stable.
 */
export function upsertSnapshot(
  snapshots: readonly DailySnapshot[],
  snapshot: DailySnapshot,
): DailySnapshot[] {
  if (!isDailySnapshot(snapshot)) return sortSnapshotsNewestFirst(snapshots)

  const existing = snapshots.find((item) => item.date === snapshot.date)
  const next = snapshots.filter((item) => item.date !== snapshot.date)
  next.push(existing ? { ...snapshot, id: existing.id } : { ...snapshot })
  return sortSnapshotsNewestFirst(next)
}

export function deleteSnapshot(
  snapshots: readonly DailySnapshot[],
  snapshotId: string,
): DailySnapshot[] {
  return sortSnapshotsNewestFirst(
    snapshots.filter((snapshot) => snapshot.id !== snapshotId),
  )
}

/**
 * Adds the change from the immediately preceding saved date to each snapshot.
 * The returned rows remain newest-first.
 */
export function getSnapshotsWithChanges(
  snapshots: readonly DailySnapshot[],
): SnapshotWithChange[] {
  const chronological = sortSnapshotsNewestFirst(snapshots).reverse()
  const changeById = new Map<string, number | null>()

  chronological.forEach((snapshot, index) => {
    const previous = chronological[index - 1]
    changeById.set(
      snapshot.id,
      previous ? snapshot.overdueBacklog - previous.overdueBacklog : null,
    )
  })

  return sortSnapshotsNewestFirst(snapshots).map((snapshot) => ({
    snapshot,
    changeFromPrevious: changeById.get(snapshot.id) ?? null,
  }))
}

export function getSnapshotChange(
  snapshots: readonly DailySnapshot[],
  snapshotId: string,
): number | null {
  return (
    getSnapshotsWithChanges(snapshots).find(
      ({ snapshot }) => snapshot.id === snapshotId,
    )?.changeFromPrevious ?? null
  )
}

/**
 * Trend calculations deliberately read only overdueBacklog. Context fields
 * such as dueToday and schedulerQueueNow never affect the result.
 */
export function calculateSnapshotTrend(
  snapshots: readonly DailySnapshot[],
): SnapshotTrend {
  const ordered = sortSnapshotsNewestFirst(snapshots)
  if (ordered.length === 0) {
    return { direction: 'flat', latestChange: null, sevenDayAverage: null }
  }

  const latestChange =
    ordered.length >= 2
      ? ordered[0].overdueBacklog - ordered[1].overdueBacklog
      : null
  const window = ordered.slice(0, 7)
  const direction = trendDirection(
    window[0].overdueBacklog - window[window.length - 1].overdueBacklog,
  )
  const sevenDayAverage =
    ordered.length >= 7
      ? window.reduce((total, snapshot) => total + snapshot.overdueBacklog, 0) /
        window.length
      : null

  return { direction, latestChange, sevenDayAverage }
}

export function createSnapshot(
  draft: SnapshotDraft,
  id = createSnapshotId(),
): DailySnapshot {
  return { ...draft, id }
}

export function isDailySnapshot(value: unknown): value is DailySnapshot {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.trim() === '') return false
  if (typeof value.date !== 'string' || !isValidLocalDate(value.date)) return false
  if (!isNonNegativeFiniteNumber(value.overdueBacklog)) return false

  return (
    isOptionalNonNegativeFiniteNumber(value.dueToday) &&
    isOptionalNonNegativeFiniteNumber(value.schedulerQueueNow) &&
    isOptionalNonNegativeFiniteNumber(value.hardCardCount) &&
    (value.note === undefined || typeof value.note === 'string')
  )
}

function trendDirection(change: number): TrendDirection {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'flat'
}

function isValidLocalDate(value: string): boolean {
  const match = LOCAL_DATE_PATTERN.exec(value)
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

function isOptionalNonNegativeFiniteNumber(value: unknown): boolean {
  return value === undefined || isNonNegativeFiniteNumber(value)
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function createSnapshotId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
