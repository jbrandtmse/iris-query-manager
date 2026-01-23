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

export interface TreeItemOptions {
  query: Query
  isSelected: boolean
  level?: number
  onClick?: TreeItemClickHandler
  onContextMenu?: TreeItemContextMenuHandler
}

/**
 * Create a tree item element for a query
 */
export function createTreeItem(options: TreeItemOptions): HTMLDivElement {
  const { query, isSelected, level = 0, onClick, onContextMenu } = options

  const item = document.createElement('div')
  item.className = 'tree-item tree-item--query'
  if (isSelected) {
    item.classList.add('tree-item--selected')
  }

  item.setAttribute('role', 'treeitem')
  item.setAttribute('tabindex', '0')
  item.setAttribute('aria-selected', String(isSelected))
  item.setAttribute('data-id', query.id)

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
}

/**
 * Create a tree item element for a folder
 */
export function createFolderTreeItem(options: TreeItemFolderOptions): HTMLDivElement {
  const { folder, isExpanded, isSelected, level = 0, onToggle, onContextMenu } = options

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

  return item
}
