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
  toggleFolder,
  getExpandedFolders,
  setExpandedFolders,
} from './tree-view'
import { clearDebounceState, clearFolderDebounceState } from './tree-item'
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
    clearFolderDebounceState() // Clear folder debounce state between tests
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

  // ========== Story 4-1: Folder Hierarchical Rendering Tests ==========

  describe('Story 4-1: hierarchical folder rendering', () => {
    const foldersForHierarchy: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', parentId: null },
      { id: 'folder-2', name: 'Folder 2', parentId: null },
      { id: 'folder-1-1', name: 'Subfolder 1-1', parentId: 'folder-1' },
    ]

    const queriesForHierarchy: Query[] = [
      {
        id: 'query-root',
        name: 'Root Query',
        sql: 'SELECT root',
        folderId: null,
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
      {
        id: 'query-in-folder-1',
        name: 'Query in Folder 1',
        sql: 'SELECT folder1',
        folderId: 'folder-1',
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
      {
        id: 'query-in-subfolder',
        name: 'Query in Subfolder',
        sql: 'SELECT subfolder',
        folderId: 'folder-1-1',
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
    ]

    it('should render folders with tree-item--folder class (7.1)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      const folders = tree.querySelectorAll('.tree-item--folder')
      expect(folders.length).toBeGreaterThanOrEqual(2) // At least folder-1 and folder-2
    })

    it('should render folders before queries at same level (7.1)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      const items = tree.querySelectorAll('.tree-item')
      // First items should be folders (at root level)
      const firstItem = items[0]
      expect(firstItem.classList.contains('tree-item--folder')).toBe(true)
    })

    it('should hide children when folder is collapsed (7.2)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      // Ensure folders are collapsed (default)
      setExpandedFolders([])
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      // Query in folder-1 should not be visible (folder collapsed)
      const queryInFolder = tree.querySelector('[data-id="query-in-folder-1"]')
      expect(queryInFolder).toBeNull()
    })

    it('should show children when folder is expanded (7.3)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      // Expand folder-1
      setExpandedFolders(['folder-1'])
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      // Query in folder-1 should be visible
      const queryInFolder = tree.querySelector('[data-id="query-in-folder-1"]')
      expect(queryInFolder).not.toBeNull()
    })

    it('should apply correct indentation to nested items (7.4)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      // Expand folder-1
      setExpandedFolders(['folder-1'])
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      // Query in folder-1 should have level 1
      const queryInFolder = tree.querySelector('[data-id="query-in-folder-1"]')
      expect(queryInFolder?.getAttribute('data-level')).toBe('1')
    })

    it('should render empty folder correctly (7.5)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      const emptyFolder: Folder[] = [{ id: 'empty-folder', name: 'Empty Folder', parentId: null }]
      updateTreeView([], emptyFolder)

      const folder = tree.querySelector('[data-id="empty-folder"]')
      expect(folder).not.toBeNull()
      expect(folder?.classList.contains('tree-item--folder')).toBe(true)
    })

    it('should have chevron on folder items', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      const folder = tree.querySelector('.tree-item--folder')
      const chevron = folder?.querySelector('.tree-item__chevron')
      expect(chevron).not.toBeNull()
    })

    it('should have data-type="folder" on folder items', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(queriesForHierarchy, foldersForHierarchy)

      const folder = tree.querySelector('.tree-item--folder')
      expect(folder?.getAttribute('data-type')).toBe('folder')
    })
  })

  describe('Story 4-1: folder expand/collapse state management', () => {
    const testFolders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', parentId: null },
    ]

    const testQueries: Query[] = [
      {
        id: 'query-1',
        name: 'Query 1',
        sql: 'SELECT 1',
        folderId: 'folder-1',
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
    ]

    it('should track expanded folders via getExpandedFolders()', () => {
      createTreeView()
      setExpandedFolders(['folder-1', 'folder-2'])
      expect(getExpandedFolders()).toContain('folder-1')
      expect(getExpandedFolders()).toContain('folder-2')
    })

    it('should update expanded folders via setExpandedFolders()', () => {
      createTreeView()
      setExpandedFolders(['folder-1'])
      expect(getExpandedFolders()).toEqual(['folder-1'])

      setExpandedFolders(['folder-2'])
      expect(getExpandedFolders()).toEqual(['folder-2'])
    })

    it('should toggle folder via toggleFolder()', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders([])
      updateTreeView(testQueries, testFolders)

      // Toggle to expand
      toggleFolder('folder-1')
      expect(getExpandedFolders()).toContain('folder-1')

      // Toggle to collapse
      toggleFolder('folder-1')
      expect(getExpandedFolders()).not.toContain('folder-1')
    })

    it('should re-render tree when folder is toggled', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders([])
      updateTreeView(testQueries, testFolders)

      // Child should not be visible
      expect(tree.querySelector('[data-id="query-1"]')).toBeNull()

      // Toggle expand
      toggleFolder('folder-1')

      // Child should now be visible
      expect(tree.querySelector('[data-id="query-1"]')).not.toBeNull()
    })
  })

  describe('Story 4-1: folder onToggle callback', () => {
    const testFolders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', parentId: null },
    ]

    it('should call onFolderToggle when folder is clicked', () => {
      vi.useFakeTimers()
      try {
        const onFolderToggle = vi.fn()
        const tree = createTreeView({ onFolderToggle })
        document.body.appendChild(tree)
        setExpandedFolders([])
        updateTreeView([], testFolders, { onFolderToggle })

        const folder = tree.querySelector('[data-id="folder-1"]') as HTMLElement
        folder.click()

        expect(onFolderToggle).toHaveBeenCalledWith('folder-1', true)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('Story 4-1: orphan queries handling', () => {
    it('should render queries with invalid folderId at root level', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)

      const orphanQuery: Query[] = [
        {
          id: 'orphan',
          name: 'Orphan Query',
          sql: 'SELECT orphan',
          folderId: 'non-existent-folder',
          createdAt: '2026-01-20T00:00:00Z',
          updatedAt: '2026-01-20T00:00:00Z',
        },
      ]

      updateTreeView(orphanQuery, [])

      // Orphan query should be rendered at root level
      const orphan = tree.querySelector('[data-id="orphan"]')
      expect(orphan).not.toBeNull()
      expect(orphan?.hasAttribute('data-level')).toBe(false) // Root level has no data-level
    })
  })

  // ========== Story 4-1: Keyboard Navigation for Folders (Task 5) ==========

  describe('Story 4-1: folder keyboard navigation', () => {
    const navFolders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', parentId: null },
    ]

    const navQueries: Query[] = [
      {
        id: 'query-in-folder',
        name: 'Query in Folder',
        sql: 'SELECT 1',
        folderId: 'folder-1',
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
      {
        id: 'root-query',
        name: 'Root Query',
        sql: 'SELECT 2',
        folderId: null,
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
    ]

    it('should expand collapsed folder on ArrowRight (5.1)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders([])
      updateTreeView(navQueries, navFolders)

      // Select the folder
      selectItem('folder-1')

      // ArrowRight should expand
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      tree.dispatchEvent(event)

      expect(getExpandedFolders()).toContain('folder-1')
    })

    it('should collapse expanded folder on ArrowLeft (5.2)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders(['folder-1'])
      updateTreeView(navQueries, navFolders)

      // Select the folder
      selectItem('folder-1')

      // ArrowLeft should collapse
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      tree.dispatchEvent(event)

      expect(getExpandedFolders()).not.toContain('folder-1')
    })

    it('should move to parent folder on ArrowLeft from query inside folder (5.3)', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders(['folder-1'])
      updateTreeView(navQueries, navFolders)

      // Select query inside folder
      selectItem('query-in-folder')

      // ArrowLeft should select parent folder
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('folder-1')
    })

    it('should move to first child on ArrowRight for expanded folder', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders(['folder-1'])
      updateTreeView(navQueries, navFolders)

      // Select folder
      selectItem('folder-1')

      // ArrowRight on expanded folder should move to first child
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      tree.dispatchEvent(event)

      expect(getSelectedId()).toBe('query-in-folder')
    })

    it('should not change selection on ArrowLeft for root level item', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      setExpandedFolders([])
      updateTreeView(navQueries, navFolders)

      // Select root folder (collapsed)
      selectItem('folder-1')

      // ArrowLeft on collapsed root folder should do nothing
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      tree.dispatchEvent(event)

      // Should stay on folder-1
      expect(getSelectedId()).toBe('folder-1')
    })

    it('Enter/Space on folder should toggle expand/collapse (5.4)', () => {
      vi.useFakeTimers()
      try {
        const tree = createTreeView()
        document.body.appendChild(tree)
        setExpandedFolders([])
        updateTreeView(navQueries, navFolders)

        let folder = tree.querySelector('[data-id="folder-1"]') as HTMLElement

        // Enter should toggle (expand)
        folder.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        expect(getExpandedFolders()).toContain('folder-1')

        // Wait for debounce
        vi.advanceTimersByTime(350)

        // Re-query folder element (it was re-rendered after toggle)
        folder = tree.querySelector('[data-id="folder-1"]') as HTMLElement

        // Enter again should toggle (collapse)
        folder.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        expect(getExpandedFolders()).not.toContain('folder-1')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  // ========== Story 4-4: Drag-Drop Root Drop Zone Tests ==========

  describe('Story 4-4: root drop zone', () => {
    const dragFolders: Folder[] = [
      { id: 'folder-1', name: 'Folder 1', parentId: null },
    ]

    const dragQueries: Query[] = [
      {
        id: 'query-1',
        name: 'Query 1',
        sql: 'SELECT 1',
        folderId: 'folder-1',
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
    ]

    it('should create root drop zone element', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders)

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone')
      expect(rootDropZone).not.toBeNull()
    })

    it('should have data-droppable="root" attribute', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders)

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone')
      expect(rootDropZone?.getAttribute('data-droppable')).toBe('root')
    })

    it('should contain drop instruction text', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders)

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone')
      expect(rootDropZone?.textContent).toContain('Drop here to move to root')
    })

    it('should add active class on dragenter', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders)

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone') as HTMLElement
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      rootDropZone.dispatchEvent(event)

      expect(rootDropZone.classList.contains('tree-view__root-drop-zone--active')).toBe(true)
    })

    it('should remove active class on dragleave when counter reaches zero', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders)

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone') as HTMLElement

      // Simulate dragenter first (increments counter to 1)
      const enterEvent = new Event('dragenter', { bubbles: true, cancelable: true })
      rootDropZone.dispatchEvent(enterEvent)
      expect(rootDropZone.classList.contains('tree-view__root-drop-zone--active')).toBe(true)

      // Simulate dragleave (decrements counter to 0)
      const leaveEvent = new Event('dragleave', { bubbles: true })
      rootDropZone.dispatchEvent(leaveEvent)

      expect(rootDropZone.classList.contains('tree-view__root-drop-zone--active')).toBe(false)
    })

    it('should call onQueryDrop with null targetFolderId on drop', () => {
      const onQueryDrop = vi.fn()
      const tree = createTreeView({ onQueryDrop })
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders, { onQueryDrop })

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone') as HTMLElement

      const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('query-1'),
      }
      dropEvent.preventDefault = vi.fn()

      rootDropZone.dispatchEvent(dropEvent)

      expect(onQueryDrop).toHaveBeenCalledWith('query-1', null)
    })

    it('should remove active class on drop', () => {
      const onQueryDrop = vi.fn()
      const tree = createTreeView({ onQueryDrop })
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders, { onQueryDrop })

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone') as HTMLElement

      // Add active class first
      rootDropZone.classList.add('tree-view__root-drop-zone--active')

      const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('query-1'),
      }
      dropEvent.preventDefault = vi.fn()

      rootDropZone.dispatchEvent(dropEvent)

      expect(rootDropZone.classList.contains('tree-view__root-drop-zone--active')).toBe(false)
    })

    it('should call preventDefault on dragover', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, dragFolders)

      const rootDropZone = tree.querySelector('.tree-view__root-drop-zone') as HTMLElement

      const event = new Event('dragover', { bubbles: true, cancelable: true }) as any
      event.dataTransfer = { dropEffect: 'none' }
      event.preventDefault = vi.fn()

      rootDropZone.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('Story 4-4: tree-view drag state', () => {
    const dragQueries: Query[] = [
      {
        id: 'query-1',
        name: 'Query 1',
        sql: 'SELECT 1',
        folderId: null,
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
    ]

    it('should add tree-view--dragging class when onDragStart is triggered', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, [])

      const queryItem = tree.querySelector('[data-id="query-1"]') as HTMLElement

      const dragStartEvent = new Event('dragstart', { bubbles: true }) as any
      dragStartEvent.dataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
      }

      queryItem.dispatchEvent(dragStartEvent)

      expect(tree.classList.contains('tree-view--dragging')).toBe(true)
    })

    it('should remove tree-view--dragging class when onDragEnd is triggered', () => {
      const tree = createTreeView()
      document.body.appendChild(tree)
      updateTreeView(dragQueries, [])

      // Add the class first
      tree.classList.add('tree-view--dragging')

      const queryItem = tree.querySelector('[data-id="query-1"]') as HTMLElement
      const dragEndEvent = new Event('dragend', { bubbles: true })

      queryItem.dispatchEvent(dragEndEvent)

      expect(tree.classList.contains('tree-view--dragging')).toBe(false)
    })
  })
})
