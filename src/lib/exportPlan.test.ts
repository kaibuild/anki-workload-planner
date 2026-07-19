import { describe, expect, it } from 'vitest'
import { buildPlanMarkdown, buildSnapshotsCsv, type ExportLabels } from './exportPlan'
import { calculatePlanner, getDefaultPlannerInputs } from './planner'
import type { DailySnapshot } from '../types/snapshots'

const LABELS: ExportLabels = {
  title: 'Plan',
  generated: 'Generated',
  inputs: 'Inputs',
  results: 'Results',
  recommendation: 'Recommendation',
  overdueBacklog: 'Overdue backlog',
  typicalDailyReviews: 'Typical daily reviews',
  dailyMinutes: 'Daily minutes',
  averageSeconds: 'Average seconds',
  newCardsPerDay: 'New cards per day',
  targetDate: 'Target date',
  direction: 'Direction',
  recurringMinutes: 'Recurring minutes',
  backlogReduction: 'Backlog reduction',
  onePass: 'One pass',
  feasibility: 'Feasibility',
  unavailable: 'Not available',
  days: 'days',
  cardsPerDay: 'cards/day',
  minutesPerDay: 'minutes/day',
  csvDate: 'Date',
  csvOverdue: 'Overdue',
  csvDueToday: 'Due today',
  csvQueue: 'Queue',
  csvHardCards: 'Hard cards',
  csvNote: 'Note',
}

describe('plan Markdown export', () => {
  it.each([
    ['en' as const, 'en'],
    ['ja' as const, 'ja'],
  ])('formats the target date for the active %s locale', (locale, intlLocale) => {
    const today = new Date(2026, 6, 16)
    const inputs = { ...getDefaultPlannerInputs(today), targetDate: '2026-07-30' }
    const result = calculatePlanner(inputs, today)
    const expectedDate = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium' }).format(
      new Date(2026, 6, 30),
    )

    const markdown = buildPlanMarkdown(
      inputs,
      result,
      locale,
      LABELS,
      'Shrinking',
      'Comfortable',
      'Keep going.',
      today,
    )

    expect(markdown).toContain(`- ${LABELS.targetDate}: ${expectedDate}`)
    expect(markdown).not.toContain(`- ${LABELS.targetDate}: 2026-07-30`)
  })

  it('uses the localized unavailable label for an invalid target date', () => {
    const today = new Date(2026, 6, 16)
    const inputs = { ...getDefaultPlannerInputs(today), targetDate: '2026-02-30' }
    const markdown = buildPlanMarkdown(
      inputs,
      calculatePlanner(inputs, today),
      'en',
      LABELS,
      'Shrinking',
      'Unrealistic',
      'Choose another date.',
      today,
    )

    expect(markdown).toContain(`- ${LABELS.targetDate}: ${LABELS.unavailable}`)
  })
})

describe('snapshot CSV export', () => {
  it('neutralizes formula-like notes without changing numeric cells', () => {
    const snapshots: DailySnapshot[] = [
      { id: 'equals', date: '2026-07-16', overdueBacklog: -42, note: '=1+1' },
      { id: 'plus', date: '2026-07-17', overdueBacklog: 10, note: '+SUM(A1:A2)' },
      { id: 'minus', date: '2026-07-18', overdueBacklog: 11, note: '-2+3' },
      { id: 'at', date: '2026-07-19', overdueBacklog: 12, note: '@command' },
      { id: 'safe', date: '2026-07-20', overdueBacklog: 13, note: 'ordinary note' },
    ]

    const csv = buildSnapshotsCsv(snapshots, LABELS)
    const lines = csv.split('\r\n')

    expect(lines[1]).toBe("2026-07-16,-42,,,,'=1+1")
    expect(lines[2]).toBe("2026-07-17,10,,,,'+SUM(A1:A2)")
    expect(lines[3]).toBe("2026-07-18,11,,,,'-2+3")
    expect(lines[4]).toBe("2026-07-19,12,,,,'@command")
    expect(lines[5]).toBe('2026-07-20,13,,,,ordinary note')
  })

  it('preserves CSV escaping after neutralizing a formula-like note', () => {
    const csv = buildSnapshotsCsv(
      [{ id: 'formula', date: '2026-07-16', overdueBacklog: 10, note: '=SUM(1,2)' }],
      LABELS,
    )

    expect(csv.split('\r\n')[1]).toBe('2026-07-16,10,,,,"\'=SUM(1,2)"')
  })
})
