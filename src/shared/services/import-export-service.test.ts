import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Query, Folder, StorageSchema } from '../types/storage.types'
import {
  exportAll,
  exportFolder,
  getDescendantFolderIds,
  validateImportData,
  getImportPreview,
  mergeImportData,
  replaceWithImportData,
  type ExportData,
  type MergeStats,
  type ReplaceStats,
} from './import-export-service'

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

  // Shared test helper for creating empty import data
  const createEmptyImportData = (): ExportData => ({
    version: '1.0',
    exportedAt: '2026-01-20T10:00:00.000Z',
    folders: [],
    queries: [],
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

  describe('validateImportData', () => {
    const validExportData: ExportData = {
      version: '1.0',
      exportedAt: '2026-01-20T10:00:00.000Z',
      folders: [
        { id: 'folder-1', name: 'Work', parentId: null },
      ],
      queries: [
        {
          id: 'query-1',
          name: 'Test Query',
          sql: 'SELECT * FROM users',
          folderId: null,
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
      ],
    }

    it('should accept valid ExportData structure', () => {
      const result = validateImportData(validExportData)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept empty folders and queries arrays', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(true)
    })

    it('should reject null data', () => {
      const result = validateImportData(null)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file must be a JSON object')
    })

    it('should reject non-object data', () => {
      const result = validateImportData('not an object')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file must be a JSON object')
    })

    it('should reject missing version field', () => {
      const data = {
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file missing version field')
    })

    it('should reject non-string version field', () => {
      const data = {
        version: 1.0,
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file missing version field')
    })

    it('should reject missing folders array', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file missing folders array')
    })

    it('should reject non-array folders', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: 'not an array',
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file missing folders array')
    })

    it('should reject missing queries array', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Import file missing queries array')
    })

    it('should reject folder without id', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ name: 'Work', parentId: null }],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Folder at index 0 missing valid id')
    })

    it('should reject folder with empty id', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ id: '', name: 'Work', parentId: null }],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Folder at index 0 missing valid id')
    })

    it('should reject folder without name', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ id: 'folder-1', parentId: null }],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Folder at index 0 missing name')
    })

    it('should reject folder with invalid parentId type', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ id: 'folder-1', name: 'Work', parentId: 123 }],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Folder "Work" has invalid parentId')
    })

    it('should accept folder with null parentId', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ id: 'folder-1', name: 'Work', parentId: null }],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(true)
    })

    it('should accept folder with string parentId', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [
          { id: 'folder-1', name: 'Work', parentId: null },
          { id: 'folder-2', name: 'Subwork', parentId: 'folder-1' },
        ],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(true)
    })

    it('should reject query without id', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            name: 'Test',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query at index 0 missing valid id')
    })

    it('should reject query without name', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query at index 0 missing name')
    })

    it('should reject query without sql', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Test',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query "Test" missing sql content')
    })

    it('should reject query without createdAt', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Test',
            sql: 'SELECT 1',
            folderId: null,
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query "Test" missing createdAt')
    })

    it('should reject query without updatedAt', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Test',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query "Test" missing updatedAt')
    })

    it('should reject query with invalid folderId type', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Test',
            sql: 'SELECT 1',
            folderId: 123,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query "Test" has invalid folderId')
    })

    it('should accept query with null folderId', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Test',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(true)
    })

    it('should accept query with string folderId', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ id: 'folder-1', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'query-1',
            name: 'Test',
            sql: 'SELECT 1',
            folderId: 'folder-1',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(true)
    })

    it('should report correct index for invalid folder', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [
          { id: 'folder-1', name: 'Valid', parentId: null },
          { id: 'folder-2', name: 'Also Valid', parentId: null },
          { name: 'Invalid - no id', parentId: null }, // index 2
        ],
        queries: [],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Folder at index 2 missing valid id')
    })

    it('should report correct index for invalid query', () => {
      const data = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Valid',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            name: 'Invalid', // index 1, missing id
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = validateImportData(data)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query at index 1 missing valid id')
    })
  })

  describe('getImportPreview', () => {
    it('should calculate correct folder and query counts', () => {
      const data: ExportData = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [
          { id: 'folder-1', name: 'Work', parentId: null },
          { id: 'folder-2', name: 'Personal', parentId: null },
          { id: 'folder-3', name: 'Subwork', parentId: 'folder-1' },
        ],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'folder-1',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-2',
            name: 'Q2',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const preview = getImportPreview(data)

      expect(preview.folderCount).toBe(3)
      expect(preview.queryCount).toBe(2)
    })

    it('should extract root-level folder names', () => {
      const data: ExportData = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [
          { id: 'folder-1', name: 'Work', parentId: null },
          { id: 'folder-2', name: 'Personal', parentId: null },
          { id: 'folder-3', name: 'Subwork', parentId: 'folder-1' }, // Not root
        ],
        queries: [],
      }

      const preview = getImportPreview(data)

      expect(preview.folderNames).toHaveLength(2)
      expect(preview.folderNames).toContain('Work')
      expect(preview.folderNames).toContain('Personal')
      expect(preview.folderNames).not.toContain('Subwork')
    })

    it('should count root queries correctly', () => {
      const data: ExportData = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [{ id: 'folder-1', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'folder-1', // In folder
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-2',
            name: 'Q2',
            sql: 'SELECT 2',
            folderId: null, // Root
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-3',
            name: 'Q3',
            sql: 'SELECT 3',
            folderId: null, // Root
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const preview = getImportPreview(data)

      expect(preview.rootQueryCount).toBe(2)
    })

    it('should handle empty data', () => {
      const data: ExportData = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [],
      }

      const preview = getImportPreview(data)

      expect(preview.folderCount).toBe(0)
      expect(preview.queryCount).toBe(0)
      expect(preview.folderNames).toEqual([])
      expect(preview.rootQueryCount).toBe(0)
    })

    it('should handle all queries at root level', () => {
      const data: ExportData = {
        version: '1.0',
        exportedAt: '2026-01-20T10:00:00.000Z',
        folders: [],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-2',
            name: 'Q2',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const preview = getImportPreview(data)

      expect(preview.rootQueryCount).toBe(2)
      expect(preview.queryCount).toBe(2)
    })
  })

  describe('mergeImportData', () => {
    const createEmptyExisting = (): StorageSchema => ({
      folders: [],
      queries: [],
    })

    it('should add new folders correctly', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'folder-1', name: 'Work', parentId: null },
          { id: 'folder-2', name: 'Personal', parentId: null },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.folders).toHaveLength(2)
      expect(result.folders.map((f) => f.name)).toContain('Work')
      expect(result.folders.map((f) => f.name)).toContain('Personal')
      expect(result.stats.foldersAdded).toBe(2)
      expect(result.stats.foldersSkipped).toBe(0)
    })

    it('should add new queries correctly', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.queries).toHaveLength(1)
      expect(result.queries[0].name).toBe('Q1')
      expect(result.queries[0].sql).toBe('SELECT 1')
      expect(result.stats.queriesAdded).toBe(1)
    })

    it('should map duplicate folder names to existing folder', () => {
      const existing: StorageSchema = {
        folders: [{ id: 'existing-1', name: 'Work', parentId: null }],
        queries: [],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [{ id: 'import-1', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'import-1',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // Only 1 folder (the existing one)
      expect(result.folders).toHaveLength(1)
      expect(result.folders[0].id).toBe('existing-1')
      // Query should be mapped to existing folder
      expect(result.queries).toHaveLength(1)
      expect(result.queries[0].folderId).toBe('existing-1')
      expect(result.stats.foldersSkipped).toBe(1)
      expect(result.stats.foldersAdded).toBe(0)
    })

    it('should rename duplicate query names with "(imported)" suffix', () => {
      const existing: StorageSchema = {
        folders: [],
        queries: [
          {
            id: 'existing-query',
            name: 'My Query',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'import-query',
            name: 'My Query',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.queries).toHaveLength(2)
      expect(result.queries[0].name).toBe('My Query')
      expect(result.queries[1].name).toBe('My Query (imported)')
      expect(result.stats.queriesRenamed).toBe(1)
    })

    it('should handle nested folder mapping correctly', () => {
      const existing: StorageSchema = {
        folders: [{ id: 'existing-work', name: 'Work', parentId: null }],
        queries: [],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'import-work', name: 'Work', parentId: null },
          { id: 'import-sub', name: 'Subwork', parentId: 'import-work' },
        ],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'import-sub',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // Work folder should be mapped to existing, Subwork should be new
      expect(result.folders).toHaveLength(2)
      const workFolder = result.folders.find((f) => f.name === 'Work')
      const subworkFolder = result.folders.find((f) => f.name === 'Subwork')

      expect(workFolder?.id).toBe('existing-work')
      expect(subworkFolder?.parentId).toBe('existing-work')

      // Query should point to new subwork folder
      expect(result.queries[0].folderId).toBe(subworkFolder?.id)
    })

    it('should preserve createdAt from imported queries', () => {
      const existing = createEmptyExisting()
      const originalCreatedAt = '2020-01-01T00:00:00.000Z'
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: originalCreatedAt,
            updatedAt: '2020-01-01T00:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.queries[0].createdAt).toBe(originalCreatedAt)
    })

    it('should update updatedAt to current time', () => {
      const existing = createEmptyExisting()
      const originalUpdatedAt = '2020-01-01T00:00:00.000Z'
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: originalUpdatedAt,
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // updatedAt should be more recent than original
      expect(new Date(result.queries[0].updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      )
    })

    it('should return correct stats', () => {
      const existing: StorageSchema = {
        folders: [{ id: 'existing-work', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'existing-query',
            name: 'Duplicate',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'import-work', name: 'Work', parentId: null }, // Will be skipped
          { id: 'import-new', name: 'New Folder', parentId: null }, // Will be added
        ],
        queries: [
          {
            id: 'query-1',
            name: 'Duplicate',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-2',
            name: 'New Query',
            sql: 'SELECT 3',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.stats.foldersAdded).toBe(1)
      expect(result.stats.foldersSkipped).toBe(1)
      expect(result.stats.queriesAdded).toBe(2)
      expect(result.stats.queriesRenamed).toBe(1)
    })

    it('should handle empty import', () => {
      const existing: StorageSchema = {
        folders: [{ id: 'folder-1', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }
      const imported = createEmptyImportData()

      const result = mergeImportData(existing, imported)

      expect(result.folders).toHaveLength(1)
      expect(result.queries).toHaveLength(1)
      expect(result.stats.foldersAdded).toBe(0)
      expect(result.stats.queriesAdded).toBe(0)
    })

    it('should handle empty existing library', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [{ id: 'folder-1', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'folder-1',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.folders).toHaveLength(1)
      expect(result.queries).toHaveLength(1)
      expect(result.stats.foldersAdded).toBe(1)
      expect(result.stats.queriesAdded).toBe(1)
    })

    it('should generate new IDs for imported items', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [{ id: 'original-folder-id', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'original-query-id',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'original-folder-id',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.folders[0].id).not.toBe('original-folder-id')
      expect(result.queries[0].id).not.toBe('original-query-id')
      // Query should reference the new folder ID
      expect(result.queries[0].folderId).toBe(result.folders[0].id)
    })

    it('should handle case-insensitive folder name matching', () => {
      const existing: StorageSchema = {
        folders: [{ id: 'existing-work', name: 'Work', parentId: null }],
        queries: [],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [{ id: 'import-work', name: 'WORK', parentId: null }],
      }

      const result = mergeImportData(existing, imported)

      expect(result.folders).toHaveLength(1)
      expect(result.stats.foldersSkipped).toBe(1)
    })

    it('should handle case-insensitive query name matching', () => {
      const existing: StorageSchema = {
        folders: [],
        queries: [
          {
            id: 'existing-query',
            name: 'my query',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'import-query',
            name: 'MY QUERY',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.queries[1].name).toBe('MY QUERY (imported)')
      expect(result.stats.queriesRenamed).toBe(1)
    })

    it('should handle queries with orphaned folderId', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'non-existent-folder', // Not in import folders
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // Query should be placed at root
      expect(result.queries[0].folderId).toBeNull()
    })

    it('should handle multiple imported queries with same name', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Duplicate Name',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-2',
            name: 'Duplicate Name',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // First query keeps original name, second gets "(imported)" suffix
      expect(result.queries[0].name).toBe('Duplicate Name')
      expect(result.queries[1].name).toBe('Duplicate Name (imported)')
      expect(result.stats.queriesRenamed).toBe(1)
    })

    it('should handle multiple collisions with incremented suffix', () => {
      // Existing has both "My Query" and "My Query (imported)"
      const existing: StorageSchema = {
        folders: [],
        queries: [
          {
            id: 'existing-1',
            name: 'My Query',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'existing-2',
            name: 'My Query (imported)',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'import-1',
            name: 'My Query',
            sql: 'SELECT 3',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // Should get "(imported 2)" since "(imported)" is taken
      expect(result.queries).toHaveLength(3)
      expect(result.queries[2].name).toBe('My Query (imported 2)')
      expect(result.stats.queriesRenamed).toBe(1)
    })

    it('should handle three imported queries with same name all colliding', () => {
      const existing: StorageSchema = {
        folders: [],
        queries: [
          {
            id: 'existing-1',
            name: 'Dupe',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'import-1',
            name: 'Dupe',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'import-2',
            name: 'Dupe',
            sql: 'SELECT 3',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'import-3',
            name: 'Dupe',
            sql: 'SELECT 4',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      // All 4 queries should have unique names
      expect(result.queries).toHaveLength(4)
      const names = result.queries.map((q) => q.name)
      expect(names).toContain('Dupe')
      expect(names).toContain('Dupe (imported)')
      expect(names).toContain('Dupe (imported 2)')
      expect(names).toContain('Dupe (imported 3)')
      expect(result.stats.queriesRenamed).toBe(3)
    })

    it('should handle deeply nested folder structure', () => {
      const existing = createEmptyExisting()
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'level-1', name: 'Level 1', parentId: null },
          { id: 'level-2', name: 'Level 2', parentId: 'level-1' },
          { id: 'level-3', name: 'Level 3', parentId: 'level-2' },
          { id: 'level-4', name: 'Level 4', parentId: 'level-3' },
        ],
        queries: [
          {
            id: 'deep-query',
            name: 'Deep Query',
            sql: 'SELECT 1',
            folderId: 'level-4',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = mergeImportData(existing, imported)

      expect(result.folders).toHaveLength(4)
      expect(result.stats.foldersAdded).toBe(4)

      // Verify folder hierarchy is preserved
      const level1 = result.folders.find((f) => f.name === 'Level 1')
      const level2 = result.folders.find((f) => f.name === 'Level 2')
      const level3 = result.folders.find((f) => f.name === 'Level 3')
      const level4 = result.folders.find((f) => f.name === 'Level 4')

      expect(level1?.parentId).toBeNull()
      expect(level2?.parentId).toBe(level1?.id)
      expect(level3?.parentId).toBe(level2?.id)
      expect(level4?.parentId).toBe(level3?.id)

      // Query should point to level 4
      expect(result.queries[0].folderId).toBe(level4?.id)
    })
  })

  describe('replaceWithImportData', () => {
    it('should generate new IDs for all folders', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'original-folder-1', name: 'Work', parentId: null },
          { id: 'original-folder-2', name: 'Personal', parentId: null },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.folders).toHaveLength(2)
      expect(result.folders[0].id).not.toBe('original-folder-1')
      expect(result.folders[1].id).not.toBe('original-folder-2')
      // IDs should be valid UUIDs
      expect(result.folders[0].id).toMatch(/^[a-f0-9-]{36}$/)
      expect(result.folders[1].id).toMatch(/^[a-f0-9-]{36}$/)
    })

    it('should generate new IDs for all queries', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'original-query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'original-query-2',
            name: 'Q2',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.queries).toHaveLength(2)
      expect(result.queries[0].id).not.toBe('original-query-1')
      expect(result.queries[1].id).not.toBe('original-query-2')
      // IDs should be valid UUIDs
      expect(result.queries[0].id).toMatch(/^[a-f0-9-]{36}$/)
      expect(result.queries[1].id).toMatch(/^[a-f0-9-]{36}$/)
    })

    it('should remap folder parentId correctly', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'parent-folder', name: 'Parent', parentId: null },
          { id: 'child-folder', name: 'Child', parentId: 'parent-folder' },
        ],
      }

      const result = replaceWithImportData(imported)

      const parentFolder = result.folders.find((f) => f.name === 'Parent')
      const childFolder = result.folders.find((f) => f.name === 'Child')

      expect(parentFolder?.parentId).toBeNull()
      expect(childFolder?.parentId).toBe(parentFolder?.id)
      expect(childFolder?.parentId).not.toBe('parent-folder')
    })

    it('should remap query folderId correctly', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [{ id: 'original-folder', name: 'Work', parentId: null }],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'original-folder',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      const workFolder = result.folders.find((f) => f.name === 'Work')
      expect(result.queries[0].folderId).toBe(workFolder?.id)
      expect(result.queries[0].folderId).not.toBe('original-folder')
    })

    it('should preserve createdAt from imported queries', () => {
      const originalCreatedAt = '2020-05-15T08:30:00.000Z'
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: originalCreatedAt,
            updatedAt: '2020-05-15T08:30:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.queries[0].createdAt).toBe(originalCreatedAt)
    })

    it('should update updatedAt to current time', () => {
      const originalUpdatedAt = '2020-01-01T00:00:00.000Z'
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: null,
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: originalUpdatedAt,
          },
        ],
      }

      const result = replaceWithImportData(imported)

      // updatedAt should be more recent than original
      expect(new Date(result.queries[0].updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      )
    })

    it('should return correct stats', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'folder-1', name: 'Work', parentId: null },
          { id: 'folder-2', name: 'Personal', parentId: null },
          { id: 'folder-3', name: 'Archive', parentId: 'folder-1' },
        ],
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'folder-1',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
          {
            id: 'query-2',
            name: 'Q2',
            sql: 'SELECT 2',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.stats.foldersImported).toBe(3)
      expect(result.stats.queriesImported).toBe(2)
    })

    it('should handle empty import', () => {
      const imported = createEmptyImportData()

      const result = replaceWithImportData(imported)

      expect(result.folders).toHaveLength(0)
      expect(result.queries).toHaveLength(0)
      expect(result.stats.foldersImported).toBe(0)
      expect(result.stats.queriesImported).toBe(0)
    })

    it('should handle nested folder structure', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'level-1', name: 'Level 1', parentId: null },
          { id: 'level-2', name: 'Level 2', parentId: 'level-1' },
          { id: 'level-3', name: 'Level 3', parentId: 'level-2' },
          { id: 'level-4', name: 'Level 4', parentId: 'level-3' },
        ],
        queries: [
          {
            id: 'deep-query',
            name: 'Deep Query',
            sql: 'SELECT 1',
            folderId: 'level-4',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.folders).toHaveLength(4)
      expect(result.stats.foldersImported).toBe(4)

      // Verify folder hierarchy is preserved
      const level1 = result.folders.find((f) => f.name === 'Level 1')
      const level2 = result.folders.find((f) => f.name === 'Level 2')
      const level3 = result.folders.find((f) => f.name === 'Level 3')
      const level4 = result.folders.find((f) => f.name === 'Level 4')

      expect(level1?.parentId).toBeNull()
      expect(level2?.parentId).toBe(level1?.id)
      expect(level3?.parentId).toBe(level2?.id)
      expect(level4?.parentId).toBe(level3?.id)

      // Query should point to level 4
      expect(result.queries[0].folderId).toBe(level4?.id)
    })

    it('should handle queries with orphaned folderId', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'Q1',
            sql: 'SELECT 1',
            folderId: 'non-existent-folder', // Not in import folders
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      // Query should be placed at root since folder doesn't exist
      expect(result.queries[0].folderId).toBeNull()
    })

    it('should preserve query name and sql content', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        queries: [
          {
            id: 'query-1',
            name: 'My Special Query',
            sql: 'SELECT * FROM users WHERE active = 1',
            folderId: null,
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z',
          },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.queries[0].name).toBe('My Special Query')
      expect(result.queries[0].sql).toBe('SELECT * FROM users WHERE active = 1')
    })

    it('should preserve folder names', () => {
      const imported: ExportData = {
        ...createEmptyImportData(),
        folders: [
          { id: 'folder-1', name: 'My Work Queries', parentId: null },
        ],
      }

      const result = replaceWithImportData(imported)

      expect(result.folders[0].name).toBe('My Work Queries')
    })
  })
})
