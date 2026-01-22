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
})
