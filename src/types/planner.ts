export type BacklogDirection = 'growing' | 'flat' | 'shrinking'
export type FeasibilityStatus = 'comfortable' | 'tight' | 'unrealistic'

export type PlannerInputs = {
  overdueBacklog: number
  typicalDailyReviews: number
  dueToday: number
  schedulerQueueNow: number
  dailyMinutes: number
  averageSecondsPerReview: number
  newCardsPerDay: number
  newCardReviewEquivalent: number
  hardCardCount: number
  hardCardReviewsPerDay: number
  extraSecondsPerHardReview: number
  plannedAdditionalCards: number
  plannedAdditionalCardsDays: number
  potentiallyTriagedCards: number
  targetDate: string
  daysOff: number[]
}

export type TargetPlan = {
  workingDaysUntilTarget: number
  requiredBacklogReductionPerDay: number | null
  requiredTotalReviewsPerDay: number | null
  requiredDailySeconds: number | null
  requiredMinutesPerDay: number | null
  feasibility: FeasibilityStatus
}

export type PlanMetrics = {
  activeBacklog: number
  dailyAvailableSeconds: number
  normalRecurringReviewSeconds: number
  newCardReviewEquivalentPerDay: number
  newCardReviewSecondsPerDay: number
  hardCardExtraSecondsPerDay: number
  recurringDailySeconds: number
  backlogReductionSecondsPerDay: number
  backlogReductionCardsPerDay: number
  direction: BacklogDirection
  dailyBacklogDelta: number
  onePassDays: number | null
  target: TargetPlan
}

export type PlannedCardsScenario = {
  plannedAdditionalCardsPerDay: number
  plannedTotalNewCardsPerDay: number
  recurringWorkloadChangeSeconds: number
  metrics: PlanMetrics
}

export type PlannerResult = {
  current: PlanMetrics
  pauseNewCards: PlanMetrics
  /** Full current backlog. Retained for compatibility with older consumers. */
  fullScope: PlanMetrics
  /** What-if metrics after removing potentially triaged cards from the planning scope. */
  reducedScope: PlanMetrics
  plannedCards: PlannedCardsScenario
  validationErrors: ValidationError[]
}

export type ValidationErrorCode =
  | 'invalidNumber'
  | 'negativeNumber'
  | 'zeroReviewTime'
  | 'nonInteger'
  | 'aboveMaximum'
  | 'triageExceedsBacklog'
  | 'allDaysOff'
  | 'invalidTargetDate'
  | 'pastTargetDate'
  | 'plannedDaysRequired'

export type ValidationError = {
  code: ValidationErrorCode
  field: keyof PlannerInputs
}
