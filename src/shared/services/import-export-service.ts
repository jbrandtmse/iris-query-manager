/**
 * Import/Export Service
 * Handles exporting queries and folders to JSON files
 * Pattern: NEVER throw from services - always return Result<T> objects
 */

import type { Result } from '../types/result.types'
import type { Query, Folder } from '../types/storage.types'
import { getQueries, getFolders } from './storage-service'

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
