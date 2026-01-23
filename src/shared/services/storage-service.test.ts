import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Query, Folder, StorageSchema } from '../types/storage.types'
import {
  getQueries,
  getFolders,
  saveQuery,
  deleteQuery,
  updateQuery,
  createFolder,
  updateFolder,
  deleteFolder,
} from './storage-service'

// Mock chrome.storage.local
const createMockStorage = () => {
  let mockStorage: Partial<StorageSchema> = {}

  const mockChrome = {
    storage: {
      local: {
        get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
          const result: Record<string, unknown> = {}
          if (Array.isArray(keys)) {
            keys.forEach((k) => {
              result[k] = mockStorage[k as keyof StorageSchema]
            })
          }
          callback(result)
        }),
        set: vi.fn((items: Partial<StorageSchema>, callback?: () => void) => {
          Object.assign(mockStorage, items)
          callback?.()
        }),
      },
    },
    runtime: {
      lastError: undefined as chrome.runtime.LastError | undefined,
    },
  }

  return {
    mockChrome,
    mockStorage,
    setStorage: (data: Partial<StorageSchema>) => {
      mockStorage = data
    },
    getStorage: () => mockStorage,
    setLastError: (error: string | undefined) => {
      mockChrome.runtime.lastError = error ? { message: error } : undefined
    },
  }
}

describe('storage-service', () => {
  let mock: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mock = createMockStorage()
    vi.stubGlobal('chrome', mock.mockChrome)
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-uuid-12345'),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getQueries', () => {
    it('should return empty array when storage is empty', async () => {
      mock.setStorage({})

      const result = await getQueries()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([])
      }
    })

    it('should return all stored queries', async () => {
      const queries: Query[] = [
        {
          id: '1',
          name: 'Test Query',
          sql: 'SELECT * FROM users',
          folderId: null,
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: '2',
          name: 'Another Query',
          sql: 'SELECT * FROM orders',
          folderId: 'folder-1',
          createdAt: '2026-01-20T11:00:00.000Z',
          updatedAt: '2026-01-20T11:00:00.000Z',
        },
      ]
      mock.setStorage({ queries })

      const result = await getQueries()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(queries)
        expect(result.data).toHaveLength(2)
      }
    })

    it('should return error when storage operation fails', async () => {
      mock.setLastError('Storage error')

      const result = await getQueries()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Storage error')
      }
    })
  })

  describe('getFolders', () => {
    it('should return empty array when storage is empty', async () => {
      mock.setStorage({})

      const result = await getFolders()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([])
      }
    })

    it('should return all stored folders', async () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
        { id: 'folder-2', name: 'Personal', parentId: null },
        { id: 'folder-3', name: 'Archived', parentId: 'folder-1' },
      ]
      mock.setStorage({ folders })

      const result = await getFolders()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(folders)
        expect(result.data).toHaveLength(3)
      }
    })
  })

  describe('saveQuery', () => {
    it('should save a new query with generated UUID', async () => {
      mock.setStorage({ queries: [] })

      const result = await saveQuery({
        name: 'New Query',
        sql: 'SELECT 1',
        folderId: null,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('test-uuid-12345')
        expect(result.data.name).toBe('New Query')
        expect(result.data.sql).toBe('SELECT 1')
        expect(result.data.folderId).toBe(null)
        expect(result.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(result.data.updatedAt).toBe(result.data.createdAt)
      }
    })

    it('should add query to existing queries array', async () => {
      const existingQuery: Query = {
        id: 'existing-1',
        name: 'Existing',
        sql: 'SELECT existing',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      mock.setStorage({ queries: [existingQuery] })

      await saveQuery({
        name: 'New Query',
        sql: 'SELECT new',
      })

      const storage = mock.getStorage()
      expect(storage.queries).toHaveLength(2)
      expect(storage.queries?.[0]).toEqual(existingQuery)
      expect(storage.queries?.[1]?.name).toBe('New Query')
    })

    it('should use crypto.randomUUID() for ID generation (AC4)', async () => {
      mock.setStorage({ queries: [] })

      const result = await saveQuery({
        name: 'UUID Test',
        sql: 'SELECT uuid',
      })

      expect(crypto.randomUUID).toHaveBeenCalled()
      if (result.success) {
        expect(result.data.id).toBe('test-uuid-12345')
      }
    })

    it('should return error when storage set fails', async () => {
      mock.setStorage({ queries: [] })
      mock.mockChrome.storage.local.set = vi.fn((_, callback) => {
        mock.setLastError('Write failed')
        callback?.()
      })

      const result = await saveQuery({
        name: 'Fail Query',
        sql: 'SELECT fail',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Write failed')
      }
    })

    it('should return error when name is empty', async () => {
      const result = await saveQuery({
        name: '',
        sql: 'SELECT 1',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Query name is required')
      }
    })

    it('should return error when name is only whitespace', async () => {
      const result = await saveQuery({
        name: '   ',
        sql: 'SELECT 1',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Query name is required')
      }
    })

    it('should return error when sql is empty', async () => {
      const result = await saveQuery({
        name: 'Valid Name',
        sql: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Query SQL is required')
      }
    })

    it('should return error when sql is only whitespace', async () => {
      const result = await saveQuery({
        name: 'Valid Name',
        sql: '   ',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Query SQL is required')
      }
    })
  })

  describe('deleteQuery', () => {
    it('should remove query from storage', async () => {
      const queries: Query[] = [
        {
          id: 'to-delete',
          name: 'Delete Me',
          sql: 'SELECT delete',
          folderId: null,
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'keep-me',
          name: 'Keep Me',
          sql: 'SELECT keep',
          folderId: null,
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
      ]
      mock.setStorage({ queries })

      const result = await deleteQuery('to-delete')

      expect(result.success).toBe(true)
      const storage = mock.getStorage()
      expect(storage.queries).toHaveLength(1)
      expect(storage.queries?.[0]?.id).toBe('keep-me')
    })

    it('should return error when query not found', async () => {
      mock.setStorage({ queries: [] })

      const result = await deleteQuery('nonexistent')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Query not found')
      }
    })
  })

  describe('updateQuery', () => {
    it('should update query fields and updatedAt timestamp', async () => {
      const originalQuery: Query = {
        id: 'update-me',
        name: 'Original Name',
        sql: 'SELECT original',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      mock.setStorage({ queries: [originalQuery] })

      const result = await updateQuery('update-me', {
        name: 'Updated Name',
        sql: 'SELECT updated',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Name')
        expect(result.data.sql).toBe('SELECT updated')
        expect(result.data.createdAt).toBe(originalQuery.createdAt)
        expect(result.data.updatedAt).not.toBe(originalQuery.updatedAt)
      }
    })

    it('should only update provided fields', async () => {
      const originalQuery: Query = {
        id: 'partial-update',
        name: 'Original',
        sql: 'SELECT original',
        folderId: 'folder-1',
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      mock.setStorage({ queries: [originalQuery] })

      const result = await updateQuery('partial-update', { name: 'New Name' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('New Name')
        expect(result.data.sql).toBe('SELECT original') // unchanged
        expect(result.data.folderId).toBe('folder-1') // unchanged
      }
    })

    it('should return error when query not found', async () => {
      mock.setStorage({ queries: [] })

      const result = await updateQuery('nonexistent', { name: 'New' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Query not found')
      }
    })

    it('should update timestamp in ISO 8601 format', async () => {
      const originalQuery: Query = {
        id: 'timestamp-test',
        name: 'Test',
        sql: 'SELECT test',
        folderId: null,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      mock.setStorage({ queries: [originalQuery] })

      const result = await updateQuery('timestamp-test', { name: 'Updated' })

      expect(result.success).toBe(true)
      if (result.success) {
        // Verify ISO 8601 format
        expect(result.data.updatedAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        )
      }
    })
  })

  describe('createFolder', () => {
    it('should create a new folder with generated UUID (AC4)', async () => {
      mock.setStorage({ folders: [] })

      const result = await createFolder({
        name: 'New Folder',
        parentId: null,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('test-uuid-12345')
        expect(result.data.name).toBe('New Folder')
        expect(result.data.parentId).toBe(null)
      }
    })

    it('should add folder to existing folders array (AC2)', async () => {
      const existingFolder: Folder = {
        id: 'existing-folder',
        name: 'Existing',
        parentId: null,
      }
      mock.setStorage({ folders: [existingFolder] })

      await createFolder({
        name: 'New Folder',
        parentId: null,
      })

      const storage = mock.getStorage()
      expect(storage.folders).toHaveLength(2)
      expect(storage.folders?.[0]).toEqual(existingFolder)
      expect(storage.folders?.[1]?.name).toBe('New Folder')
    })

    it('should create subfolder with parentId (AC3, FR11)', async () => {
      const parentFolder: Folder = {
        id: 'parent-folder',
        name: 'Parent',
        parentId: null,
      }
      mock.setStorage({ folders: [parentFolder] })

      const result = await createFolder({
        name: 'Subfolder',
        parentId: 'parent-folder',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe('parent-folder')
      }
    })

    it('should default parentId to null when not provided', async () => {
      mock.setStorage({ folders: [] })

      const result = await createFolder({
        name: 'Root Folder',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe(null)
      }
    })

    it('should trim folder name whitespace', async () => {
      mock.setStorage({ folders: [] })

      const result = await createFolder({
        name: '  Trimmed Name  ',
        parentId: null,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Trimmed Name')
      }
    })

    it('should return error when name is empty', async () => {
      const result = await createFolder({
        name: '',
        parentId: null,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder name is required')
      }
    })

    it('should return error when name is only whitespace', async () => {
      const result = await createFolder({
        name: '   ',
        parentId: null,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder name is required')
      }
    })

    it('should return error when storage set fails', async () => {
      mock.setStorage({ folders: [] })
      mock.mockChrome.storage.local.set = vi.fn((_, callback) => {
        mock.setLastError('Write failed')
        callback?.()
      })

      const result = await createFolder({
        name: 'Fail Folder',
        parentId: null,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Write failed')
      }
    })

    it('should use crypto.randomUUID() for ID generation', async () => {
      mock.setStorage({ folders: [] })

      const result = await createFolder({
        name: 'UUID Test',
        parentId: null,
      })

      expect(crypto.randomUUID).toHaveBeenCalled()
      if (result.success) {
        expect(result.data.id).toBe('test-uuid-12345')
      }
    })

    it('should return error when parentId does not exist', async () => {
      mock.setStorage({ folders: [] })

      const result = await createFolder({
        name: 'Orphan Folder',
        parentId: 'non-existent-parent',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Parent folder not found')
      }
    })

    it('should succeed when parentId exists', async () => {
      const parentFolder: Folder = {
        id: 'valid-parent',
        name: 'Parent',
        parentId: null,
      }
      mock.setStorage({ folders: [parentFolder] })

      const result = await createFolder({
        name: 'Valid Child',
        parentId: 'valid-parent',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe('valid-parent')
      }
    })
  })

  describe('updateFolder', () => {
    it('should update folder name', async () => {
      const folder: Folder = {
        id: 'update-folder',
        name: 'Original Name',
        parentId: null,
      }
      mock.setStorage({ folders: [folder] })

      const result = await updateFolder('update-folder', { name: 'Updated Name' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Name')
        expect(result.data.id).toBe('update-folder')
        expect(result.data.parentId).toBe(null)
      }

      const storage = mock.getStorage()
      expect(storage.folders?.[0]?.name).toBe('Updated Name')
    })

    it('should return error when folder not found', async () => {
      mock.setStorage({ folders: [] })

      const result = await updateFolder('nonexistent', { name: 'New Name' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder not found')
      }
    })

    it('should return error when name is empty', async () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Existing',
        parentId: null,
      }
      mock.setStorage({ folders: [folder] })

      const result = await updateFolder('folder-1', { name: '' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder name is required')
      }
    })

    it('should return error when name is whitespace only', async () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Existing',
        parentId: null,
      }
      mock.setStorage({ folders: [folder] })

      const result = await updateFolder('folder-1', { name: '   ' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder name is required')
      }
    })

    it('should trim whitespace from name', async () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Existing',
        parentId: null,
      }
      mock.setStorage({ folders: [folder] })

      const result = await updateFolder('folder-1', { name: '  Trimmed Name  ' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Trimmed Name')
      }
    })

    it('should return error when storage set fails', async () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Existing',
        parentId: null,
      }
      mock.setStorage({ folders: [folder] })
      mock.mockChrome.storage.local.set = vi.fn((_, callback) => {
        mock.setLastError('Write failed')
        callback?.()
      })

      const result = await updateFolder('folder-1', { name: 'New Name' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Write failed')
      }
    })
  })

  describe('deleteFolder', () => {
    it('should delete empty folder', async () => {
      const folder: Folder = {
        id: 'delete-me',
        name: 'To Delete',
        parentId: null,
      }
      mock.setStorage({ folders: [folder], queries: [] })

      const result = await deleteFolder('delete-me')

      expect(result.success).toBe(true)
      const storage = mock.getStorage()
      expect(storage.folders).toHaveLength(0)
    })

    it('should return error when folder has queries', async () => {
      const folder: Folder = {
        id: 'has-queries',
        name: 'Folder With Queries',
        parentId: null,
      }
      const query: Query = {
        id: 'query-1',
        name: 'Query',
        sql: 'SELECT 1',
        folderId: 'has-queries',
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      }
      mock.setStorage({ folders: [folder], queries: [query] })

      const result = await deleteFolder('has-queries')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder contains queries. Move or delete them first.')
      }
    })

    it('should return error when folder has subfolders', async () => {
      const parentFolder: Folder = {
        id: 'parent-folder',
        name: 'Parent',
        parentId: null,
      }
      const childFolder: Folder = {
        id: 'child-folder',
        name: 'Child',
        parentId: 'parent-folder',
      }
      mock.setStorage({ folders: [parentFolder, childFolder], queries: [] })

      const result = await deleteFolder('parent-folder')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder contains subfolders. Delete them first.')
      }
    })

    it('should return error when folder not found', async () => {
      mock.setStorage({ folders: [], queries: [] })

      const result = await deleteFolder('nonexistent')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder not found')
      }
    })

    it('should return error when storage set fails', async () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Existing',
        parentId: null,
      }
      mock.setStorage({ folders: [folder], queries: [] })
      mock.mockChrome.storage.local.set = vi.fn((_, callback) => {
        mock.setLastError('Write failed')
        callback?.()
      })

      const result = await deleteFolder('folder-1')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Write failed')
      }
    })

    it('should allow deletion after removing all queries from folder', async () => {
      const folder: Folder = {
        id: 'folder-1',
        name: 'Folder',
        parentId: null,
      }
      // No queries in this folder
      mock.setStorage({ folders: [folder], queries: [] })

      const result = await deleteFolder('folder-1')

      expect(result.success).toBe(true)
    })

    it('should keep other folders when deleting one', async () => {
      const folder1: Folder = { id: 'folder-1', name: 'Keep', parentId: null }
      const folder2: Folder = { id: 'folder-2', name: 'Delete', parentId: null }
      mock.setStorage({ folders: [folder1, folder2], queries: [] })

      const result = await deleteFolder('folder-2')

      expect(result.success).toBe(true)
      const storage = mock.getStorage()
      expect(storage.folders).toHaveLength(1)
      expect(storage.folders?.[0]?.id).toBe('folder-1')
    })
  })
})
