import { useState } from 'react'
import { DEMO_IDS, getDemoInputs, type DemoId } from '../lib/demos'
import type { PlannerInputs, ValidationError } from '../types/planner'

export type PlannerFormLabels = {
  heading: string
  description: string
  simpleMode: string
  advanced: string
  loadDemo: string
  demoPrompt: string
  demoLoaded: string
  demos: Record<DemoId, string>
  fields: Record<keyof Omit<PlannerInputs, 'daysOff'>, { label: string; helper?: string; unit?: string; badge?: string }>
  hardCards: {
    heading: string
    description: string
    previewLabel: string
    previewMissingReviews: string
    previewMissingExtraSeconds: string
    collapsedIncluded: string
    collapsedShort: string
    minutesPerDay: string
  }
  inputSemantics: {
    overdueColorWarning: string
    overdueConfirmation: string
    findOverdueTitle: string
    findOverdueIntro: string
    findOverdueStepBrowse: string
    findOverdueStepSearch: string
    findOverdueQuery: string
    findOverdueStepCount: string
    findOverdueExplanation: string
    findOverdueDoNotGuess: string
    dailyReviewStatsWarning: string
    dailyReviewEstimateNote: string
    quickGuideTitle: string
    quickGuideOverdueTerm: string
    quickGuideOverdueDefinition: string
    quickGuideReviewsTerm: string
    quickGuideReviewsDefinition: string
    quickGuideNewCardsTerm: string
    quickGuideNewCardsDefinition: string
    quickGuideSecondsTerm: string
    quickGuideSecondsDefinition: string
  }
  daysOff: string
  daysOffHelp: string
  weekdays: string[]
  errors: Record<ValidationError['code'], string>
}

type PlannerFormProps = {
  inputs: PlannerInputs
  errors: ValidationError[]
  labels: PlannerFormLabels
  locale: 'en' | 'ja'
  onChange: (inputs: PlannerInputs) => void
}

const SIMPLE_FIELDS: Array<keyof Omit<PlannerInputs, 'daysOff'>> = [
  'overdueBacklog',
  'typicalDailyReviews',
  'dailyMinutes',
  'averageSecondsPerReview',
  'newCardsPerDay',
  'targetDate',
]

const ADVANCED_CONTEXT_FIELDS: Array<keyof Omit<PlannerInputs, 'daysOff'>> = [
  'dueToday',
  'schedulerQueueNow',
]

const HARD_CARD_ESTIMATE_FIELDS: Array<keyof Omit<PlannerInputs, 'daysOff'>> = [
  'hardCardReviewsPerDay',
  'extraSecondsPerHardReview',
]

const ADVANCED_PLANNING_FIELDS: Array<keyof Omit<PlannerInputs, 'daysOff'>> = [
  'newCardReviewEquivalent',
  'plannedAdditionalCards',
  'plannedAdditionalCardsDays',
  'potentiallyTriagedCards',
]

export function PlannerForm({ inputs, errors, labels, locale, onChange }: PlannerFormProps) {
  const [demo, setDemo] = useState<DemoId>('moderate')
  const [demoLoaded, setDemoLoaded] = useState(false)
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const hardCardReviewsPerDay = validNonNegative(inputs.hardCardReviewsPerDay)
  const extraSecondsPerHardReview = validNonNegative(inputs.extraSecondsPerHardReview)
  const hardCardMinutesPerDay =
    (hardCardReviewsPerDay * extraSecondsPerHardReview) / 60
  const hardCardPreview = hardCardMinutesPerDay > 0
    ? `${labels.hardCards.previewLabel}: ${decimal.format(hardCardMinutesPerDay)} ${labels.hardCards.minutesPerDay}`
    : hardCardReviewsPerDay <= 0
      ? labels.hardCards.previewMissingReviews
      : labels.hardCards.previewMissingExtraSeconds
  const update = <K extends keyof PlannerInputs>(key: K, value: PlannerInputs[K]) => {
    onChange({ ...inputs, [key]: value })
  }
  const renderField = (
    field: keyof Omit<PlannerInputs, 'daysOff'>,
    describedBy?: string,
  ) => (
    <PlannerField
      describedBy={describedBy}
      errors={errors.filter((error) => error.field === field).map((error) => labels.errors[error.code])}
      field={field}
      key={field}
      meta={labels.fields[field]}
      value={inputs[field]}
      onChange={(value) => update(field, value as never)}
    />
  )
  const renderSimpleField = (
    field: keyof Omit<PlannerInputs, 'daysOff'>,
  ) => {
    if (field === 'overdueBacklog') {
      const hasEnteredOverdueCards = validNonNegative(inputs.overdueBacklog) > 0
      return (
        <div className="min-w-0" key={field}>
          {renderField(
            field,
            [
              'planner-overdue-color-warning',
              hasEnteredOverdueCards ? 'planner-overdue-confirmation' : '',
            ].filter(Boolean).join(' '),
          )}
          <p
            className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-950"
            id="planner-overdue-color-warning"
          >
            {labels.inputSemantics.overdueColorWarning}
          </p>
          {hasEnteredOverdueCards ? (
            <p
              className="mt-2 text-xs leading-5 text-slate-600"
              id="planner-overdue-confirmation"
            >
              {labels.inputSemantics.overdueConfirmation}
            </p>
          ) : null}
          <details className="group quiet-surface mt-2 overflow-hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold text-teal-800">
              {labels.inputSemantics.findOverdueTitle}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-lg leading-none text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <div className="border-t border-slate-200/70 px-3 pb-3 pt-3 text-xs leading-5 text-slate-600">
              <p>{labels.inputSemantics.findOverdueIntro}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>{labels.inputSemantics.findOverdueStepBrowse}</li>
                <li>
                  {labels.inputSemantics.findOverdueStepSearch}{' '}
                  <code className="select-text rounded bg-white px-1.5 py-1 font-mono text-[0.75rem] font-semibold text-slate-900 ring-1 ring-inset ring-slate-200">
                    {labels.inputSemantics.findOverdueQuery}
                  </code>
                </li>
                <li>{labels.inputSemantics.findOverdueStepCount}</li>
              </ol>
              <p className="mt-2">{labels.inputSemantics.findOverdueExplanation}</p>
              <p className="mt-2 font-medium text-slate-800">{labels.inputSemantics.findOverdueDoNotGuess}</p>
            </div>
          </details>
        </div>
      )
    }

    if (field === 'typicalDailyReviews') {
      return (
        <div className="min-w-0" key={field}>
          {renderField(field, 'planner-typical-review-stats-help planner-typical-review-estimate-help')}
          <p
            className="mt-2 text-xs font-medium leading-5 text-slate-700"
            id="planner-typical-review-stats-help"
          >
            {labels.inputSemantics.dailyReviewStatsWarning}
          </p>
          <p
            className="mt-2 text-xs leading-5 text-slate-500"
            id="planner-typical-review-estimate-help"
          >
            {labels.inputSemantics.dailyReviewEstimateNote}
          </p>
        </div>
      )
    }

    return <div className="min-w-0" key={field}>{renderField(field)}</div>
  }

  return (
    <section className="panel" aria-labelledby="planner-input-heading">
      <div>
        <p className="eyebrow">{labels.simpleMode}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]" id="planner-input-heading">{labels.heading}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{labels.description}</p>
      </div>

      <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
        {SIMPLE_FIELDS.map(renderSimpleField)}
      </div>

      <details className="group quiet-surface mt-4 overflow-hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700">
          {labels.inputSemantics.quickGuideTitle}
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-lg leading-none text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <dl className="grid gap-3 border-t border-slate-200/70 px-3.5 py-3.5 text-xs leading-5 sm:grid-cols-2 lg:grid-cols-1">
          {[
            [labels.inputSemantics.quickGuideOverdueTerm, labels.inputSemantics.quickGuideOverdueDefinition],
            [labels.inputSemantics.quickGuideReviewsTerm, labels.inputSemantics.quickGuideReviewsDefinition],
            [labels.inputSemantics.quickGuideNewCardsTerm, labels.inputSemantics.quickGuideNewCardsDefinition],
            [labels.inputSemantics.quickGuideSecondsTerm, labels.inputSemantics.quickGuideSecondsDefinition],
          ].map(([term, definition]) => (
            <div key={term}>
              <dt className="font-semibold text-slate-800">{term}</dt>
              <dd className="mt-0.5 text-slate-600">{definition}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details className="group quiet-surface mt-6 overflow-hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700">
          {labels.loadDemo}
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-lg leading-none text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <div className="border-t border-slate-200/70 px-3.5 pb-3.5 pt-3">
          <label className="sr-only" htmlFor="demo-select">{labels.loadDemo}</label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1">
            <select id="demo-select" className="field" value={demo} onChange={(event) => { setDemo(event.currentTarget.value as DemoId); setDemoLoaded(false) }}>
              {DEMO_IDS.map((id) => <option value={id} key={id}>{labels.demos[id]}</option>)}
            </select>
            <button className="button-secondary shrink-0" type="button" onClick={() => { onChange(getDemoInputs(demo, inputs)); setDemoLoaded(true) }}>{labels.demoPrompt}</button>
          </div>
          <p className="mt-2 min-h-5 text-xs font-medium text-teal-800" aria-live="polite">{demoLoaded ? labels.demoLoaded : ''}</p>
        </div>
      </details>

      <details className="group mt-6 border-t border-slate-200 pt-2">
        <summary className="-mx-2 flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
          <span>{labels.advanced}</span>
          <span className="flex min-w-0 max-w-[68%] items-center justify-end gap-2">
            {hardCardMinutesPerDay > 0 ? (
              <span
                className="min-w-0 truncate rounded-full bg-amber-100 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-950"
                aria-label={`${labels.hardCards.collapsedIncluded}: ${decimal.format(hardCardMinutesPerDay)} ${labels.hardCards.minutesPerDay}`}
              >
                <span className="sm:hidden">{labels.hardCards.collapsedShort}: </span>
                <span className="hidden sm:inline">{labels.hardCards.collapsedIncluded}: </span>
                {decimal.format(hardCardMinutesPerDay)} {labels.hardCards.minutesPerDay}
              </span>
            ) : null}
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-lg leading-none text-slate-600 transition group-open:rotate-45">+</span>
          </span>
        </summary>
        <div className="mt-2 rounded-2xl bg-slate-50/80 p-4">
          <div className="grid gap-5">{ADVANCED_CONTEXT_FIELDS.map((field) => renderField(field))}</div>

          <fieldset className="mt-6 min-w-0 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">{labels.hardCards.heading}</legend>
            <p className="mt-1 text-xs leading-5 text-slate-600">{labels.hardCards.description}</p>
            <div className="mt-4 grid gap-5">
              {HARD_CARD_ESTIMATE_FIELDS.map((field) => renderField(field, 'planner-hard-card-impact'))}
            </div>
            <div
              className={`mt-4 rounded-lg border px-3.5 py-3 text-sm font-semibold leading-6 ${
                hardCardMinutesPerDay > 0
                  ? 'border-amber-300 bg-white text-amber-950'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              id="planner-hard-card-impact"
              role="status"
              aria-atomic="true"
              aria-live="polite"
            >
              {hardCardPreview}
            </div>
            <div className="mt-5 border-t border-amber-200 pt-5">
              {renderField('hardCardCount')}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-5">
            {ADVANCED_PLANNING_FIELDS.map((field) => renderField(field))}
          </div>
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-slate-800">{labels.daysOff}</legend>
            <p className="mt-1 text-xs leading-5 text-slate-500" id="planner-daysOff-help">{labels.daysOffHelp}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {labels.weekdays.map((day, index) => (
                <label key={day} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-950">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-800"
                    checked={inputs.daysOff.includes(index)}
                    aria-describedby="planner-daysOff-help planner-daysOff-error"
                    aria-invalid={errors.some((error) => error.field === 'daysOff')}
                    onChange={(event) => {
                      const next = event.currentTarget.checked
                        ? [...inputs.daysOff, index]
                        : inputs.daysOff.filter((dayOff) => dayOff !== index)
                      update('daysOff', [...new Set(next)].sort())
                    }}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
            {errors.some((error) => error.field === 'daysOff') ? (
              <p className="mt-2 text-xs font-medium leading-5 text-rose-800" id="planner-daysOff-error" role="alert">
                {errors.filter((error) => error.field === 'daysOff').map((error) => labels.errors[error.code]).join(' ')}
              </p>
            ) : <span id="planner-daysOff-error" />}
          </fieldset>
        </div>
      </details>
    </section>
  )
}

type FieldProps = {
  field: keyof Omit<PlannerInputs, 'daysOff'>
  value: number | string
  meta: { label: string; helper?: string; unit?: string; badge?: string }
  errors: string[]
  describedBy?: string
  onChange: (value: number | string) => void
}

function PlannerField({ field, value, meta, errors, describedBy, onChange }: FieldProps) {
  const id = `planner-${field}`
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const isDate = field === 'targetDate'
  const decimalFields: Array<FieldProps['field']> = ['dailyMinutes', 'averageSecondsPerReview', 'extraSecondsPerHardReview', 'newCardReviewEquivalent']
  const step = decimalFields.includes(field) ? 0.1 : 1
  const maximum = field === 'dailyMinutes'
    ? 1440
    : field === 'averageSecondsPerReview' || field === 'extraSecondsPerHardReview'
      ? 3600
      : field === 'newCardReviewEquivalent'
        ? 100
        : field === 'plannedAdditionalCardsDays'
          ? 36500
          : 1_000_000
  const displayValue = typeof value === 'number' && !Number.isFinite(value) ? '' : value
  return (
    <label className="block" htmlFor={id}>
      <span className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-sm font-medium leading-5 text-slate-800">
        <span className="min-w-0 flex-1">
          <span>{meta.label}</span>
          {meta.badge ? (
            <span className="ml-2 inline-block rounded-full bg-white px-2 py-0.5 align-middle text-[0.65rem] font-semibold text-teal-800 ring-1 ring-inset ring-slate-200">
              {meta.badge}
            </span>
          ) : null}
        </span>
        {meta.unit ? <span className="shrink-0 text-[0.68rem] font-medium text-slate-500">{meta.unit}</span> : null}
      </span>
      <input
        id={id}
        className="field mt-2 tabular-nums"
        type={isDate ? 'date' : 'number'}
        step={isDate ? undefined : step}
        min={isDate ? undefined : 0}
        max={isDate ? undefined : maximum}
        inputMode={isDate ? undefined : 'decimal'}
        value={displayValue}
        aria-describedby={[meta.helper ? helpId : '', describedBy ?? '', errors.length ? errorId : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={errors.length > 0}
        onChange={(event) => {
          if (isDate) onChange(event.currentTarget.value)
          else onChange(event.currentTarget.value === '' ? Number.NaN : event.currentTarget.valueAsNumber)
        }}
      />
      {meta.helper ? <span className="mt-1.5 block text-xs leading-[1.45rem] text-slate-500" id={helpId}>{meta.helper}</span> : null}
      {errors.length ? <span className="mt-1.5 block text-xs font-medium leading-5 text-rose-800" id={errorId}>{errors.join(' ')}</span> : null}
    </label>
  )
}

function validNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0
}
