import { addCalendarDays, countWorkingDays, formatLocalDate, parseLocalDate } from './dates'
import type {
  BacklogDirection,
  FeasibilityStatus,
  PlanMetrics,
  PlannerInputs,
  PlannerResult,
  TargetPlan,
  ValidationError,
} from '../types/planner'

const NUMBER_FIELDS: Array<keyof PlannerInputs> = [
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

const INTEGER_FIELDS = new Set<keyof PlannerInputs>([
  'overdueBacklog',
  'typicalDailyReviews',
  'dueToday',
  'schedulerQueueNow',
  'newCardsPerDay',
  'hardCardCount',
  'hardCardReviewsPerDay',
  'plannedAdditionalCards',
  'plannedAdditionalCardsDays',
  'potentiallyTriagedCards',
])

/** The MVP intentionally supports card collections up to one million. */
export const MAX_PLANNER_INPUT = 1_000_000
const MAX_DERIVED_NUMBER = Number.MAX_SAFE_INTEGER
const FIELD_MAXIMUMS: Partial<Record<keyof PlannerInputs, number>> = {
  dailyMinutes: 1_440,
  averageSecondsPerReview: 3_600,
  extraSecondsPerHardReview: 3_600,
  newCardReviewEquivalent: 100,
  plannedAdditionalCardsDays: 36_500,
}

export function getDefaultPlannerInputs(today = new Date()): PlannerInputs {
  return {
    overdueBacklog: 0,
    typicalDailyReviews: 0,
    dueToday: 0,
    schedulerQueueNow: 0,
    dailyMinutes: 45,
    averageSecondsPerReview: 8,
    newCardsPerDay: 0,
    newCardReviewEquivalent: 1.5,
    hardCardCount: 0,
    hardCardReviewsPerDay: 0,
    extraSecondsPerHardReview: 7,
    plannedAdditionalCards: 0,
    plannedAdditionalCardsDays: 7,
    potentiallyTriagedCards: 0,
    targetDate: formatLocalDate(addCalendarDays(today, 14)),
    daysOff: [],
  }
}

export function validatePlannerInputs(
  inputs: PlannerInputs,
  today = new Date(),
): ValidationError[] {
  const errors: ValidationError[] = []
  for (const field of NUMBER_FIELDS) {
    const value = inputs[field]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push({ code: 'invalidNumber', field })
    } else if (value < 0) {
      errors.push({ code: 'negativeNumber', field })
    } else {
      if (value > (FIELD_MAXIMUMS[field] ?? MAX_PLANNER_INPUT)) {
        errors.push({ code: 'aboveMaximum', field })
      }
      if (INTEGER_FIELDS.has(field) && !Number.isInteger(value)) {
        errors.push({ code: 'nonInteger', field })
      }
    }
  }
  if (Number.isFinite(inputs.averageSecondsPerReview) && inputs.averageSecondsPerReview === 0) {
    errors.push({ code: 'zeroReviewTime', field: 'averageSecondsPerReview' })
  }
  const target = parseLocalDate(inputs.targetDate)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!target) {
    errors.push({ code: 'invalidTargetDate', field: 'targetDate' })
  } else if (target < start) {
    errors.push({ code: 'pastTargetDate', field: 'targetDate' })
  }
  if (inputs.plannedAdditionalCards > 0 && inputs.plannedAdditionalCardsDays <= 0) {
    errors.push({ code: 'plannedDaysRequired', field: 'plannedAdditionalCardsDays' })
  }
  if (
    Number.isFinite(inputs.potentiallyTriagedCards) &&
    Number.isFinite(inputs.overdueBacklog) &&
    inputs.potentiallyTriagedCards >= 0 &&
    inputs.overdueBacklog >= 0 &&
    inputs.potentiallyTriagedCards > inputs.overdueBacklog
  ) {
    errors.push({ code: 'triageExceedsBacklog', field: 'potentiallyTriagedCards' })
  }
  const validDaysOff = new Set(
    inputs.daysOff.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  )
  if (validDaysOff.size === 7) {
    errors.push({ code: 'allDaysOff', field: 'daysOff' })
  }
  return errors
}

function safe(value: number, maximum = MAX_PLANNER_INPUT): number {
  return Number.isFinite(value) && value >= 0 ? Math.min(value, maximum) : 0
}

function safeDivide(numerator: number, denominator: number): number {
  if (numerator <= 0 || denominator <= 0) return 0
  const result = numerator / denominator
  return Number.isFinite(result) ? Math.min(result, MAX_DERIVED_NUMBER) : MAX_DERIVED_NUMBER
}

function safeCeil(value: number): number {
  if (!Number.isFinite(value)) return MAX_DERIVED_NUMBER
  return Math.min(Math.ceil(Math.max(0, value)), MAX_DERIVED_NUMBER)
}

export function calculatePlanMetrics(
  inputs: PlannerInputs,
  today = new Date(),
  overrides: { newCardsPerDay?: number; potentiallyTriagedCards?: number } = {},
): PlanMetrics {
  const averageSeconds = safe(inputs.averageSecondsPerReview, FIELD_MAXIMUMS.averageSecondsPerReview)
  const triagedCards =
    overrides.potentiallyTriagedCards === undefined
      ? 0
      : safe(overrides.potentiallyTriagedCards)
  const activeBacklog = Math.max(
    0,
    safe(inputs.overdueBacklog) - triagedCards,
  )
  const dailyAvailableSeconds = safe(inputs.dailyMinutes, FIELD_MAXIMUMS.dailyMinutes) * 60
  const normalRecurringReviewSeconds = safe(inputs.typicalDailyReviews) * averageSeconds
  const newCardsPerDay =
    overrides.newCardsPerDay === undefined
      ? safe(inputs.newCardsPerDay)
      : safe(overrides.newCardsPerDay, MAX_PLANNER_INPUT * 2)
  const newCardReviewEquivalentPerDay = newCardsPerDay * safe(inputs.newCardReviewEquivalent, FIELD_MAXIMUMS.newCardReviewEquivalent)
  const newCardReviewSecondsPerDay = newCardReviewEquivalentPerDay * averageSeconds
  const hardCardExtraSecondsPerDay =
    safe(inputs.hardCardReviewsPerDay) * safe(inputs.extraSecondsPerHardReview, FIELD_MAXIMUMS.extraSecondsPerHardReview)
  const recurringDailySeconds =
    normalRecurringReviewSeconds + newCardReviewSecondsPerDay + hardCardExtraSecondsPerDay
  const backlogReductionSecondsPerDay = dailyAvailableSeconds - recurringDailySeconds
  const backlogReductionCardsPerDay =
    backlogReductionSecondsPerDay > 0 && averageSeconds > 0
      ? safeDivide(backlogReductionSecondsPerDay, averageSeconds)
      : 0
  const direction = getDirection(recurringDailySeconds, dailyAvailableSeconds)
  const dailyBacklogDelta =
    averageSeconds > 0
      ? Math.sign(recurringDailySeconds - dailyAvailableSeconds) *
        safeDivide(Math.abs(recurringDailySeconds - dailyAvailableSeconds), averageSeconds)
      : 0
  const onePassDays =
    activeBacklog === 0
      ? 0
      : backlogReductionSecondsPerDay > 0 && averageSeconds > 0
        ? safeCeil(safeDivide(activeBacklog * averageSeconds, backlogReductionSecondsPerDay))
        : null
  const target = calculateTargetPlan(
    activeBacklog,
    recurringDailySeconds,
    averageSeconds,
    safe(inputs.dailyMinutes, FIELD_MAXIMUMS.dailyMinutes),
    inputs.targetDate,
    inputs.daysOff,
    today,
  )

  return {
    activeBacklog,
    dailyAvailableSeconds,
    normalRecurringReviewSeconds,
    newCardReviewEquivalentPerDay,
    newCardReviewSecondsPerDay,
    hardCardExtraSecondsPerDay,
    recurringDailySeconds,
    backlogReductionSecondsPerDay,
    backlogReductionCardsPerDay,
    direction,
    dailyBacklogDelta,
    onePassDays,
    target,
  }
}

export function calculatePlanner(inputs: PlannerInputs, today = new Date()): PlannerResult {
  const current = calculatePlanMetrics(inputs, today)
  const pauseNewCards = calculatePlanMetrics(inputs, today, { newCardsPerDay: 0 })
  const reducedScope = calculatePlanMetrics(inputs, today, {
    potentiallyTriagedCards: inputs.potentiallyTriagedCards,
  })
  const fullScope = current
  const plannedCards = safe(inputs.plannedAdditionalCards)
  const plannedDays = safe(inputs.plannedAdditionalCardsDays, FIELD_MAXIMUMS.plannedAdditionalCardsDays)
  const plannedAdditionalCardsPerDay =
    plannedCards > 0 && plannedDays > 0
      ? safeCeil(safeDivide(plannedCards, plannedDays))
      : 0
  const plannedTotalNewCardsPerDay = Math.min(
    safe(inputs.newCardsPerDay) + plannedAdditionalCardsPerDay,
    MAX_PLANNER_INPUT * 2,
  )
  const plannedMetrics = calculatePlanMetrics(inputs, today, {
    newCardsPerDay: plannedTotalNewCardsPerDay,
  })

  return {
    current,
    pauseNewCards,
    fullScope,
    reducedScope,
    plannedCards: {
      plannedAdditionalCardsPerDay,
      plannedTotalNewCardsPerDay,
      recurringWorkloadChangeSeconds:
        plannedMetrics.recurringDailySeconds - current.recurringDailySeconds,
      metrics: plannedMetrics,
    },
    validationErrors: validatePlannerInputs(inputs, today),
  }
}

function calculateTargetPlan(
  activeBacklog: number,
  recurringDailySeconds: number,
  averageSeconds: number,
  dailyMinutes: number,
  targetDate: string,
  daysOff: readonly number[],
  today: Date,
): TargetPlan {
  const workingDays = countWorkingDays(today, targetDate, daysOff)
  if (workingDays === null || (workingDays === 0 && activeBacklog > 0) || averageSeconds <= 0) {
    return unavailableTarget(workingDays ?? 0)
  }
  const requiredBacklogReductionPerDay =
    workingDays === 0 ? 0 : safeCeil(safeDivide(activeBacklog, workingDays))
  const requiredDailySeconds =
    recurringDailySeconds + requiredBacklogReductionPerDay * averageSeconds
  const requiredMinutesPerDay = requiredDailySeconds / 60
  return {
    workingDaysUntilTarget: workingDays,
    requiredBacklogReductionPerDay,
    requiredTotalReviewsPerDay:
      averageSeconds > 0
        ? safeDivide(recurringDailySeconds, averageSeconds) + requiredBacklogReductionPerDay
        : null,
    requiredDailySeconds,
    requiredMinutesPerDay,
    feasibility: getFeasibility(requiredMinutesPerDay, dailyMinutes),
  }
}

function unavailableTarget(workingDays: number): TargetPlan {
  return {
    workingDaysUntilTarget: workingDays,
    requiredBacklogReductionPerDay: null,
    requiredTotalReviewsPerDay: null,
    requiredDailySeconds: null,
    requiredMinutesPerDay: null,
    feasibility: 'unrealistic',
  }
}

export function getFeasibility(requiredMinutes: number, dailyMinutes: number): FeasibilityStatus {
  if (!Number.isFinite(requiredMinutes) || requiredMinutes > dailyMinutes) return 'unrealistic'
  if (requiredMinutes <= dailyMinutes * 0.7) return 'comfortable'
  return 'tight'
}

function getDirection(recurringSeconds: number, availableSeconds: number): BacklogDirection {
  if (recurringSeconds < availableSeconds) return 'shrinking'
  if (recurringSeconds > availableSeconds) return 'growing'
  return 'flat'
}
