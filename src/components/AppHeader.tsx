import { Link, NavLink } from 'react-router-dom'
import type { Locale } from '../i18n'
import { localizedPath, type AppPage } from '../lib/routes'
import { LanguageSwitcher } from './LanguageSwitcher'

export type HeaderLabels = {
  productName: string
  languageLabel: string
  english: string
  japanese: string
  primaryNavigation: string
  plan: string
  trend: string
  methodology: string
}

export function AppHeader({
  labels,
  locale,
  page,
  onLocaleChange,
}: {
  labels: HeaderLabels
  locale: Locale
  page: AppPage
  onLocaleChange: (locale: Locale) => void
}) {
  const pages: Array<[AppPage, string]> = [
    ['plan', labels.plan],
    ['trend', labels.trend],
    ['methodology', labels.methodology],
  ]

  return (
    <header className="border-b border-slate-200/80 bg-white" data-page={page}>
      <div className="mx-auto max-w-[82rem] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 py-2 md:flex-nowrap md:gap-5">
          <Link
            className="flex min-w-0 items-center gap-2 rounded-lg text-sm font-semibold text-slate-950"
            to={localizedPath(locale, 'plan')}
          >
            <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-800 text-white sm:grid" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path d="M6 16.5V11m6 5.5V7m6 9.5V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0 max-w-[9rem] truncate sm:max-w-none">{labels.productName}</span>
          </Link>

          <nav aria-label={labels.primaryNavigation} className="order-3 mt-2 w-full border-t border-slate-100 pt-2 md:order-none md:mt-0 md:w-auto md:flex-1 md:border-0 md:pt-0">
            <div className="grid grid-cols-3 gap-1 md:flex md:items-center md:justify-center md:gap-1">
              {pages.map(([target, label]) => (
                <NavLink
                  className={({ isActive }) => `flex min-h-11 min-w-0 items-center justify-center rounded-lg px-2 text-center text-xs font-semibold leading-4 transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-100 text-teal-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                  end
                  key={target}
                  to={localizedPath(locale, target)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>

          <LanguageSwitcher locale={locale} label={labels.languageLabel} english={labels.english} japanese={labels.japanese} onChange={onLocaleChange} />
        </div>
      </div>
    </header>
  )
}
