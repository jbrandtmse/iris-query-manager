/**
 * Storage service for managing queries and folders in chrome.storage.local
 * Pattern: NEVER throw from services - always return Result<T> objects
 */

import type { Result } from '../types/result.types'
import type { Query, Folder, SaveQueryInput, CreateFolderInput } from '../types/storage.types'

const STORAGE_KEY_QUERIES = 'queries'
const STORAGE_KEY_FOLDERS = 'folders'

/**
 * Helper to wrap chrome.storage.local.get in a Promise
 */
async function getFromStorage<T>(key: string): Promise<Result<T | undefined>> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message ?? 'Unknown storage error' })
      } else {
        resolve({ success: true, data: result[key] as T | undefined })
      }
    })
  })
}

/**
 * Helper to wrap chrome.storage.local.set in a Promise
 */
async function setInStorage<T>(key: string, value: T): Promise<Result<void>> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message ?? 'Unknown storage error' })
      } else {
        resolve({ success: true, data: undefined })
      }
    })
  })
}

/**
 * Get all queries from storage (AC5)
 */
export async function getQueries(): Promise<Result<Query[]>> {
  const result = await getFromStorage<Query[]>(STORAGE_KEY_QUERIES)
  if (!result.success) {
    return result
  }
  return { success: true, data: result.data ?? [] }
}

/**
 * Get all folders from storage
 */
export async function getFolders(): Promise<Result<Folder[]>> {
  const result = await getFromStorage<Folder[]>(STORAGE_KEY_FOLDERS)
  if (!result.success) {
    return result
  }
  return { success: true, data: result.data ?? [] }
}

/**
 * Save a new query (AC3, AC4)
 * Returns Result object with success/data or success=false/error
 * Generates unique ID using crypto.randomUUID()
 */
export async function saveQuery(input: SaveQueryInput): Promise<Result<Query>> {
  // Validate required fields
  if (!input.name || input.name.trim() === '') {
    return { success: false, error: 'Query name is required' }
  }
  if (!input.sql || input.sql.trim() === '') {
    return { success: false, error: 'Query SQL is required' }
  }

  // Get existing queries
  const queriesResult = await getQueries()
  if (!queriesResult.success) {
    return queriesResult
  }

  const now = new Date().toISOString()
  const newQuery: Query = {
    id: crypto.randomUUID(),
    name: input.name,
    sql: input.sql,
    folderId: input.folderId ?? null,
    createdAt: now,
    updatedAt: now,
  }

  const queries = [...queriesResult.data, newQuery]
  const setResult = await setInStorage(STORAGE_KEY_QUERIES, queries)

  if (!setResult.success) {
    return setResult
  }

  return { success: true, data: newQuery }
}

/**
 * Delete a query by ID
 */
export async function deleteQuery(id: string): Promise<Result<void>> {
  const queriesResult = await getQueries()
  if (!queriesResult.success) {
    return queriesResult
  }

  const queries = queriesResult.data
  const index = queries.findIndex((q) => q.id === id)

  if (index === -1) {
    return { success: false, error: 'Query not found' }
  }

  const updatedQueries = queries.filter((q) => q.id !== id)
  return setInStorage(STORAGE_KEY_QUERIES, updatedQueries)
}

/**
 * Update a query by ID with partial updates
 * Automatically updates the updatedAt timestamp
 */
export async function updateQuery(
  id: string,
  updates: Partial<Pick<Query, 'name' | 'sql' | 'folderId'>>
): Promise<Result<Query>> {
  const queriesResult = await getQueries()
  if (!queriesResult.success) {
    return queriesResult
  }

  const queries = queriesResult.data
  const index = queries.findIndex((q) => q.id === id)

  if (index === -1) {
    return { success: false, error: 'Query not found' }
  }

  const updatedQuery: Query = {
    ...queries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  const updatedQueries = [...queries]
  updatedQueries[index] = updatedQuery

  const setResult = await setInStorage(STORAGE_KEY_QUERIES, updatedQueries)
  if (!setResult.success) {
    return setResult
  }

  return { success: true, data: updatedQuery }
}

/**
 * Create a new folder (Story 4-2: AC2, AC3, AC4)
 * Returns Result object with success/data or success=false/error
 * Generates unique ID using crypto.randomUUID()
 */
export async function createFolder(input: CreateFolderInput): Promise<Result<Folder>> {
  // Validate required fields
  if (!input.name || input.name.trim() === '') {
    return { success: false, error: 'Folder name is required' }
  }

  // Get existing folders
  const foldersResult = await getFolders()
  if (!foldersResult.success) {
    return foldersResult
  }

  // Validate parentId exists if provided (AC4: parent's ID for nested)
  if (input.parentId) {
    const parentExists = foldersResult.data.some((f) => f.id === input.parentId)
    if (!parentExists) {
      return { success: false, error: 'Parent folder not found' }
    }
  }

  const newFolder: Folder = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    parentId: input.parentId ?? null,
  }

  const folders = [...foldersResult.data, newFolder]
  const setResult = await setInStorage(STORAGE_KEY_FOLDERS, folders)

  if (!setResult.success) {
    return setResult
  }

  return { success: true, data: newFolder }
}

/**
 * Update a folder by ID with partial updates (Story 4-3: AC1)
 * Currently only name can be updated (parentId changes handled by drag-drop in Story 4-5)
 */
export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, 'name'>>
): Promise<Result<Folder>> {
  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Folder name is required' }
    }
    updates = { ...updates, name: trimmedName }
  }

  const foldersResult = await getFolders()
  if (!foldersResult.success) {
    return foldersResult
  }

  const folders = foldersResult.data
  const index = folders.findIndex((f) => f.id === id)

  if (index === -1) {
    return { success: false, error: 'Folder not found' }
  }

  const updatedFolder: Folder = {
    ...folders[index],
    ...updates,
  }

  const updatedFolders = [...folders]
  updatedFolders[index] = updatedFolder

  const setResult = await setInStorage(STORAGE_KEY_FOLDERS, updatedFolders)
  if (!setResult.success) {
    return setResult
  }

  return { success: true, data: updatedFolder }
}

/**
 * Delete a folder by ID (Story 4-3: AC2, AC3, AC4)
 * Only allows deletion of empty folders (no queries, no subfolders)
 * FR13: User can delete empty folders
 */
export async function deleteFolder(id: string): Promise<Result<void>> {
  // Get current state
  const [foldersResult, queriesResult] = await Promise.all([
    getFolders(),
    getQueries(),
  ])

  if (!foldersResult.success) {
    return foldersResult
  }
  if (!queriesResult.success) {
    return queriesResult
  }

  const folders = foldersResult.data
  const queries = queriesResult.data

  // Check folder exists
  const folderIndex = folders.findIndex((f) => f.id === id)
  if (folderIndex === -1) {
    return { success: false, error: 'Folder not found' }
  }

  // Check for queries in this folder (AC3)
  const hasQueries = queries.some((q) => q.folderId === id)
  if (hasQueries) {
    return { success: false, error: 'Folder contains queries. Move or delete them first.' }
  }

  // Check for subfolders (AC4)
  const hasSubfolders = folders.some((f) => f.parentId === id)
  if (hasSubfolders) {
    return { success: false, error: 'Folder contains subfolders. Delete them first.' }
  }

  // Safe to delete
  const updatedFolders = folders.filter((f) => f.id !== id)
  return setInStorage(STORAGE_KEY_FOLDERS, updatedFolders)
}

/**
 * Move a query to a different folder (or to root) (Story 4-4: FR14)
 * @param queryId - The ID of the query to move
 * @param targetFolderId - The target folder ID, or null to move to root
 */
export async function moveQuery(
  queryId: string,
  targetFolderId: string | null
): Promise<Result<Query>> {
  // Get current state
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

  const queries = queriesResult.data
  const folders = foldersResult.data

  // Find query
  const queryIndex = queries.findIndex((q) => q.id === queryId)
  if (queryIndex === -1) {
    return { success: false, error: 'Query not found' }
  }

  // Validate target folder exists (if not moving to root)
  if (targetFolderId !== null) {
    const folderExists = folders.some((f) => f.id === targetFolderId)
    if (!folderExists) {
      return { success: false, error: 'Target folder not found' }
    }
  }

  // Skip if already in target location
  if (queries[queryIndex].folderId === targetFolderId) {
    return { success: true, data: queries[queryIndex] }
  }

  // Update query
  const updatedQuery: Query = {
    ...queries[queryIndex],
    folderId: targetFolderId,
    updatedAt: new Date().toISOString(),
  }

  const updatedQueries = [...queries]
  updatedQueries[queryIndex] = updatedQuery

  const setResult = await setInStorage(STORAGE_KEY_QUERIES, updatedQueries)
  if (!setResult.success) {
    return setResult
  }

  return { success: true, data: updatedQuery }
}
