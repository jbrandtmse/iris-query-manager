/**
 * Query Preview Panel Component
 * Displays SQL preview at the bottom of the popup when a query is selected
 */

import './query-preview.css'

// Module state
let previewElement: HTMLElement | null = null
let contentElement: HTMLPreElement | null = null

/**
 * Creates the query preview panel element
 * @returns HTMLElement - The preview panel container
 */
export function createQueryPreview(): HTMLElement {
  // Clean up previous instance if exists
  cleanup()

  const footer = document.createElement('footer')
  footer.className = 'query-preview query-preview--hidden'
  footer.setAttribute('role', 'region')
  footer.setAttribute('aria-label', 'Query preview')
  footer.setAttribute('aria-hidden', 'true')

  const content = document.createElement('pre')
  content.className = 'query-preview__content'

  footer.appendChild(content)

  // Store references
  previewElement = footer
  contentElement = content

  return footer
}

/**
 * Updates the preview panel with query SQL
 * @param sql - SQL content to display, or null to hide
 */
export function updateQueryPreview(sql: string | null): void {
  if (!previewElement || !contentElement) return

  if (sql === null) {
    // Hide panel
    previewElement.classList.add('query-preview--hidden')
    previewElement.setAttribute('aria-hidden', 'true')
    contentElement.textContent = ''
  } else {
    // Show panel with SQL
    previewElement.classList.remove('query-preview--hidden')
    previewElement.setAttribute('aria-hidden', 'false')
    contentElement.textContent = sql
  }
}

/**
 * Clean up module state
 */
export function cleanup(): void {
  previewElement = null
  contentElement = null
}
