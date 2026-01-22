/**
 * Query Preview Panel Tests
 * Tests for the query preview component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createQueryPreview,
  updateQueryPreview,
  cleanup,
} from './query-preview'

describe('Query Preview Panel', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    cleanup()
    container.remove()
  })

  describe('createQueryPreview', () => {
    it('should return a footer element', () => {
      const preview = createQueryPreview()
      expect(preview.tagName.toLowerCase()).toBe('footer')
    })

    it('should have class "query-preview"', () => {
      const preview = createQueryPreview()
      expect(preview.classList.contains('query-preview')).toBe(true)
    })

    it('should have role="region"', () => {
      const preview = createQueryPreview()
      expect(preview.getAttribute('role')).toBe('region')
    })

    it('should have aria-label="Query preview"', () => {
      const preview = createQueryPreview()
      expect(preview.getAttribute('aria-label')).toBe('Query preview')
    })

    it('should be hidden by default', () => {
      const preview = createQueryPreview()
      expect(preview.classList.contains('query-preview--hidden')).toBe(true)
    })

    it('should have aria-hidden="true" when hidden', () => {
      const preview = createQueryPreview()
      expect(preview.getAttribute('aria-hidden')).toBe('true')
    })

    it('should contain a pre element for content', () => {
      const preview = createQueryPreview()
      const content = preview.querySelector('.query-preview__content')
      expect(content).not.toBeNull()
      expect(content?.tagName.toLowerCase()).toBe('pre')
    })
  })

  describe('updateQueryPreview', () => {
    it('should show panel when SQL provided', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview('SELECT * FROM Users')

      expect(preview.classList.contains('query-preview--hidden')).toBe(false)
    })

    it('should hide panel when null provided', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      // First show it
      updateQueryPreview('SELECT * FROM Users')
      // Then hide it
      updateQueryPreview(null)

      expect(preview.classList.contains('query-preview--hidden')).toBe(true)
    })

    it('should display SQL content in pre element', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      const sql = 'SELECT * FROM Users WHERE id = 1'
      updateQueryPreview(sql)

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe(sql)
    })

    it('should update content when called multiple times', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview('SELECT * FROM Users')
      updateQueryPreview('SELECT * FROM Orders')

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe('SELECT * FROM Orders')
    })

    it('should preserve whitespace in SQL', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      const sql = `SELECT *
FROM Users
WHERE status = 'active'`
      updateQueryPreview(sql)

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe(sql)
    })

    it('should clear content when hiding', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview('SELECT * FROM Users')
      updateQueryPreview(null)

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe('')
    })

    it('should remove aria-hidden when visible', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview('SELECT * FROM Users')

      expect(preview.getAttribute('aria-hidden')).toBe('false')
    })

    it('should set aria-hidden="true" when hidden', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview('SELECT * FROM Users')
      updateQueryPreview(null)

      expect(preview.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('styling', () => {
    it('should have query-preview__content class for styling', () => {
      const preview = createQueryPreview()
      const content = preview.querySelector('pre')
      expect(content?.classList.contains('query-preview__content')).toBe(true)
    })

    it('should handle long multi-line SQL content', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      // Create a 10+ line SQL query to test scrollability
      const longSql = `SELECT
  u.id,
  u.username,
  u.email,
  u.created_at,
  u.updated_at,
  p.first_name,
  p.last_name,
  p.phone
FROM Users u
INNER JOIN Profiles p ON u.id = p.user_id
WHERE u.status = 'active'
  AND u.created_at > '2025-01-01'
ORDER BY u.created_at DESC
LIMIT 100`
      updateQueryPreview(longSql)

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe(longSql)
      // Verify the content preserves all line breaks
      expect(content?.textContent?.split('\n').length).toBeGreaterThan(10)
    })
  })

  describe('cleanup', () => {
    it('should reset module state', () => {
      createQueryPreview()
      updateQueryPreview('SELECT * FROM Users')

      cleanup()

      // Creating a new preview should start fresh
      const newPreview = createQueryPreview()
      expect(newPreview.classList.contains('query-preview--hidden')).toBe(true)
    })
  })
})
