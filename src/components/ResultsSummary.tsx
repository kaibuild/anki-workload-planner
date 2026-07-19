import type { PlanMetrics } from '../types/planner'

export type SummaryLabels = {
  eyebrow: string
  heading: string
  estimateNote: string
  causeQuestion: string
  directionQuestion: string
  adjustmentQuestion: string
  onePassQuestion: string
  causeAnswer: string
  directionAnswer: string
  adjustmentAnswer: string
  onePassUnavailable: string
  onePassComplete: string
  days: string
}

export function ResultsSummary({ metrics, labels, locale, recommendation }: { metrics: PlanMetrics; labels: SummaryLabels; locale: 'en' | 'ja'; recommendation: string }) {
  const number = new Intl.NumberFormat(locale)
  const onePass = metrics.activeBacklog === 0
    ? labels.onePassComplete
    : metrics.onePassDays === null
      ? labels.onePassUnavailable
      : `${number.format(metrics.onePassDays)} ${labels.days}`
  const directionTone = metrics.direction === 'shrinking'
    ? 'border-teal-200 bg-teal-50 text-teal-950'
    : metrics.direction === 'flat'
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : 'border-rose-200 bg-rose-50 text-rose-950'

  return (
    <section className="panel overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.035)]" aria-labelledby="result-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{labels.eyebrow}</p>
          <h2 className="mt-1 section-title" id="result-heading">{labels.heading}</h2>
        </div>
        <p className="max-w-md text-xs leading-5 text-slate-500 sm:text-right">{labels.estimateNote}</p>
      </div>

      <p className="sr-only" aria-atomic="true" aria-live="polite">
        {labels.causeQuestion} {labels.causeAnswer} {labels.directionQuestion} {labels.directionAnswer}{' '}
        {labels.adjustmentQuestion} {labels.adjustmentAnswer || recommendation} {labels.onePassQuestion} {onePass}
      </p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 sm:col-span-2 sm:p-5 xl:col-span-3">
          <dt className="flex items-center gap-2 text-xs font-semibold leading-5 text-teal-800">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-700 text-white" aria-hidden="true">→</span>
            {labels.adjustmentQuestion}
          </dt>
          <dd className="mt-2 max-w-3xl text-base font-semibold leading-6 text-slate-950 sm:text-lg">{labels.adjustmentAnswer || recommendation}</dd>
        </div>

        <div className={`rounded-xl border p-4 ${directionTone}`}>
          <dt className="text-xs font-semibold leading-5 opacity-70">{labels.directionQuestion}</dt>
          <dd className="mt-2 text-base font-semibold leading-6">{labels.directionAnswer}</dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold leading-5 text-slate-500">{labels.causeQuestion}</dt>
          <dd className="mt-2 text-base font-semibold leading-6 text-slate-950">{labels.causeAnswer}</dd>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2 xl:col-span-1">
          <dt className="text-xs font-semibold leading-5 text-slate-500">{labels.onePassQuestion}</dt>
          <dd className="mt-2 break-words text-xl font-semibold tracking-[-0.03em] text-slate-950 tabular-nums sm:text-2xl">{onePass}</dd>
        </div>
      </dl>
    </section>
  )
}
