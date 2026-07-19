import type { PlannerInputs } from '../types/planner'

export const DEMO_IDS = ['moderate', 'extreme', 'growing', 'planned'] as const
export type DemoId = (typeof DEMO_IDS)[number]

export function getDemoInputs(id: DemoId, defaults: PlannerInputs): PlannerInputs {
  const base: PlannerInputs = {
    ...defaults,
    dueToday: 0,
    schedulerQueueNow: 0,
    hardCardCount: 0,
    hardCardReviewsPerDay: 0,
    extraSecondsPerHardReview: 7,
    newCardReviewEquivalent: 1.5,
    plannedAdditionalCards: 0,
    plannedAdditionalCardsDays: 7,
    potentiallyTriagedCards: 0,
    daysOff: [],
  }
  switch (id) {
    case 'moderate':
      return { ...base, overdueBacklog: 1200, typicalDailyReviews: 180, dailyMinutes: 45, averageSecondsPerReview: 8, newCardsPerDay: 20 }
    case 'extreme':
      return { ...base, overdueBacklog: 22_000, typicalDailyReviews: 600, dailyMinutes: 120, averageSecondsPerReview: 10, newCardsPerDay: 0, hardCardCount: 2500, hardCardReviewsPerDay: 100 }
    case 'growing':
      return { ...base, overdueBacklog: 3000, typicalDailyReviews: 300, dailyMinutes: 35, averageSecondsPerReview: 9, newCardsPerDay: 50 }
    case 'planned':
      return { ...base, overdueBacklog: 600, typicalDailyReviews: 180, dailyMinutes: 45, averageSecondsPerReview: 8, newCardsPerDay: 10, plannedAdditionalCards: 800, plannedAdditionalCardsDays: 7 }
  }
}
