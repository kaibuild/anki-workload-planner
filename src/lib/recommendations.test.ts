import { describe, expect, it } from 'vitest'
import { calculatePlanner, getDefaultPlannerInputs } from './planner'
import {
  getRecommendation,
  getRecommendationText,
  selectRecommendation,
  type RecommendationKey,
} from './recommendations'
import type { PlannerInputs, PlannerResult } from '../types/planner'

const TODAY = new Date(2026, 6, 16)

function inputs(patch: Partial<PlannerInputs> = {}): PlannerInputs {
  return {
    ...getDefaultPlannerInputs(TODAY),
    overdueBacklog: 100,
    targetDate: '2026-12-31',
    ...patch,
  }
}

function withResult(
  plannerInputs: PlannerInputs,
  patch: (result: PlannerResult) => PlannerResult = (result) => result,
): PlannerResult {
  return patch(calculatePlanner(plannerInputs, TODAY))
}

describe('deterministic recommendation rules', () => {
  it('focuses on prevention when no overdue backlog is entered', () => {
    const plannerInputs = inputs({ overdueBacklog: 0 })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe('noBacklog')
  })

  it('prioritizes a planned batch that makes workload grow', () => {
    const plannerInputs = inputs({
      typicalDailyReviews: 180,
      newCardsPerDay: 10,
      plannedAdditionalCards: 800,
      plannedAdditionalCardsDays: 7,
    })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'plannedCardsGrow',
    )
  })

  it('recommends pausing new cards first whenever the current pace is not shrinking', () => {
    const plannerInputs = inputs({
      overdueBacklog: 3000,
      typicalDailyReviews: 250,
      dailyMinutes: 45,
      averageSecondsPerReview: 9,
      newCardsPerDay: 50,
    })
    const result = withResult(plannerInputs)
    expect(result.current.direction).toBe('growing')
    expect(result.pauseNewCards.direction).toBe('shrinking')
    expect(selectRecommendation(plannerInputs, result)).toBe('pauseNewCards')
  })

  it('still recommends pausing new cards when pausing alone does not restore capacity', () => {
    const plannerInputs = inputs({
      typicalDailyReviews: 500,
      dailyMinutes: 20,
      newCardsPerDay: 1,
    })
    const result = withResult(plannerInputs)
    expect(result.pauseNewCards.direction).toBe('growing')
    expect(selectRecommendation(plannerInputs, result)).toBe('pauseNewCards')
  })

  it('recommends one recurring-load adjustment when baseline reviews exceed capacity', () => {
    const plannerInputs = inputs({
      typicalDailyReviews: 500,
      dailyMinutes: 20,
      newCardsPerDay: 0,
    })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'reduceRecurringLoad',
    )
  })

  it('fixes an already overloaded baseline before warning about a planned batch', () => {
    const plannerInputs = inputs({
      typicalDailyReviews: 500,
      dailyMinutes: 20,
      newCardsPerDay: 0,
      plannedAdditionalCards: 800,
      plannedAdditionalCardsDays: 7,
    })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'reduceRecurringLoad',
    )
  })

  it('recommends extending the date when the target is the only unrealistic part', () => {
    const plannerInputs = inputs({ overdueBacklog: 3000, targetDate: '2026-07-17' })
    const result = withResult(plannerInputs)
    expect(result.current.target.feasibility).toBe('unrealistic')
    expect(selectRecommendation(plannerInputs, result)).toBe('extendTargetDate')
  })

  it('identifies substantial hard-card overhead', () => {
    const plannerInputs = inputs({
      typicalDailyReviews: 80,
      newCardsPerDay: 0,
      hardCardReviewsPerDay: 40,
      extraSecondsPerHardReview: 7,
    })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'hardCardOverhead',
    )
  })

  it('prioritizes review time for the long-sentence-card persona', () => {
    const plannerInputs = inputs({
      overdueBacklog: 500,
      typicalDailyReviews: 150,
      dailyMinutes: 45,
      averageSecondsPerReview: 25,
      newCardsPerDay: 10,
    })
    const result = withResult(plannerInputs)
    expect(result.current.direction).toBe('growing')
    expect(selectRecommendation(plannerInputs, result)).toBe('longReviewTime')
  })

  it('recommends holding a pace that is shrinking backlog', () => {
    const plannerInputs = inputs()
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'currentShrinking',
    )
  })

  it('identifies long average review time with a deterministic threshold', () => {
    const plannerInputs = inputs({
      typicalDailyReviews: 100,
      dailyMinutes: 60,
      averageSecondsPerReview: 25,
      newCardsPerDay: 0,
    })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'longReviewTime',
    )
  })

  it('reduces recurring load for a flat plan with no room to clear backlog', () => {
    const plannerInputs = inputs({
      overdueBacklog: 100,
      typicalDailyReviews: 300,
      averageSecondsPerReview: 9,
      newCardsPerDay: 0,
    })
    expect(selectRecommendation(plannerInputs, withResult(plannerInputs))).toBe(
      'reduceRecurringLoad',
    )
  })

  it('planned-card risk takes priority over later workload-detail rules', () => {
    const plannerInputs = inputs({ plannedAdditionalCards: 800, plannedAdditionalCardsDays: 1 })
    const result = withResult(plannerInputs, (value) => ({
      ...value,
      current: {
        ...value.current,
        target: { ...value.current.target, feasibility: 'unrealistic' },
      },
    }))
    expect(selectRecommendation(plannerInputs, result)).toBe('plannedCardsGrow')
  })
})

describe('localized recommendation copy', () => {
  const keys: RecommendationKey[] = [
    'plannedCardsGrow',
    'pauseNewCards',
    'targetUnrealistic',
    'hardCardOverhead',
    'currentShrinking',
    'fallback',
  ]

  it.each(keys)('%s returns complete English and Japanese text', (key) => {
    const english = getRecommendationText(key, 'en')
    const japanese = getRecommendationText(key, 'ja')
    expect(english.trim()).not.toBe('')
    expect(japanese.trim()).not.toBe('')
    expect(japanese).not.toBe(english)
  })

  it('returns the selected key together with localized text', () => {
    const plannerInputs = inputs()
    const result = withResult(plannerInputs)
    expect(getRecommendation(plannerInputs, result, 'ja')).toEqual({
      key: 'currentShrinking',
      text: getRecommendationText('currentShrinking', 'ja'),
    })
  })
})
