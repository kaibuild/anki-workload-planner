import type { en } from './en'

export const LOCALES = ['en', 'ja'] as const

export type Locale = (typeof LOCALES)[number]

type WidenStringLeaves<T> = {
  readonly [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly unknown[]
      ? T[K]
      : WidenStringLeaves<T[K]>
}

/** The English dictionary is the canonical schema; every locale must match it. */
export type Translation = WidenStringLeaves<typeof en>

export type RecommendationTranslationKey = keyof Translation['recommendations']
