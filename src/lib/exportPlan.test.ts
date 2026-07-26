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
  hardCardHeading: 'Hard-card workload',
  hardCardCount: 'Known hard/leech cards',
  hardCardReviewsPerDay: 'Hard-card reviews per day',
  extraSecondsPerHardReview: 'Extra seconds per hard review',
  hardCardOverhead: 'Estimated hard-card overhead',
  hardCardAddedTime: 'Additional time per day',
  hardCardReducedCapacity: 'Fewer backlog cards per day',
  usedInEstimate: 'Used in estimate',
  contextOnly: 'Context only',
  estimatedEffect: 'Estimated effect compared with no hard-card overhead',
  hardCardNoDailyOverheadCountContext:
    'Known hard-card count was recorded as context, but no daily hard-card overhead was included because hard-card reviews per day was zero.',
  hardCardNoDailyOverhead:
    'No daily hard-card overhead was included because one or both calculation inputs were zero.',
  hardCardOnePassUnchanged: 'no whole-day change',
  withoutHardCardOverhead: 'without hard-card overhead',
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

const JA_LABELS: ExportLabels = {
  ...LABELS,
  title: 'Anki負荷プラン',
  generated: 'ブラウザ内で生成',
  inputs: '現在の入力',
  results: 'サマリー',
  recommendation: '最初におすすめする調整',
  hardCardHeading: '難しいカードの負荷',
  hardCardCount: '既知のleech・難しいカード数',
  hardCardReviewsPerDay: '1日あたりの難しいカードのレビュー数',
  extraSecondsPerHardReview: '難しいカード1回あたりの追加秒数',
  hardCardOverhead: '難しいカードの推定追加時間',
  hardCardAddedTime: '1日あたりの追加時間',
  hardCardReducedCapacity: '1日あたりに減るbacklog処理量',
  usedInEstimate: '推定に使用',
  contextOnly: '参考情報のみ',
  estimatedEffect: '難しいカードの追加負荷がない場合との推定差',
  hardCardNoDailyOverheadCountContext:
    '既知の難しいカード数は参考情報として記録されていますが、1日あたりの難しいカードのレビュー数が0のため、追加負荷は計算に含まれていません。',
  hardCardNoDailyOverhead:
    '計算に使う入力の一方または両方が0のため、難しいカードの追加負荷は計算に含まれていません。',
  hardCardOnePassUnchanged: '日数単位では変化なし',
  withoutHardCardOverhead: '難しいカードの追加負荷なし',
  recurringMinutes: '継続的な1日の負荷',
  backlogReduction: '1日あたりのbacklog削減数',
  onePass: '現在のbacklogを一巡するまでの推定日数',
  days: '学習日',
  cardsPerDay: '枚/日',
  minutesPerDay: '分/日',
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

  it.each([
    ['en' as const, LABELS],
    ['ja' as const, JA_LABELS],
  ])('exports every applied hard-card value and its effect in %s', (locale, labels) => {
    const today = new Date(2026, 6, 16)
    const inputs = {
      ...getDefaultPlannerInputs(today),
      overdueBacklog: 3940,
      typicalDailyReviews: 50,
      dailyMinutes: 180,
      averageSecondsPerReview: 10,
      newCardsPerDay: 0,
      hardCardCount: 500,
      hardCardReviewsPerDay: 100,
      extraSecondsPerHardReview: 7,
      targetDate: '2026-08-10',
    }
    const markdown = buildPlanMarkdown(
      inputs,
      calculatePlanner(inputs, today),
      locale,
      labels,
      locale === 'ja' ? '減少' : 'Shrinking',
      locale === 'ja' ? '余裕あり' : 'Comfortable',
      locale === 'ja' ? '現在のペースを維持します。' : 'Keep the current pace.',
      today,
    )

    expect(markdown).toContain(`- ${labels.hardCardReviewsPerDay}: 100 (${labels.usedInEstimate})`)
    expect(markdown).toContain(`- ${labels.extraSecondsPerHardReview}: 7 (${labels.usedInEstimate})`)
    expect(markdown).toContain(`- ${labels.hardCardOverhead}: 11.7 ${labels.minutesPerDay}`)
    expect(markdown).toContain(`- ${labels.recurringMinutes}: 20 ${labels.minutesPerDay}`)
    expect(markdown).toContain(`- ${labels.backlogReduction}: 960 ${labels.cardsPerDay}`)
    expect(markdown).toContain(`- ${labels.onePass}: 5 ${labels.days}`)
    expect(markdown).toContain(`  - ${labels.hardCardReducedCapacity}: 70 ${labels.cardsPerDay}`)
    expect(markdown).toContain(
      `5 ${labels.days} (${labels.withoutHardCardOverhead}: 4 ${labels.days})`,
    )
  })

  it.each([
    ['en' as const, LABELS],
    ['ja' as const, JA_LABELS],
  ])('explains in %s when a known count remains context only', (locale, labels) => {
    const today = new Date(2026, 6, 16)
    const inputs = {
      ...getDefaultPlannerInputs(today),
      hardCardCount: 500,
      hardCardReviewsPerDay: 0,
      extraSecondsPerHardReview: 7,
    }
    const markdown = buildPlanMarkdown(
      inputs,
      calculatePlanner(inputs, today),
      locale,
      labels,
      'Shrinking',
      'Comfortable',
      'Keep going.',
      today,
    )

    expect(markdown).toContain(labels.hardCardNoDailyOverheadCountContext)
    expect(markdown).toContain(`- ${labels.hardCardCount}: 500 (${labels.contextOnly})`)
    expect(markdown).toContain(`- ${labels.hardCardOverhead}: 0 ${labels.minutesPerDay}`)
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
