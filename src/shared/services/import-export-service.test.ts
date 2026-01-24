import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Query, Folder, StorageSchema } from '../types/storage.types'
import { exportAll } from './import-export-service'

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

describe('import-export-service', () => {
  let mock: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mock = createMockStorage()
    vi.stubGlobal('chrome', mock.mockChrome)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('exportAll', () => {
    it('should return all queries and folders with metadata', async () => {
      const queries: Query[] = [
        {
          id: 'query-1',
          name: 'Test Query',
          sql: 'SELECT * FROM users',
          folderId: null,
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
      ]
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
      ]
      mock.setStorage({ queries, folders })

      const result = await exportAll()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.queries).toEqual(queries)
        expect(result.data.folders).toEqual(folders)
        expect(result.data.version).toBe('1.0')
        expect(result.data.exportedAt).toBeDefined()
      }
    })

    it('should include version "1.0" in export data', async () => {
      mock.setStorage({ queries: [], folders: [] })

      const result = await exportAll()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('1.0')
      }
    })

    it('should include exportedAt as ISO 8601 timestamp', async () => {
      mock.setStorage({ queries: [], folders: [] })

      const result = await exportAll()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.exportedAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        )
        // Verify it's a valid date
        const date = new Date(result.data.exportedAt)
        expect(date.getTime()).not.toBeNaN()
      }
    })

    it('should return empty arrays when no data exists', async () => {
      mock.setStorage({})

      const result = await exportAll()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.queries).toEqual([])
        expect(result.data.folders).toEqual([])
      }
    })

    it('should return error when getQueries fails', async () => {
      mock.setLastError('Storage error')

      const result = await exportAll()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Storage error')
      }
    })

    it('should return error when getFolders fails', async () => {
      // Mock storage.get to succeed for queries but fail for folders
      // Use keys array to determine which call this is (more reliable than call count)
      mock.mockChrome.storage.local.get = vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        if (keys.includes('queries')) {
          // Queries call - succeed
          callback({ queries: [] })
        } else if (keys.includes('folders')) {
          // Folders call - fail
          mock.setLastError('Folders read error')
          callback({})
        } else {
          callback({})
        }
      })

      const result = await exportAll()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folders read error')
      }
    })

    it('should include all query and folder data in export', async () => {
      const queries: Query[] = [
        {
          id: 'query-1',
          name: 'Query 1',
          sql: 'SELECT 1',
          folderId: 'folder-1',
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T11:00:00.000Z',
        },
        {
          id: 'query-2',
          name: 'Query 2',
          sql: 'SELECT 2',
          folderId: null,
          createdAt: '2026-01-20T12:00:00.000Z',
          updatedAt: '2026-01-20T12:00:00.000Z',
        },
      ]
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
        { id: 'folder-2', name: 'Archive', parentId: 'folder-1' },
      ]
      mock.setStorage({ queries, folders })

      const result = await exportAll()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.queries).toHaveLength(2)
        expect(result.data.folders).toHaveLength(2)

        // Verify complete query data
        expect(result.data.queries[0]).toEqual(queries[0])
        expect(result.data.queries[1]).toEqual(queries[1])

        // Verify complete folder data
        expect(result.data.folders[0]).toEqual(folders[0])
        expect(result.data.folders[1]).toEqual(folders[1])
      }
    })
  })
})
