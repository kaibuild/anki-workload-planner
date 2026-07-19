import { useEffect, useMemo, useState } from 'react'
import { formatLocalDate } from '../lib/dates'
import { calculateSnapshotTrend, createSnapshot, getSnapshotsWithChanges, upsertSnapshot, deleteSnapshot } from '../lib/snapshots'
import type { PlannerInputs } from '../types/planner'
import type { DailySnapshot, TrendDirection } from '../types/snapshots'
import { ConfirmDialog } from './ConfirmDialog'
import { Sparkline } from './Sparkline'

export type TrendLabels = {
  eyebrow: string
  heading: string
  description: string
  localOnly: string
  saveToday: string
  updateSnapshot: string
  cancelEdit: string
  date: string
  overdue: string
  dueToday: string
  queue: string
  hardCards: string
  note: string
  notePlaceholder: string
  empty: string
  trend: string
  directions: Record<TrendDirection, string>
  insufficient: string
  latestChange: string
  sevenDayAverage: string
  needsSeven: string
  previousChange: string
  firstSnapshot: string
  edit: string
  delete: string
  deleteTitle: string
  deleteDescription: string
  confirmDelete: string
  cancel: string
  saved: string
  updated: string
  required: string
  invalidDate: string
  invalidNumber: string
  nonNegative: string
  wholeNumber: string
  tooLarge: string
  duplicateDate: string
  noteTooLong: string
  contextNote: string
  sparkline: string
}

type NumericDraftValue = number | string

type SnapshotDraft = {
  id?: string
  date: string
  overdueBacklog: NumericDraftValue
  dueToday: NumericDraftValue
  schedulerQueueNow: NumericDraftValue
  hardCardCount: NumericDraftValue
  note: string
}

type SnapshotDraftErrors = Partial<Record<keyof Omit<SnapshotDraft, 'id'>, string>>
type SaveStatus = 'saved' | 'updated'

const MAX_SNAPSHOT_VALUE = 1_000_000
const MAX_NOTE_LENGTH = 2_000
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function BacklogTrend({ inputs, snapshots, labels, locale, onChange }: { inputs: PlannerInputs; snapshots: DailySnapshot[]; labels: TrendLabels; locale: 'en' | 'ja'; onChange: (snapshots: DailySnapshot[]) => void }) {
  const freshDraft = (): SnapshotDraft => ({
    date: formatLocalDate(new Date()),
    overdueBacklog: inputs.overdueBacklog,
    dueToday: inputs.dueToday,
    schedulerQueueNow: inputs.schedulerQueueNow,
    hardCardCount: inputs.hardCardCount,
    note: '',
  })
  const [draft, setDraft] = useState<SnapshotDraft>(freshDraft)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [formOpen, setFormOpen] = useState(snapshots.length === 0)
  const trend = useMemo(() => calculateSnapshotTrend(snapshots), [snapshots])
  const rows = useMemo(() => getSnapshotsWithChanges(snapshots), [snapshots])
  const sparklineValues = useMemo(() => [...snapshots].reverse().map((snapshot) => snapshot.overdueBacklog), [snapshots])
  const draftErrors = useMemo(() => getDraftErrors(draft, snapshots, labels), [draft, labels, snapshots])
  const number = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: 'auto' }), [locale])
  const whole = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0, signDisplay: 'auto' }), [locale])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])
  const updateDraft = (patch: Partial<SnapshotDraft>) => {
    setSaveStatus(null)
    setDraft((current) => ({ ...current, ...patch }))
  }

  useEffect(() => {
    setDraft((current) => current.id ? current : {
      ...current,
      overdueBacklog: inputs.overdueBacklog,
      dueToday: inputs.dueToday,
      schedulerQueueNow: inputs.schedulerQueueNow,
      hardCardCount: inputs.hardCardCount,
    })
  }, [inputs.dueToday, inputs.hardCardCount, inputs.overdueBacklog, inputs.schedulerQueueNow])

  const submit = () => {
    setShowValidation(true)
    if (Object.keys(draftErrors).length > 0) return

    const replacesExistingDate = snapshots.some((item) => item.date === draft.date)
    const snapshot = createSnapshot({
      date: draft.date,
      overdueBacklog: Number(draft.overdueBacklog),
      dueToday: optionalDraftNumber(draft.dueToday),
      schedulerQueueNow: optionalDraftNumber(draft.schedulerQueueNow),
      hardCardCount: optionalDraftNumber(draft.hardCardCount),
      note: draft.note.trim() || undefined,
    }, draft.id)
    const withoutEditedRow = draft.id
      ? snapshots.filter((item) => item.id !== draft.id)
      : snapshots
    onChange(upsertSnapshot(withoutEditedRow, snapshot))
    setDraft(freshDraft())
    setSaveStatus(draft.id || replacesExistingDate ? 'updated' : 'saved')
    setShowValidation(false)
    setFormOpen(false)
  }

  return (
    <section className="panel" aria-labelledby="trend-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">{labels.eyebrow}</p>
          <h2 className="mt-1 section-title" id="trend-heading">{labels.heading}</h2>
          <p className="section-description">{labels.description}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden="true" />
          {labels.localOnly}
        </span>
      </div>

      {snapshots.length > 0 ? (
        <>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <TrendMetric label={labels.trend} value={snapshots.length < 2 ? labels.insufficient : labels.directions[trend.direction]} />
            <TrendMetric label={labels.latestChange} value={trend.latestChange === null ? labels.firstSnapshot : whole.format(trend.latestChange)} />
            <TrendMetric label={labels.sevenDayAverage} value={trend.sevenDayAverage === null ? labels.needsSeven : number.format(trend.sevenDayAverage)} />
          </div>
          <div className="quiet-surface mt-3 px-3 py-2">
            <Sparkline values={sparklineValues} label={labels.sparkline} />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{labels.contextNote}</p>
        </>
      ) : null}

      <details
        className="group mt-6 rounded-2xl border border-slate-200 bg-slate-50/70"
        open={formOpen}
        onToggle={(event) => setFormOpen(event.currentTarget.open)}
      >
        <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-slate-900">
          <span>{draft.id ? labels.updateSnapshot : labels.saveToday}</span>
          <span className="flex items-center gap-3">
            <span className="text-xs font-medium text-teal-700" aria-live="polite">{saveStatus ? labels[saveStatus] : ''}</span>
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-white text-lg leading-none text-slate-500 shadow-sm transition group-open:rotate-45">+</span>
          </span>
        </summary>
        <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <SnapshotField id="snapshot-date" label={labels.date} type="date" value={draft.date} required error={showValidation ? draftErrors.date : undefined} onChange={(value) => updateDraft({ date: value })} />
          <SnapshotField id="snapshot-overdue" label={labels.overdue} value={draft.overdueBacklog} required error={showValidation ? draftErrors.overdueBacklog : undefined} onChange={(value) => updateDraft({ overdueBacklog: value })} />
          <SnapshotField id="snapshot-due-today" label={labels.dueToday} value={draft.dueToday} error={showValidation ? draftErrors.dueToday : undefined} onChange={(value) => updateDraft({ dueToday: value })} />
          <SnapshotField id="snapshot-queue" label={labels.queue} value={draft.schedulerQueueNow} error={showValidation ? draftErrors.schedulerQueueNow : undefined} onChange={(value) => updateDraft({ schedulerQueueNow: value })} />
          <SnapshotField id="snapshot-hard-cards" label={labels.hardCards} value={draft.hardCardCount} error={showValidation ? draftErrors.hardCardCount : undefined} onChange={(value) => updateDraft({ hardCardCount: value })} />
          <label className="block sm:col-span-2 xl:col-span-3" htmlFor="snapshot-note">
            <span className="text-sm font-semibold text-slate-800">{labels.note}</span>
            <textarea
              id="snapshot-note"
              className="field mt-2 min-h-20 resize-y"
              value={draft.note}
              placeholder={labels.notePlaceholder}
              maxLength={MAX_NOTE_LENGTH}
              aria-describedby={showValidation && draftErrors.note ? 'snapshot-note-error' : undefined}
              aria-invalid={showValidation && Boolean(draftErrors.note)}
              onChange={(event) => updateDraft({ note: event.currentTarget.value })}
            />
            {showValidation && draftErrors.note ? <span className="mt-1.5 block text-xs font-medium leading-5 text-rose-800" id="snapshot-note-error" role="alert">{draftErrors.note}</span> : null}
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
            <button className="button-primary" type="button" onClick={submit}>{draft.id ? labels.updateSnapshot : labels.saveToday}</button>
            {draft.id ? <button className="button-secondary" type="button" onClick={() => { setDraft(freshDraft()); setShowValidation(false); setFormOpen(false) }}>{labels.cancelEdit}</button> : null}
          </div>
        </div>
      </details>

      {snapshots.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{labels.empty}</p>
      ) : (
          <div className="mt-5 grid gap-2">
            {rows.map(({ snapshot, changeFromPrevious }) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={snapshot.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{dateFormatter.format(new Date(`${snapshot.date}T00:00:00`))}</h3>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.025em] tabular-nums">{whole.format(snapshot.overdueBacklog)} <span className="text-sm font-normal tracking-normal text-slate-500">{labels.overdue}</span></p>
                    <p className="mt-1 text-xs text-slate-500">{labels.previousChange}: {changeFromPrevious === null ? labels.firstSnapshot : whole.format(changeFromPrevious)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="button-secondary" type="button" onClick={() => { setDraft({ ...snapshot, dueToday: snapshot.dueToday ?? 0, schedulerQueueNow: snapshot.schedulerQueueNow ?? 0, hardCardCount: snapshot.hardCardCount ?? 0, note: snapshot.note ?? '' }); setSaveStatus(null); setShowValidation(false); setFormOpen(true) }}>{labels.edit}</button>
                    <button className="button-secondary text-rose-800" type="button" onClick={() => setDeleteId(snapshot.id)}>{labels.delete}</button>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <div><dt className="font-semibold">{labels.dueToday}</dt><dd>{whole.format(snapshot.dueToday ?? 0)}</dd></div>
                  <div><dt className="font-semibold">{labels.queue}</dt><dd>{whole.format(snapshot.schedulerQueueNow ?? 0)}</dd></div>
                  <div><dt className="font-semibold">{labels.hardCards}</dt><dd>{whole.format(snapshot.hardCardCount ?? 0)}</dd></div>
                </dl>
                {snapshot.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{snapshot.note}</p> : null}
              </article>
            ))}
          </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title={labels.deleteTitle}
        description={labels.deleteDescription}
        confirmLabel={labels.confirmDelete}
        cancelLabel={labels.cancel}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onChange(deleteSnapshot(snapshots, deleteId))
          setDeleteId(null)
        }}
      />
    </section>
  )
}

function SnapshotField({ id, label, value, error, required = false, type = 'number', onChange }: { id: string; label: string; value: NumericDraftValue; error?: string; required?: boolean; type?: 'date' | 'number'; onChange: (value: string) => void }) {
  const errorId = `${id}-error`
  const safeValue = typeof value === 'number' && !Number.isFinite(value) ? '' : value
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        id={id}
        className="field mt-2 tabular-nums"
        type={type}
        value={safeValue}
        required={required}
        min={type === 'number' ? 0 : undefined}
        max={type === 'number' ? MAX_SNAPSHOT_VALUE : undefined}
        step={type === 'number' ? 1 : undefined}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {error ? <span className="mt-1.5 block text-xs font-medium leading-5 text-rose-800" id={errorId} role="alert">{error}</span> : null}
    </label>
  )
}

function TrendMetric({ label, value }: { label: string; value: string }) {
  return <div className="quiet-surface p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>
}

function getDraftErrors(draft: SnapshotDraft, snapshots: readonly DailySnapshot[], labels: TrendLabels): SnapshotDraftErrors {
  const errors: SnapshotDraftErrors = {}

  if (draft.date.trim() === '') errors.date = labels.required
  else if (!isValidLocalDate(draft.date)) errors.date = labels.invalidDate
  else if (draft.id && snapshots.some((snapshot) => snapshot.id !== draft.id && snapshot.date === draft.date)) errors.date = labels.duplicateDate

  const overdueBacklogError = validateSnapshotNumber(draft.overdueBacklog, labels, true)
  const dueTodayError = validateSnapshotNumber(draft.dueToday, labels)
  const schedulerQueueError = validateSnapshotNumber(draft.schedulerQueueNow, labels)
  const hardCardError = validateSnapshotNumber(draft.hardCardCount, labels)
  if (overdueBacklogError) errors.overdueBacklog = overdueBacklogError
  if (dueTodayError) errors.dueToday = dueTodayError
  if (schedulerQueueError) errors.schedulerQueueNow = schedulerQueueError
  if (hardCardError) errors.hardCardCount = hardCardError
  if (draft.note.length > MAX_NOTE_LENGTH) errors.note = labels.noteTooLong

  return errors
}

function validateSnapshotNumber(value: NumericDraftValue, labels: TrendLabels, required = false): string | undefined {
  if (typeof value === 'string' && value.trim() === '') return required ? labels.required : undefined
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return labels.invalidNumber
  if (number < 0) return labels.nonNegative
  if (!Number.isInteger(number)) return labels.wholeNumber
  if (number > MAX_SNAPSHOT_VALUE) return labels.tooLarge
  return undefined
}

function optionalDraftNumber(value: NumericDraftValue): number | undefined {
  return typeof value === 'string' && value.trim() === '' ? undefined : Number(value)
}

function isValidLocalDate(value: string): boolean {
  const match = LOCAL_DATE_PATTERN.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
}
