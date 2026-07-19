import { useState } from 'react'
import { buildAllDataJson, buildSnapshotsCsv, copyText, downloadText, type ExportLabels } from '../lib/exportPlan'
import type { PlannerInputs } from '../types/planner'
import type { DailySnapshot } from '../types/snapshots'

export type ExportPanelLabels = {
  heading: string
  description: string
  copyPlan: string
  downloadMarkdown: string
  exportCsv: string
  downloadJson: string
  resetPlan: string
  deleteAll: string
  copied: string
  copyFailed: string
  noSnapshots: string
  invalidPlan: string
  localDataHeading: string
  resetPlanHelp: string
  deleteAllHelp: string
}

export function ExportPanel({ labels, exportLabels, markdown, inputs, snapshots, locale, productName, canExportPlan, operationStatus, onReset, onDeleteAll }: { labels: ExportPanelLabels; exportLabels: ExportLabels; markdown: string; inputs: PlannerInputs; snapshots: DailySnapshot[]; locale: 'en' | 'ja'; productName: string; canExportPlan: boolean; operationStatus: string; onReset: () => void; onDeleteAll: () => void }) {
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null)
  const copyPlan = async () => setCopyStatus(await copyText(markdown) ? 'copied' : 'failed')
  return (
    <section className="panel" aria-labelledby="export-heading">
      <h2 className="section-title" id="export-heading">{labels.heading}</h2>
      <p className="section-description">{labels.description}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button className="button-primary sm:min-w-44" type="button" disabled={!canExportPlan} aria-describedby={!canExportPlan ? 'plan-export-help' : undefined} onClick={copyPlan}>{labels.copyPlan}</button>
        <button className="button-secondary" type="button" disabled={!canExportPlan} aria-describedby={!canExportPlan ? 'plan-export-help' : undefined} onClick={() => downloadText(markdown, locale === 'ja' ? 'anki-負荷プラン.md' : 'anki-workload-plan.md', 'text/markdown;charset=utf-8')}>{labels.downloadMarkdown}</button>
        <button className="button-secondary" type="button" disabled={snapshots.length === 0} aria-describedby={snapshots.length === 0 ? 'csv-empty-help' : undefined} onClick={() => downloadText(buildSnapshotsCsv(snapshots, exportLabels), 'anki-backlog-snapshots.csv', 'text/csv;charset=utf-8')}>{labels.exportCsv}</button>
        <button className="button-secondary" type="button" disabled={!canExportPlan} aria-describedby={!canExportPlan ? 'plan-export-help' : undefined} onClick={() => downloadText(buildAllDataJson(inputs, snapshots, locale, productName), 'anki-workload-planner-data.json', 'application/json;charset=utf-8')}>{labels.downloadJson}</button>
      </div>
      <p className="mt-2 text-xs leading-5 text-amber-800" id="plan-export-help">{canExportPlan ? '' : labels.invalidPlan}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500" id="csv-empty-help">{snapshots.length === 0 ? labels.noSnapshots : ''}</p>
      <p className="mt-2 min-h-5 text-sm font-medium text-teal-700" aria-live="polite">{copyStatus === 'copied' ? labels.copied : copyStatus === 'failed' ? labels.copyFailed : ''}</p>

      <details className="group mt-5 border-t border-slate-200 pt-2">
        <summary className="-mx-2 flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
          {labels.localDataHeading}
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-lg leading-none text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="quiet-surface flex flex-col items-start p-4">
            <p className="text-xs leading-5 text-slate-600">{labels.resetPlanHelp}</p>
            <button className="button-secondary mt-3" type="button" onClick={onReset}>{labels.resetPlan}</button>
          </div>
          <div className="quiet-surface flex flex-col items-start p-4">
            <p className="text-xs leading-5 text-slate-600">{labels.deleteAllHelp}</p>
            <button className="button-danger mt-3" type="button" onClick={onDeleteAll}>{labels.deleteAll}</button>
          </div>
        </div>
      </details>
      <p className="mt-3 min-h-5 text-sm font-medium text-teal-800" aria-live="polite">{operationStatus}</p>
    </section>
  )
}
