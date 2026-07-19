import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { BacklogTrend } from './components/BacklogTrend'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ExportPanel } from './components/ExportPanel'
import { Glossary } from './components/Glossary'
import { MethodologyOverview } from './components/MethodologyOverview'
import { PageIntro } from './components/PageIntro'
import { PlannerForm } from './components/PlannerForm'
import { PrivacyAndLimitations } from './components/PrivacyAndLimitations'
import { ResultsSummary } from './components/ResultsSummary'
import { ScenarioGrid } from './components/ScenarioGrid'
import { TrustStrip } from './components/TrustStrip'
import { WorkloadBreakdown } from './components/WorkloadBreakdown'
import {
  detectBrowserLocale,
  getTranslation,
  localeFromLanguageTag,
  resolveLocale,
  type Locale,
} from './i18n'
import { buildPlanMarkdown, type ExportLabels } from './lib/exportPlan'
import { calculatePlanner, getDefaultPlannerInputs } from './lib/planner'
import { getRecommendationText, selectRecommendation } from './lib/recommendations'
import { localizedPath, type AppPage } from './lib/routes'
import {
  clearAllLocalData,
  clearStoredInputs,
  loadLocale,
  loadSnapshots,
  loadStoredInputs,
  saveInputs,
  saveLocale,
  saveSnapshots,
} from './lib/storage'
import type { PlannerInputs, PlanMetrics } from './types/planner'
import type { DailySnapshot } from './types/snapshots'

type OperationStatus = 'reset' | 'deleted' | null

export default function App() {
  const [inputs, setInputs] = useState<PlannerInputs>(() => loadStoredInputs())
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>(() => loadSnapshots())
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [operationStatus, setOperationStatus] = useState<OperationStatus>(null)
  const [storageError, setStorageError] = useState(false)
  const skipPersistence = useRef(false)
  const result = useMemo(() => calculatePlanner(inputs), [inputs])
  const recommendationKey = useMemo(() => selectRecommendation(inputs, result), [inputs, result])

  useEffect(() => {
    if (skipPersistence.current) {
      skipPersistence.current = false
      return
    }
    const inputsSaved = saveInputs(inputs)
    const snapshotsSaved = saveSnapshots(snapshots)
    setStorageError(!(inputsSaved && snapshotsSaved))
  }, [inputs, snapshots])

  const resetPlan = () => {
    const cleared = clearStoredInputs()
    setInputs(getDefaultPlannerInputs())
    setOperationStatus('reset')
    setStorageError(!cleared)
    setResetOpen(false)
  }

  const deleteAll = (navigate: ReturnType<typeof useNavigate>) => {
    if (!clearAllLocalData()) {
      setStorageError(true)
      setDeleteAllOpen(false)
      return
    }
    skipPersistence.current = true
    setInputs(getDefaultPlannerInputs())
    setSnapshots([])
    setOperationStatus('deleted')
    setStorageError(false)
    setDeleteAllOpen(false)
    navigate(localizedPath(detectBrowserLocale(), 'plan'), { replace: true })
  }

  const shared: SharedPageProps = {
    inputs,
    snapshots,
    result,
    recommendationKey,
    storageError,
    operationStatus,
    onInputsChange: (next) => { setInputs(next); setOperationStatus(null) },
    onSnapshotsChange: (next) => { setSnapshots(next); setOperationStatus(null) },
    onStorageError: () => setStorageError(true),
    onResetRequest: () => setResetOpen(true),
    onDeleteAllRequest: () => setDeleteAllOpen(true),
    onResetConfirm: resetPlan,
    onDeleteAllConfirm: deleteAll,
    resetOpen,
    deleteAllOpen,
    onResetCancel: () => setResetOpen(false),
    onDeleteAllCancel: () => setDeleteAllOpen(false),
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:locale/plan" element={<LocalizedPage page="plan" {...shared} />} />
      <Route path="/:locale/trend" element={<LocalizedPage page="trend" {...shared} />} />
      <Route path="/:locale/methodology" element={<LocalizedPage page="methodology" {...shared} />} />
      <Route path="/:locale" element={<LocalizedFallback />} />
      <Route path="/:locale/*" element={<LocalizedFallback />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

type SharedPageProps = {
  inputs: PlannerInputs
  snapshots: DailySnapshot[]
  result: ReturnType<typeof calculatePlanner>
  recommendationKey: ReturnType<typeof selectRecommendation>
  storageError: boolean
  operationStatus: OperationStatus
  onInputsChange: (inputs: PlannerInputs) => void
  onSnapshotsChange: (snapshots: DailySnapshot[]) => void
  onStorageError: () => void
  onResetRequest: () => void
  onDeleteAllRequest: () => void
  onResetConfirm: () => void
  onDeleteAllConfirm: (navigate: ReturnType<typeof useNavigate>) => void
  resetOpen: boolean
  deleteAllOpen: boolean
  onResetCancel: () => void
  onDeleteAllCancel: () => void
}

function RootRedirect() {
  const locale = resolveLocale(null, loadLocale())
  return <Navigate replace to={localizedPath(locale, 'plan')} />
}

function LocalizedFallback() {
  const { locale: routeLocale } = useParams()
  const locale = localeFromLanguageTag(routeLocale) ?? resolveLocale(null, loadLocale())
  return <Navigate replace to={localizedPath(locale, 'plan')} />
}

function LocalizedPage({ page, ...shared }: SharedPageProps & { page: AppPage }) {
  const { locale: routeLocale } = useParams()
  const locale = localeFromLanguageTag(routeLocale)
  if (!locale) return <Navigate replace to={localizedPath(resolveLocale(null, loadLocale()), 'plan')} />
  if (routeLocale !== locale) return <Navigate replace to={localizedPath(locale, page)} />
  return <PageShell locale={locale} page={page} {...shared} />
}

function PageShell({
  locale,
  page,
  inputs,
  snapshots,
  result,
  recommendationKey,
  storageError,
  operationStatus,
  onInputsChange,
  onSnapshotsChange,
  onStorageError,
  onResetRequest,
  onDeleteAllRequest,
  onResetConfirm,
  onDeleteAllConfirm,
  resetOpen,
  deleteAllOpen,
  onResetCancel,
  onDeleteAllCancel,
}: SharedPageProps & { locale: Locale; page: AppPage }) {
  const copy = getTranslation(locale)
  const navigate = useNavigate()
  const location = useLocation()
  const recommendation = getRecommendationText(recommendationKey, locale)
  const exportLabels = useMemo(() => makeExportLabels(copy), [copy])
  const markdown = useMemo(
    () => buildPlanMarkdown(
      inputs,
      result,
      locale,
      exportLabels,
      copy.direction[result.current.direction],
      copy.feasibility[result.current.target.feasibility],
      recommendation,
    ),
    [copy, exportLabels, inputs, locale, recommendation, result],
  )
  const pageCopy = copy.pages[page]

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = copy.meta.pageTitles[page]
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', copy.meta.description)
  }, [copy.meta.description, copy.meta.pageTitles, locale, page])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const changeLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return
    if (!saveLocale(nextLocale)) onStorageError()
    navigate(localizedPath(nextLocale, page))
  }

  const primaryCause = getPrimaryCause(inputs, result.current, copy.summary)
  const operationMessage = operationStatus === 'reset'
    ? copy.localData.resetDone
    : operationStatus === 'deleted'
      ? copy.localData.deleteDone
      : ''

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-slate-950">
      <a className="skip-link" href="#main-content">{copy.navigation.skipToContent}</a>
      <AppHeader
        labels={{
          productName: copy.meta.productName,
          languageLabel: copy.language.switcherLabel,
          english: copy.language.english,
          japanese: copy.language.japanese,
          primaryNavigation: copy.navigation.primary,
          plan: copy.navigation.plan,
          trend: copy.navigation.trend,
          methodology: copy.navigation.methodology,
        }}
        locale={locale}
        page={page}
        onLocaleChange={changeLocale}
      />
      <TrustStrip strip={copy.trust.strip} local={copy.trust.localOnly} connection={copy.trust.noConnection} />

      <main id="main-content" tabIndex={-1}>
        <PageIntro eyebrow={pageCopy.eyebrow} title={pageCopy.title} description={pageCopy.description} />

        {storageError ? (
          <div className="mx-auto mb-5 max-w-[82rem] px-4 sm:px-6 lg:px-8" role="alert">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <strong>{copy.localData.storageErrorHeading}</strong> {copy.localData.storageErrorBody}
            </div>
          </div>
        ) : null}

        {page === 'plan' ? (
          <div className="mx-auto grid max-w-[82rem] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(20rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:px-8">
            <aside className="lg:sticky lg:top-4">
              <PlannerForm
                inputs={inputs}
                errors={result.validationErrors}
                labels={{
                  heading: copy.form.heading,
                  description: copy.form.description,
                  simpleMode: copy.form.simpleMode,
                  advanced: copy.form.advancedSettings,
                  loadDemo: copy.demo.label,
                  demoPrompt: copy.demo.label,
                  demoLoaded: copy.demo.loaded,
                  demos: { moderate: copy.demo.moderate, extreme: copy.demo.extreme, growing: copy.demo.growing, planned: copy.demo.plannedAddition },
                  fields: makeFieldLabels(copy),
                  daysOff: copy.form.fields.daysOff.label,
                  daysOffHelp: copy.form.fields.daysOff.helper,
                  weekdays: Object.values(copy.form.weekdays),
                  errors: copy.form.validation,
                }}
                onChange={onInputsChange}
              />
            </aside>

            <div className="min-w-0 space-y-6">
              {result.validationErrors.length > 0 ? (
                <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="invalid-results-heading" role="alert">
                  <h2 className="text-lg font-semibold text-amber-950" id="invalid-results-heading">{copy.form.validation.heading}</h2>
                  <p className="mt-1 text-sm leading-6 text-amber-900">{copy.form.validation.fixBeforeResults}</p>
                </section>
              ) : (
                <>
                  <ResultsSummary
                    metrics={result.current}
                    locale={locale}
                    recommendation={recommendation}
                    labels={{
                      eyebrow: copy.summary.description,
                      heading: copy.summary.heading,
                      estimateNote: copy.scenarios.roughEstimate,
                      causeQuestion: copy.summary.heavyQuestion,
                      directionQuestion: copy.summary.directionQuestion,
                      adjustmentQuestion: copy.summary.adjustmentQuestion,
                      onePassQuestion: copy.summary.onePassQuestion,
                      causeAnswer: primaryCause,
                      directionAnswer: getDirectionAnswer(result.current, copy.summary),
                      adjustmentAnswer: recommendation,
                      onePassUnavailable: copy.summary.onePassUnavailable,
                      onePassComplete: copy.summary.onePassComplete,
                      days: copy.common.studyDays,
                    }}
                  />
                  <WorkloadBreakdown metrics={result.current} locale={locale} labels={makeBreakdownLabels(copy)} />
                  <ScenarioGrid inputs={inputs} result={result} locale={locale} labels={makeScenarioLabels(copy)} />
                </>
              )}
              <ExportPanel
                labels={{
                  heading: copy.export.heading,
                  description: copy.export.description,
                  copyPlan: copy.export.copyText,
                  downloadMarkdown: copy.export.downloadMarkdown,
                  exportCsv: copy.export.exportCsv,
                  downloadJson: copy.export.downloadJson,
                  resetPlan: copy.localData.resetPlan,
                  deleteAll: copy.localData.deleteAll,
                  copied: copy.export.copied,
                  copyFailed: copy.export.copyFailed,
                  noSnapshots: copy.export.noSnapshots,
                  invalidPlan: copy.export.invalidPlan,
                  localDataHeading: copy.localData.heading,
                  resetPlanHelp: copy.localData.resetPlanHelp,
                  deleteAllHelp: copy.localData.deleteAllHelp,
                }}
                exportLabels={exportLabels}
                markdown={markdown}
                inputs={inputs}
                snapshots={snapshots}
                locale={locale}
                productName={copy.meta.productName}
                canExportPlan={result.validationErrors.length === 0}
                operationStatus={operationMessage}
                onReset={onResetRequest}
                onDeleteAll={onDeleteAllRequest}
              />
            </div>
          </div>
        ) : null}

        {page === 'trend' ? (
          <div className="mx-auto max-w-[82rem] px-4 pb-8 sm:px-6 lg:px-8">
            <BacklogTrend inputs={inputs} snapshots={snapshots} locale={locale} onChange={onSnapshotsChange} labels={makeTrendLabels(copy)} />
          </div>
        ) : null}

        {page === 'methodology' ? (
          <div className="mx-auto max-w-[82rem] space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
            <MethodologyOverview labels={copy.methodology} />
            <Glossary labels={{
              heading: copy.glossary.heading,
              description: copy.glossary.description,
              dueToday: copy.glossary.dueTodayTerm,
              dueTodayDefinition: copy.glossary.dueTodayDefinition,
              queue: copy.glossary.schedulerQueueTerm,
              queueDefinition: copy.glossary.schedulerQueueDefinition,
              overdue: copy.glossary.overdueBacklogTerm,
              overdueDefinition: copy.glossary.overdueBacklogDefinition,
              hard: copy.glossary.hardCardsTerm,
              hardDefinition: copy.glossary.hardCardsDefinition,
            }} />
            <PrivacyAndLimitations labels={{
              heading: copy.privacy.heading,
              localHeading: copy.privacy.localHeading,
              localDescription: copy.privacy.localBody,
              connection: copy.privacy.connectionBody,
              limitationsHeading: copy.privacy.limitationsHeading,
              limitations: copy.privacy.limitationsBody,
              destructive: copy.privacy.destructiveWarning,
              hardHeading: copy.privacy.hardCardsHeading,
              hardCan: copy.privacy.hardCardsCanBody,
              hardCannot: copy.privacy.hardCardsBody,
            }} />
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-[82rem] px-4 py-7 text-xs leading-6 text-slate-600 sm:px-6 lg:px-8">{copy.footer.disclaimer}</p>
      </footer>

      <ConfirmDialog
        open={resetOpen}
        title={copy.confirm.resetPlanTitle}
        description={copy.confirm.resetPlanBody}
        confirmLabel={copy.confirm.confirmResetPlan}
        cancelLabel={copy.confirm.cancel}
        onCancel={onResetCancel}
        onConfirm={onResetConfirm}
      />
      <ConfirmDialog
        open={deleteAllOpen}
        title={copy.confirm.deleteAllTitle}
        description={copy.confirm.deleteAllBody}
        confirmLabel={copy.confirm.confirmDeleteAll}
        cancelLabel={copy.confirm.cancel}
        onCancel={onDeleteAllCancel}
        onConfirm={() => onDeleteAllConfirm(navigate)}
      />
    </div>
  )
}

type Copy = ReturnType<typeof getTranslation>

function makeFieldLabels(copy: Copy) {
  const field = copy.form.fields
  return {
    overdueBacklog: field.overdueBacklog,
    typicalDailyReviews: field.typicalDailyReviews,
    dueToday: field.dueToday,
    schedulerQueueNow: field.schedulerQueueNow,
    dailyMinutes: { ...field.dailyMinutes, unit: copy.common.minutes },
    averageSecondsPerReview: { ...field.averageSecondsPerReview, unit: copy.common.seconds },
    newCardsPerDay: field.newCardsPerDay,
    newCardReviewEquivalent: field.newCardReviewEquivalent,
    hardCardCount: field.hardCardCount,
    hardCardReviewsPerDay: field.hardCardReviewsPerDay,
    extraSecondsPerHardReview: { ...field.extraSecondsPerHardReview, unit: copy.common.seconds },
    plannedAdditionalCards: field.plannedAdditionalCards,
    plannedAdditionalCardsDays: { ...field.plannedAdditionalCardsDays, unit: copy.common.days },
    potentiallyTriagedCards: field.potentiallyTriagedCards,
    targetDate: field.targetDate,
  }
}

function makeBreakdownLabels(copy: Copy) {
  return {
    heading: copy.breakdown.heading,
    description: copy.breakdown.description,
    normal: copy.breakdown.normalReviews,
    normalNote: copy.breakdown.normalReviewsHelp,
    newCards: copy.breakdown.newCardBurden,
    newCardsNote: copy.breakdown.newCardBurdenHelp,
    hardCards: copy.breakdown.hardCardOverhead,
    hardCardsNote: copy.breakdown.hardCardOverheadHelp,
    backlogTime: copy.breakdown.backlogTime,
    backlogTimePositive: copy.breakdown.backlogTimePositive,
    backlogTimeNegative: copy.breakdown.backlogTimeNone,
    minutesPerDay: copy.common.minutesShort,
  }
}

function makeScenarioLabels(copy: Copy) {
  return {
    heading: copy.scenarios.heading,
    description: copy.scenarios.description,
    current: copy.scenarios.current,
    pause: { title: copy.scenarios.pause.title, description: copy.scenarios.pause.description, freed: copy.scenarios.pause.minutesFreed, difference: copy.scenarios.pause.improvesBy },
    target: { title: copy.scenarios.target.title, description: copy.scenarios.target.description, workingDays: copy.scenarios.target.workingDays, requiredBacklog: copy.scenarios.target.backlogPerDay, totalReviews: copy.scenarios.target.totalReviews, requiredMinutes: copy.scenarios.target.minutes, adjustmentOptions: copy.scenarios.target.unrealisticExplanation },
    reduce: { title: copy.scenarios.reduceScope.title, description: copy.scenarios.reduceScope.description, before: copy.scenarios.reduceScope.before, after: copy.scenarios.reduceScope.after, onePassChange: copy.scenarios.reduceScope.onePassChange, scopeOnly: copy.scenarios.reduceScope.disclaimer },
    add: { title: copy.scenarios.addCards.title, description: copy.scenarios.addCards.description, addedPerDay: copy.scenarios.addCards.addedPerDay, workloadChange: copy.scenarios.addCards.workloadChange, resultingDirection: copy.scenarios.addCards.direction, targetFeasibility: copy.scenarios.addCards.target, rough: copy.scenarios.roughEstimate },
    recurring: copy.scenarios.current.recurringWorkload,
    backlogTime: copy.scenarios.current.backlogTime,
    dailyDelta: copy.scenarios.current.dailyDelta,
    direction: copy.scenarios.current.direction,
    onePass: copy.summary.onePassLabel,
    targetFeasibility: copy.scenarios.current.target,
    directions: copy.direction,
    feasibility: copy.feasibility,
    minutesPerDay: copy.common.minutesShort,
    cardsPerDay: copy.common.cardsPerDay,
    days: copy.common.studyDays,
    unavailable: copy.common.notAvailable,
    noChange: copy.common.noChange,
    noBacklog: copy.summary.onePassComplete,
  }
}

function makeTrendLabels(copy: Copy) {
  return {
    eyebrow: copy.trend.newestFirst,
    heading: copy.trend.heading,
    description: copy.trend.description,
    localOnly: copy.trust.localOnly,
    saveToday: copy.trend.saveToday,
    updateSnapshot: copy.trend.updateSnapshot,
    cancelEdit: copy.trend.cancelEdit,
    date: copy.trend.date,
    overdue: copy.trend.overdueBacklog,
    dueToday: copy.trend.dueToday,
    queue: copy.trend.schedulerQueue,
    hardCards: copy.trend.hardCards,
    note: copy.trend.note,
    notePlaceholder: copy.trend.notePlaceholder,
    empty: copy.trend.empty,
    trend: copy.trend.trendLabel,
    directions: { up: copy.trend.up, flat: copy.trend.flat, down: copy.trend.down },
    insufficient: copy.trend.insufficient,
    latestChange: copy.trend.change,
    sevenDayAverage: copy.trend.sevenDayAverage,
    needsSeven: copy.trend.sevenDayInsufficient,
    previousChange: copy.trend.change,
    firstSnapshot: copy.common.notAvailable,
    edit: copy.trend.edit,
    delete: copy.trend.delete,
    deleteTitle: copy.confirm.deleteSnapshotTitle,
    deleteDescription: copy.confirm.deleteSnapshotBody,
    confirmDelete: copy.confirm.confirmDelete,
    cancel: copy.confirm.cancel,
    saved: copy.trend.saved,
    updated: copy.trend.updated,
    contextNote: copy.trend.contextOnly,
    sparkline: copy.trend.sparklineLabel,
    required: copy.trend.required,
    invalidDate: copy.trend.invalidDate,
    invalidNumber: copy.trend.invalidNumber,
    nonNegative: copy.trend.nonNegative,
    wholeNumber: copy.trend.wholeNumber,
    tooLarge: copy.trend.tooLarge,
    duplicateDate: copy.trend.duplicateDate,
    noteTooLong: copy.trend.noteTooLong,
  }
}

function makeExportLabels(copy: Copy): ExportLabels {
  return {
    title: copy.export.markdownTitle,
    generated: copy.export.generatedLocally,
    inputs: copy.export.inputsHeading,
    results: copy.export.summaryHeading,
    recommendation: copy.export.recommendationHeading,
    overdueBacklog: copy.form.fields.overdueBacklog.label,
    typicalDailyReviews: copy.form.fields.typicalDailyReviews.label,
    dailyMinutes: copy.form.fields.dailyMinutes.label,
    averageSeconds: copy.form.fields.averageSecondsPerReview.label,
    newCardsPerDay: copy.form.fields.newCardsPerDay.label,
    targetDate: copy.form.fields.targetDate.label,
    direction: copy.scenarios.current.direction,
    recurringMinutes: copy.scenarios.current.recurringWorkload,
    backlogReduction: copy.scenarios.pause.reduction,
    onePass: copy.summary.onePassLabel,
    feasibility: copy.scenarios.target.feasibility,
    unavailable: copy.common.notAvailable,
    days: copy.common.studyDays,
    cardsPerDay: copy.common.cardsPerDay,
    minutesPerDay: copy.common.minutes,
    csvDate: copy.trend.date,
    csvOverdue: copy.trend.overdueBacklog,
    csvDueToday: copy.trend.dueToday,
    csvQueue: copy.trend.schedulerQueue,
    csvHardCards: copy.trend.hardCards,
    csvNote: copy.trend.note,
  }
}

function getPrimaryCause(inputs: PlannerInputs, metrics: PlanMetrics, summary: Copy['summary']): string {
  if (inputs.averageSecondsPerReview >= 20 && metrics.recurringDailySeconds >= metrics.dailyAvailableSeconds) {
    return summary.heavySlowReviews
  }
  const recurring = [
    [metrics.normalRecurringReviewSeconds, summary.heavyNormal],
    [metrics.newCardReviewSecondsPerDay, summary.heavyNewCards],
    [metrics.hardCardExtraSecondsPerDay, summary.heavyHardCards],
  ] as const
  if (metrics.recurringDailySeconds === 0) return metrics.activeBacklog > 0 ? summary.heavyBacklog : summary.noRecurringLoad
  const largest = [...recurring].sort((left, right) => right[0] - left[0])[0]
  if (metrics.activeBacklog > 0 && metrics.onePassDays !== null && metrics.onePassDays >= 14 && largest[0] < metrics.dailyAvailableSeconds * 0.6) return summary.heavyBacklog
  return largest[1]
}

function getDirectionAnswer(metrics: PlanMetrics, summary: Copy['summary']): string {
  if (metrics.activeBacklog === 0) {
    if (metrics.direction === 'growing') return summary.directionNoBacklogGrowing
    if (metrics.direction === 'flat') return summary.directionNoBacklogFlat
    return summary.directionNoBacklogCapacity
  }
  if (metrics.direction === 'growing') return summary.directionGrowing
  if (metrics.direction === 'flat') return summary.directionFlat
  return summary.directionShrinking
}
