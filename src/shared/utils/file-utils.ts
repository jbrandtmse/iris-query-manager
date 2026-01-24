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
 * Sanitize folder name for use in filename
 * Removes/replaces characters that could cause file system issues
 */
function sanitizeFolderName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[<>:"/\\|?*]/g, '') // Remove forbidden file chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '')         // Trim leading/trailing hyphens
    .substring(0, 50)              // Limit length

  // Fall back to 'folder' if nothing remains after sanitization
  return sanitized || 'folder'
}

/**
 * Generate export filename for a specific folder (AC3)
 * Format: query-manager-{folder-name}-YYYY-MM-DD.json
 *
 * @param folderName - The folder name to include in filename
 * @returns Formatted filename string
 */
export function generateFolderExportFilename(folderName: string): string {
  const sanitized = sanitizeFolderName(folderName)
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `query-manager-${sanitized}-${date}.json`
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
