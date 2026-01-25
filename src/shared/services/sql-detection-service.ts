/**
 * SQL Detection Service (FR22)
 *
 * Detects destructive SQL keywords in queries with word boundary matching
 * to avoid false positives (e.g., "DELETED_FLAG" should not match DELETE)
 *
 * Used by:
 * - Tree items to show warning badges (Story 6-2)
 * - Paste handlers to show warning modals (Story 6-3)
 */

/**
 * Destructive SQL keywords that trigger warnings
 */
export type DestructiveKeyword = 'DELETE' | 'DROP' | 'TRUNCATE' | 'UPDATE' | 'ALTER' | 'INSERT'

/**
 * Severity levels for destructive operations
 * - danger: Data loss or schema destruction (DELETE, DROP, TRUNCATE)
 * - caution: Data modification (UPDATE, ALTER, INSERT)
 * - none: No destructive keywords found
 */
export type Severity = 'none' | 'caution' | 'danger'

/**
 * Result of SQL detection analysis
 */
export interface SqlDetectionResult {
  /** Whether any destructive keywords were found */
  isDestructive: boolean
  /** List of unique destructive keywords found (uppercase) */
  keywords: DestructiveKeyword[]
  /** Highest severity level among detected keywords */
  severity: Severity
}

/**
 * Keywords that represent data loss or schema destruction
 * Severity: danger (red)
 */
export const DANGER_KEYWORDS: DestructiveKeyword[] = ['DELETE', 'DROP', 'TRUNCATE']

/**
 * Keywords that represent data modification
 * Severity: caution (amber)
 */
export const CAUTION_KEYWORDS: DestructiveKeyword[] = ['UPDATE', 'ALTER', 'INSERT']

/**
 * All destructive keywords combined
 */
const ALL_KEYWORDS: DestructiveKeyword[] = [...DANGER_KEYWORDS, ...CAUTION_KEYWORDS]

/**
 * Regex pattern for matching destructive keywords with word boundaries
 * Uses word boundary (\b) to avoid false positives like "DELETED_FLAG"
 */
const DESTRUCTIVE_PATTERN = new RegExp(`\\b(${ALL_KEYWORDS.join('|')})\\b`, 'gi')

/**
 * Detect destructive SQL keywords in a query (FR22)
 *
 * Uses word boundary matching to avoid false positives like:
 * - "DELETED_FLAG" matching DELETE
 * - "DROPDOWN" matching DROP
 * - "ALTERATIONS" matching ALTER
 *
 * @param sql - The SQL query to analyze
 * @returns Detection result with keywords found and severity level
 *
 * @example
 * detectDestructiveKeywords('DELETE FROM users WHERE id = 1')
 * // → { isDestructive: true, keywords: ['DELETE'], severity: 'danger' }
 *
 * @example
 * detectDestructiveKeywords('SELECT * FROM DELETED_RECORDS')
 * // → { isDestructive: false, keywords: [], severity: 'none' }
 */
export function detectDestructiveKeywords(sql: string): SqlDetectionResult {
  // Handle null, undefined, or non-string inputs gracefully
  if (!sql || typeof sql !== 'string') {
    return { isDestructive: false, keywords: [], severity: 'none' }
  }

  const matches = sql.match(DESTRUCTIVE_PATTERN)

  if (!matches || matches.length === 0) {
    return { isDestructive: false, keywords: [], severity: 'none' }
  }

  // Normalize to uppercase and deduplicate
  const keywords = [...new Set(matches.map((m) => m.toUpperCase()))] as DestructiveKeyword[]

  // Determine severity (danger takes precedence over caution)
  const hasDanger = keywords.some((k) => DANGER_KEYWORDS.includes(k))
  const severity: Severity = hasDanger ? 'danger' : 'caution'

  return {
    isDestructive: true,
    keywords,
    severity,
  }
}
