import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Query, Folder, StorageSchema } from '../types/storage.types'
import { exportAll, exportFolder, getDescendantFolderIds } from './import-export-service'

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

  describe('getDescendantFolderIds', () => {
    it('should return empty array for folder with no children', () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
        { id: 'folder-2', name: 'Other', parentId: null },
      ]

      const result = getDescendantFolderIds('folder-1', folders)

      expect(result).toEqual([])
    })

    it('should return direct children', () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
        { id: 'folder-2', name: 'Child1', parentId: 'folder-1' },
        { id: 'folder-3', name: 'Child2', parentId: 'folder-1' },
      ]

      const result = getDescendantFolderIds('folder-1', folders)

      expect(result).toHaveLength(2)
      expect(result).toContain('folder-2')
      expect(result).toContain('folder-3')
    })

    it('should return all descendants recursively', () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
        { id: 'folder-2', name: 'Child', parentId: 'folder-1' },
        { id: 'folder-3', name: 'Grandchild', parentId: 'folder-2' },
        { id: 'folder-4', name: 'GreatGrandchild', parentId: 'folder-3' },
      ]

      const result = getDescendantFolderIds('folder-1', folders)

      expect(result).toHaveLength(3)
      expect(result).toContain('folder-2')
      expect(result).toContain('folder-3')
      expect(result).toContain('folder-4')
    })

    it('should not include unrelated folders', () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
        { id: 'folder-2', name: 'Child', parentId: 'folder-1' },
        { id: 'folder-3', name: 'Unrelated', parentId: null },
        { id: 'folder-4', name: 'UnrelatedChild', parentId: 'folder-3' },
      ]

      const result = getDescendantFolderIds('folder-1', folders)

      expect(result).toHaveLength(1)
      expect(result).toContain('folder-2')
      expect(result).not.toContain('folder-3')
      expect(result).not.toContain('folder-4')
    })

    it('should handle non-existent folder ID', () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
      ]

      const result = getDescendantFolderIds('non-existent', folders)

      expect(result).toEqual([])
    })
  })

  describe('exportFolder', () => {
    it('should export target folder and its direct queries', async () => {
      const queries: Query[] = [
        {
          id: 'query-1',
          name: 'Query 1',
          sql: 'SELECT 1',
          folderId: 'folder-1',
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'query-2',
          name: 'Query 2',
          sql: 'SELECT 2',
          folderId: 'folder-2', // Different folder
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
      ]
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
        { id: 'folder-2', name: 'Personal', parentId: null },
      ]
      mock.setStorage({ queries, folders })

      const result = await exportFolder('folder-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.folders).toHaveLength(1)
        expect(result.data.folders[0].id).toBe('folder-1')
        expect(result.data.queries).toHaveLength(1)
        expect(result.data.queries[0].id).toBe('query-1')
      }
    })

    it('should include all descendant subfolders recursively', async () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
        { id: 'folder-2', name: 'Child', parentId: 'folder-1' },
        { id: 'folder-3', name: 'Grandchild', parentId: 'folder-2' },
        { id: 'folder-4', name: 'GreatGrandchild', parentId: 'folder-3' },
        { id: 'folder-5', name: 'Unrelated', parentId: null },
      ]
      mock.setStorage({ queries: [], folders })

      const result = await exportFolder('folder-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.folders).toHaveLength(4)
        const folderIds = result.data.folders.map((f) => f.id)
        expect(folderIds).toContain('folder-1')
        expect(folderIds).toContain('folder-2')
        expect(folderIds).toContain('folder-3')
        expect(folderIds).toContain('folder-4')
        expect(folderIds).not.toContain('folder-5')
      }
    })

    it('should include queries from all descendant folders', async () => {
      const queries: Query[] = [
        {
          id: 'query-1',
          name: 'Root Query',
          sql: 'SELECT 1',
          folderId: 'folder-1',
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'query-2',
          name: 'Child Query',
          sql: 'SELECT 2',
          folderId: 'folder-2',
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'query-3',
          name: 'Grandchild Query',
          sql: 'SELECT 3',
          folderId: 'folder-3',
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'query-4',
          name: 'Unrelated Query',
          sql: 'SELECT 4',
          folderId: 'folder-5',
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
      ]
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Root', parentId: null },
        { id: 'folder-2', name: 'Child', parentId: 'folder-1' },
        { id: 'folder-3', name: 'Grandchild', parentId: 'folder-2' },
        { id: 'folder-5', name: 'Unrelated', parentId: null },
      ]
      mock.setStorage({ queries, folders })

      const result = await exportFolder('folder-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.queries).toHaveLength(3)
        const queryIds = result.data.queries.map((q) => q.id)
        expect(queryIds).toContain('query-1')
        expect(queryIds).toContain('query-2')
        expect(queryIds).toContain('query-3')
        expect(queryIds).not.toContain('query-4')
      }
    })

    it('should return error for non-existent folder ID', async () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Work', parentId: null },
      ]
      mock.setStorage({ queries: [], folders })

      const result = await exportFolder('non-existent')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Folder not found')
      }
    })

    it('should handle empty folder (no queries, no subfolders)', async () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Empty', parentId: null },
      ]
      mock.setStorage({ queries: [], folders })

      const result = await exportFolder('folder-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.folders).toHaveLength(1)
        expect(result.data.folders[0].id).toBe('folder-1')
        expect(result.data.queries).toHaveLength(0)
      }
    })

    it('should set exported root folder parentId to null', async () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Parent', parentId: null },
        { id: 'folder-2', name: 'Child', parentId: 'folder-1' }, // Has a parent
      ]
      mock.setStorage({ queries: [], folders })

      // Export folder-2 which has a parent
      const result = await exportFolder('folder-2')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.folders).toHaveLength(1)
        expect(result.data.folders[0].id).toBe('folder-2')
        expect(result.data.folders[0].parentId).toBeNull() // Should be null for clean import
      }
    })

    it('should include version and exportedAt metadata', async () => {
      const folders: Folder[] = [
        { id: 'folder-1', name: 'Test', parentId: null },
      ]
      mock.setStorage({ queries: [], folders })

      const result = await exportFolder('folder-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('1.0')
        expect(result.data.exportedAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        )
      }
    })
  })
})
