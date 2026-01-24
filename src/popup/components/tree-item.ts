/**
 * Tree Item Component
 * Represents a single query or folder in the tree view
 */

import './tree-item.css'
import type { Query, Folder } from '../../shared/types/storage.types'
import { ICONS } from '../icons'

export type TreeItemClickHandler = (id: string) => void
export type FolderToggleHandler = (folderId: string, isExpanded: boolean) => void

// Debounce delay to prevent double-click from triggering paste twice
const CLICK_DEBOUNCE_MS = 300

// Track last click time per item to debounce (query items)
const lastClickTime = new Map<string, number>()

// Track last click time per folder to debounce
const folderLastClickTime = new Map<string, number>()

/**
 * Clear debounce state (for testing purposes only)
 */
export function clearDebounceState(): void {
  lastClickTime.clear()
}

/**
 * Clear folder debounce state (for testing purposes only)
 */
export function clearFolderDebounceState(): void {
  folderLastClickTime.clear()
}

export type TreeItemContextMenuHandler = (id: string, x: number, y: number) => void
export type QueryDropHandler = (queryId: string, targetFolderId: string | null) => void
export type FolderDropHandler = (folderId: string, targetParentId: string | null) => void

export interface TreeItemOptions {
  query: Query
  isSelected: boolean
  level?: number
  onClick?: TreeItemClickHandler
  onContextMenu?: TreeItemContextMenuHandler
  onDragStart?: (queryId: string) => void
  onDragEnd?: () => void
}

/**
 * Create a tree item element for a query
 */
export function createTreeItem(options: TreeItemOptions): HTMLDivElement {
  const { query, isSelected, level = 0, onClick, onContextMenu, onDragStart, onDragEnd } = options

  const item = document.createElement('div')
  item.className = 'tree-item tree-item--query'
  if (isSelected) {
    item.classList.add('tree-item--selected')
  }

  item.setAttribute('role', 'treeitem')
  item.setAttribute('tabindex', '0')
  item.setAttribute('aria-selected', String(isSelected))
  item.setAttribute('data-id', query.id)

  // Drag-drop attributes (Story 4-4)
  item.setAttribute('draggable', 'true')
  item.setAttribute('data-draggable', 'query')

  // Set level for CSS indentation and ARIA
  item.setAttribute('aria-level', String(level + 1)) // ARIA levels are 1-based
  if (level > 0) {
    item.setAttribute('data-level', String(level))
  }

  // Icon
  const iconSpan = document.createElement('span')
  iconSpan.className = 'tree-item__icon'
  iconSpan.innerHTML = ICONS.query
  item.appendChild(iconSpan)

  // Name
  const nameSpan = document.createElement('span')
  nameSpan.className = 'tree-item__name'
  nameSpan.textContent = query.name
  nameSpan.title = query.name // Tooltip for truncated names
  item.appendChild(nameSpan)

  // Click handler with debounce to prevent double-click double-paste
  item.addEventListener('click', () => {
    const now = Date.now()
    const lastTime = lastClickTime.get(query.id) ?? 0

    if (now - lastTime < CLICK_DEBOUNCE_MS) {
      return // Ignore rapid clicks
    }

    lastClickTime.set(query.id, now)
    onClick?.(query.id)
  })

  // Keyboard handler with debounce to prevent rapid key presses
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()

      const now = Date.now()
      const lastTime = lastClickTime.get(query.id) ?? 0

      if (now - lastTime < CLICK_DEBOUNCE_MS) {
        return // Ignore rapid key presses
      }

      lastClickTime.set(query.id, now)
      onClick?.(query.id)
    }
  })

  // Context menu handler (right-click)
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    onContextMenu?.(query.id, e.clientX, e.clientY)
  })

  // Drag start handler (Story 4-4)
  item.addEventListener('dragstart', (e) => {
    if (!e.dataTransfer) return
    e.dataTransfer.setData('application/x-query-id', query.id)
    e.dataTransfer.effectAllowed = 'move'
    item.classList.add('tree-item--dragging')
    onDragStart?.(query.id)
  })

  // Drag end handler (Story 4-4)
  item.addEventListener('dragend', () => {
    item.classList.remove('tree-item--dragging')
    onDragEnd?.()
  })

  return item
}

// ========== Folder Tree Item (Story 4-1) ==========

export interface TreeItemFolderOptions {
  folder: Folder
  isExpanded: boolean
  isSelected: boolean
  level?: number
  onToggle?: FolderToggleHandler
  onContextMenu?: TreeItemContextMenuHandler
  onQueryDrop?: QueryDropHandler
  onFolderDrop?: FolderDropHandler  // Story 4-5: folder drag-drop
  onDragStart?: (folderId: string) => void  // Story 4-5
  onDragEnd?: () => void  // Story 4-5
}

/**
 * Create a tree item element for a folder
 */
export function createFolderTreeItem(options: TreeItemFolderOptions): HTMLDivElement {
  const { folder, isExpanded, isSelected, level = 0, onToggle, onContextMenu, onQueryDrop, onFolderDrop, onDragStart, onDragEnd } = options

  const item = document.createElement('div')
  item.className = 'tree-item tree-item--folder'
  if (isExpanded) {
    item.classList.add('tree-item--expanded')
  }
  if (isSelected) {
    item.classList.add('tree-item--selected')
  }

  item.setAttribute('role', 'treeitem')
  item.setAttribute('tabindex', '0')
  item.setAttribute('aria-selected', String(isSelected))
  item.setAttribute('aria-expanded', String(isExpanded))
  item.setAttribute('data-id', folder.id)
  item.setAttribute('data-type', 'folder')

  // Drop target attributes (Story 4-4)
  item.setAttribute('data-droppable', 'folder')

  // Drag source attributes (Story 4-5)
  item.setAttribute('draggable', 'true')
  item.setAttribute('data-draggable', 'folder')
  item.setAttribute('data-folder-id', folder.id)

  // Set level for CSS indentation and ARIA
  item.setAttribute('aria-level', String(level + 1)) // ARIA levels are 1-based
  if (level > 0) {
    item.setAttribute('data-level', String(level))
  }

  // Chevron (expand/collapse indicator)
  const chevronSpan = document.createElement('span')
  chevronSpan.className = 'tree-item__chevron'
  chevronSpan.innerHTML = ICONS.chevronRight // CSS .tree-item--expanded rotates chevron 90deg
  item.appendChild(chevronSpan)

  // Folder Icon
  const iconSpan = document.createElement('span')
  iconSpan.className = 'tree-item__icon'
  iconSpan.innerHTML = ICONS.folder
  item.appendChild(iconSpan)

  // Name
  const nameSpan = document.createElement('span')
  nameSpan.className = 'tree-item__name'
  nameSpan.textContent = folder.name
  nameSpan.title = folder.name // Tooltip for truncated names
  item.appendChild(nameSpan)

  // Helper to handle toggle with debounce
  const handleToggle = (): void => {
    const now = Date.now()
    const lastTime = folderLastClickTime.get(folder.id) ?? 0

    if (now - lastTime < CLICK_DEBOUNCE_MS) {
      return // Ignore rapid clicks
    }

    folderLastClickTime.set(folder.id, now)
    onToggle?.(folder.id, !isExpanded)
  }

  // Chevron click handler - stop propagation to prevent double toggle
  chevronSpan.addEventListener('click', (e) => {
    e.stopPropagation()
    handleToggle()
  })

  // Click handler on folder row
  item.addEventListener('click', () => {
    handleToggle()
  })

  // Keyboard handler for Enter/Space to toggle
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  })

  // Context menu handler (right-click)
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    onContextMenu?.(folder.id, e.clientX, e.clientY)
  })

  // ========== Drag events for folder (Story 4-5) ==========

  // Drag start handler - set folder data transfer
  item.addEventListener('dragstart', (e) => {
    if (!e.dataTransfer) return
    e.dataTransfer.setData('application/x-folder-id', folder.id)
    e.dataTransfer.effectAllowed = 'move'
    item.classList.add('tree-item--dragging')
    onDragStart?.(folder.id)
  })

  // Drag end handler - cleanup
  item.addEventListener('dragend', () => {
    item.classList.remove('tree-item--dragging')
    onDragEnd?.()
  })

  // ========== Drop event handlers (Story 4-4, 4-5) ==========

  // Track dragenter/dragleave count to handle child element events
  // This prevents flickering when dragging over child elements (icon, name span)
  let dragEnterCount = 0

  // Dragover handler - allow drop
  item.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  })

  // Dragenter handler - visual feedback (increment counter)
  item.addEventListener('dragenter', (e) => {
    e.preventDefault()
    dragEnterCount++
    if (dragEnterCount === 1) {
      item.classList.add('tree-item--drop-target')
    }
  })

  // Dragleave handler - remove visual feedback (decrement counter)
  item.addEventListener('dragleave', () => {
    dragEnterCount--
    if (dragEnterCount === 0) {
      item.classList.remove('tree-item--drop-target')
    }
  })

  // Drop handler - move query or folder to this folder
  item.addEventListener('drop', (e) => {
    e.preventDefault()
    // Reset counter and remove class on drop
    dragEnterCount = 0
    item.classList.remove('tree-item--drop-target')

    // Check what type of item is being dropped
    const queryId = e.dataTransfer?.getData('application/x-query-id')
    const droppedFolderId = e.dataTransfer?.getData('application/x-folder-id')

    if (queryId && typeof queryId === 'string' && queryId.trim().length > 0) {
      // Query drop (Story 4-4)
      // Expand folder if collapsed
      if (!isExpanded && onToggle) {
        onToggle(folder.id, true)
      }
      // Notify parent to handle the move
      onQueryDrop?.(queryId, folder.id)
    } else if (droppedFolderId && typeof droppedFolderId === 'string' && droppedFolderId.trim().length > 0) {
      // Folder drop (Story 4-5)
      // Prevent dropping folder onto itself
      if (droppedFolderId !== folder.id) {
        // Expand folder if collapsed
        if (!isExpanded && onToggle) {
          onToggle(folder.id, true)
        }
        // Notify parent to handle the move
        onFolderDrop?.(droppedFolderId, folder.id)
      }
    }
  })

  return item
}
