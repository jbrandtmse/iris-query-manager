/**
 * Warning Badge Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createWarningBadge } from './warning-badge'
import type { DestructiveKeyword, Severity } from '../../shared/services/sql-detection-service'

describe('warning-badge', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('createWarningBadge', () => {
    it('should create a span element', () => {
      const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })
      expect(badge).toBeInstanceOf(HTMLSpanElement)
    })

    it('should have warning-badge base class', () => {
      const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })
      expect(badge.classList.contains('warning-badge')).toBe(true)
    })
  })

  describe('danger badge creation (AC: 1)', () => {
    it('should create danger badge for DELETE keyword', () => {
      const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })

      expect(badge.textContent).toBe('DELETE')
      expect(badge.classList.contains('warning-badge')).toBe(true)
      expect(badge.classList.contains('warning-badge--danger')).toBe(true)
    })

    it('should create danger badge for DROP keyword', () => {
      const badge = createWarningBadge({ keyword: 'DROP', severity: 'danger' })

      expect(badge.textContent).toBe('DROP')
      expect(badge.classList.contains('warning-badge--danger')).toBe(true)
    })

    it('should create danger badge for TRUNCATE keyword', () => {
      const badge = createWarningBadge({ keyword: 'TRUNCATE', severity: 'danger' })

      expect(badge.textContent).toBe('TRUNCATE')
      expect(badge.classList.contains('warning-badge--danger')).toBe(true)
    })
  })

  describe('caution badge creation (AC: 2)', () => {
    it('should create caution badge for UPDATE keyword', () => {
      const badge = createWarningBadge({ keyword: 'UPDATE', severity: 'caution' })

      expect(badge.textContent).toBe('UPDATE')
      expect(badge.classList.contains('warning-badge')).toBe(true)
      expect(badge.classList.contains('warning-badge--caution')).toBe(true)
    })

    it('should create caution badge for ALTER keyword', () => {
      const badge = createWarningBadge({ keyword: 'ALTER', severity: 'caution' })

      expect(badge.textContent).toBe('ALTER')
      expect(badge.classList.contains('warning-badge--caution')).toBe(true)
    })

    it('should create caution badge for INSERT keyword', () => {
      const badge = createWarningBadge({ keyword: 'INSERT', severity: 'caution' })

      expect(badge.textContent).toBe('INSERT')
      expect(badge.classList.contains('warning-badge--caution')).toBe(true)
    })
  })

  describe('CSS classes (AC: 4)', () => {
    it('should apply warning-badge--danger class for danger severity', () => {
      const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })

      expect(badge.classList.contains('warning-badge--danger')).toBe(true)
      expect(badge.classList.contains('warning-badge--caution')).toBe(false)
    })

    it('should apply warning-badge--caution class for caution severity', () => {
      const badge = createWarningBadge({ keyword: 'UPDATE', severity: 'caution' })

      expect(badge.classList.contains('warning-badge--caution')).toBe(true)
      expect(badge.classList.contains('warning-badge--danger')).toBe(false)
    })

    it('should always have warning-badge base class', () => {
      const dangerBadge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })
      const cautionBadge = createWarningBadge({ keyword: 'UPDATE', severity: 'caution' })

      expect(dangerBadge.classList.contains('warning-badge')).toBe(true)
      expect(cautionBadge.classList.contains('warning-badge')).toBe(true)
    })
  })

  describe('text content', () => {
    it('should display the keyword as text content', () => {
      const keywords: DestructiveKeyword[] = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'ALTER', 'INSERT']

      for (const keyword of keywords) {
        const severity: Severity = ['DELETE', 'DROP', 'TRUNCATE'].includes(keyword) ? 'danger' : 'caution'
        const badge = createWarningBadge({ keyword, severity })
        expect(badge.textContent).toBe(keyword)
      }
    })
  })

  describe('accessibility attributes (AC: 5)', () => {
    it('should have role="status"', () => {
      const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })

      expect(badge.getAttribute('role')).toBe('status')
    })

    it('should have aria-label for DELETE keyword', () => {
      const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })

      expect(badge.getAttribute('aria-label')).toBe('Destructive query: DELETE')
    })

    it('should have aria-label for DROP keyword', () => {
      const badge = createWarningBadge({ keyword: 'DROP', severity: 'danger' })

      expect(badge.getAttribute('aria-label')).toBe('Destructive query: DROP')
    })

    it('should have aria-label for UPDATE keyword', () => {
      const badge = createWarningBadge({ keyword: 'UPDATE', severity: 'caution' })

      expect(badge.getAttribute('aria-label')).toBe('Caution: UPDATE')
    })

    it('should have aria-label for all keywords', () => {
      const keywords: DestructiveKeyword[] = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'ALTER', 'INSERT']

      for (const keyword of keywords) {
        const severity: Severity = ['DELETE', 'DROP', 'TRUNCATE'].includes(keyword) ? 'danger' : 'caution'
        const badge = createWarningBadge({ keyword, severity })
        const expectedPrefix = severity === 'danger' ? 'Destructive query' : 'Caution'
        expect(badge.getAttribute('aria-label')).toBe(`${expectedPrefix}: ${keyword}`)
      }
    })
  })
})
