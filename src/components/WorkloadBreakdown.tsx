import type { PlanMetrics } from '../types/planner'

export type BreakdownLabels = {
  heading: string
  description: string
  normal: string
  normalNote: string
  newCards: string
  newCardsNote: string
  hardCards: string
  hardCardsNote: string
  backlogTime: string
  backlogTimePositive: string
  backlogTimeNegative: string
  minutesPerDay: string
}

export function WorkloadBreakdown({ metrics, labels, locale }: { metrics: PlanMetrics; labels: BreakdownLabels; locale: 'en' | 'ja' }) {
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const rows = [
    { label: labels.normal, value: metrics.normalRecurringReviewSeconds / 60, seconds: metrics.normalRecurringReviewSeconds, note: labels.normalNote, color: 'bg-slate-700', dot: 'bg-slate-700' },
    { label: labels.newCards, value: metrics.newCardReviewSecondsPerDay / 60, seconds: metrics.newCardReviewSecondsPerDay, note: labels.newCardsNote, color: 'bg-slate-400', dot: 'bg-slate-400' },
    { label: labels.hardCards, value: metrics.hardCardExtraSecondsPerDay / 60, seconds: metrics.hardCardExtraSecondsPerDay, note: labels.hardCardsNote, color: 'bg-amber-400', dot: 'bg-amber-400' },
    {
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
          {rows.map((row) => (
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
          <div className="min-w-0 border-t border-slate-100 pt-3" key={row.label}>
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} aria-hidden="true" />
                <span>{row.label}</span>
              </p>
              <p className={`shrink-0 text-sm font-bold tabular-nums ${row.value < 0 ? 'text-rose-700' : 'text-slate-950'}`}>
                {row.value > 0 && row === rows[3] ? '+' : ''}{format.format(row.value)} {labels.minutesPerDay}
              </p>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
