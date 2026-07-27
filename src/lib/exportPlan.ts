import type { PlannerInputs, PlannerResult } from '../types/planner'
import type { DailySnapshot } from '../types/snapshots'
import { formatUnitCount, type PluralForms } from '../i18n'
import { getBacklogMetricPresentation } from './backlogPresentation'

export type ExportLabels = {
  title: string
  generated: string
  inputs: string
  inputInterpretation: string
  overdueInputRule: string
  usualReviewsInputRule: string
  results: string
  recommendation: string
  overdueBacklog: string
  typicalDailyReviews: string
  dailyMinutes: string
  averageSeconds: string
  newCardsPerDay: string
  targetDate: string
  hardCardHeading: string
  hardCardCount: string
  hardCardReviewsPerDay: string
  extraSecondsPerHardReview: string
  hardCardOverhead: string
  hardCardAddedTime: string
  hardCardReducedCapacity: string
  usedInEstimate: string
  contextOnly: string
  estimatedEffect: string
  hardCardNoDailyOverheadCountContext: string
  hardCardNoDailyOverhead: string
  hardCardOnePassUnchanged: string
  withoutHardCardOverhead: string
  direction: string
  backlogDirection: string
  currentOverdueBacklog: string
  recurringMinutes: string
  onePass: string
  feasibility: string
  unavailable: string
  noBacklog: string
  estimateNote: string
  backlogReductionCapacity: string
  estimatedBacklogGrowth: string
  estimatedBacklogChange: string
  reductionCapacityValue: string
  growthValue: string
  flatValue: string
  fitsWithinOneDay: string
  studyDay: PluralForms
  card: PluralForms
  cardPerDay: PluralForms
  minutesPerDay: string
  csvDate: string
  csvOverdue: string
  csvDueToday: string
  csvQueue: string
  csvHardCards: string
  csvNote: string
}

export function buildPlanMarkdown(
  inputs: PlannerInputs,
  result: PlannerResult,
  locale: 'en' | 'ja',
  labels: ExportLabels,
  localizedDirection: string,
  localizedFeasibility: string,
  recommendation: string,
  now = new Date(),
): string {
  const number = new Intl.NumberFormat(locale)
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(now)
  const targetDate = formatLocalDateForExport(inputs.targetDate, locale, labels.unavailable)
  const onePass = result.current.activeBacklog === 0
    ? labels.noBacklog
    : result.current.onePassDays === null
      ? labels.unavailable
      : formatUnitCount(result.current.onePassDays, locale, labels.studyDay)
  const backlogMetric = getBacklogMetricPresentation(result.current, locale, {
    estimateNote: labels.estimateNote,
    backlogReductionCapacity: labels.backlogReductionCapacity,
    estimatedBacklogGrowth: labels.estimatedBacklogGrowth,
    estimatedBacklogChange: labels.estimatedBacklogChange,
    reductionCapacityValue: labels.reductionCapacityValue,
    growthValue: labels.growthValue,
    flatValue: labels.flatValue,
    fitsWithinOneDay: labels.fitsWithinOneDay,
    noBacklog: labels.noBacklog,
    card: labels.card,
    cardPerDay: labels.cardPerDay,
    studyDay: labels.studyDay,
  })
  const hardCardOverheadMinutes = result.current.hardCardExtraSecondsPerDay / 60
  const hardCardEffectLines = hardCardOverheadMinutes > 0
    ? [
        `- ${labels.estimatedEffect}:`,
        `  - ${labels.hardCardAddedTime}: +${decimal.format(hardCardOverheadMinutes)} ${labels.minutesPerDay}`,
        `  - ${labels.hardCardReducedCapacity}: ${formatUnitCount(result.hardCardImpact.backlogCapacityReductionCardsPerDay, locale, labels.cardPerDay, 1)}`,
        ...hardCardOnePassEffect(result, labels, locale),
      ]
    : [
        inputs.hardCardCount > 0 && inputs.hardCardReviewsPerDay === 0
          ? labels.hardCardNoDailyOverheadCountContext
          : labels.hardCardNoDailyOverhead,
      ]
  return [
    `# ${labels.title}`,
    '',
    `${labels.generated}: ${date}`,
    '',
    `## ${labels.inputs}`,
    '',
    `- ${labels.overdueBacklog}: ${number.format(inputs.overdueBacklog)}`,
    `- ${labels.typicalDailyReviews}: ${number.format(inputs.typicalDailyReviews)}`,
    `- ${labels.dailyMinutes}: ${decimal.format(inputs.dailyMinutes)}`,
    `- ${labels.averageSeconds}: ${decimal.format(inputs.averageSecondsPerReview)}`,
    `- ${labels.newCardsPerDay}: ${number.format(inputs.newCardsPerDay)}`,
    `- ${labels.targetDate}: ${targetDate}`,
    '',
    `### ${labels.inputInterpretation}`,
    '',
    `- ${labels.overdueInputRule}`,
    `- ${labels.usualReviewsInputRule}`,
    '',
    `## ${labels.hardCardHeading}`,
    '',
    `- ${labels.hardCardCount}: ${number.format(inputs.hardCardCount)} (${labels.contextOnly})`,
    `- ${labels.hardCardReviewsPerDay}: ${number.format(inputs.hardCardReviewsPerDay)} (${labels.usedInEstimate})`,
    `- ${labels.extraSecondsPerHardReview}: ${decimal.format(inputs.extraSecondsPerHardReview)} (${labels.usedInEstimate})`,
    `- ${labels.hardCardOverhead}: ${decimal.format(hardCardOverheadMinutes)} ${labels.minutesPerDay}`,
    `- ${labels.recurringMinutes}: ${decimal.format(result.current.recurringDailySeconds / 60)} ${labels.minutesPerDay}`,
    `- ${backlogMetric.label}: ${backlogMetric.value}`,
    `- ${labels.onePass}: ${onePass}`,
    ...hardCardEffectLines,
    '',
    `## ${labels.results}`,
    '',
    `- ${labels.backlogDirection}: ${localizedDirection}`,
    `- ${labels.currentOverdueBacklog}: ${formatUnitCount(result.current.activeBacklog, locale, labels.card)}`,
    `- ${labels.recurringMinutes}: ${decimal.format(result.current.recurringDailySeconds / 60)} ${labels.minutesPerDay}`,
    `- ${backlogMetric.label}: ${backlogMetric.value}`,
    `- ${labels.onePass}: ${onePass}`,
    ...(backlogMetric.note && backlogMetric.note !== labels.estimateNote
      ? [`- ${backlogMetric.note}`]
      : []),
    `- ${labels.estimateNote}`,
    `- ${labels.feasibility}: ${localizedFeasibility}`,
    '',
    `## ${labels.recommendation}`,
    '',
    recommendation,
    '',
  ].join('\n')
}

function hardCardOnePassEffect(
  result: PlannerResult,
  labels: ExportLabels,
  locale: 'en' | 'ja',
): string[] {
  const current = result.current.onePassDays
  const withoutOverhead = result.hardCardImpact.onePassDaysWithoutOverhead
  if (result.current.activeBacklog === 0 || current === null || withoutOverhead === null) return []

  const comparison = result.hardCardImpact.onePassDaysDifference &&
    result.hardCardImpact.onePassDaysDifference > 0
    ? `${formatUnitCount(current, locale, labels.studyDay)} (${labels.withoutHardCardOverhead}: ${formatUnitCount(withoutOverhead, locale, labels.studyDay)})`
    : `${formatUnitCount(current, locale, labels.studyDay)} · ${labels.hardCardOnePassUnchanged}`
  return [`  - ${labels.onePass}: ${comparison}`]
}

export function buildSnapshotsCsv(
  snapshots: readonly DailySnapshot[],
  labels: ExportLabels,
): string {
  const rows = snapshots.map((snapshot) => [
    snapshot.date,
    String(snapshot.overdueBacklog),
    valueOrEmpty(snapshot.dueToday),
    valueOrEmpty(snapshot.schedulerQueueNow),
    valueOrEmpty(snapshot.hardCardCount),
    protectSpreadsheetText(snapshot.note ?? ''),
  ])
  return [
    [labels.csvDate, labels.csvOverdue, labels.csvDueToday, labels.csvQueue, labels.csvHardCards, labels.csvNote],
    ...rows,
  ]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n')
}

export function buildAllDataJson(
  inputs: PlannerInputs,
  snapshots: readonly DailySnapshot[],
  locale: 'en' | 'ja',
  productName: string,
): string {
  return JSON.stringify(
    { schemaVersion: 1, productName, locale, exportedAt: new Date().toISOString(), inputs, snapshots },
    null,
    2,
  )
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function downloadText(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function valueOrEmpty(value: number | undefined): string {
  return value === undefined ? '' : String(value)
}

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function protectSpreadsheetText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

function formatLocalDateForExport(
  value: string,
  locale: 'en' | 'ja',
  unavailable: string,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return unavailable

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return unavailable
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}
