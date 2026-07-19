import { describe, expect, it } from 'vitest'
import { APP_PAGES, isAppPage, localizedPath } from './routes'

describe('localized routes', () => {
  it('recognizes only the three addressable MVP pages', () => {
    expect(isAppPage('plan')).toBe(true)
    expect(isAppPage('trend')).toBe(true)
    expect(isAppPage('methodology')).toBe(true)
    expect(isAppPage('missing')).toBe(false)
  })

  it('builds stable localized paths', () => {
    expect(localizedPath('ja', 'trend')).toBe('/ja/trend')
  })

  it('builds all six localized application routes', () => {
    expect((['en', 'ja'] as const).flatMap((locale) => APP_PAGES.map((page) => localizedPath(locale, page)))).toEqual([
      '/en/plan',
      '/en/trend',
      '/en/methodology',
      '/ja/plan',
      '/ja/trend',
      '/ja/methodology',
    ])
  })
})
