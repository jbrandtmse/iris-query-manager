import { describe, it, expect } from 'vitest'
import { isSmpUrl, SMP_URL_PATTERN } from './url-utils'

describe('url-utils', () => {
  describe('SMP_URL_PATTERN', () => {
    it('exports the correct URL-encoded pattern', () => {
      expect(SMP_URL_PATTERN).toBe('%25CSP.UI.Portal.SQL.Home.zen')
    })
  })

  describe('isSmpUrl', () => {
    it('returns true for SMP SQL page URL', () => {
      const url = 'http://localhost:52773/csp/sys/%25CSP.UI.Portal.SQL.Home.zen'
      expect(isSmpUrl(url)).toBe(true)
    })

    it('returns true for SMP URL with query parameters', () => {
      const url =
        'http://localhost:52773/csp/sys/%25CSP.UI.Portal.SQL.Home.zen?$NAMESPACE=USER'
      expect(isSmpUrl(url)).toBe(true)
    })

    it('returns true for HTTPS SMP URL', () => {
      const url = 'https://iris-server:443/csp/sys/%25CSP.UI.Portal.SQL.Home.zen'
      expect(isSmpUrl(url)).toBe(true)
    })

    it('returns false for non-SMP URL', () => {
      const url = 'https://www.google.com'
      expect(isSmpUrl(url)).toBe(false)
    })

    it('returns false for partial SMP pattern', () => {
      const url = 'http://localhost:52773/csp/sys/Portal.SQL.Home.zen'
      expect(isSmpUrl(url)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isSmpUrl('')).toBe(false)
    })

    it('returns false for SMP management portal (not SQL page)', () => {
      const url = 'http://localhost:52773/csp/sys/%25CSP.UI.Portal.Home.zen'
      expect(isSmpUrl(url)).toBe(false)
    })
  })
})
