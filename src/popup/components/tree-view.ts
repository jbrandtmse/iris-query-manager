/**
 * Tree View Container Component
 * Displays queries and folders in a scrollable tree structure
 */

import './tree-view.css'
import type { Query, Folder } from '../../shared/types/storage.types'
import { createTreeItem, type TreeItemClickHandler } from './tree-item'

interface TreeViewState {
  selectedId: string | null
}

export interface TreeViewOptions {
  onItemClick?: TreeItemClickHandler
  onItemSelect?: (query: Query) => void
  onItemActivate?: (query: Query) => void // Called on Enter/click for paste action
}

// Module state
let treeViewElement: HTMLDivElement | null = null
let state: TreeViewState = { selectedId: null }
let currentOptions: TreeViewOptions = {}
let currentQueries: Query[] = []

// Bound event handler for cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

/**
 * Create the tree view container
 */
export function createTreeView(options?: TreeViewOptions): HTMLDivElement {
  // Clean up previous instance if exists
  cleanup()

  const container = document.createElement('div')
  container.className = 'tree-view'
  container.setAttribute('role', 'tree')
  container.setAttribute('aria-label', 'Query library')

  treeViewElement = container
  currentOptions = options ?? {}

  // Reset state when creating new tree
  state = { selectedId: null }
  currentQueries = []

  // Add keyboard navigation handler
  keydownHandler = handleTreeKeydown
  container.addEventListener('keydown', keydownHandler)

  return container
}

/**
 * Update tree view with queries and folders
 */
export function updateTreeView(
  queries: Query[],
  folders: Folder[],
  options?: TreeViewOptions
): void {
  if (!treeViewElement) return

  // Update options if provided
  if (options) {
    currentOptions = options
  }

  // Store queries for keyboard navigation
  currentQueries = queries

  // Clear existing content
  treeViewElement.innerHTML = ''

  // Show empty state if no queries
  if (queries.length === 0) {
    treeViewElement.appendChild(createEmptyState())
    return
  }

  // Create list container
  const list = document.createElement('div')
  list.className = 'tree-view__list'

  // Render queries (flat for now, folders in Epic 4)
  queries.forEach((query) => {
    const item = createTreeItem({
      query,
      isSelected: state.selectedId === query.id,
      onClick: (id) => {
        selectItem(id)
        const selectedQuery = queries.find((q) => q.id === id)
        if (selectedQuery) {
          // Click triggers both selection update and activation (paste)
          currentOptions.onItemSelect?.(selectedQuery)
          currentOptions.onItemActivate?.(selectedQuery)
        }
      },
    })
    list.appendChild(item)
  })

  treeViewElement.appendChild(list)
}

/**
 * Select a tree item by ID
 */
export function selectItem(id: string | null): void {
  state.selectedId = id

  // Update selected state in DOM
  if (treeViewElement) {
    const items = treeViewElement.querySelectorAll('.tree-item')
    items.forEach((item) => {
      const itemId = item.getAttribute('data-id')
      const isSelected = itemId === id
      item.classList.toggle('tree-item--selected', isSelected)
      item.setAttribute('aria-selected', String(isSelected))
    })
  }
}

/**
 * Get currently selected item ID
 */
export function getSelectedId(): string | null {
  return state.selectedId
}

/**
 * Create empty state element
 */
function createEmptyState(): HTMLDivElement {
  const empty = document.createElement('div')
  empty.className = 'tree-view__empty'

  const message = document.createElement('p')
  message.className = 'tree-view__empty-message'
  message.textContent = 'No queries saved yet'

  const hint = document.createElement('p')
  hint.className = 'tree-view__empty-hint'
  hint.textContent = 'Write a query in SMP and click + to capture'

  empty.appendChild(message)
  empty.appendChild(hint)

  return empty
}

/**
 * Handle keyboard navigation within the tree
 */
function handleTreeKeydown(e: KeyboardEvent): void {
  if (!treeViewElement || currentQueries.length === 0) return

  const items = Array.from(treeViewElement.querySelectorAll('.tree-item')) as HTMLElement[]
  if (items.length === 0) return

  const currentIndex = items.findIndex((item) => item.getAttribute('data-id') === state.selectedId)

  let newIndex = -1

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (currentIndex === -1) {
        newIndex = 0
      } else if (currentIndex < items.length - 1) {
        newIndex = currentIndex + 1
      }
      break

    case 'ArrowUp':
      e.preventDefault()
      if (currentIndex === -1) {
        newIndex = items.length - 1
      } else if (currentIndex > 0) {
        newIndex = currentIndex - 1
      }
      break

    case 'Home':
      e.preventDefault()
      newIndex = 0
      break

    case 'End':
      e.preventDefault()
      newIndex = items.length - 1
      break

    default:
      return
  }

  if (newIndex >= 0 && newIndex < items.length) {
    const newId = items[newIndex].getAttribute('data-id')
    if (newId) {
      selectItem(newId)
      items[newIndex].focus()

      // Trigger onItemSelect callback (for selection tracking, NOT paste)
      // Paste is only triggered by onItemActivate (click or Enter)
      const selectedQuery = currentQueries.find((q) => q.id === newId)
      if (selectedQuery && currentOptions.onItemSelect) {
        currentOptions.onItemSelect(selectedQuery)
      }
    }
  }
}

/**
 * Activate the currently selected item (trigger paste)
 * Called when user presses Enter on a selected item
 */
export function activateSelectedItem(): void {
  if (!state.selectedId) return

  const selectedQuery = currentQueries.find((q) => q.id === state.selectedId)
  if (selectedQuery && currentOptions.onItemActivate) {
    currentOptions.onItemActivate(selectedQuery)
  }
}

/**
 * Clean up event listeners
 */
export function cleanup(): void {
  if (treeViewElement && keydownHandler) {
    treeViewElement.removeEventListener('keydown', keydownHandler)
  }
  keydownHandler = null
  treeViewElement = null
  currentQueries = []
  state = { selectedId: null }
}
