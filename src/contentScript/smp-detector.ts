import type { MessageResult } from '../shared/types/message.types'

/**
 * SMP textarea detection module
 * Pure functions for finding the SQL textarea in IRIS System Management Portal
 */

/** Default timeout for waiting for textarea to appear (ms) */
export const DEFAULT_TEXTAREA_TIMEOUT_MS = 5000

// Selector priority order for IRIS version compatibility
const SELECTORS = [
  '#QueryText textarea', // Primary: textarea within QueryText container
  '#queryText', // Fallback 1: Direct textarea ID (lowercase q)
  '.queryText textarea', // Fallback 2: Class-based container
  'textarea[name*="query" i]', // Fallback 3: Name attribute contains "query"
] as const

/**
 * Find the SMP SQL textarea in the current document
 * Tries multiple selectors for IRIS version compatibility
 *
 * @param doc - Document to search (defaults to window.document)
 * @returns Result with textarea element or error
 */
export function findSmpTextarea(
  doc: Document = document
): MessageResult<HTMLTextAreaElement> {
  for (const selector of SELECTORS) {
    const element = doc.querySelector(selector)
    if (element instanceof HTMLTextAreaElement) {
      return { success: true, data: element }
    }
  }

  return {
    success: false,
    error: 'SMP textarea not found with any known selector',
  }
}

/**
 * Wait for textarea to appear in dynamically-loaded pages
 * Uses MutationObserver to detect DOM changes
 *
 * @param timeout - Maximum time to wait in milliseconds (default 5000)
 * @param doc - Document to observe (defaults to window.document)
 * @returns Promise resolving to Result with textarea or timeout error
 */
export function waitForTextarea(
  timeout = DEFAULT_TEXTAREA_TIMEOUT_MS,
  doc: Document = document
): Promise<MessageResult<HTMLTextAreaElement>> {
  return new Promise((resolve) => {
    // Try immediate detection first
    const immediate = findSmpTextarea(doc)
    if (immediate.success) {
      resolve(immediate)
      return
    }

    // Set up observer for dynamic loading
    const observer = new MutationObserver(() => {
      const result = findSmpTextarea(doc)
      if (result.success) {
        observer.disconnect()
        resolve(result)
      }
    })

    observer.observe(doc.body, {
      childList: true,
      subtree: true,
    })

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect()
      resolve({ success: false, error: 'Textarea not found within timeout' })
    }, timeout)
  })
}

/**
 * Start observing for textarea appearance and call callback when found
 * Used for continuous monitoring after initial load failure
 *
 * @param onFound - Callback when textarea is found
 * @param doc - Document to observe (defaults to window.document)
 * @returns Cleanup function to stop observing
 */
export function observeForTextarea(
  onFound: (textarea: HTMLTextAreaElement) => void,
  doc: Document = document
): () => void {
  const observer = new MutationObserver(() => {
    const result = findSmpTextarea(doc)
    if (result.success) {
      observer.disconnect()
      onFound(result.data)
    }
  })

  observer.observe(doc.body, {
    childList: true,
    subtree: true,
  })

  // Return cleanup function
  return () => observer.disconnect()
}
