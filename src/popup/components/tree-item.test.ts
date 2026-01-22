/**
 * Tree Item Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTreeItem } from './tree-item'
import type { Query } from '../../shared/types/storage.types'

const mockQuery: Query = {
  id: 'test-id-123',
  name: 'Test Query',
  sql: 'SELECT * FROM test',
  folderId: null,
  createdAt: '2026-01-20T00:00:00Z',
  updatedAt: '2026-01-20T00:00:00Z',
}

describe('tree-item', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('createTreeItem', () => {
    it('should create a div element', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item).toBeInstanceOf(HTMLDivElement)
    })

    it('should have tree-item class', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.classList.contains('tree-item')).toBe(true)
    })

    it('should have tree-item--query class for query type', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.classList.contains('tree-item--query')).toBe(true)
    })

    it('should have role="treeitem"', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('role')).toBe('treeitem')
    })

    it('should have tabindex="0"', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('tabindex')).toBe('0')
    })

    it('should have data-id attribute with query id', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('data-id')).toBe('test-id-123')
    })

    it('should display query name', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      const nameSpan = item.querySelector('.tree-item__name')
      expect(nameSpan?.textContent).toBe('Test Query')
    })

    it('should have title attribute for tooltip', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      const nameSpan = item.querySelector('.tree-item__name')
      expect(nameSpan?.getAttribute('title')).toBe('Test Query')
    })

    it('should have icon element', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      const icon = item.querySelector('.tree-item__icon')
      expect(icon).not.toBeNull()
      expect(icon?.innerHTML).toContain('svg')
    })
  })

  describe('selection state', () => {
    it('should not have selected class when isSelected=false', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.classList.contains('tree-item--selected')).toBe(false)
    })

    it('should have selected class when isSelected=true', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: true })
      expect(item.classList.contains('tree-item--selected')).toBe(true)
    })

    it('should set aria-selected="false" when not selected', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('aria-selected')).toBe('false')
    })

    it('should set aria-selected="true" when selected', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: true })
      expect(item.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('click handler', () => {
    it('should call onClick with query id on click', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      item.click()

      expect(onClick).toHaveBeenCalledWith('test-id-123')
    })

    it('should call onClick on Enter key', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      item.dispatchEvent(event)

      expect(onClick).toHaveBeenCalledWith('test-id-123')
    })

    it('should call onClick on Space key', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      const event = new KeyboardEvent('keydown', { key: ' ' })
      item.dispatchEvent(event)

      expect(onClick).toHaveBeenCalledWith('test-id-123')
    })

    it('should not call onClick on other keys', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      item.dispatchEvent(event)

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('nesting level', () => {
    it('should not have data-level when level=0', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false, level: 0 })
      expect(item.hasAttribute('data-level')).toBe(false)
    })

    it('should have data-level="1" when level=1', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false, level: 1 })
      expect(item.getAttribute('data-level')).toBe('1')
    })

    it('should have data-level="2" when level=2', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false, level: 2 })
      expect(item.getAttribute('data-level')).toBe('2')
    })

    it('should have aria-level="1" when level=0 (ARIA levels are 1-based)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false, level: 0 })
      expect(item.getAttribute('aria-level')).toBe('1')
    })

    it('should have aria-level="2" when level=1', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false, level: 1 })
      expect(item.getAttribute('aria-level')).toBe('2')
    })

    it('should have aria-level="3" when level=2', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false, level: 2 })
      expect(item.getAttribute('aria-level')).toBe('3')
    })
  })

  describe('hover state (AC4)', () => {
    it('should have tree-item class for CSS hover styling', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      // CSS .tree-item:hover applies background-color: #e8f0fe
      expect(item.classList.contains('tree-item')).toBe(true)
    })
  })

  describe('Story 3-2: visual specifications', () => {
    it('should have tree-item class that applies 32px height via CSS (AC1)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      // CSS .tree-item { height: 32px }
      expect(item.classList.contains('tree-item')).toBe(true)
    })

    it('should have tree-item--selected class for blue left border when selected (AC2)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: true })
      // CSS .tree-item--selected { border-left-color: #4285f4 }
      expect(item.classList.contains('tree-item--selected')).toBe(true)
    })

    it('should have tree-item__icon class for 16x16px blue icon (AC1)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      const icon = item.querySelector('.tree-item__icon')
      // CSS .tree-item__icon { width: 16px; height: 16px; color: #4285f4 }
      expect(icon).not.toBeNull()
      expect(icon?.classList.contains('tree-item__icon')).toBe(true)
    })

    it('should have tree-item__name class for text styling (AC1)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      const name = item.querySelector('.tree-item__name')
      // CSS .tree-item__name { font-size: 13px; overflow: hidden; text-overflow: ellipsis }
      expect(name).not.toBeNull()
      expect(name?.classList.contains('tree-item__name')).toBe(true)
    })
  })

  describe('Story 3-2: accessibility (AC4)', () => {
    it('should have role="treeitem" for ARIA tree pattern (6.1)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('role')).toBe('treeitem')
    })

    it('should have aria-selected="true" when selected (6.2)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: true })
      expect(item.getAttribute('aria-selected')).toBe('true')
    })

    it('should have aria-selected="false" when not selected (6.2)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('aria-selected')).toBe('false')
    })

    it('should have aria-level set correctly for nesting (6.3)', () => {
      const itemLevel0 = createTreeItem({ query: mockQuery, isSelected: false, level: 0 })
      const itemLevel1 = createTreeItem({ query: mockQuery, isSelected: false, level: 1 })
      const itemLevel2 = createTreeItem({ query: mockQuery, isSelected: false, level: 2 })

      // ARIA levels are 1-based
      expect(itemLevel0.getAttribute('aria-level')).toBe('1')
      expect(itemLevel1.getAttribute('aria-level')).toBe('2')
      expect(itemLevel2.getAttribute('aria-level')).toBe('3')
    })

    it('should be focusable via tabindex for keyboard navigation (6.4)', () => {
      const item = createTreeItem({ query: mockQuery, isSelected: false })
      expect(item.getAttribute('tabindex')).toBe('0')
    })

    it('should support keyboard activation via Enter and Space (6.4)', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      // Enter key
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(onClick).toHaveBeenCalledTimes(1)

      // Space key
      item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      expect(onClick).toHaveBeenCalledTimes(2)
    })
  })
})
