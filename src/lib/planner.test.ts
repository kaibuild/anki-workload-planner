import { describe, expect, it } from 'vitest'
import {
  calculatePlanner,
  getDefaultPlannerInputs,
  MAX_PLANNER_INPUT,
  validatePlannerInputs,
} from './planner'

const TODAY = new Date(2026, 6, 16)

function input(overrides = {}) {
  return { ...getDefaultPlannerInputs(TODAY), targetDate: '2026-07-30', ...overrides }
}

describe('workload planner', () => {
  it('calculates basic daily capacity and backlog reduction', () => {
    const result = calculatePlanner(
      input({ typicalDailyReviews: 100, newCardsPerDay: 0, dailyMinutes: 30, averageSecondsPerReview: 10 }),
      TODAY,
    )
    expect(result.current.dailyAvailableSeconds).toBe(1800)
    expect(result.current.recurringDailySeconds).toBe(1000)
    expect(result.current.backlogReductionCardsPerDay).toBe(80)
  })

  it('marks backlog shrinking when capacity exceeds recurring demand', () => {
    expect(calculatePlanner(input({ newCardsPerDay: 0 }), TODAY).current.direction).toBe('shrinking')
  })

  it('marks backlog growing when recurring demand exceeds capacity', () => {
    const result = calculatePlanner(input({ typicalDailyReviews: 500, dailyMinutes: 20 }), TODAY)
    expect(result.current.direction).toBe('growing')
    expect(result.current.dailyBacklogDelta).toBeGreaterThan(0)
  })

  it('pausing new cards improves backlog reduction', () => {
    const result = calculatePlanner(input({ newCardsPerDay: 50 }), TODAY)
    expect(result.pauseNewCards.backlogReductionCardsPerDay).toBeGreaterThan(
      result.current.backlogReductionCardsPerDay,
    )
  })

  it('keeps current backlog genuine and calculates reduced scope as a separate scenario', () => {
    const result = calculatePlanner(
      input({ overdueBacklog: 1000, potentiallyTriagedCards: 300 }),
      TODAY,
    )
    expect(result.current.activeBacklog).toBe(1000)
    expect(result.fullScope.activeBacklog).toBe(1000)
    expect(result.reducedScope.activeBacklog).toBe(700)
  })

  it.each([
    [{ overdueBacklog: 0, typicalDailyReviews: 120, newCardsPerDay: 0, dailyMinutes: 60, averageSecondsPerReview: 10, targetDate: '2026-07-16' }, 'comfortable'],
    [{ overdueBacklog: 0, typicalDailyReviews: 270, newCardsPerDay: 0, dailyMinutes: 60, averageSecondsPerReview: 10, targetDate: '2026-07-16' }, 'tight'],
    [{ overdueBacklog: 0, typicalDailyReviews: 420, newCardsPerDay: 0, dailyMinutes: 60, averageSecondsPerReview: 10, targetDate: '2026-07-16' }, 'unrealistic'],
  ])('calculates target feasibility %s', (overrides, expected) => {
    expect(calculatePlanner(input(overrides), TODAY).current.target.feasibility).toBe(expected)
  })

  it('excludes selected days off using local calendar dates', () => {
    const result = calculatePlanner(
      input({ targetDate: '2026-07-19', daysOff: [4, 5] }),
      TODAY,
    )
    expect(result.current.target.workingDaysUntilTarget).toBe(2)
  })

  it('rejects a past target date', () => {
    expect(validatePlannerInputs(input({ targetDate: '2026-07-15' }), TODAY)).toContainEqual({
      code: 'pastTargetDate',
      field: 'targetDate',
    })
  })

  it('rejects zero average review time', () => {
    expect(validatePlannerInputs(input({ averageSecondsPerReview: 0 }), TODAY)).toContainEqual({
      code: 'zeroReviewTime',
      field: 'averageSecondsPerReview',
    })
  })

  it('adds hard-card overhead to recurring workload', () => {
    const baseline = calculatePlanner(input({ hardCardReviewsPerDay: 0 }), TODAY)
    const withHard = calculatePlanner(
      input({ hardCardReviewsPerDay: 100, extraSecondsPerHardReview: 7 }),
      TODAY,
    )
    expect(withHard.current.recurringDailySeconds - baseline.current.recurringDailySeconds).toBe(700)
  })

  it('handles extreme values without overflow', () => {
    const result = calculatePlanner(
      input({ overdueBacklog: 22_000, hardCardCount: 2500, hardCardReviewsPerDay: 100, typicalDailyReviews: 600 }),
      TODAY,
    )
    expect(Number.isFinite(result.current.recurringDailySeconds)).toBe(true)
    expect(result.current.activeBacklog).toBe(22_000)
  })

  it('does not let scheduler queue or due today alter genuine backlog', () => {
    const baseline = calculatePlanner(input({ overdueBacklog: 1200, dueToday: 0, schedulerQueueNow: 0 }), TODAY)
    const contextual = calculatePlanner(input({ overdueBacklog: 1200, dueToday: 999_999, schedulerQueueNow: 888_888 }), TODAY)
    expect(contextual.current.activeBacklog).toBe(baseline.current.activeBacklog)
    expect(contextual.current.recurringDailySeconds).toBe(baseline.current.recurringDailySeconds)
  })

  it('planned cards increase workload and spread with ceil', () => {
    const result = calculatePlanner(
      input({ plannedAdditionalCards: 800, plannedAdditionalCardsDays: 7 }),
      TODAY,
    )
    expect(result.plannedCards.plannedAdditionalCardsPerDay).toBe(115)
    expect(result.plannedCards.metrics.recurringDailySeconds).toBeGreaterThan(
      result.current.recurringDailySeconds,
    )
  })

  it('handles values up to one million cards', () => {
    const result = calculatePlanner(input({ overdueBacklog: 1_000_000 }), TODAY)
    expect(result.current.activeBacklog).toBe(1_000_000)
    expect(result.current.onePassDays === null || Number.isSafeInteger(result.current.onePassDays)).toBe(true)
  })

  it('uses spare seconds for one-pass duration even when capacity is below one whole card per day', () => {
    const result = calculatePlanner(
      input({
        overdueBacklog: 10,
        typicalDailyReviews: 7,
        dailyMinutes: 1,
        averageSecondsPerReview: 8,
        newCardsPerDay: 0,
        hardCardReviewsPerDay: 1,
        extraSecondsPerHardReview: 3,
      }),
      TODAY,
    )
    expect(result.current.backlogReductionSecondsPerDay).toBe(1)
    expect(result.current.backlogReductionCardsPerDay).toBe(0.125)
    expect(result.current.onePassDays).toBe(80)
  })

  it('validates integers, maximums, triage scope, and selecting every day off', () => {
    const errors = validatePlannerInputs(
      input({
        overdueBacklog: 10.5,
        dueToday: MAX_PLANNER_INPUT + 1,
        potentiallyTriagedCards: 11,
        daysOff: [0, 1, 2, 3, 4, 5, 6],
      }),
      TODAY,
    )
    expect(errors).toContainEqual({ code: 'nonInteger', field: 'overdueBacklog' })
    expect(errors).toContainEqual({ code: 'aboveMaximum', field: 'dueToday' })
    expect(errors).toContainEqual({
      code: 'triageExceedsBacklog',
      field: 'potentiallyTriagedCards',
    })
    expect(errors).toContainEqual({ code: 'allDaysOff', field: 'daysOff' })
  })

  it('accepts exactly one million cards', () => {
    expect(
      validatePlannerInputs(input({ overdueBacklog: MAX_PLANNER_INPUT }), TODAY),
    ).not.toContainEqual({ code: 'aboveMaximum', field: 'overdueBacklog' })
  })

  it('allows fractional time estimates while keeping card and day counts integral', () => {
    const errors = validatePlannerInputs(
      input({
        dailyMinutes: 45.5,
        averageSecondsPerReview: 8.5,
        extraSecondsPerHardReview: 7.5,
      }),
      TODAY,
    )
    expect(errors.filter((error) => error.code === 'nonInteger')).toEqual([])
  })

  it('never returns NaN or Infinity when every numeric input is at the maximum', () => {
    const result = calculatePlanner(
      input({
        overdueBacklog: MAX_PLANNER_INPUT,
        typicalDailyReviews: MAX_PLANNER_INPUT,
        dueToday: MAX_PLANNER_INPUT,
        schedulerQueueNow: MAX_PLANNER_INPUT,
        dailyMinutes: MAX_PLANNER_INPUT,
        averageSecondsPerReview: MAX_PLANNER_INPUT,
        newCardsPerDay: MAX_PLANNER_INPUT,
        newCardReviewEquivalent: MAX_PLANNER_INPUT,
        hardCardCount: MAX_PLANNER_INPUT,
        hardCardReviewsPerDay: MAX_PLANNER_INPUT,
        extraSecondsPerHardReview: MAX_PLANNER_INPUT,
        plannedAdditionalCards: MAX_PLANNER_INPUT,
        plannedAdditionalCardsDays: MAX_PLANNER_INPUT,
        potentiallyTriagedCards: MAX_PLANNER_INPUT,
      }),
      TODAY,
    )
    assertAllNumbersFinite(result)
  })

  it('sanitizes invalid extreme numbers instead of leaking NaN or Infinity', () => {
    const result = calculatePlanner(
      input({
        overdueBacklog: Number.POSITIVE_INFINITY,
        typicalDailyReviews: Number.MAX_VALUE,
        dailyMinutes: Number.NaN,
        averageSecondsPerReview: Number.MIN_VALUE,
        plannedAdditionalCards: Number.MAX_VALUE,
        plannedAdditionalCardsDays: Number.MIN_VALUE,
      }),
      TODAY,
    )
    assertAllNumbersFinite(result)
  })
})

function assertAllNumbersFinite(value: unknown): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value)).toBe(true)
    return
  }
  if (Array.isArray(value)) {
    value.forEach(assertAllNumbersFinite)
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(assertAllNumbersFinite)
  }
}
