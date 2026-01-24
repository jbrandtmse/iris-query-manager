/**
 * File utilities for import/export operations
 * Handles JSON file downloads using Blob API
 */

/**
 * Generate export filename with current date
 * Format: query-manager-export-YYYY-MM-DD.json (AC4)
 *
 * @returns Formatted filename string
 */
export function generateExportFilename(): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `query-manager-export-${date}.json`
}

/**
 * Trigger browser download of JSON data as file
 * Uses Blob API and temporary anchor element
 *
 * @param data - Object to serialize as JSON
 * @param filename - Name of the downloaded file
 */
export function downloadJsonFile(data: object, filename: string): void {
  // Pretty-print JSON (AC3: human-readable)
  const jsonString = JSON.stringify(data, null, 2)

  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()

  // Cleanup
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
