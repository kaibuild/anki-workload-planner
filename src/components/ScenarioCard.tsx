import { useState, type ReactNode } from 'react'

export type ScenarioTone = 'neutral' | 'good' | 'warning' | 'danger'

interface ScenarioCardProps {
  title: string
  description: string
  rows: Array<{
    label: string
    value: ReactNode
    note?: ReactNode
  }>
  tone?: ScenarioTone
  featured?: boolean
}

export function ScenarioCard({
  title,
  description,
  rows,
  tone = 'neutral',
  featured = false,
}: ScenarioCardProps) {
  const [open, setOpen] = useState(featured)

  return (
    <article className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${featured ? 'xl:col-span-2' : ''}`}>
      <details className="group" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="flex min-h-16 cursor-pointer list-none items-start gap-3 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${toneDot[tone]}`} aria-hidden="true" />
              <h3 className="text-base font-semibold tracking-[-0.015em] text-slate-950 sm:text-lg">{title}</h3>
            </div>
            <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-50 text-lg leading-none text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
        </summary>

        <dl className={`${featured ? 'grid gap-x-4 sm:grid-cols-2 xl:grid-cols-3' : 'divide-y divide-slate-100'} border-t border-slate-100 px-4 pb-4 sm:px-5 sm:pb-5`}>
          {rows.map((row) => (
            <div className={featured ? 'border-t border-slate-100 py-3.5' : 'grid gap-1 py-3.5 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-3'} key={row.label}>
              <dt className="text-xs font-semibold leading-5 text-slate-600">{row.label}</dt>
              <dd className={`min-w-0 max-w-full break-words text-base font-semibold tabular-nums text-slate-950 [overflow-wrap:anywhere] ${featured ? 'mt-1' : 'sm:text-right'}`}>{row.value}</dd>
              {row.note ? <dd className={`mt-1 text-xs leading-5 text-slate-600 ${featured ? '' : 'sm:col-span-2'}`}>{row.note}</dd> : null}
            </div>
          ))}
        </dl>
      </details>
    </article>
  )
}

const toneDot: Record<ScenarioTone, string> = {
  neutral: 'bg-slate-400',
  good: 'bg-teal-600',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}
