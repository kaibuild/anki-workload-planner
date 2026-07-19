import { en } from './en'
import { ja } from './ja'
import { LOCALES, type Locale, type Translation } from './types'

export { en } from './en'
export { ja } from './ja'
export { LOCALES }
export type { Locale, RecommendationTranslationKey, Translation } from './types'

export const LOCALE_STORAGE_KEY = 'anki-workload-planner:locale:v1'

export const translations = { en, ja } satisfies Record<Locale, Translation>

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function getTranslation(locale: Locale): Translation {
  return translations[locale]
}

export const getTranslations = getTranslation

export function localeFromLanguageTag(languageTag: unknown): Locale | null {
  if (typeof languageTag !== 'string') return null

  const normalized = languageTag.trim().toLowerCase()
  if (/^ja(?:-|$)/.test(normalized)) return 'ja'
  if (/^en(?:-|$)/.test(normalized)) return 'en'
  return null
}

export function resolveLocale(
  urlLocale: unknown,
  savedLocale: unknown,
  browser: Pick<Navigator, 'language' | 'languages'> | undefined =
    typeof navigator === 'undefined' ? undefined : navigator,
): Locale {
  const explicitUrlLocale = localeFromLanguageTag(urlLocale)
  if (explicitUrlLocale) return explicitUrlLocale
  if (isLocale(savedLocale)) return savedLocale

  if (browser) {
    for (const language of browser.languages ?? []) {
      const locale = localeFromLanguageTag(language)
      if (locale) return locale
    }

    const primaryLocale = localeFromLanguageTag(browser.language)
    if (primaryLocale) return primaryLocale
  }

  return 'en'
}

export function detectBrowserLocale(
  browser: Pick<Navigator, 'language' | 'languages'> | undefined =
    typeof navigator === 'undefined' ? undefined : navigator,
): Locale {
  return resolveLocale(null, null, browser)
}

export function loadStoredLocale(storage?: Pick<Storage, 'getItem'>): Locale | null {
  const target = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
  if (!target) return null

  try {
    const value = target.getItem(LOCALE_STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function getInitialLocale(
  storage?: Pick<Storage, 'getItem'>,
  browser?: Pick<Navigator, 'language' | 'languages'>,
): Locale {
  return resolveLocale(null, loadStoredLocale(storage), browser)
}

export function saveLocale(locale: Locale, storage?: Pick<Storage, 'setItem'>): void {
  const target = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage)
  if (!target) return

  try {
    target.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // A denied or full localStorage must not prevent the planner from working.
  }
}

export function applyDocumentLocale(locale: Locale, documentTarget?: Document): void {
  const target = documentTarget ?? (typeof document === 'undefined' ? undefined : document)
  if (!target) return
  target.documentElement.lang = locale
  target.title = translations[locale].meta.documentTitle
}

export function localeTag(locale: Locale): 'en-US' | 'ja-JP' {
  return locale === 'ja' ? 'ja-JP' : 'en-US'
}

export function formatNumber(value: number, locale: Locale, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits,
  }).format(value)
}

export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 0 }).format(value)
}

export function formatDate(value: Date | string, locale: Locale): string {
  const date = typeof value === 'string' ? parseLocalDate(value) : value
  if (!date || Number.isNaN(date.getTime())) return translations[locale].common.notAvailable

  return new Intl.DateTimeFormat(localeTag(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function interpolate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  )
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null
}
