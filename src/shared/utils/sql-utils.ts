/**
 * SQL Utility Functions
 * Provides SQL safety detection and analysis
 */

/**
 * Dangerous SQL keywords that could modify data or schema
 * Per project-context.md: DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT
 */
const DANGEROUS_SQL_KEYWORDS = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'ALTER', 'INSERT']

/**
 * Regex pattern for detecting dangerous SQL operations
 * Case-insensitive with word boundaries to avoid false positives
 */
const DANGEROUS_SQL_PATTERN = new RegExp(
  `\\b(${DANGEROUS_SQL_KEYWORDS.join('|')})\\b`,
  'i'
)

/**
 * Check if SQL contains potentially dangerous operations
 * @param sql - The SQL string to check
 * @returns Object with isDangerous flag and matched keyword if found
 */
export function checkSqlSafety(sql: string): { isDangerous: boolean; keyword: string | null } {
  const match = sql.match(DANGEROUS_SQL_PATTERN)

  if (match) {
    return {
      isDangerous: true,
      keyword: match[1].toUpperCase(),
    }
  }

  return {
    isDangerous: false,
    keyword: null,
  }
}

/**
 * Get a warning message for dangerous SQL
 * @param keyword - The dangerous keyword detected
 * @returns User-friendly warning message
 */
export function getDangerousSqlWarning(keyword: string): string {
  return `This query contains ${keyword} which can modify data. Are you sure you want to paste it?`
}
