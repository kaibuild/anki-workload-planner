import type { Locale } from '../i18n'

export const APP_PAGES = ['plan', 'trend', 'methodology'] as const
export type AppPage = (typeof APP_PAGES)[number]

export function isAppPage(value: unknown): value is AppPage {
  return typeof value === 'string' && (APP_PAGES as readonly string[]).includes(value)
}

export function localizedPath(locale: Locale, page: AppPage): string {
  return `/${locale}/${page}`
}
