import { describe, expect, it } from 'vitest'
import { en, getTranslation, ja, type Locale } from '../i18n'
import { calculatePlanner, getDefaultPlannerInputs } from './planner'
import { getBacklogMetricPresentation, type BacklogMetricLabels } from './backlogPresentation'

const TODAY = new Date(2026, 6, 26)

function inputs(overrides = {}) {
  return {
    ...getDefaultPlannerInputs(TODAY),
    overdueBacklog: 6,
    typicalDailyReviews: 14,
    dailyMinutes: 28.3,
    averageSecondsPerReview: 15,
    newCardsPerDay: 6,
    newCardReviewEquivalent: 1.5,
    targetDate: '2026-08-09',
    ...overrides,
  }
}

function labels(locale: Locale): BacklogMetricLabels {
  const copy = getTranslation(locale)
  return {
    estimateNote: copy.scenarios.roughEstimate,
    backlogReductionCapacity: copy.scenarios.current.backlogReductionCapacity,
    estimatedBacklogGrowth: copy.scenarios.current.estimatedBacklogGrowth,
    estimatedBacklogChange: copy.scenarios.current.estimatedBacklogChange,
    reductionCapacityValue: copy.scenarios.current.reductionCapacityValue,
    growthValue: copy.scenarios.current.growthValue,
    flatValue: copy.scenarios.current.flatValue,
    fitsWithinOneDay: copy.scenarios.current.fitsWithinOneDay,
    noBacklog: copy.summary.onePassComplete,
    card: copy.common.units.card,
    cardPerDay: copy.common.units.cardPerDay,
    studyDay: copy.common.units.studyDay,
  }
}

describe('backlog metric presentation', () => {
  it('presents the six-card shrinking fixture as capacity, not negative actual change', () => {
    const metrics = calculatePlanner(inputs(), TODAY).current
    const presentation = getBacklogMetricPresentation(metrics, 'en', labels('en'))

    expect(presentation).toEqual({
      label: 'Backlog reduction capacity',
      value: 'Up to 90.2 cards/day',
      note: 'Only 6 cards are currently overdue, so this backlog fits within 1 study day.',
    })
    expect(presentation.value).not.toContain('-90.2')
  })

  it('keeps a large shrinking backlog on the same uncapped capacity', () => {
    const metrics = calculatePlanner(inputs({ overdueBacklog: 1000 }), TODAY).current
    const presentation = getBacklogMetricPresentation(metrics, 'en', labels('en'))

    expect(metrics.backlogReductionCardsPerDay).toBeCloseTo(90.2)
    expect(metrics.onePassDays).toBe(12)
    expect(presentation.label).toBe('Backlog reduction capacity')
    expect(presentation.value).toBe('Up to 90.2 cards/day')
    expect(presentation.note).toBe(en.scenarios.roughEstimate)
  })

  it('presents positive shortfall as estimated growth', () => {
    const metrics = calculatePlanner(
      inputs({ overdueBacklog: 100, dailyMinutes: 2 }),
      TODAY,
    ).current
    const presentation = getBacklogMetricPresentation(metrics, 'en', labels('en'))

    expect(metrics.direction).toBe('growing')
    expect(presentation.label).toBe('Estimated backlog growth')
    expect(presentation.value).toMatch(/^\+\d+(?:\.\d+)? cards\/day$/)
    expect(presentation.value).not.toContain('reduction')
  })

  it('presents an exactly flat workload as zero change', () => {
    const metrics = calculatePlanner(
      inputs({ dailyMinutes: 5.75 }),
      TODAY,
    ).current
    const presentation = getBacklogMetricPresentation(metrics, 'en', labels('en'))

    expect(metrics.direction).toBe('flat')
    expect(presentation).toEqual({
      label: 'Estimated backlog change',
      value: '0 cards/day',
      note: en.scenarios.roughEstimate,
    })
  })

  it('retains the dedicated zero-backlog state', () => {
    const metrics = calculatePlanner(
      inputs({ overdueBacklog: 0 }),
      TODAY,
    ).current
    const presentation = getBacklogMetricPresentation(metrics, 'en', labels('en'))

    expect(metrics.actualNextStudyDayReduction).toBe(0)
    expect(presentation).toEqual({
      label: 'Estimated backlog change',
      value: 'No active overdue backlog',
    })
  })

  it('uses natural Japanese capacity wording and count spacing', () => {
    const metrics = calculatePlanner(inputs(), TODAY).current
    const presentation = getBacklogMetricPresentation(metrics, 'ja', labels('ja'))

    expect(presentation).toEqual({
      label: 'backlogを減らせる上限',
      value: '1日あたり最大90.2枚',
      note: '現在の期限超過backlogは6枚のため、1学習日以内に一巡できる見込みです。',
    })
    expect(presentation.value).not.toContain(' 枚')
    expect(presentation.note).not.toContain(' 学習日')
    expect(ja.scenarios.current.estimatedBacklogGrowth).toBe('backlogの推定増加')
  })
})
