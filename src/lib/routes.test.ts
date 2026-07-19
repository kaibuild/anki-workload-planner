import { describe, expect, it } from 'vitest'
import { isAppPage, localizedPath, safeHttpUrl } from './routes'

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
})

describe('optional source URL', () => {
  it('allows only HTTP(S) URLs', () => {
    expect(safeHttpUrl('https://example.com/source')).toBe('https://example.com/source')
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeHttpUrl('not a URL')).toBeUndefined()
  })
})
