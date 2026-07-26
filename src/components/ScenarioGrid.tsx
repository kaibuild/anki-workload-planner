import { ScenarioCard, type ScenarioTone } from './ScenarioCard'
import { formatUnitCount, type PluralForms } from '../i18n'
import { getBacklogMetricPresentation } from '../lib/backlogPresentation'
import type { BacklogDirection, FeasibilityStatus, PlannerInputs, PlannerResult } from '../types/planner'

export type ScenarioLabels = {
  heading: string
  description: string
  estimateNote: string
  current: {
    title: string
    description: string
    backlogReductionCapacity: string
    estimatedBacklogGrowth: string
    estimatedBacklogChange: string
    reductionCapacityValue: string
    growthValue: string
    flatValue: string
    fitsWithinOneDay: string
  }
  pause: { title: string; description: string; freed: string; difference: string }
  target: { title: string; description: string; workingDays: string; requiredBacklog: string; totalReviews: string; requiredMinutes: string; adjustmentOptions: string }
  reduce: { title: string; description: string; before: string; after: string; onePassChange: string; scopeOnly: string }
  add: { title: string; description: string; addedPerDay: string; workloadChange: string; resultingDirection: string; targetFeasibility: string; rough: string }
  recurring: string
  backlogTime: string
  direction: string
  onePass: string
  targetFeasibility: string
  directions: Record<BacklogDirection, string>
  feasibility: Record<FeasibilityStatus, string>
  minutesPerDay: string
  card: PluralForms
  cardPerDay: PluralForms
  reviewPerDay: PluralForms
  studyDay: PluralForms
  workingDay: PluralForms
  unavailable: string
  noChange: string
  noBacklog: string
}

export function ScenarioGrid({ inputs, result, labels, locale }: { inputs: PlannerInputs; result: PlannerResult; labels: ScenarioLabels; locale: 'en' | 'ja' }) {
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const minutes = (seconds: number) => `${number.format(seconds / 60)} ${labels.minutesPerDay}`
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const cardsPerDay = (value: number) => formatUnitCount(value, locale, labels.cardPerDay, 1)
  const wholeCardsPerDay = (value: number) => formatUnitCount(value, locale, labels.cardPerDay)
  const reviewsPerDay = (value: number) => formatUnitCount(value, locale, labels.reviewPerDay, 1)
  const days = (value: number | null) =>
    value === null ? labels.unavailable : formatUnitCount(value, locale, labels.studyDay)
  const current = result.current
  const pause = result.pauseNewCards
  const target = current.target
  const scopeDaysChange = formatDayDifference(
    current.onePassDays,
    result.reducedScope.onePassDays,
    locale,
    labels,
  )
  const currentBacklogMetric = getBacklogMetricPresentation(current, locale, {
    estimateNote: labels.estimateNote,
    ...labels.current,
    noBacklog: labels.noBacklog,
    card: labels.card,
    cardPerDay: labels.cardPerDay,
    studyDay: labels.studyDay,
  })
  const cardsTone = (direction: BacklogDirection): ScenarioTone => direction === 'shrinking' ? 'good' : direction === 'flat' ? 'warning' : 'danger'

  const scenarios = [
    {
      title: labels.current.title,
      description: labels.current.description,
      tone: cardsTone(current.direction),
      rows: [
        { label: labels.recurring, value: minutes(current.recurringDailySeconds) },
        { label: labels.backlogTime, value: minutes(current.backlogReductionSecondsPerDay) },
        {
          label: currentBacklogMetric.label,
          value: currentBacklogMetric.value,
          note: currentBacklogMetric.note,
        },
        { label: labels.direction, value: current.activeBacklog === 0 ? labels.noBacklog : labels.directions[current.direction] },
        { label: labels.onePass, value: current.activeBacklog === 0 ? labels.noBacklog : days(current.onePassDays) },
        { label: labels.targetFeasibility, value: labels.feasibility[target.feasibility] },
      ],
    },
    {
      title: labels.pause.title,
      description: labels.pause.description,
      tone: cardsTone(pause.direction),
      rows: [
        { label: labels.pause.difference, value: cardsPerDay(pause.backlogReductionCardsPerDay - current.backlogReductionCardsPerDay) },
        { label: labels.onePass, value: current.activeBacklog === 0 ? labels.noBacklog : days(pause.onePassDays) },
        { label: labels.pause.freed, value: minutes(current.newCardReviewSecondsPerDay) },
        { label: labels.direction, value: current.activeBacklog === 0 ? labels.noBacklog : labels.directions[pause.direction] },
      ],
    },
    {
      title: labels.target.title,
      description: labels.target.description,
      tone: feasibilityTone(target.feasibility),
      rows: [
        { label: labels.target.workingDays, value: formatUnitCount(target.workingDaysUntilTarget, locale, labels.workingDay) },
        { label: labels.target.requiredBacklog, value: target.requiredBacklogReductionPerDay === null ? labels.unavailable : cardsPerDay(target.requiredBacklogReductionPerDay) },
        { label: labels.target.totalReviews, value: target.requiredTotalReviewsPerDay === null ? labels.unavailable : reviewsPerDay(target.requiredTotalReviewsPerDay) },
        { label: labels.target.requiredMinutes, value: target.requiredDailySeconds === null ? labels.unavailable : minutes(target.requiredDailySeconds) },
        { label: labels.targetFeasibility, value: labels.feasibility[target.feasibility], note: target.feasibility === 'unrealistic' ? labels.target.adjustmentOptions : undefined },
      ],
    },
    {
      title: labels.reduce.title,
      description: labels.reduce.description,
      tone: inputs.potentiallyTriagedCards > 0 ? 'good' as const : 'neutral' as const,
      rows: [
        { label: labels.reduce.before, value: whole.format(current.activeBacklog) },
        { label: labels.reduce.after, value: whole.format(result.reducedScope.activeBacklog) },
        { label: labels.reduce.onePassChange, value: scopeDaysChange, note: labels.reduce.scopeOnly },
      ],
    },
    {
      title: labels.add.title,
      description: labels.add.description,
      tone: result.plannedCards.plannedAdditionalCardsPerDay === 0 ? 'neutral' as const : cardsTone(result.plannedCards.metrics.direction),
      rows: [
        { label: labels.add.addedPerDay, value: wholeCardsPerDay(result.plannedCards.plannedAdditionalCardsPerDay) },
        { label: labels.add.workloadChange, value: minutes(result.plannedCards.recurringWorkloadChangeSeconds), note: labels.add.rough },
        { label: labels.add.resultingDirection, value: labels.directions[result.plannedCards.metrics.direction] },
        { label: labels.add.targetFeasibility, value: labels.feasibility[result.plannedCards.metrics.target.feasibility] },
      ],
    },
  ]

  return (
    <section aria-labelledby="scenarios-heading">
      <h2 className="section-title" id="scenarios-heading">{labels.heading}</h2>
      <p className="section-description">{labels.description}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {scenarios.map((scenario, index) => <ScenarioCard key={scenario.title} featured={index === 0} {...scenario} />)}
      </div>
    </section>
  )
}

function feasibilityTone(status: FeasibilityStatus): ScenarioTone {
  return status === 'comfortable' ? 'good' : status === 'tight' ? 'warning' : 'danger'
}

function formatDayDifference(
  before: number | null,
  after: number | null,
  locale: 'en' | 'ja',
  labels: ScenarioLabels,
): string {
  if (before === null && after === null) return labels.noChange
  if (before === null && after !== null) {
    return formatUnitCount(after, locale, labels.studyDay)
  }
  if (before !== null && after === null) return labels.unavailable
  const difference = (after ?? 0) - (before ?? 0)
  return difference === 0
    ? labels.noChange
    : formatUnitCount(difference, locale, labels.studyDay)
}
