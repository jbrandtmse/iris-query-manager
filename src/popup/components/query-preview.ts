/**
 * Query Preview Panel Component
 * Displays SQL preview at the bottom of the popup when a query is selected
 */

import './query-preview.css'
import type { Query } from '../../shared/types/storage.types'

// Module state
let previewElement: HTMLElement | null = null
let contentElement: HTMLPreElement | null = null
let metadataElement: HTMLDivElement | null = null

/**
 * Formats an ISO date string to localized date format
 * @param isoString - ISO 8601 formatted date string
 * @returns Localized date string, or 'Unknown' if invalid
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString()
}

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

  const metadata = document.createElement('div')
  metadata.className = 'query-preview__metadata'
  metadata.setAttribute('aria-label', 'Query timestamps')

  footer.appendChild(content)
  footer.appendChild(metadata)

  // Store references
  previewElement = footer
  contentElement = content
  metadataElement = metadata

  return footer
}

/**
 * Updates the preview panel with query content and metadata
 * @param query - Query object to display, or null to hide
 */
export function updateQueryPreview(query: Query | null): void {
  if (!previewElement || !contentElement || !metadataElement) return

  if (query === null) {
    // Hide panel
    previewElement.classList.add('query-preview--hidden')
    previewElement.setAttribute('aria-hidden', 'true')
    contentElement.textContent = ''
    metadataElement.innerHTML = ''
  } else {
    // Show panel with SQL
    previewElement.classList.remove('query-preview--hidden')
    previewElement.setAttribute('aria-hidden', 'false')
    contentElement.textContent = query.sql

    // Update metadata section using DOM APIs (not innerHTML) for security
    const createdDate = formatDate(query.createdAt)
    const modifiedDate = formatDate(query.updatedAt)

    metadataElement.textContent = '' // Clear existing content

    const createdSpan = document.createElement('span')
    createdSpan.className = 'query-preview__metadata-item'
    createdSpan.textContent = `Created: ${createdDate}`

    const modifiedSpan = document.createElement('span')
    modifiedSpan.className = 'query-preview__metadata-item'
    modifiedSpan.textContent = `Modified: ${modifiedDate}`

    metadataElement.appendChild(createdSpan)
    metadataElement.appendChild(modifiedSpan)
  }
}

/**
 * Clean up module state
 */
export function cleanup(): void {
  previewElement = null
  contentElement = null
  metadataElement = null
}
