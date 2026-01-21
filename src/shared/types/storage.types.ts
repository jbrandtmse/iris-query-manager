/**
 * Storage type definitions for queries and folders
 * Used by storage-service for chrome.storage.local operations
 */

/**
 * Query entity - stores a SQL query with metadata
 * AC1: includes id, name, sql, folderId, createdAt, updatedAt
 */
export interface Query {
  id: string
  name: string
  sql: string
  folderId: string | null // null = root level
  createdAt: string // ISO 8601 format
  updatedAt: string // ISO 8601 format
}

/**
 * Folder entity - organizes queries hierarchically
 * AC2: includes id, name, parentId (nullable for root folders)
 */
export interface Folder {
  id: string
  name: string
  parentId: string | null // null = root folder
}

/**
 * Schema for chrome.storage.local data structure
 */
export interface StorageSchema {
  queries: Query[]
  folders: Folder[]
}

/**
 * Input for creating a new query (id, createdAt, updatedAt are generated)
 */
export interface SaveQueryInput {
  name: string
  sql: string
  folderId?: string | null
}
