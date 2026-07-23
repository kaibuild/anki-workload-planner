import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const headers = readFileSync(resolve('public/_headers'), 'utf8')
const csp = headers
  .split('\n')
  .find((line) => line.trim().startsWith('Content-Security-Policy:'))

describe('production security headers', () => {
  it('allows only the reviewed Cloudflare Web Analytics script and same-origin beacon endpoint', () => {
    expect(csp).toContain(
      "script-src 'self' https://static.cloudflareinsights.com/beacon.min.js",
    )
    expect(csp).toContain("connect-src 'self'")
    expect(csp).not.toContain('script-src *')
    expect(csp).not.toContain('connect-src *')
  })
})
