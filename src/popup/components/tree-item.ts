/**
 * Tree Item Component
 * Represents a single query or folder in the tree view
 */

import './tree-item.css'
import type { Query } from '../../shared/types/storage.types'
import { ICONS } from '../icons'

export type TreeItemClickHandler = (id: string) => void

export interface TreeItemOptions {
  query: Query
  isSelected: boolean
  level?: number
  onClick?: TreeItemClickHandler
}

/**
 * Create a tree item element for a query
 */
export function createTreeItem(options: TreeItemOptions): HTMLDivElement {
  const { query, isSelected, level = 0, onClick } = options

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

  // Click handler
  item.addEventListener('click', () => {
    onClick?.(query.id)
  })

  // Keyboard handler
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(query.id)
    }
  })

  return item
}
