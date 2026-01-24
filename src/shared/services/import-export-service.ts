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
