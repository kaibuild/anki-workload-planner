import { getTranslation, type Locale } from '../i18n'
import type { PlannerInputs, PlannerResult } from '../types/planner'

export const HARD_CARD_OVERHEAD_SHARE_THRESHOLD = 0.1
export const LONG_REVIEW_SECONDS_THRESHOLD = 20

export type RecommendationKey =
  | 'noBacklog'
  | 'plannedCardsGrow'
  | 'targetUnrealistic'
  | 'extendTargetDate'
  | 'pauseNewCards'
  | 'reduceRecurringLoad'
  | 'hardCardOverhead'
  | 'longReviewTime'
  | 'currentShrinking'
  | 'fallback'

export type Recommendation = {
  key: RecommendationKey
  text: string
}

/**
 * Picks exactly one first adjustment. Rules are intentionally deterministic and
 * evaluated in product-priority order; no user data leaves the browser.
 */
export function selectRecommendation(
  inputs: PlannerInputs,
  result: PlannerResult,
): RecommendationKey {
  if (result.current.activeBacklog === 0) {
    return 'noBacklog'
  }

  if (
    inputs.averageSecondsPerReview >= LONG_REVIEW_SECONDS_THRESHOLD &&
    result.current.recurringDailySeconds >= result.current.dailyAvailableSeconds
  ) {
    return 'longReviewTime'
  }

  if (result.current.direction !== 'shrinking' && inputs.newCardsPerDay > 0) {
    return 'pauseNewCards'
  }

  if (result.current.recurringDailySeconds >= result.current.dailyAvailableSeconds) {
    return 'reduceRecurringLoad'
  }

  if (
    inputs.plannedAdditionalCards > 0 &&
    result.plannedCards.plannedAdditionalCardsPerDay > 0 &&
    result.plannedCards.metrics.direction === 'growing'
  ) {
    return 'plannedCardsGrow'
  }

  if (hasSubstantialHardCardOverhead(result)) {
    return 'hardCardOverhead'
  }

  if (inputs.averageSecondsPerReview >= LONG_REVIEW_SECONDS_THRESHOLD) {
    return 'longReviewTime'
  }

  if (result.current.target.feasibility === 'unrealistic') {
    return 'extendTargetDate'
  }

  if (result.current.direction === 'shrinking') {
    return 'currentShrinking'
  }

  return 'fallback'
}

export const getRecommendationKey = selectRecommendation

export function getRecommendationText(key: RecommendationKey, locale: Locale): string {
  return getTranslation(locale).recommendations[key]
}

export function getRecommendation(
  inputs: PlannerInputs,
  result: PlannerResult,
  locale: Locale,
): Recommendation {
  const key = selectRecommendation(inputs, result)
  return { key, text: getRecommendationText(key, locale) }
}

export const buildRecommendation = getRecommendation

function hasSubstantialHardCardOverhead(result: PlannerResult): boolean {
  const { dailyAvailableSeconds, hardCardExtraSecondsPerDay } = result.current
  return (
    dailyAvailableSeconds > 0 &&
    hardCardExtraSecondsPerDay > 0 &&
    hardCardExtraSecondsPerDay / dailyAvailableSeconds >= HARD_CARD_OVERHEAD_SHARE_THRESHOLD
  )
}
