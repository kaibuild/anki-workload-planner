import { describe, expect, it } from 'vitest'
import {
  detectBrowserLocale,
  en,
  formatUnitCount,
  getInitialLocale,
  ja,
  loadStoredLocale,
  localeFromLanguageTag,
  resolveLocale,
  saveLocale,
  translations,
  type Locale,
} from './index'

function leafEntries(value: unknown, prefix = ''): Array<[string, unknown]> {
  if (typeof value !== 'object' || value === null) return [[prefix, value]]

  return Object.entries(value).flatMap(([key, nested]) =>
    leafEntries(nested, prefix ? `${prefix}.${key}` : key),
  )
}

describe('translation dictionaries', () => {
  it('contains exactly the same keys in English and Japanese', () => {
    const englishKeys = leafEntries(en).map(([key]) => key).sort()
    const japaneseKeys = leafEntries(ja).map(([key]) => key).sort()

    expect(japaneseKeys).toEqual(englishKeys)
  })

  it.each(Object.entries(translations) as Array<[Locale, typeof en | typeof ja]>) (
    '%s contains no missing or empty required translation',
    (_locale, dictionary) => {
      const leaves = leafEntries(dictionary)
      expect(leaves.length).toBeGreaterThan(150)
      for (const [key, value] of leaves) {
        expect(value, key).toBeTypeOf('string')
        expect((value as string).trim(), key).not.toBe('')
      }
    },
  )

  it('includes the required one-pass and trust language in both locales', () => {
    expect(en.summary.onePassLabel).toBe(
      'Estimated study days for one pass through entered overdue cards',
    )
    expect(ja.summary.onePassLabel).toBe('期限超過として入力したカードを一巡する推定学習日数')
    expect(en.trust.strip).toBe('Browser-only · No login · No uploads · No AI')
    expect(ja.trust.strip).toBe(
      'ブラウザ内で完結 · ログイン不要 · アップロードなし · AI不使用',
    )
    expect(en.privacy.connectionBody).toContain('Cloudflare Web Analytics')
    expect(en.privacy.connectionBody).toContain('planner inputs, snapshots, notes, and exports are not sent')
    expect(ja.privacy.connectionBody).toContain('Cloudflare Web Analytics')
    expect(ja.privacy.connectionBody).toContain('計画の入力値、snapshot、メモ、書き出し内容は送信しません')
  })

  it('distinguishes hard-card calculation inputs from context-only count in both locales', () => {
    expect(en.form.fields.hardCardCount.helper).toContain('does not affect the estimate')
    expect(en.form.fields.hardCardReviewsPerDay.helper).toContain('Used in the estimate')
    expect(en.form.fields.extraSecondsPerHardReview.helper).toContain('Used in the estimate')
    expect(en.form.hardCards.previewMissingReviews).toContain('No hard-card time is currently included')
    expect(en.export.hardCardNoDailyOverheadCountContext).toContain('recorded as context')

    expect(ja.form.fields.hardCardCount.helper).toContain('単独では負荷の計算に使用しません')
    expect(ja.form.fields.hardCardReviewsPerDay.helper).toContain('推定に使用')
    expect(ja.form.fields.extraSecondsPerHardReview.helper).toContain('推定に使用')
    expect(ja.form.hardCards.previewMissingReviews).toContain('追加時間は計算に含まれていません')
    expect(ja.export.hardCardNoDailyOverheadCountContext).toContain('参考情報として記録')
  })

  it('defines the two Anki workload inputs without relying on colors or Stats answer counts', () => {
    expect(en.form.fields.overdueBacklog.label).toBe('Cards overdue before today')
    expect(ja.form.fields.overdueBacklog.label).toBe('今日より前が期限の未処理カード')
    expect(en.form.fields.overdueBacklog.helper).toContain('Cards due today are not included')
    expect(ja.form.fields.overdueBacklog.helper).toContain('今日が期限のカードは含めません')

    expect(en.form.inputSemantics.findOverdueQuery).toBe('prop:due<=-1')
    expect(ja.form.inputSemantics.findOverdueQuery).toBe('prop:due<=-1')
    expect(en.form.inputSemantics.overdueColorWarning).toContain('red or green')
    expect(ja.form.inputSemantics.overdueColorWarning).toContain('赤・緑')
    expect(en.glossary.colorQuestion).toBe('Are overdue cards red or green?')
    expect(ja.glossary.colorQuestion).toBe('overdueカードは赤ですか、緑ですか？')

    expect(en.form.fields.typicalDailyReviews.label).toBe('Usual review cards due per day')
    expect(ja.form.fields.typicalDailyReviews.label).toBe('普段その日に期限を迎えるレビュー数')
    expect(en.form.fields.typicalDailyReviews.helper).toContain('without counting the overdue cards')
    expect(en.form.fields.typicalDailyReviews.helper).toContain('new cards')
    expect(ja.form.fields.typicalDailyReviews.helper).toContain('期限超過カード')
    expect(ja.form.fields.typicalDailyReviews.helper).toContain('新規カード')
    expect(en.form.inputSemantics.dailyReviewStatsWarning).toContain('counts each answer')
    expect(en.form.inputSemantics.dailyReviewStatsWarning).toContain('more than once')
    expect(ja.form.inputSemantics.dailyReviewStatsWarning).toContain('回答回数')
    expect(ja.form.inputSemantics.dailyReviewStatsWarning).toContain('複数回')
  })

  it('never defines red or green as universally overdue', () => {
    for (const dictionary of [en, ja]) {
      const text = leafEntries(dictionary).map(([, value]) => String(value)).join('\n').toLowerCase()
      expect(text).not.toMatch(/red\s*=\s*overdue|green\s*=\s*overdue/)
      expect(text).not.toContain('赤＝overdue')
      expect(text).not.toContain('緑＝overdue')
    }
  })
})

describe('localized count formatting', () => {
  it.each([
    [0, '0 study days'],
    [1, '1 study day'],
    [2, '2 study days'],
    [-1, '-1 study day'],
  ])('formats %s English study days', (value, expected) => {
    expect(formatUnitCount(value, 'en', en.common.units.studyDay)).toBe(expected)
  })

  it.each([
    [1, '1学習日'],
    [2, '2学習日'],
  ])('formats %s Japanese study days without an unnatural space', (value, expected) => {
    expect(formatUnitCount(value, 'ja', ja.common.units.studyDay)).toBe(expected)
  })

  it('uses singular English card and review units where applicable', () => {
    expect(formatUnitCount(1, 'en', en.common.units.cardPerDay)).toBe('1 card/day')
    expect(formatUnitCount(2, 'en', en.common.units.cardPerDay)).toBe('2 cards/day')
    expect(formatUnitCount(1, 'en', en.common.units.reviewPerDay)).toBe('1 review/day')
    expect(formatUnitCount(2, 'en', en.common.units.reviewPerDay)).toBe('2 reviews/day')
  })
})

describe('locale selection and persistence', () => {
  it('canonicalizes supported BCP 47 language tags', () => {
    expect(localeFromLanguageTag('ja')).toBe('ja')
    expect(localeFromLanguageTag('JA-jp')).toBe('ja')
    expect(localeFromLanguageTag('en-GB')).toBe('en')
    expect(localeFromLanguageTag(' fr-FR ')).toBeNull()
    expect(localeFromLanguageTag('javanese')).toBeNull()
    expect(localeFromLanguageTag(undefined)).toBeNull()
  })

  it('uses the first supported navigator.languages entry', () => {
    expect(
      detectBrowserLocale({ language: 'en-US', languages: ['ja-JP', 'en-US'] }),
    ).toBe('ja')
    expect(
      detectBrowserLocale({ language: 'ja-JP', languages: ['fr-FR', 'en-GB', 'ja-JP'] }),
    ).toBe('en')
    expect(
      detectBrowserLocale({ language: 'en-US', languages: ['fr-FR', 'ja-JP'] }),
    ).toBe('ja')
    expect(detectBrowserLocale({ language: 'en-US', languages: ['en-US'] })).toBe('en')
  })

  it('falls through unsupported language lists to navigator.language and then English', () => {
    expect(
      detectBrowserLocale({ language: 'ja-JP', languages: ['fr-FR', 'de-DE'] }),
    ).toBe('ja')
    expect(
      detectBrowserLocale({ language: 'ko-KR', languages: ['fr-FR', 'de-DE'] }),
    ).toBe('en')
    expect(detectBrowserLocale(undefined)).toBe('en')
  })

  it('resolves URL, saved choice, browser preferences, and fallback in precedence order', () => {
    const japaneseBrowser = { language: 'ja-JP', languages: ['ja-JP'] }
    const englishBrowser = { language: 'en-US', languages: ['en-US'] }

    expect(resolveLocale('en-US', 'ja', japaneseBrowser)).toBe('en')
    expect(resolveLocale('fr-FR', 'ja', englishBrowser)).toBe('ja')
    expect(resolveLocale(null, 'unsupported', japaneseBrowser)).toBe('ja')
    expect(resolveLocale(null, null, englishBrowser)).toBe('en')
    expect(resolveLocale(null, null, { language: 'ko-KR', languages: ['fr-FR'] })).toBe('en')
  })

  it('uses a valid saved locale before the browser locale', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    saveLocale('en', storage)
    expect(loadStoredLocale(storage)).toBe('en')
    expect(getInitialLocale(storage, { language: 'ja-JP', languages: ['ja-JP'] })).toBe('en')
  })

  it('ignores malformed persisted locales', () => {
    const storage = { getItem: () => 'de' }
    expect(loadStoredLocale(storage)).toBeNull()
    expect(getInitialLocale(storage, { language: 'ja', languages: ['ja'] })).toBe('ja')
  })
})
