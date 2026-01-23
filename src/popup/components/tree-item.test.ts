/**
 * Tree Item Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTreeItem, clearDebounceState } from './tree-item'
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
    clearDebounceState() // Clear debounce state between tests
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
      vi.useFakeTimers()
      try {
        const onClick = vi.fn()
        const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
        document.body.appendChild(item)

        // Enter key
        item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
        expect(onClick).toHaveBeenCalledTimes(1)

        // Wait for debounce window to expire (300ms)
        vi.advanceTimersByTime(350)

        // Space key
        item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
        expect(onClick).toHaveBeenCalledTimes(2)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('Story 3-4: click debounce (AC2.3)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce rapid clicks to prevent double-paste', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      // First click should trigger
      item.click()
      expect(onClick).toHaveBeenCalledTimes(1)

      // Rapid second click (within 300ms) should be ignored
      vi.advanceTimersByTime(100)
      item.click()
      expect(onClick).toHaveBeenCalledTimes(1)

      // Click after debounce window should trigger
      vi.advanceTimersByTime(300)
      item.click()
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('should debounce rapid Enter key presses', () => {
      const onClick = vi.fn()
      const item = createTreeItem({ query: mockQuery, isSelected: false, onClick })
      document.body.appendChild(item)

      // First Enter should trigger
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(onClick).toHaveBeenCalledTimes(1)

      // Rapid second Enter (within 300ms) should be ignored
      vi.advanceTimersByTime(100)
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(onClick).toHaveBeenCalledTimes(1)

      // Enter after debounce window should trigger
      vi.advanceTimersByTime(300)
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('should allow different items to trigger immediately', () => {
      const onClick1 = vi.fn()
      const onClick2 = vi.fn()

      const query2: Query = { ...mockQuery, id: 'different-id' }

      const item1 = createTreeItem({ query: mockQuery, isSelected: false, onClick: onClick1 })
      const item2 = createTreeItem({ query: query2, isSelected: false, onClick: onClick2 })
      document.body.appendChild(item1)
      document.body.appendChild(item2)

      // Click item1
      item1.click()
      expect(onClick1).toHaveBeenCalledTimes(1)

      // Immediately click item2 - should work (different item)
      item2.click()
      expect(onClick2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Story 3-5: context menu (right-click)', () => {
    it('should call onContextMenu on right-click', () => {
      const onContextMenu = vi.fn()
      const item = createTreeItem({
        query: mockQuery,
        isSelected: false,
        onContextMenu,
      })
      document.body.appendChild(item)

      const event = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 200,
        bubbles: true,
      })
      item.dispatchEvent(event)

      expect(onContextMenu).toHaveBeenCalledWith('test-id-123', 150, 200)
    })

    it('should prevent default browser context menu', () => {
      const onContextMenu = vi.fn()
      const item = createTreeItem({
        query: mockQuery,
        isSelected: false,
        onContextMenu,
      })
      document.body.appendChild(item)

      const event = new MouseEvent('contextmenu', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
        cancelable: true,
      })

      const preventDefault = vi.spyOn(event, 'preventDefault')
      item.dispatchEvent(event)

      expect(preventDefault).toHaveBeenCalled()
    })

    it('should pass correct coordinates to onContextMenu', () => {
      const onContextMenu = vi.fn()
      const item = createTreeItem({
        query: mockQuery,
        isSelected: false,
        onContextMenu,
      })
      document.body.appendChild(item)

      const event = new MouseEvent('contextmenu', {
        clientX: 250,
        clientY: 350,
        bubbles: true,
      })
      item.dispatchEvent(event)

      expect(onContextMenu).toHaveBeenCalledWith('test-id-123', 250, 350)
    })

    it('should not throw if onContextMenu is not provided', () => {
      const item = createTreeItem({
        query: mockQuery,
        isSelected: false,
      })
      document.body.appendChild(item)

      const event = new MouseEvent('contextmenu', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      })

      // Should not throw
      expect(() => item.dispatchEvent(event)).not.toThrow()
    })
  })
})

// ========== Story 4-1: Folder Tree Item Tests ==========

import { createFolderTreeItem, clearFolderDebounceState } from './tree-item'
import type { Folder } from '../../shared/types/storage.types'

const mockFolder: Folder = {
  id: 'folder-123',
  name: 'Test Folder',
  parentId: null,
}

describe('folder-tree-item', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    clearFolderDebounceState()
  })

  describe('createFolderTreeItem', () => {
    it('should create a div element', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item).toBeInstanceOf(HTMLDivElement)
    })

    it('should have tree-item class', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.classList.contains('tree-item')).toBe(true)
    })

    it('should have tree-item--folder modifier class', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.classList.contains('tree-item--folder')).toBe(true)
    })

    it('should have role="treeitem"', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('role')).toBe('treeitem')
    })

    it('should have tabindex="0"', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('tabindex')).toBe('0')
    })

    it('should have data-id attribute with folder id', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('data-id')).toBe('folder-123')
    })

    it('should have data-type="folder" attribute', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('data-type')).toBe('folder')
    })

    it('should display folder name', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      const nameSpan = item.querySelector('.tree-item__name')
      expect(nameSpan?.textContent).toBe('Test Folder')
    })

    it('should have title attribute for tooltip', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      const nameSpan = item.querySelector('.tree-item__name')
      expect(nameSpan?.getAttribute('title')).toBe('Test Folder')
    })

    it('should have folder icon element', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      const icon = item.querySelector('.tree-item__icon')
      expect(icon).not.toBeNull()
      expect(icon?.innerHTML).toContain('svg')
    })

    it('should have chevron element', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      const chevron = item.querySelector('.tree-item__chevron')
      expect(chevron).not.toBeNull()
      expect(chevron?.innerHTML).toContain('svg')
    })
  })

  describe('expand/collapse state (AC: 2, 3)', () => {
    it('should not have tree-item--expanded class when isExpanded=false', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.classList.contains('tree-item--expanded')).toBe(false)
    })

    it('should have tree-item--expanded class when isExpanded=true', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: true, isSelected: false })
      expect(item.classList.contains('tree-item--expanded')).toBe(true)
    })

    it('should set aria-expanded="false" when collapsed', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('aria-expanded')).toBe('false')
    })

    it('should set aria-expanded="true" when expanded', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: true, isSelected: false })
      expect(item.getAttribute('aria-expanded')).toBe('true')
    })
  })

  describe('selection state', () => {
    it('should not have selected class when isSelected=false', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.classList.contains('tree-item--selected')).toBe(false)
    })

    it('should have selected class when isSelected=true', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: true })
      expect(item.classList.contains('tree-item--selected')).toBe(true)
    })

    it('should set aria-selected="false" when not selected', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('aria-selected')).toBe('false')
    })

    it('should set aria-selected="true" when selected', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: true })
      expect(item.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('click handler for toggle (AC: 2, 3)', () => {
    it('should call onToggle with folder id and new expanded state on click', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      item.click()

      // When collapsed (isExpanded: false), clicking should toggle to expanded (true)
      expect(onToggle).toHaveBeenCalledWith('folder-123', true)
    })

    it('should call onToggle with false when clicking expanded folder', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: true, isSelected: false, onToggle })
      document.body.appendChild(item)

      item.click()

      // When expanded (isExpanded: true), clicking should toggle to collapsed (false)
      expect(onToggle).toHaveBeenCalledWith('folder-123', false)
    })

    it('should call onToggle on Enter key', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      item.dispatchEvent(event)

      expect(onToggle).toHaveBeenCalledWith('folder-123', true)
    })

    it('should call onToggle on Space key', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      const event = new KeyboardEvent('keydown', { key: ' ' })
      item.dispatchEvent(event)

      expect(onToggle).toHaveBeenCalledWith('folder-123', true)
    })

    it('should not call onToggle on other keys', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      item.dispatchEvent(event)

      expect(onToggle).not.toHaveBeenCalled()
    })
  })

  describe('chevron click (AC: 2, 3)', () => {
    it('should call onToggle when chevron is clicked', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      const chevron = item.querySelector('.tree-item__chevron') as HTMLElement
      chevron.click()

      expect(onToggle).toHaveBeenCalledWith('folder-123', true)
    })

    it('should stop propagation when chevron clicked', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      const chevron = item.querySelector('.tree-item__chevron') as HTMLElement
      const event = new MouseEvent('click', { bubbles: true })
      const stopPropagation = vi.spyOn(event, 'stopPropagation')
      chevron.dispatchEvent(event)

      expect(stopPropagation).toHaveBeenCalled()
    })
  })

  describe('nesting level (AC: 4)', () => {
    it('should not have data-level when level=0', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 0 })
      expect(item.hasAttribute('data-level')).toBe(false)
    })

    it('should have data-level="1" when level=1', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 1 })
      expect(item.getAttribute('data-level')).toBe('1')
    })

    it('should have data-level="2" when level=2', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 2 })
      expect(item.getAttribute('data-level')).toBe('2')
    })

    it('should have aria-level="1" when level=0 (ARIA levels are 1-based)', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 0 })
      expect(item.getAttribute('aria-level')).toBe('1')
    })

    it('should have aria-level="2" when level=1', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 1 })
      expect(item.getAttribute('aria-level')).toBe('2')
    })

    it('should have aria-level="3" when level=2', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 2 })
      expect(item.getAttribute('aria-level')).toBe('3')
    })
  })

  describe('ARIA attributes (6.7)', () => {
    it('should have aria-expanded attribute on folder', () => {
      const itemCollapsed = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      const itemExpanded = createFolderTreeItem({ folder: mockFolder, isExpanded: true, isSelected: false })

      expect(itemCollapsed.getAttribute('aria-expanded')).toBe('false')
      expect(itemExpanded.getAttribute('aria-expanded')).toBe('true')
    })

    it('should have correct aria-level for nested folders', () => {
      const itemLevel0 = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 0 })
      const itemLevel1 = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 1 })
      const itemLevel2 = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, level: 2 })

      expect(itemLevel0.getAttribute('aria-level')).toBe('1')
      expect(itemLevel1.getAttribute('aria-level')).toBe('2')
      expect(itemLevel2.getAttribute('aria-level')).toBe('3')
    })
  })

  describe('context menu', () => {
    it('should call onContextMenu on right-click', () => {
      const onContextMenu = vi.fn()
      const item = createFolderTreeItem({
        folder: mockFolder,
        isExpanded: false,
        isSelected: false,
        onContextMenu,
      })
      document.body.appendChild(item)

      const event = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 200,
        bubbles: true,
      })
      item.dispatchEvent(event)

      expect(onContextMenu).toHaveBeenCalledWith('folder-123', 150, 200)
    })

    it('should prevent default browser context menu', () => {
      const onContextMenu = vi.fn()
      const item = createFolderTreeItem({
        folder: mockFolder,
        isExpanded: false,
        isSelected: false,
        onContextMenu,
      })
      document.body.appendChild(item)

      const event = new MouseEvent('contextmenu', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
        cancelable: true,
      })

      const preventDefault = vi.spyOn(event, 'preventDefault')
      item.dispatchEvent(event)

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  describe('click debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce rapid clicks', () => {
      const onToggle = vi.fn()
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false, onToggle })
      document.body.appendChild(item)

      // First click should trigger
      item.click()
      expect(onToggle).toHaveBeenCalledTimes(1)

      // Rapid second click (within 300ms) should be ignored
      vi.advanceTimersByTime(100)
      item.click()
      expect(onToggle).toHaveBeenCalledTimes(1)

      // Click after debounce window should trigger
      vi.advanceTimersByTime(300)
      item.click()
      expect(onToggle).toHaveBeenCalledTimes(2)
    })
  })

  describe('Story 4-4: folder drop events', () => {
    it('should have data-droppable="folder" attribute', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      expect(item.getAttribute('data-droppable')).toBe('folder')
    })

    it('should add drop-target class on dragenter', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      document.body.appendChild(item)

      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      item.dispatchEvent(event)

      expect(item.classList.contains('tree-item--drop-target')).toBe(true)
    })

    it('should remove drop-target class on dragleave when counter reaches zero', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      document.body.appendChild(item)

      // Simulate dragenter first (increments counter to 1)
      const enterEvent = new Event('dragenter', { bubbles: true, cancelable: true })
      item.dispatchEvent(enterEvent)
      expect(item.classList.contains('tree-item--drop-target')).toBe(true)

      // Simulate dragleave (decrements counter to 0)
      const leaveEvent = new Event('dragleave', { bubbles: true })
      item.dispatchEvent(leaveEvent)

      expect(item.classList.contains('tree-item--drop-target')).toBe(false)
    })

    it('should not remove drop-target class on dragleave when entering child element', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      document.body.appendChild(item)

      // Simulate dragenter on parent (counter = 1)
      item.dispatchEvent(new Event('dragenter', { bubbles: true, cancelable: true }))
      // Simulate dragenter on child (counter = 2)
      item.dispatchEvent(new Event('dragenter', { bubbles: true, cancelable: true }))
      // Simulate dragleave from parent to child (counter = 1)
      item.dispatchEvent(new Event('dragleave', { bubbles: true }))

      // Class should still be present
      expect(item.classList.contains('tree-item--drop-target')).toBe(true)
    })

    it('should call onQueryDrop on drop with query id', () => {
      const onQueryDrop = vi.fn()
      const item = createFolderTreeItem({
        folder: mockFolder,
        isExpanded: false,
        isSelected: false,
        onQueryDrop,
      })
      document.body.appendChild(item)

      // Create a drop event with dataTransfer
      const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('test-query-id'),
      }
      dropEvent.preventDefault = vi.fn()

      item.dispatchEvent(dropEvent)

      expect(onQueryDrop).toHaveBeenCalledWith('test-query-id', 'folder-123')
    })

    it('should remove drop-target class on drop', () => {
      const onQueryDrop = vi.fn()
      const item = createFolderTreeItem({
        folder: mockFolder,
        isExpanded: false,
        isSelected: false,
        onQueryDrop,
      })
      document.body.appendChild(item)

      // Add the class first
      item.classList.add('tree-item--drop-target')

      const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('test-query-id'),
      }
      dropEvent.preventDefault = vi.fn()

      item.dispatchEvent(dropEvent)

      expect(item.classList.contains('tree-item--drop-target')).toBe(false)
    })

    it('should call preventDefault on dragover', () => {
      const item = createFolderTreeItem({ folder: mockFolder, isExpanded: false, isSelected: false })
      document.body.appendChild(item)

      const event = new Event('dragover', { bubbles: true, cancelable: true }) as any
      event.dataTransfer = { dropEffect: 'none' }
      event.preventDefault = vi.fn()

      item.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should expand collapsed folder on drop', () => {
      const onToggle = vi.fn()
      const onQueryDrop = vi.fn()
      const item = createFolderTreeItem({
        folder: mockFolder,
        isExpanded: false,
        isSelected: false,
        onToggle,
        onQueryDrop,
      })
      document.body.appendChild(item)

      const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('test-query-id'),
      }
      dropEvent.preventDefault = vi.fn()

      item.dispatchEvent(dropEvent)

      // Should call onToggle to expand the folder
      expect(onToggle).toHaveBeenCalledWith('folder-123', true)
    })
  })
})

// ========== Story 4-4: Query Drag Tests ==========

describe('tree-item drag events (Story 4-4)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    clearDebounceState()
  })

  it('should have draggable="true" attribute on query items', () => {
    const item = createTreeItem({ query: mockQuery, isSelected: false })
    expect(item.getAttribute('draggable')).toBe('true')
  })

  it('should have data-draggable="query" attribute', () => {
    const item = createTreeItem({ query: mockQuery, isSelected: false })
    expect(item.getAttribute('data-draggable')).toBe('query')
  })

  it('should add dragging class on dragstart', () => {
    const item = createTreeItem({ query: mockQuery, isSelected: false })
    document.body.appendChild(item)

    const event = new Event('dragstart', { bubbles: true }) as any
    event.dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    }

    item.dispatchEvent(event)

    expect(item.classList.contains('tree-item--dragging')).toBe(true)
  })

  it('should set correct dataTransfer data on dragstart', () => {
    const item = createTreeItem({ query: mockQuery, isSelected: false })
    document.body.appendChild(item)

    const setData = vi.fn()
    const event = new Event('dragstart', { bubbles: true }) as any
    event.dataTransfer = {
      setData,
      effectAllowed: '',
    }

    item.dispatchEvent(event)

    expect(setData).toHaveBeenCalledWith('application/x-query-id', 'test-id-123')
  })

  it('should set effectAllowed to "move" on dragstart', () => {
    const item = createTreeItem({ query: mockQuery, isSelected: false })
    document.body.appendChild(item)

    const event = new Event('dragstart', { bubbles: true }) as any
    event.dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    }

    item.dispatchEvent(event)

    expect(event.dataTransfer.effectAllowed).toBe('move')
  })

  it('should call onDragStart callback on dragstart', () => {
    const onDragStart = vi.fn()
    const item = createTreeItem({ query: mockQuery, isSelected: false, onDragStart })
    document.body.appendChild(item)

    const event = new Event('dragstart', { bubbles: true }) as any
    event.dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    }

    item.dispatchEvent(event)

    expect(onDragStart).toHaveBeenCalledWith('test-id-123')
  })

  it('should remove dragging class on dragend', () => {
    const item = createTreeItem({ query: mockQuery, isSelected: false })
    document.body.appendChild(item)

    // Add the dragging class first
    item.classList.add('tree-item--dragging')

    const event = new Event('dragend', { bubbles: true })
    item.dispatchEvent(event)

    expect(item.classList.contains('tree-item--dragging')).toBe(false)
  })

  it('should call onDragEnd callback on dragend', () => {
    const onDragEnd = vi.fn()
    const item = createTreeItem({ query: mockQuery, isSelected: false, onDragEnd })
    document.body.appendChild(item)

    const event = new Event('dragend', { bubbles: true })
    item.dispatchEvent(event)

    expect(onDragEnd).toHaveBeenCalled()
  })
})
