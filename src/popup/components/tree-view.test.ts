/**
 * Tree View Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createTreeView,
  updateTreeView,
  selectItem,
  getSelectedId,
  cleanup,
  activateSelectedItem,
} from './tree-view'
import { clearDebounceState } from './tree-item'
import type { Query, Folder } from '../../shared/types/storage.types'

const mockQueries: Query[] = [
  {
    id: '1',
    name: 'Query 1',
    sql: 'SELECT 1',
    folderId: null,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: '2',
    name: 'Query 2',
    sql: 'SELECT 2',
    folderId: null,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
]

const mockFolders: Folder[] = []

describe('tree-view', () => {
  beforeEach(() => {
    cleanup()
    clearDebounceState() // Clear tree-item debounce state between tests
    document.body.innerHTML = ''
  })

  describe('createTreeView', () => {
    it('should create a container element', () => {
      const tree = createTreeView()
      expect(tree).toBeInstanceOf(HTMLDivElement)
      expect(tree.className).toBe('tree-view')
    })

    it('should have role="tree" attribute', () => {
      const tree = createTreeView()
      expect(tree.getAttribute('role')).toBe('tree')
    })

    it('should have aria-label="Query library"', () => {
      const tree = createTreeView()
      expect(tree.getAttribute('aria-label')).toBe('Query library')
    })
  })

  describe('updateTreeView', () => {
    it('should render query items when queries exist', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView(mockQueries, mockFolders)

      const items = tree.querySelectorAll('.tree-item')
      expect(items.length).toBe(2)
    })

    it('should display query names', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView(mockQueries, mockFolders)

      const names = tree.querySelectorAll('.tree-item__name')
      expect(names[0].textContent).toBe('Query 1')
      expect(names[1].textContent).toBe('Query 2')
    })

    it('should show empty state when no queries', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView([], [])

      const empty = tree.querySelector('.tree-view__empty')
      expect(empty).not.toBeNull()
    })

    it('should show empty state message', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView([], [])

      const message = tree.querySelector('.tree-view__empty-message')
      expect(message?.textContent).toBe('No queries saved yet')
    })

    it('should show capture hint in empty state', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView([], [])

      const hint = tree.querySelector('.tree-view__empty-hint')
      expect(hint?.textContent).toContain('click + to capture')
    })

    it('should hide empty state when queries exist', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView([], [])
      updateTreeView(mockQueries, [])

      const empty = tree.querySelector('.tree-view__empty')
      expect(empty).toBeNull()

      const items = tree.querySelectorAll('.tree-item')
      expect(items.length).toBe(2)
    })

    it('should create list container with correct class', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      updateTreeView(mockQueries, [])

      const list = tree.querySelector('.tree-view__list')
      expect(list).not.toBeNull()
    })
  })

  describe('selectItem', () => {
    it('should add selected class to item', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')

      const selected = tree.querySelector('.tree-item--selected')
      expect(selected).not.toBeNull()
      expect(selected?.getAttribute('data-id')).toBe('1')
    })

    it('should allow only one selection at a time', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')
      selectItem('2')

      const selected = tree.querySelectorAll('.tree-item--selected')
      expect(selected.length).toBe(1)
      expect(selected[0].getAttribute('data-id')).toBe('2')
    })

    it('should update aria-selected attribute', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')

      const items = tree.querySelectorAll('.tree-item')
      expect(items[0].getAttribute('aria-selected')).toBe('true')
      expect(items[1].getAttribute('aria-selected')).toBe('false')
    })

    it('should deselect when null is passed', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')
      selectItem(null)

      const selected = tree.querySelectorAll('.tree-item--selected')
      expect(selected.length).toBe(0)
    })
  })

  describe('getSelectedId', () => {
    it('should return null when nothing selected', () => {
      createTreeView()
      expect(getSelectedId()).toBeNull()
    })

    it('should return selected item id', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')

      expect(getSelectedId()).toBe('1')
    })
  })

  describe('scrollable behavior', () => {
    it('should have tree-view class for CSS max-height styling', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      expect(tree.classList.contains('tree-view')).toBe(true)
    })

    it('should render many items for scrolling (AC2: >12 items)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      // Create 15 queries to test scrollable behavior
      const manyQueries: Query[] = Array.from({ length: 15 }, (_, i) => ({
        id: String(i + 1),
        name: `Query ${i + 1}`,
        sql: `SELECT ${i + 1}`,
        folderId: null,
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      }))

      updateTreeView(manyQueries, [])

      const items = tree.querySelectorAll('.tree-item')
      expect(items.length).toBe(15)
      // Tree container has overflow-y: auto in CSS for scrolling
      expect(tree.classList.contains('tree-view')).toBe(true)
    })
  })

  describe('hover state (AC4)', () => {
    it('should have tree-item class that enables CSS hover styles', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      const item = tree.querySelector('.tree-item')
      expect(item).not.toBeNull()
      // CSS .tree-item:hover applies background-color: #e8f0fe
      expect(item?.classList.contains('tree-item')).toBe(true)
    })
  })

  describe('keyboard navigation', () => {
    it('should move selection down with ArrowDown', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // Select first item
      selectItem('1')

      // Dispatch ArrowDown
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('2')
    })

    it('should move selection up with ArrowUp', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // Select second item
      selectItem('2')

      // Dispatch ArrowUp
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('1')
    })

    it('should select first item with Home key', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // Select second item
      selectItem('2')

      // Dispatch Home
      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('1')
    })

    it('should select last item with End key', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // Select first item
      selectItem('1')

      // Dispatch End
      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('2')
    })

    it('should select first item when ArrowDown with no selection', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // No selection initially
      expect(getSelectedId()).toBeNull()

      // Dispatch ArrowDown
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('1')
    })

    it('should not move past last item with ArrowDown', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // Select last item
      selectItem('2')

      // Dispatch ArrowDown
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      tree.dispatchEvent(event)

      // Should stay on last item
      expect(getSelectedId()).toBe('2')
    })

    it('should not move past first item with ArrowUp', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      // Select first item
      selectItem('1')

      // Dispatch ArrowUp
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      tree.dispatchEvent(event)

      // Should stay on first item
      expect(getSelectedId()).toBe('1')
    })

    it('should call onItemSelect callback on keyboard navigation', () => {
      const onItemSelect = vi.fn()
      const tree = createTreeView({ onItemSelect })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect })

      // Select first item
      selectItem('1')

      // Dispatch ArrowDown
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      tree.dispatchEvent(event)

      expect(onItemSelect).toHaveBeenCalledWith(mockQueries[1])
    })
  })

  describe('cleanup', () => {
    it('should reset state after cleanup', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)
      selectItem('1')

      cleanup()

      expect(getSelectedId()).toBeNull()
    })
  })

  describe('Story 3-2: single selection constraint (AC3)', () => {
    it('should clear previous selection when selecting new item', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')
      const firstSelected = tree.querySelectorAll('.tree-item--selected')
      expect(firstSelected.length).toBe(1)
      expect(firstSelected[0].getAttribute('data-id')).toBe('1')

      selectItem('2')
      const secondSelected = tree.querySelectorAll('.tree-item--selected')
      expect(secondSelected.length).toBe(1)
      expect(secondSelected[0].getAttribute('data-id')).toBe('2')

      // Verify first item is no longer selected
      const firstItem = tree.querySelector('[data-id="1"]')
      expect(firstItem?.classList.contains('tree-item--selected')).toBe(false)
    })

    it('should update aria-selected=false on previously selected item', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      selectItem('1')
      selectItem('2')

      const firstItem = tree.querySelector('[data-id="1"]')
      const secondItem = tree.querySelector('[data-id="2"]')

      expect(firstItem?.getAttribute('aria-selected')).toBe('false')
      expect(secondItem?.getAttribute('aria-selected')).toBe('true')
    })

    it('should track selectedId accurately via getSelectedId()', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders)

      expect(getSelectedId()).toBeNull()
      selectItem('1')
      expect(getSelectedId()).toBe('1')
      selectItem('2')
      expect(getSelectedId()).toBe('2')
      selectItem(null)
      expect(getSelectedId()).toBeNull()
    })
  })

  describe('Story 3-2: keyboard selection triggers callback (AC4)', () => {
    it('should trigger onItemSelect on ArrowDown', () => {
      const onItemSelect = vi.fn()
      const tree = createTreeView({ onItemSelect })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect })

      selectItem('1')
      onItemSelect.mockClear() // Clear previous calls

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      tree.dispatchEvent(event)

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(mockQueries[1])
    })

    it('should trigger onItemSelect on ArrowUp', () => {
      const onItemSelect = vi.fn()
      const tree = createTreeView({ onItemSelect })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect })

      selectItem('2')
      onItemSelect.mockClear()

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      tree.dispatchEvent(event)

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(mockQueries[0])
    })

    it('should trigger onItemSelect on Home key', () => {
      const onItemSelect = vi.fn()
      const tree = createTreeView({ onItemSelect })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect })

      selectItem('2')
      onItemSelect.mockClear()

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      tree.dispatchEvent(event)

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(mockQueries[0])
    })

    it('should trigger onItemSelect on End key', () => {
      const onItemSelect = vi.fn()
      const tree = createTreeView({ onItemSelect })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect })

      selectItem('1')
      onItemSelect.mockClear()

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      tree.dispatchEvent(event)

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(mockQueries[1])
    })
  })

  describe('Story 3-2: click triggers selection and activation callbacks', () => {
    it('should trigger onItemSelect callback when item is clicked', () => {
      const onItemSelect = vi.fn()
      const tree = createTreeView({ onItemSelect })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect })

      const firstItem = tree.querySelector('[data-id="1"]') as HTMLElement
      firstItem.click()

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemSelect).toHaveBeenCalledWith(mockQueries[0])
    })

    it('should trigger onItemActivate callback when item is clicked', () => {
      const onItemActivate = vi.fn()
      const tree = createTreeView({ onItemActivate })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemActivate })

      const firstItem = tree.querySelector('[data-id="1"]') as HTMLElement
      firstItem.click()

      expect(onItemActivate).toHaveBeenCalledTimes(1)
      expect(onItemActivate).toHaveBeenCalledWith(mockQueries[0])
    })

    it('should NOT trigger onItemActivate on keyboard navigation (only onItemSelect)', () => {
      const onItemSelect = vi.fn()
      const onItemActivate = vi.fn()
      const tree = createTreeView({ onItemSelect, onItemActivate })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemSelect, onItemActivate })

      selectItem('1')
      onItemSelect.mockClear()

      // ArrowDown should only trigger onItemSelect, not onItemActivate
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      tree.dispatchEvent(event)

      expect(onItemSelect).toHaveBeenCalledTimes(1)
      expect(onItemActivate).not.toHaveBeenCalled()
    })
  })

  describe('Story 3-2: activateSelectedItem', () => {
    it('should trigger onItemActivate for currently selected item', () => {
      const onItemActivate = vi.fn()
      const tree = createTreeView({ onItemActivate })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemActivate })

      selectItem('1')

      activateSelectedItem()

      expect(onItemActivate).toHaveBeenCalledTimes(1)
      expect(onItemActivate).toHaveBeenCalledWith(mockQueries[0])
    })

    it('should not trigger onItemActivate when nothing selected', () => {
      const onItemActivate = vi.fn()
      const tree = createTreeView({ onItemActivate })
      document.body.appendChild(tree)
      updateTreeView(mockQueries, mockFolders, { onItemActivate })

      // No selection
      activateSelectedItem()

      expect(onItemActivate).not.toHaveBeenCalled()
    })
  })
})
