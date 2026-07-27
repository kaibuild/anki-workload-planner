import { formatUnitCount, interpolate, type PluralForms } from '../i18n'
import type { PlanMetrics } from '../types/planner'

export type BacklogMetricLabels = {
  estimateNote: string
  backlogReductionCapacity: string
  estimatedBacklogGrowth: string
  estimatedBacklogChange: string
  reductionCapacityValue: string
  growthValue: string
  flatValue: string
  fitsWithinOneDay: string
  noBacklog: string
  card: PluralForms
  cardPerDay: PluralForms
  studyDay: PluralForms
}

export type BacklogMetricPresentation = {
  label: string
  value: string
  note?: string
}

export type OnePassExplanationLabels = Pick<
  BacklogMetricLabels,
  'fitsWithinOneDay' | 'card' | 'studyDay'
>

export function getOnePassExplanation(
  metrics: PlanMetrics,
  locale: 'en' | 'ja',
  labels: OnePassExplanationLabels,
): string | undefined {
  const fitsWithinOneDay =
    metrics.activeBacklog > 0 &&
    metrics.onePassDays === 1 &&
    metrics.actualNextStudyDayReduction === metrics.activeBacklog
  if (!fitsWithinOneDay) return undefined

  return interpolate(labels.fitsWithinOneDay, {
    backlog: formatUnitCount(metrics.activeBacklog, locale, labels.card),
    studyDays: formatUnitCount(1, locale, labels.studyDay),
  })
}

export function getBacklogMetricPresentation(
  metrics: PlanMetrics,
  locale: 'en' | 'ja',
  labels: BacklogMetricLabels,
): BacklogMetricPresentation {
  if (metrics.activeBacklog === 0) {
    return {
      label: labels.estimatedBacklogChange,
      value: labels.noBacklog,
    }
  }

  if (metrics.direction === 'shrinking') {
    const cardsPerDay = formatUnitCount(
      metrics.backlogReductionCardsPerDay,
      locale,
      labels.cardPerDay,
      1,
    )
    const cards = formatUnitCount(
      metrics.backlogReductionCardsPerDay,
      locale,
      labels.card,
      1,
    )
    const onePassExplanation = getOnePassExplanation(metrics, locale, labels)
    return {
      label: labels.backlogReductionCapacity,
      value: interpolate(labels.reductionCapacityValue, {
        cardsPerDay,
        cards,
      }),
      note: onePassExplanation ?? labels.estimateNote,
    }
  }

  if (metrics.direction === 'growing') {
    const growth = Math.max(0, metrics.dailyBacklogDelta)
    return {
      label: labels.estimatedBacklogGrowth,
      value: interpolate(labels.growthValue, {
        cardsPerDay: formatUnitCount(growth, locale, labels.cardPerDay, 1),
        cards: formatUnitCount(growth, locale, labels.card, 1),
      }),
      note: labels.estimateNote,
    }
  }

  return {
    label: labels.estimatedBacklogChange,
    value: interpolate(labels.flatValue, {
      cardsPerDay: formatUnitCount(0, locale, labels.cardPerDay, 1),
      cards: formatUnitCount(0, locale, labels.card, 1),
    }),
    note: labels.estimateNote,
  }
}
