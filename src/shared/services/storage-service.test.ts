import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Query, Folder, StorageSchema } from '../types/storage.types'
import {
  getQueries,
  getFolders,
  saveQuery,
  deleteQuery,
  updateQuery,
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
})
