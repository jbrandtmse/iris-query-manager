/**
 * Warning Badge Component (Story 6-2)
 *
 * Displays a visual indicator for destructive queries in the tree view.
 * Uses semantic colors: red for danger (DELETE, DROP, TRUNCATE),
 * amber for caution (UPDATE, ALTER, INSERT).
 */

import './warning-badge.css'
import type { DestructiveKeyword, Severity } from '../../shared/services/sql-detection-service'

export interface WarningBadgeOptions {
  keyword: DestructiveKeyword
  severity: Severity
}

/**
 * Create a warning badge element for destructive queries
 */
export function createWarningBadge(options: WarningBadgeOptions): HTMLSpanElement {
  const { keyword, severity } = options

  const badge = document.createElement('span')
  badge.className = `warning-badge warning-badge--${severity}`
  badge.textContent = keyword

  // Accessibility (AC: 5)
  badge.setAttribute('role', 'status')
  const labelPrefix = severity === 'danger' ? 'Destructive query' : 'Caution'
  badge.setAttribute('aria-label', `${labelPrefix}: ${keyword}`)

  return badge
}
