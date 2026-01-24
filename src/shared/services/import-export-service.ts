/**
 * Import/Export Service
 * Handles exporting queries and folders to JSON files
 * Pattern: NEVER throw from services - always return Result<T> objects
 */

import type { Result } from '../types/result.types'
import type { Query, Folder } from '../types/storage.types'
import { getQueries, getFolders } from './storage-service'

/**
 * Validation result for import data (FR21, NFR9)
 * Provides detailed error messages for user feedback
 */
export interface ValidationResult {
  valid: boolean
  error?: string        // Human-readable error message
  warnings?: string[]   // Non-fatal issues (for lenient mode in 5-4/5-5)
}

/**
 * Preview information for import confirmation (AC4)
 * Shows user what they're about to import
 */
export interface ImportPreview {
  folderCount: number
  queryCount: number
  folderNames: string[]    // Root-level folder names for display
  rootQueryCount: number   // Queries not in any folder
}

/**
 * Export file format with metadata for version compatibility
 * CRITICAL: This format becomes a contract for Story 5-3 (Import)
 */
export interface ExportData {
  version: string        // "1.0" for MVP, allows future format changes
  exportedAt: string     // ISO 8601 timestamp
  folders: Folder[]      // All folders with id, name, parentId
  queries: Query[]       // All queries with full data
}

/**
 * Export all queries and folders for backup/sharing (FR16)
 * Returns data structure ready for JSON serialization
 *
 * @returns Result containing ExportData or error message
 */
export async function exportAll(): Promise<Result<ExportData>> {
  const [queriesResult, foldersResult] = await Promise.all([
    getQueries(),
    getFolders(),
  ])

  if (!queriesResult.success) {
    return queriesResult
  }
  if (!foldersResult.success) {
    return foldersResult
  }

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    folders: foldersResult.data,
    queries: queriesResult.data,
  }

  return { success: true, data: exportData }
}

/**
 * Get all descendant folder IDs recursively
 * Used for collecting all subfolders at any nesting depth
 * Exported for unit testing
 */
export function getDescendantFolderIds(folderId: string, folders: Folder[]): string[] {
  const descendants: string[] = []
  const directChildren = folders.filter((f) => f.parentId === folderId)

  for (const child of directChildren) {
    descendants.push(child.id)
    descendants.push(...getDescendantFolderIds(child.id, folders))
  }

  return descendants
}

/**
 * Export a specific folder with all its contents (FR17)
 * Includes all descendant subfolders and their queries at any depth
 *
 * @param folderId - The folder ID to export
 * @returns Result containing ExportData or error message
 */
export async function exportFolder(folderId: string): Promise<Result<ExportData>> {
  const [queriesResult, foldersResult] = await Promise.all([
    getQueries(),
    getFolders(),
  ])

  if (!queriesResult.success) {
    return queriesResult
  }
  if (!foldersResult.success) {
    return foldersResult
  }

  const allFolders = foldersResult.data
  const allQueries = queriesResult.data

  // Find the target folder
  const targetFolder = allFolders.find((f) => f.id === folderId)
  if (!targetFolder) {
    return { success: false, error: 'Folder not found' }
  }

  // Get all descendant folder IDs
  const descendantIds = getDescendantFolderIds(folderId, allFolders)
  const allFolderIds = [folderId, ...descendantIds]

  // Collect all folders (target + descendants)
  // Important: Set the root folder's parentId to null for clean import
  const exportFolders = allFolders
    .filter((f) => allFolderIds.includes(f.id))
    .map((f) => {
      if (f.id === folderId) {
        return { ...f, parentId: null } // Root folder in export
      }
      return f
    })

  // Collect all queries in any of these folders
  const exportQueries = allQueries.filter((q) =>
    q.folderId !== null && allFolderIds.includes(q.folderId)
  )

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    folders: exportFolders,
    queries: exportQueries,
  }

  return { success: true, data: exportData }
}

/**
 * Validate imported data structure matches ExportData format (FR21)
 * Returns detailed error messages for user feedback (NFR9)
 *
 * @param data - Unknown data to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateImportData(data: unknown): ValidationResult {
  // Check basic structure
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Import file must be a JSON object' }
  }

  const obj = data as Record<string, unknown>

  // Check version field
  if (!('version' in obj) || typeof obj.version !== 'string') {
    return { valid: false, error: 'Import file missing version field' }
  }

  // Check folders array
  if (!('folders' in obj) || !Array.isArray(obj.folders)) {
    return { valid: false, error: 'Import file missing folders array' }
  }

  // Validate each folder structure
  for (let i = 0; i < obj.folders.length; i++) {
    const folder = obj.folders[i] as Record<string, unknown>
    if (!folder || typeof folder !== 'object') {
      return { valid: false, error: `Folder at index ${i} is not an object` }
    }
    if (typeof folder.id !== 'string' || !folder.id) {
      return { valid: false, error: `Folder at index ${i} missing valid id` }
    }
    if (typeof folder.name !== 'string') {
      return { valid: false, error: `Folder at index ${i} missing name` }
    }
    // parentId can be null or string
    if (folder.parentId !== null && typeof folder.parentId !== 'string') {
      return { valid: false, error: `Folder "${folder.name}" has invalid parentId` }
    }
  }

  // Check queries array
  if (!('queries' in obj) || !Array.isArray(obj.queries)) {
    return { valid: false, error: 'Import file missing queries array' }
  }

  // Validate each query structure
  for (let i = 0; i < obj.queries.length; i++) {
    const query = obj.queries[i] as Record<string, unknown>
    if (!query || typeof query !== 'object') {
      return { valid: false, error: `Query at index ${i} is not an object` }
    }
    if (typeof query.id !== 'string' || !query.id) {
      return { valid: false, error: `Query at index ${i} missing valid id` }
    }
    if (typeof query.name !== 'string') {
      return { valid: false, error: `Query at index ${i} missing name` }
    }
    if (typeof query.sql !== 'string') {
      return { valid: false, error: `Query "${query.name}" missing sql content` }
    }
    // folderId can be null or string
    if (query.folderId !== null && typeof query.folderId !== 'string') {
      return { valid: false, error: `Query "${query.name}" has invalid folderId` }
    }
    // createdAt and updatedAt are required
    if (typeof query.createdAt !== 'string') {
      return { valid: false, error: `Query "${query.name}" missing createdAt` }
    }
    if (typeof query.updatedAt !== 'string') {
      return { valid: false, error: `Query "${query.name}" missing updatedAt` }
    }
  }

  return { valid: true }
}

/**
 * Parse and validate an import file (FR18, FR21)
 * Reads file, parses JSON, validates structure
 *
 * @param file - File object from file input
 * @returns Result containing validated ExportData or error message
 */
export async function parseImportFile(file: File): Promise<Result<ExportData>> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const content = reader.result as string
        const data = JSON.parse(content)

        const validation = validateImportData(data)
        if (!validation.valid) {
          resolve({ success: false, error: validation.error! })
          return
        }

        // Cast is safe after validation
        resolve({ success: true, data: data as ExportData })
      } catch (e) {
        if (e instanceof SyntaxError) {
          resolve({ success: false, error: 'Invalid JSON format. Please select a valid export file.' })
        } else {
          resolve({ success: false, error: 'Failed to read file' })
        }
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' })
    }

    reader.readAsText(file)
  })
}

/**
 * Generate preview summary from validated import data (AC4)
 *
 * @param data - Validated ExportData
 * @returns ImportPreview with counts and folder names
 */
export function getImportPreview(data: ExportData): ImportPreview {
  // Get root-level folder names (parentId === null)
  const rootFolders = data.folders.filter((f) => f.parentId === null)
  const folderNames = rootFolders.map((f) => f.name)

  // Count queries not in any folder
  const rootQueryCount = data.queries.filter((q) => q.folderId === null).length

  return {
    folderCount: data.folders.length,
    queryCount: data.queries.length,
    folderNames,
    rootQueryCount,
  }
}
