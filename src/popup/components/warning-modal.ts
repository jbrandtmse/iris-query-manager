/**
 * Warning Modal Component (Story 6-3)
 *
 * Displays a confirmation modal before pasting destructive queries.
 * Uses semantic colors: red for danger (DELETE, DROP, TRUNCATE),
 * amber for caution (UPDATE, ALTER, INSERT).
 */

import './warning-modal.css'
import { ICONS } from '../icons'
import type { SqlDetectionResult, Severity } from '../../shared/services/sql-detection-service'

export interface WarningModalOptions {
  queryName: string
  sql: string
  detection: SqlDetectionResult
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

// Module state
let modalOverlay: HTMLDivElement | null = null
let previousActiveElement: HTMLElement | null = null
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

/**
 * Show warning modal before pasting destructive query (FR23, FR24)
 */
export function showWarningModal(options: WarningModalOptions): void {
  // Store current focus for restoration
  previousActiveElement = document.activeElement as HTMLElement

  // Remove existing modal if any
  hideWarningModal()

  // Create and show modal
  modalOverlay = createModalOverlay(options)
  document.body.appendChild(modalOverlay)

  // Setup keyboard handling (Esc to close)
  setupKeyboardHandling(options.onCancel)

  // Focus cancel button (safer default) - AC: 5
  const cancelBtn = modalOverlay.querySelector('.warning-modal__btn--cancel') as HTMLButtonElement
  cancelBtn?.focus()
}

/**
 * Hide and remove the warning modal
 */
export function hideWarningModal(): void {
  // Remove keyboard handler
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  // Remove modal from DOM
  if (modalOverlay) {
    modalOverlay.remove()
    modalOverlay = null
  }

  // Restore focus to previous element
  if (previousActiveElement && previousActiveElement.focus) {
    previousActiveElement.focus()
    previousActiveElement = null
  }
}

/**
 * Create the modal overlay with semi-transparent backdrop
 */
function createModalOverlay(options: WarningModalOptions): HTMLDivElement {
  const { detection, onConfirm, onCancel } = options

  const overlay = document.createElement('div')
  overlay.className = 'warning-modal-overlay'

  const modal = createModal(options)
  overlay.appendChild(modal)

  // Setup focus trap within overlay
  setupFocusTrap(overlay)

  // Handle button clicks
  const confirmBtn = modal.querySelector('.warning-modal__btn--confirm') as HTMLButtonElement
  const cancelBtn = modal.querySelector('.warning-modal__btn--cancel') as HTMLButtonElement

  confirmBtn.addEventListener('click', () => {
    hideWarningModal()
    onConfirm()
  })

  cancelBtn.addEventListener('click', () => {
    hideWarningModal()
    onCancel()
  })

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideWarningModal()
      onCancel()
    }
  })

  return overlay
}

/**
 * Create the modal content with header, preview, warning text, and buttons
 */
function createModal(options: WarningModalOptions): HTMLDivElement {
  const { sql, detection } = options
  const { severity, keywords } = detection

  const modal = document.createElement('div')
  modal.className = 'warning-modal'

  // ARIA attributes for accessibility - AC: 6
  modal.setAttribute('role', 'alertdialog')
  modal.setAttribute('aria-modal', 'true')
  modal.setAttribute('aria-labelledby', 'warning-modal-header')
  modal.setAttribute('aria-describedby', 'warning-modal-text')

  // Header with icon
  const header = createHeader(severity)
  modal.appendChild(header)

  // SQL preview
  const preview = createPreview(sql)
  modal.appendChild(preview)

  // Warning text
  const text = createWarningText(keywords)
  modal.appendChild(text)

  // Action buttons
  const actions = createActions()
  modal.appendChild(actions)

  return modal
}

/**
 * Create header with warning icon and title
 */
function createHeader(severity: Severity): HTMLDivElement {
  const header = document.createElement('div')
  header.className = `warning-modal__header warning-modal__header--${severity}`
  header.id = 'warning-modal-header'

  // Icon
  const iconSpan = document.createElement('span')
  iconSpan.className = 'warning-modal__icon'
  iconSpan.innerHTML = ICONS.warningTriangle
  header.appendChild(iconSpan)

  // Title text - AC: 2, 3
  const title = document.createElement('span')
  title.textContent = severity === 'danger'
    ? 'Destructive Query Warning'
    : 'Caution: Data Modification'
  header.appendChild(title)

  return header
}

/**
 * Create SQL preview with truncation - AC: 4
 */
function createPreview(sql: string): HTMLDivElement {
  const preview = document.createElement('div')
  preview.className = 'warning-modal__preview'
  preview.textContent = truncateSql(sql)
  return preview
}

/**
 * Truncate SQL to first 5 lines or ~300 characters
 */
function truncateSql(sql: string, maxLines = 5, maxChars = 300): string {
  const lines = sql.split('\n')
  let result = lines.slice(0, maxLines).join('\n')

  if (result.length > maxChars) {
    result = result.slice(0, maxChars)
  }

  const wasTruncated = lines.length > maxLines || sql.length > maxChars
  if (wasTruncated) {
    result = result.trimEnd() + '\n...'
  }

  return result
}

/**
 * Create warning text describing the detected keywords
 */
function createWarningText(keywords: string[]): HTMLDivElement {
  const text = document.createElement('div')
  text.className = 'warning-modal__text'
  text.id = 'warning-modal-text'

  const keywordList = keywords.join(', ')
  text.textContent = `This query contains ${keywordList}. Review carefully before executing.`

  return text
}

/**
 * Create action buttons (Cancel and Paste Anyway)
 */
function createActions(): HTMLDivElement {
  const actions = document.createElement('div')
  actions.className = 'warning-modal__actions'

  // Cancel button (primary - left) - safer action
  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.className = 'warning-modal__btn warning-modal__btn--cancel'
  cancelBtn.textContent = 'Cancel'
  actions.appendChild(cancelBtn)

  // Confirm button (secondary - right) - requires deliberate choice
  const confirmBtn = document.createElement('button')
  confirmBtn.type = 'button'
  confirmBtn.className = 'warning-modal__btn warning-modal__btn--confirm'
  confirmBtn.textContent = 'Paste Anyway'
  actions.appendChild(confirmBtn)

  return actions
}

/**
 * Setup focus trap to keep Tab cycling within modal - AC: 5
 */
function setupFocusTrap(overlay: HTMLElement): void {
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return

    const focusableElements = overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  })
}

/**
 * Setup Esc key to dismiss modal - AC: 5
 */
function setupKeyboardHandling(onCancel: () => void): void {
  keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      hideWarningModal()
      onCancel()
    }
  }
  document.addEventListener('keydown', keydownHandler)
}
