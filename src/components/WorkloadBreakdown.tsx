import type { HardCardImpact, PlanMetrics } from '../types/planner'

export type BreakdownLabels = {
  heading: string
  description: string
  normal: string
  normalNote: string
  newCards: string
  newCardsNote: string
  hardCards: string
  hardCardsNote: string
  hardCardsNotIncluded: string
  hardCardsContextOnly: string
  hardCardsMissingExtraSeconds: string
  recurringTotal: string
  recurringTotalNote: string
  backlogTime: string
  backlogTimePositive: string
  backlogTimeNegative: string
  hardCardImpactHeading: string
  hardCardImpactDescription: string
  hardCardAddedTime: string
  hardCardReducedCapacity: string
  hardCardOnePass: string
  hardCardOnePassUnchanged: string
  withoutHardCardOverhead: string
  minutesPerDay: string
  cardsPerDay: string
  days: string
}

type WorkloadBreakdownProps = {
  metrics: PlanMetrics
  impact: HardCardImpact
  hardCardCount: number
  hardCardReviewsPerDay: number
  labels: BreakdownLabels
  locale: 'en' | 'ja'
}

export function WorkloadBreakdown({
  metrics,
  impact,
  hardCardCount,
  hardCardReviewsPerDay,
  labels,
  locale,
}: WorkloadBreakdownProps) {
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const hardCardNote = metrics.hardCardExtraSecondsPerDay > 0
    ? labels.hardCardsNote
    : hardCardReviewsPerDay > 0
      ? labels.hardCardsMissingExtraSeconds
      : hardCardCount > 0
        ? labels.hardCardsContextOnly
        : labels.hardCardsNotIncluded
  const componentRows = [
    { kind: 'normal', label: labels.normal, value: metrics.normalRecurringReviewSeconds / 60, seconds: metrics.normalRecurringReviewSeconds, note: labels.normalNote, color: 'bg-slate-700', dot: 'bg-slate-700' },
    { kind: 'new', label: labels.newCards, value: metrics.newCardReviewSecondsPerDay / 60, seconds: metrics.newCardReviewSecondsPerDay, note: labels.newCardsNote, color: 'bg-slate-400', dot: 'bg-slate-400' },
    { kind: 'hard', label: labels.hardCards, value: metrics.hardCardExtraSecondsPerDay / 60, seconds: metrics.hardCardExtraSecondsPerDay, note: hardCardNote, color: 'bg-amber-400', dot: 'bg-amber-400' },
  ] as const
  const rows = [
    ...componentRows,
    {
      kind: 'total',
      label: labels.recurringTotal,
      value: metrics.recurringDailySeconds / 60,
      seconds: metrics.recurringDailySeconds,
      note: labels.recurringTotalNote,
      color: 'bg-transparent',
      dot: 'bg-teal-800',
    },
    {
      kind: 'backlog',
      label: labels.backlogTime,
      value: metrics.backlogReductionSecondsPerDay / 60,
      seconds: Math.max(0, metrics.backlogReductionSecondsPerDay),
      note: metrics.backlogReductionSecondsPerDay >= 0 ? labels.backlogTimePositive : labels.backlogTimeNegative,
      color: 'bg-teal-500',
      dot: metrics.backlogReductionSecondsPerDay >= 0 ? 'bg-teal-500' : 'bg-rose-500',
    },
  ]
  const displayTotal = Math.max(metrics.dailyAvailableSeconds, metrics.recurringDailySeconds, 1)
  const capacityPosition = Math.min(100, (metrics.dailyAvailableSeconds / displayTotal) * 100)

  return (
    <section className="panel" aria-labelledby="breakdown-heading">
      <h2 className="section-title" id="breakdown-heading">{labels.heading}</h2>
      <p className="section-description">{labels.description}</p>

      <div className="relative mt-6 h-4 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="flex h-full w-full">
          {[...componentRows, rows.at(-1)!].map((row) => (
            row.seconds > 0 ? (
              <div
                key={row.label}
                className={`${row.color} h-full first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${(row.seconds / displayTotal) * 100}%` }}
              />
            ) : null
          ))}
        </div>
        {metrics.recurringDailySeconds > metrics.dailyAvailableSeconds ? (
          <span className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.3)]" style={{ left: `${capacityPosition}%` }} />
        ) : null}
      </div>

      <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            className={`min-w-0 border-t pt-3 ${
              row.kind === 'total'
                ? 'rounded-lg border-teal-200 bg-teal-50/70 px-3 pb-3'
                : 'border-slate-100'
            }`}
            key={row.label}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} aria-hidden="true" />
                <span>{row.label}</span>
              </p>
              <p className={`shrink-0 text-sm font-bold tabular-nums ${row.value < 0 ? 'text-rose-700' : 'text-slate-950'}`}>
                {row.value > 0 && row.kind === 'backlog' ? '+' : ''}{decimal.format(row.value)} {labels.minutesPerDay}
              </p>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4" aria-labelledby="hard-card-impact-heading">
        <h3 className="text-sm font-semibold text-slate-950" id="hard-card-impact-heading">
          {labels.hardCardImpactHeading}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">{labels.hardCardImpactDescription}</p>
        {metrics.hardCardExtraSecondsPerDay > 0 ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <ImpactValue
              label={labels.hardCardAddedTime}
              value={`+${decimal.format(metrics.hardCardExtraSecondsPerDay / 60)} ${labels.minutesPerDay}`}
            />
            <ImpactValue
              label={labels.hardCardReducedCapacity}
              value={`${whole.format(impact.backlogCapacityReductionCardsPerDay)} ${labels.cardsPerDay}`}
            />
            {metrics.onePassDays !== null && impact.onePassDaysWithoutOverhead !== null ? (
              <ImpactValue
                label={labels.hardCardOnePass}
                value={impact.onePassDaysDifference && impact.onePassDaysDifference > 0
                  ? `${whole.format(metrics.onePassDays)} ${labels.days} (${labels.withoutHardCardOverhead}: ${whole.format(impact.onePassDaysWithoutOverhead)} ${labels.days})`
                  : `${whole.format(metrics.onePassDays)} ${labels.days} · ${labels.hardCardOnePassUnchanged}`}
              />
            ) : null}
          </dl>
        ) : (
          <p className="mt-3 rounded-lg bg-white px-3.5 py-3 text-sm font-medium leading-6 text-slate-700">
            {hardCardNote}
          </p>
        )}
      </section>
    </section>
  )
}

function ImpactValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <dt className="text-xs font-medium leading-5 text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold leading-6 text-slate-950 tabular-nums">{value}</dd>
    </div>
  )
}
