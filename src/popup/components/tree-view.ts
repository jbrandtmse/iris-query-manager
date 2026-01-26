/**
 * Tree View Container Component
 * Displays queries and folders in a scrollable tree structure
 */

import './tree-view.css'
import type { Query, Folder } from '../../shared/types/storage.types'
import {
  createTreeItem,
  createFolderTreeItem,
  type TreeItemClickHandler,
  type TreeItemContextMenuHandler,
  type FolderToggleHandler,
  type QueryDropHandler,
  type FolderDropHandler,
} from './tree-item'

interface TreeViewState {
  selectedId: string | null
}

export interface TreeViewOptions {
  onItemClick?: TreeItemClickHandler
  onItemSelect?: (query: Query) => void
  onItemActivate?: (query: Query) => void // Called on Enter/click for paste action
  onItemContextMenu?: TreeItemContextMenuHandler // Called on right-click
  onFolderToggle?: FolderToggleHandler // Called when folder expand/collapse is toggled
  onQueryDrop?: QueryDropHandler // Called when query is dropped on folder or root (Story 4-4)
  onFolderDrop?: FolderDropHandler // Called when folder is dropped on folder or root (Story 4-5)
}

// Module state
let treeViewElement: HTMLDivElement | null = null
let state: TreeViewState = { selectedId: null }
let currentOptions: TreeViewOptions = {}
let currentQueries: Query[] = []
let currentFolders: Folder[] = []

// Track expanded folder IDs
const expandedFolders = new Set<string>()

// Bound event handler for cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

// ========== Tree Node Structure for Hierarchical Rendering ==========

interface TreeNode {
  type: 'folder' | 'query'
  item: Folder | Query
  children: TreeNode[]
}

/**
 * Build hierarchical tree structure from flat folders and queries
 */
function buildTree(folders: Folder[], queries: Query[]): TreeNode[] {
  const folderMap = new Map<string, Folder>()
  const folderNodes = new Map<string, TreeNode>()
  const rootNodes: TreeNode[] = []

  // Create folder map for lookup
  folders.forEach((folder) => {
    folderMap.set(folder.id, folder)
    folderNodes.set(folder.id, { type: 'folder', item: folder, children: [] })
  })

  // Build folder hierarchy
  folders.forEach((folder) => {
    const node = folderNodes.get(folder.id)!
    if (folder.parentId === null) {
      rootNodes.push(node)
    } else {
      const parentNode = folderNodes.get(folder.parentId)
      if (parentNode) {
        parentNode.children.push(node)
      } else {
        // Orphan folder (parent doesn't exist) - treat as root
        rootNodes.push(node)
      }
    }
  })

  // Add queries to appropriate folders or root
  queries.forEach((query) => {
    const queryNode: TreeNode = { type: 'query', item: query, children: [] }
    if (query.folderId === null) {
      rootNodes.push(queryNode)
    } else {
      const parentFolder = folderNodes.get(query.folderId)
      if (parentFolder) {
        parentFolder.children.push(queryNode)
      } else {
        // Orphan query (folder doesn't exist) - treat as root
        rootNodes.push(queryNode)
      }
    }
  })

  // Sort: folders first (alphabetically), then queries (alphabetically)
  const sortNodes = (nodes: TreeNode[]): void => {
    nodes.sort((a, b) => {
      // Folders before queries
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      // Alphabetically by name
      const nameA = a.type === 'folder' ? (a.item as Folder).name : (a.item as Query).name
      const nameB = b.type === 'folder' ? (b.item as Folder).name : (b.item as Query).name
      return nameA.localeCompare(nameB)
    })
    // Recursively sort children
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortNodes(node.children)
      }
    })
  }

  sortNodes(rootNodes)
  return rootNodes
}

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
  currentFolders = []

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

  // Store data for keyboard navigation and re-renders
  currentQueries = queries
  currentFolders = folders

  // Clear existing content
  treeViewElement.innerHTML = ''

  // Show empty state if no queries AND no folders
  if (queries.length === 0 && folders.length === 0) {
    treeViewElement.appendChild(createEmptyState())
    return
  }

  // Create list container
  const list = document.createElement('div')
  list.className = 'tree-view__list'

  // Build hierarchical tree and render
  const tree = buildTree(folders, queries)
  renderTree(tree, list, 0)

  treeViewElement.appendChild(list)

  // Add root drop zone (Story 4-4)
  const rootDropZone = createRootDropZone()
  treeViewElement.appendChild(rootDropZone)
}

/**
 * Recursively render tree nodes
 */
function renderTree(nodes: TreeNode[], container: HTMLElement, level: number): void {
  for (const node of nodes) {
    if (node.type === 'folder') {
      const folder = node.item as Folder
      const isExpanded = expandedFolders.has(folder.id)

      const folderItem = createFolderTreeItem({
        folder,
        isExpanded,
        isSelected: state.selectedId === folder.id,
        level,
        onToggle: handleFolderToggle,
        onContextMenu: currentOptions.onItemContextMenu,
        onQueryDrop: currentOptions.onQueryDrop,
        onFolderDrop: currentOptions.onFolderDrop,  // Story 4-5
        onDragStart: handleDragStart,  // Story 4-5
        onDragEnd: handleDragEnd,  // Story 4-5
      })
      container.appendChild(folderItem)

      // Only render children if expanded
      if (isExpanded && node.children.length > 0) {
        renderTree(node.children, container, level + 1)
      }
    } else {
      // Query item
      const query = node.item as Query
      const queryItem = createTreeItem({
        query,
        isSelected: state.selectedId === query.id,
        level,
        onClick: (id) => {
          selectItem(id)
          const selectedQuery = currentQueries.find((q) => q.id === id)
          if (selectedQuery) {
            currentOptions.onItemSelect?.(selectedQuery)
            currentOptions.onItemActivate?.(selectedQuery)
          }
        },
        onContextMenu: currentOptions.onItemContextMenu,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
      })
      container.appendChild(queryItem)
    }
  }
}

// ========== Drag State Handlers (Story 4-4, 4-5) ==========

/**
 * Handle drag start - add dragging class to tree view container
 * This enables the root drop zone visibility via CSS (.tree-view--dragging)
 * Called when any query or folder starts being dragged.
 */
function handleDragStart(): void {
  treeViewElement?.classList.add('tree-view--dragging')
}

/**
 * Handle drag end - remove dragging class from tree view container
 * This hides the root drop zone when drag operation completes.
 * Called when drag ends (drop or cancel) for any query or folder.
 */
function handleDragEnd(): void {
  treeViewElement?.classList.remove('tree-view--dragging')
}

/**
 * Handle folder toggle (expand/collapse)
 */
function handleFolderToggle(folderId: string, isExpanded: boolean): void {
  if (isExpanded) {
    expandedFolders.add(folderId)
  } else {
    expandedFolders.delete(folderId)
  }

  // Notify external callback
  currentOptions.onFolderToggle?.(folderId, isExpanded)

  // Re-render tree with updated state
  updateTreeView(currentQueries, currentFolders, currentOptions)
}

/**
 * Toggle folder expand/collapse state
 */
export function toggleFolder(folderId: string): void {
  const isCurrentlyExpanded = expandedFolders.has(folderId)
  handleFolderToggle(folderId, !isCurrentlyExpanded)
}

/**
 * Get list of expanded folder IDs
 */
export function getExpandedFolders(): string[] {
  return Array.from(expandedFolders)
}

/**
 * Set expanded folder IDs
 */
export function setExpandedFolders(folderIds: string[]): void {
  expandedFolders.clear()
  folderIds.forEach((id) => expandedFolders.add(id))
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
 * Create root drop zone element for moving queries/folders to root (Story 4-4, 4-5)
 */
function createRootDropZone(): HTMLDivElement {
  const rootDropZone = document.createElement('div')
  rootDropZone.className = 'tree-view__root-drop-zone'
  rootDropZone.textContent = 'Drop here to move to root level'
  rootDropZone.setAttribute('data-droppable', 'root')

  // Track dragenter/dragleave count to handle child element events
  let dragEnterCount = 0

  // Dragover handler - allow drop (fires continuously during drag)
  // Note: Only preventDefault and dropEffect are set here - no expensive DOM operations.
  // Visual feedback is handled by dragenter/dragleave which fire once per boundary.
  rootDropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  })

  // Dragenter handler - visual feedback (increment counter)
  rootDropZone.addEventListener('dragenter', (e) => {
    e.preventDefault()
    dragEnterCount++
    if (dragEnterCount === 1) {
      rootDropZone.classList.add('tree-view__root-drop-zone--active')
    }
  })

  // Dragleave handler - remove visual feedback (decrement counter)
  rootDropZone.addEventListener('dragleave', () => {
    dragEnterCount--
    if (dragEnterCount === 0) {
      rootDropZone.classList.remove('tree-view__root-drop-zone--active')
    }
  })

  // Drop handler - move query or folder to root (Story 4-4, 4-5)
  rootDropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    // Reset counter and remove class on drop
    dragEnterCount = 0
    rootDropZone.classList.remove('tree-view__root-drop-zone--active')

    // Handle query drop (Story 4-4)
    const queryId = e.dataTransfer?.getData('application/x-query-id')
    if (queryId && typeof queryId === 'string' && queryId.trim().length > 0) {
      // Move query to root (folderId = null)
      currentOptions.onQueryDrop?.(queryId, null)
      return
    }

    // Handle folder drop (Story 4-5)
    const folderId = e.dataTransfer?.getData('application/x-folder-id')
    if (folderId && typeof folderId === 'string' && folderId.trim().length > 0) {
      // Move folder to root (parentId = null)
      currentOptions.onFolderDrop?.(folderId, null)
    }
  })

  return rootDropZone
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
  if (!treeViewElement) return

  const items = Array.from(treeViewElement.querySelectorAll('.tree-item')) as HTMLElement[]
  if (items.length === 0) return

  const currentIndex = items.findIndex((item) => item.getAttribute('data-id') === state.selectedId)
  const currentItem = currentIndex >= 0 ? items[currentIndex] : null

  let newIndex = -1
  let handled = false

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

    case 'ArrowRight':
      e.preventDefault()
      if (currentItem && currentItem.getAttribute('data-type') === 'folder') {
        const folderId = currentItem.getAttribute('data-id')
        if (folderId) {
          const isExpanded = expandedFolders.has(folderId)
          if (!isExpanded) {
            // Expand collapsed folder
            handleFolderToggle(folderId, true)
            handled = true
          } else {
            // Move to first child if expanded
            if (currentIndex < items.length - 1) {
              newIndex = currentIndex + 1
            }
          }
        }
      }
      break

    case 'ArrowLeft':
      e.preventDefault()
      if (currentItem) {
        const itemType = currentItem.getAttribute('data-type')
        const itemId = currentItem.getAttribute('data-id')

        if (itemType === 'folder' && itemId && expandedFolders.has(itemId)) {
          // Collapse expanded folder
          handleFolderToggle(itemId, false)
          handled = true
        } else {
          // Move to parent folder (if not at root)
          const parentId = findParentFolderId(itemId)
          if (parentId) {
            selectItem(parentId)
            const parentItem = treeViewElement?.querySelector(`[data-id="${parentId}"]`) as HTMLElement
            parentItem?.focus()
            handled = true
          }
        }
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

  if (!handled && newIndex >= 0 && newIndex < items.length) {
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
 * Find parent folder ID for a given item
 */
function findParentFolderId(itemId: string | null): string | null {
  if (!itemId) return null

  // Check if item is a query
  const query = currentQueries.find((q) => q.id === itemId)
  if (query && query.folderId) {
    return query.folderId
  }

  // Check if item is a folder
  const folder = currentFolders.find((f) => f.id === itemId)
  if (folder && folder.parentId) {
    return folder.parentId
  }

  return null
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
  currentFolders = []
  state = { selectedId: null }
  expandedFolders.clear()
}
