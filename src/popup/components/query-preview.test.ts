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
import type { Query } from '../../shared/types/storage.types'

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
    const createTestQuery = (overrides: Partial<Query> = {}): Query => ({
      id: '1',
      name: 'Test Query',
      sql: 'SELECT * FROM Users',
      folderId: null,
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z',
      ...overrides,
    })

    it('should show panel when query provided', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview(createTestQuery())

      expect(preview.classList.contains('query-preview--hidden')).toBe(false)
    })

    it('should hide panel when null provided', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      // First show it
      updateQueryPreview(createTestQuery())
      // Then hide it
      updateQueryPreview(null)

      expect(preview.classList.contains('query-preview--hidden')).toBe(true)
    })

    it('should display SQL content in pre element', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      const sql = 'SELECT * FROM Users WHERE id = 1'
      updateQueryPreview(createTestQuery({ sql }))

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe(sql)
    })

    it('should update content when called multiple times', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview(createTestQuery({ sql: 'SELECT * FROM Users' }))
      updateQueryPreview(createTestQuery({ sql: 'SELECT * FROM Orders' }))

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe('SELECT * FROM Orders')
    })

    it('should preserve whitespace in SQL', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      const sql = `SELECT *
FROM Users
WHERE status = 'active'`
      updateQueryPreview(createTestQuery({ sql }))

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe(sql)
    })

    it('should clear content when hiding', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview(createTestQuery())
      updateQueryPreview(null)

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe('')
    })

    it('should remove aria-hidden when visible', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview(createTestQuery())

      expect(preview.getAttribute('aria-hidden')).toBe('false')
    })

    it('should set aria-hidden="true" when hidden', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)

      updateQueryPreview(createTestQuery())
      updateQueryPreview(null)

      expect(preview.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('styling', () => {
    const createTestQuery = (overrides: Partial<Query> = {}): Query => ({
      id: '1',
      name: 'Test Query',
      sql: 'SELECT * FROM Users',
      folderId: null,
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z',
      ...overrides,
    })

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
      updateQueryPreview(createTestQuery({ sql: longSql }))

      const content = preview.querySelector('.query-preview__content')
      expect(content?.textContent).toBe(longSql)
      // Verify the content preserves all line breaks
      expect(content?.textContent?.split('\n').length).toBeGreaterThan(10)
    })
  })

  describe('cleanup', () => {
    it('should reset module state', () => {
      createQueryPreview()
      const query: Query = {
        id: '1',
        name: 'Test Query',
        sql: 'SELECT * FROM Users',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      updateQueryPreview(query)

      cleanup()

      // Creating a new preview should start fresh
      const newPreview = createQueryPreview()
      expect(newPreview.classList.contains('query-preview--hidden')).toBe(true)
    })
  })

  describe('metadata display', () => {
    it('should display created and modified dates when query provided', () => {
      const query: Query = {
        id: '1',
        name: 'Test Query',
        sql: 'SELECT 1',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-21T15:30:00.000Z',
      }
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(query)

      const metadata = preview.querySelector('.query-preview__metadata')
      expect(metadata).not.toBeNull()
      expect(metadata?.textContent).toContain('Created:')
      expect(metadata?.textContent).toContain('Modified:')
    })

    it('should hide metadata when query is null', () => {
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(null)

      // Check panel is hidden (has --hidden class)
      expect(preview.classList.contains('query-preview--hidden')).toBe(true)
    })

    it('should use toLocaleDateString for formatting', () => {
      const query: Query = {
        id: '1',
        name: 'Test Query',
        sql: 'SELECT 1',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(query)

      const expectedDate = new Date('2026-01-20T10:00:00.000Z').toLocaleDateString()
      expect(preview.textContent).toContain(expectedDate)
    })

    it('should display same createdAt and updatedAt correctly for new queries', () => {
      const timestamp = '2026-01-22T12:00:00.000Z'
      const query: Query = {
        id: '1',
        name: 'New Query',
        sql: 'SELECT 1',
        folderId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(query)

      const metadata = preview.querySelector('.query-preview__metadata')
      const expectedDate = new Date(timestamp).toLocaleDateString()

      // Both dates should be displayed even if same
      const items = metadata?.querySelectorAll('.query-preview__metadata-item')
      expect(items?.length).toBe(2)
      expect(items?.[0]?.textContent).toContain(expectedDate)
      expect(items?.[1]?.textContent).toContain(expectedDate)
    })

    it('should display different createdAt and updatedAt correctly', () => {
      const query: Query = {
        id: '1',
        name: 'Test Query',
        sql: 'SELECT 1',
        folderId: null,
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-22T15:30:00.000Z',
      }
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(query)

      const createdDate = new Date('2026-01-15T10:00:00.000Z').toLocaleDateString()
      const modifiedDate = new Date('2026-01-22T15:30:00.000Z').toLocaleDateString()

      const metadata = preview.querySelector('.query-preview__metadata')
      expect(metadata?.textContent).toContain(createdDate)
      expect(metadata?.textContent).toContain(modifiedDate)
    })

    it('should have metadata section below SQL content', () => {
      const query: Query = {
        id: '1',
        name: 'Test Query',
        sql: 'SELECT * FROM Users',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(query)

      const content = preview.querySelector('.query-preview__content')
      const metadata = preview.querySelector('.query-preview__metadata')

      // Verify SQL is displayed correctly
      expect(content?.textContent).toBe(query.sql)

      // Verify metadata section exists and comes after content
      expect(metadata).not.toBeNull()

      // Check DOM order: content before metadata
      const children = Array.from(preview.children)
      const contentIndex = children.indexOf(content as Element)
      const metadataIndex = children.indexOf(metadata as Element)
      expect(contentIndex).toBeLessThan(metadataIndex)
    })

    it('should display "Unknown" for invalid date strings', () => {
      const query: Query = {
        id: '1',
        name: 'Test Query',
        sql: 'SELECT 1',
        folderId: null,
        createdAt: 'not-a-valid-date',
        updatedAt: 'also-invalid',
      }
      const preview = createQueryPreview()
      container.appendChild(preview)
      updateQueryPreview(query)

      const metadata = preview.querySelector('.query-preview__metadata')
      expect(metadata?.textContent).toContain('Created: Unknown')
      expect(metadata?.textContent).toContain('Modified: Unknown')
    })

    it('should have aria-label on metadata section for accessibility', () => {
      const preview = createQueryPreview()
      const metadata = preview.querySelector('.query-preview__metadata')
      expect(metadata?.getAttribute('aria-label')).toBe('Query timestamps')
    })
  })
})
