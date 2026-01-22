/**
 * Context Menu Component
 * Right-click menu for query actions (rename, delete)
 * Supports keyboard navigation, click-outside close, viewport positioning
 */

import './context-menu.css'

export interface ContextMenuItem {
  label: string
  action: string
  danger?: boolean
}

export interface ContextMenuOptions {
  x: number
  y: number
  items: ContextMenuItem[]
  onSelect: (action: string) => void
  onClose?: () => void
  triggerElement?: HTMLElement // Element that triggered the menu (for focus return)
}

// Module state
let currentMenu: HTMLDivElement | null = null
let currentOptions: ContextMenuOptions | null = null
let focusedIndex = -1
let triggerElement: HTMLElement | null = null

// Event handler references for cleanup
let documentClickHandler: ((e: MouseEvent) => void) | null = null
let documentKeydownHandler: ((e: KeyboardEvent) => void) | null = null

/**
 * Show a context menu at the specified position
 * Only one menu can be open at a time
 */
export function showContextMenu(options: ContextMenuOptions): void {
  // Close any existing menu first
  hideContextMenu()

  currentOptions = options
  focusedIndex = 0 // Start with first item focused
  triggerElement = options.triggerElement ?? null

  // Create menu element
  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.setAttribute('role', 'menu')
  menu.setAttribute('tabindex', '-1')

  // Create menu items
  options.items.forEach((item, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'context-menu__item'
    if (item.danger) {
      button.classList.add('context-menu__item--danger')
    }
    if (index === 0) {
      button.classList.add('context-menu__item--focused')
    }
    button.setAttribute('role', 'menuitem')
    button.setAttribute('tabindex', '-1')
    button.setAttribute('data-action', item.action)
    button.setAttribute('id', `context-menu-item-${index}`)
    button.textContent = item.label

    // Click handler
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      selectItem(item.action)
    })

    // Mouse enter updates focus
    button.addEventListener('mouseenter', () => {
      setFocusedIndex(index)
    })

    menu.appendChild(button)
  })

  // Set initial aria-activedescendant
  menu.setAttribute('aria-activedescendant', 'context-menu-item-0')

  // Add to DOM first (needed for positioning calculation)
  document.body.appendChild(menu)
  currentMenu = menu

  // Position menu within viewport
  positionMenu(options.x, options.y, menu)

  // Focus the menu for keyboard navigation
  menu.focus()

  // Set up event listeners
  setupEventListeners()
}

/**
 * Hide and cleanup the current context menu
 */
export function hideContextMenu(): void {
  // Store trigger before clearing state (for focus return)
  const elementToFocus = triggerElement

  if (currentMenu) {
    currentMenu.remove()
    currentMenu = null
  }

  // Clean up event listeners
  if (documentClickHandler) {
    document.removeEventListener('click', documentClickHandler, true)
    documentClickHandler = null
  }
  if (documentKeydownHandler) {
    document.removeEventListener('keydown', documentKeydownHandler, true)
    documentKeydownHandler = null
  }

  // Call onClose callback if set
  if (currentOptions?.onClose) {
    currentOptions.onClose()
  }

  currentOptions = null
  focusedIndex = -1
  triggerElement = null

  // Return focus to trigger element (accessibility requirement)
  if (elementToFocus) {
    elementToFocus.focus()
  }
}

/**
 * Check if a context menu is currently visible
 */
export function isContextMenuVisible(): boolean {
  return currentMenu !== null
}

/**
 * Position menu to stay within viewport
 */
function positionMenu(clickX: number, clickY: number, menu: HTMLElement): void {
  const menuWidth = 160 // Fixed width from CSS
  const menuHeight = menu.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 8

  // Calculate position, preventing off-screen
  let left = clickX
  if (clickX + menuWidth > viewportWidth) {
    left = viewportWidth - menuWidth - margin
  }

  let top = clickY
  if (clickY + menuHeight > viewportHeight) {
    top = viewportHeight - menuHeight - margin
  }

  // Ensure not negative
  left = Math.max(margin, left)
  top = Math.max(margin, top)

  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
}

/**
 * Set up document-level event listeners for close and keyboard nav
 */
function setupEventListeners(): void {
  // Click outside to close
  documentClickHandler = (e: MouseEvent) => {
    if (currentMenu && !currentMenu.contains(e.target as Node)) {
      hideContextMenu()
    }
  }
  // Use capture phase to catch clicks before they reach the menu
  document.addEventListener('click', documentClickHandler, true)

  // Keyboard navigation
  documentKeydownHandler = (e: KeyboardEvent) => {
    if (!currentMenu || !currentOptions) return

    const itemCount = currentOptions.items.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((focusedIndex + 1) % itemCount)
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(focusedIndex <= 0 ? itemCount - 1 : focusedIndex - 1)
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          selectItem(currentOptions.items[focusedIndex].action)
        }
        break

      case 'Escape':
        e.preventDefault()
        hideContextMenu()
        break

      case 'Tab':
        // Trap focus within menu - cycle through items
        e.preventDefault()
        if (e.shiftKey) {
          // Shift+Tab: move backwards
          setFocusedIndex(focusedIndex <= 0 ? itemCount - 1 : focusedIndex - 1)
        } else {
          // Tab: move forwards
          setFocusedIndex((focusedIndex + 1) % itemCount)
        }
        break
    }
  }
  document.addEventListener('keydown', documentKeydownHandler, true)
}

/**
 * Update focused item index and visual state
 */
function setFocusedIndex(index: number): void {
  if (!currentMenu || !currentOptions) return

  const items = currentMenu.querySelectorAll('.context-menu__item')

  // Remove focused class from previous
  if (focusedIndex >= 0 && focusedIndex < items.length) {
    items[focusedIndex].classList.remove('context-menu__item--focused')
  }

  // Set new focused index
  focusedIndex = index

  // Add focused class to new item
  if (focusedIndex >= 0 && focusedIndex < items.length) {
    items[focusedIndex].classList.add('context-menu__item--focused')
    currentMenu.setAttribute('aria-activedescendant', `context-menu-item-${focusedIndex}`)
  }
}

/**
 * Select an item and close the menu
 */
function selectItem(action: string): void {
  const onSelect = currentOptions?.onSelect
  hideContextMenu()
  onSelect?.(action)
}
