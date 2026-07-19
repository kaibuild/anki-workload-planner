export type DailySnapshot = {
  id: string
  date: string
  overdueBacklog: number
  dueToday?: number
  schedulerQueueNow?: number
  hardCardCount?: number
  note?: string
}

export type TrendDirection = 'up' | 'flat' | 'down'

export type SnapshotTrend = {
  direction: TrendDirection
  latestChange: number | null
  sevenDayAverage: number | null
}
