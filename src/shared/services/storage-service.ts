/**
 * Storage service for managing queries and folders in chrome.storage.local
 * Pattern: NEVER throw from services - always return Result<T> objects
 */

import type { Result } from '../types/result.types'
import type { Query, Folder, SaveQueryInput } from '../types/storage.types'

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
