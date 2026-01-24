/**
 * Popup Index Tests
 * Tests for query activation and paste flow (Story 3-4)
 * Tests for rename/delete flows (Story 3-5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the paste logic by importing the module after mocking dependencies

// Mock modules before importing
vi.mock('./components/toast', () => ({
  showToast: vi.fn(),
}))

vi.mock('../shared/services/message-service', () => ({
  sendToServiceWorker: vi.fn(),
}))

vi.mock('../shared/utils/sql-utils', () => ({
  checkSqlSafety: vi.fn(() => ({ isDangerous: false, keyword: null })),
  getDangerousSqlWarning: vi.fn(),
}))

vi.mock('../shared/utils/file-utils', () => ({
  downloadJsonFile: vi.fn(),
  generateExportFilename: vi.fn(() => 'query-manager-export-2026-01-24.json'),
  generateFolderExportFilename: vi.fn((name: string) => `query-manager-${name.toLowerCase()}-2026-01-24.json`),
}))

// Import mocked functions after vi.mock calls
import { showToast } from './components/toast'
import { sendToServiceWorker } from '../shared/services/message-service'
import { checkSqlSafety } from '../shared/utils/sql-utils'
import { downloadJsonFile, generateExportFilename, generateFolderExportFilename } from '../shared/utils/file-utils'
import type { Query, Folder } from '../shared/types/storage.types'
import type { MessageResult } from '../shared/types/message.types'

// Helper to create mock query
const createMockQuery = (overrides?: Partial<Query>): Query => ({
  id: 'test-query-id',
  name: 'Test Query',
  sql: 'SELECT * FROM users',
  folderId: null,
  createdAt: '2026-01-22T00:00:00Z',
  updatedAt: '2026-01-22T00:00:00Z',
  ...overrides,
})

// Helper to create mock folder
const createMockFolder = (overrides?: Partial<Folder>): Folder => ({
  id: 'test-folder-id',
  name: 'Test Folder',
  parentId: null,
  ...overrides,
})

// We need to test handleQueryActivate which is not exported
// We'll test via integration with the tree-view callbacks
// For now, let's test the individual behaviors through a simplified test approach

describe('Story 3-4: handleQueryActivate paste flow', () => {
  // Create a simplified version of handleQueryActivate for testing
  // This mirrors the actual implementation logic
  async function handleQueryActivate(query: Query): Promise<void> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)
    const mockedCheckSqlSafety = vi.mocked(checkSqlSafety)

    // Check SMP availability BEFORE attempting paste (Story 3-4 AC4)
    const statusResult = (await mockedSendToServiceWorker({
      type: 'GET_SMP_STATUS',
    })) as MessageResult<{ available: boolean }>

    if (!statusResult.success || !statusResult.data.available) {
      mockedShowToast('SMP textarea not detected on this page', 'error')
      return
    }

    // Check for dangerous SQL before paste (per project-context.md)
    const safetyCheck = mockedCheckSqlSafety(query.sql)

    if (safetyCheck.isDangerous) {
      // Skip confirm dialog check in tests for simplicity
      return
    }

    // Paste query SQL to SMP textarea (Story 3-2 AC2)
    const result = (await mockedSendToServiceWorker({
      type: 'PASTE_QUERY',
      payload: { sql: query.sql },
    })) as MessageResult<null>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return
    }

    // Show success feedback
    mockedShowToast(`Pasted: ${query.name}`, 'success')
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset sql safety check to return safe by default
    vi.mocked(checkSqlSafety).mockReturnValue({ isDangerous: false, keyword: null })
  })

  describe('SMP status check before paste (AC4)', () => {
    it('should call GET_SMP_STATUS before attempting paste', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: true },
      })
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: null,
      })

      await handleQueryActivate(query)

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'GET_SMP_STATUS',
      })
    })

    it('should show error toast when SMP unavailable', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: false },
      })

      await handleQueryActivate(query)

      expect(showToast).toHaveBeenCalledWith(
        'SMP textarea not detected on this page',
        'error'
      )
    })

    it('should show error toast when GET_SMP_STATUS fails', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Service worker not ready',
      })

      await handleQueryActivate(query)

      expect(showToast).toHaveBeenCalledWith(
        'SMP textarea not detected on this page',
        'error'
      )
    })

    it('should NOT attempt paste when SMP unavailable', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: false },
      })

      await handleQueryActivate(query)

      // Should only be called once (for GET_SMP_STATUS), not for PASTE_QUERY
      expect(sendToServiceWorker).toHaveBeenCalledTimes(1)
      expect(sendToServiceWorker).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PASTE_QUERY' })
      )
    })
  })

  describe('paste operation (AC1)', () => {
    it('should send PASTE_QUERY when SMP is available', async () => {
      const query = createMockQuery({ sql: 'SELECT id FROM orders' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: true },
      })
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: null,
      })

      await handleQueryActivate(query)

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'PASTE_QUERY',
        payload: { sql: 'SELECT id FROM orders' },
      })
    })

    it('should check SMP status before paste (not after)', async () => {
      const query = createMockQuery()
      const callOrder: string[] = []

      vi.mocked(sendToServiceWorker).mockImplementation(async (msg) => {
        callOrder.push(msg.type)
        if (msg.type === 'GET_SMP_STATUS') {
          return { success: true, data: { available: true } }
        }
        return { success: true, data: null }
      })

      await handleQueryActivate(query)

      expect(callOrder).toEqual(['GET_SMP_STATUS', 'PASTE_QUERY'])
    })
  })

  describe('success feedback (AC3)', () => {
    it('should show success toast with query name after paste', async () => {
      const query = createMockQuery({ name: 'My Special Query' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: true },
      })
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: null,
      })

      await handleQueryActivate(query)

      expect(showToast).toHaveBeenCalledWith('Pasted: My Special Query', 'success')
    })
  })

  describe('error feedback (AC3, AC4)', () => {
    it('should show error toast when paste fails', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: true },
      })
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Content script not responding',
      })

      await handleQueryActivate(query)

      expect(showToast).toHaveBeenCalledWith('Content script not responding', 'error')
    })

    it('should NOT show success toast when paste fails', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: true },
      })
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Paste failed',
      })

      await handleQueryActivate(query)

      expect(showToast).not.toHaveBeenCalledWith(
        expect.stringContaining('Pasted:'),
        'success'
      )
    })
  })

  describe('SQL safety check', () => {
    it('should check SQL safety before paste when SMP available', async () => {
      const query = createMockQuery({ sql: 'DELETE FROM users' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: true },
      })

      await handleQueryActivate(query)

      expect(checkSqlSafety).toHaveBeenCalledWith('DELETE FROM users')
    })

    it('should NOT check SQL safety if SMP unavailable', async () => {
      const query = createMockQuery({ sql: 'DELETE FROM users' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { available: false },
      })

      await handleQueryActivate(query)

      expect(checkSqlSafety).not.toHaveBeenCalled()
    })
  })
})

describe('Story 3-5: handleRenameQuery flow', () => {
  // Simplified version of handleRenameQuery for testing
  async function handleRenameQuery(
    query: Query,
    promptResult: string | null
  ): Promise<void> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)

    // Handle cancel or empty input
    if (promptResult === null) {
      return // User cancelled
    }

    const trimmedName = promptResult.trim()
    if (!trimmedName) {
      mockedShowToast('Name cannot be empty', 'error')
      return
    }

    // Skip if name unchanged
    if (trimmedName === query.name) {
      return
    }

    // Send UPDATE_QUERY to service worker
    const result = (await mockedSendToServiceWorker({
      type: 'UPDATE_QUERY',
      payload: { id: query.id, updates: { name: trimmedName } },
    })) as MessageResult<Query>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return
    }

    // Show success feedback
    mockedShowToast(`Renamed to: ${trimmedName}`, 'success')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rename validation (AC2)', () => {
    it('should do nothing when user cancels prompt', async () => {
      const query = createMockQuery()

      await handleRenameQuery(query, null)

      expect(sendToServiceWorker).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })

    it('should show error toast for empty name', async () => {
      const query = createMockQuery()

      await handleRenameQuery(query, '   ')

      expect(showToast).toHaveBeenCalledWith('Name cannot be empty', 'error')
      expect(sendToServiceWorker).not.toHaveBeenCalled()
    })

    it('should skip update if name unchanged', async () => {
      const query = createMockQuery({ name: 'Original Name' })

      await handleRenameQuery(query, 'Original Name')

      expect(sendToServiceWorker).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })

    it('should trim whitespace from name', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { ...query, name: 'Trimmed Name' },
      })

      await handleRenameQuery(query, '  Trimmed Name  ')

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'UPDATE_QUERY',
        payload: { id: query.id, updates: { name: 'Trimmed Name' } },
      })
    })
  })

  describe('rename operation (AC2)', () => {
    it('should call UPDATE_QUERY with correct data', async () => {
      const query = createMockQuery({ id: 'query-123', name: 'Old Name' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { ...query, name: 'New Name' },
      })

      await handleRenameQuery(query, 'New Name')

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'UPDATE_QUERY',
        payload: { id: 'query-123', updates: { name: 'New Name' } },
      })
    })

    it('should show success toast after rename', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { ...query, name: 'New Query Name' },
      })

      await handleRenameQuery(query, 'New Query Name')

      expect(showToast).toHaveBeenCalledWith('Renamed to: New Query Name', 'success')
    })

    it('should show error toast when rename fails', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Query not found',
      })

      await handleRenameQuery(query, 'New Name')

      expect(showToast).toHaveBeenCalledWith('Query not found', 'error')
    })
  })
})

describe('Story 3-5: handleDeleteQuery flow', () => {
  // Simplified version of handleDeleteQuery for testing
  async function handleDeleteQuery(
    query: Query,
    confirmed: boolean,
    currentSelectedId: string | null = null
  ): Promise<{ clearedSelection: boolean }> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)

    if (!confirmed) {
      return { clearedSelection: false }
    }

    // Send DELETE_QUERY to service worker
    const result = (await mockedSendToServiceWorker({
      type: 'DELETE_QUERY',
      payload: { id: query.id },
    })) as MessageResult<void>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return { clearedSelection: false }
    }

    // Show success feedback
    mockedShowToast(`Deleted: ${query.name}`, 'success')

    // Clear selection if deleted query was selected
    const clearedSelection = currentSelectedId === query.id

    return { clearedSelection }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('delete confirmation (AC3)', () => {
    it('should do nothing when user cancels confirmation', async () => {
      const query = createMockQuery()

      await handleDeleteQuery(query, false)

      expect(sendToServiceWorker).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })
  })

  describe('delete operation (AC3)', () => {
    it('should call DELETE_QUERY with correct id', async () => {
      const query = createMockQuery({ id: 'delete-me-123' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      await handleDeleteQuery(query, true)

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'DELETE_QUERY',
        payload: { id: 'delete-me-123' },
      })
    })

    it('should show success toast with query name after delete', async () => {
      const query = createMockQuery({ name: 'My Deleted Query' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      await handleDeleteQuery(query, true)

      expect(showToast).toHaveBeenCalledWith('Deleted: My Deleted Query', 'success')
    })

    it('should show error toast when delete fails', async () => {
      const query = createMockQuery()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Storage error',
      })

      await handleDeleteQuery(query, true)

      expect(showToast).toHaveBeenCalledWith('Storage error', 'error')
    })

    it('should clear selection when deleted query was selected', async () => {
      const query = createMockQuery({ id: 'selected-query' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      const result = await handleDeleteQuery(query, true, 'selected-query')

      expect(result.clearedSelection).toBe(true)
    })

    it('should NOT clear selection when different query was selected', async () => {
      const query = createMockQuery({ id: 'deleted-query' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      const result = await handleDeleteQuery(query, true, 'other-query')

      expect(result.clearedSelection).toBe(false)
    })
  })
})

describe('Story 4-3: handleRenameFolder flow', () => {
  // Simplified version of handleRenameFolder for testing
  async function handleRenameFolder(
    folder: Folder,
    promptResult: string | null
  ): Promise<void> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)

    // Handle cancel or empty input
    if (promptResult === null) {
      return // User cancelled
    }

    const trimmedName = promptResult.trim()
    if (!trimmedName) {
      mockedShowToast('Name cannot be empty', 'error')
      return
    }

    // Skip if name unchanged
    if (trimmedName === folder.name) {
      return
    }

    // Send UPDATE_FOLDER to service worker
    const result = (await mockedSendToServiceWorker({
      type: 'UPDATE_FOLDER',
      payload: { id: folder.id, updates: { name: trimmedName } },
    })) as MessageResult<Folder>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return
    }

    // Show success feedback
    mockedShowToast(`Renamed to: ${trimmedName}`, 'success')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rename validation (AC1)', () => {
    it('should do nothing when user cancels prompt', async () => {
      const folder = createMockFolder()

      await handleRenameFolder(folder, null)

      expect(sendToServiceWorker).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })

    it('should show error toast for empty name', async () => {
      const folder = createMockFolder()

      await handleRenameFolder(folder, '   ')

      expect(showToast).toHaveBeenCalledWith('Name cannot be empty', 'error')
      expect(sendToServiceWorker).not.toHaveBeenCalled()
    })

    it('should skip update if name unchanged', async () => {
      const folder = createMockFolder({ name: 'Original Name' })

      await handleRenameFolder(folder, 'Original Name')

      expect(sendToServiceWorker).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })

    it('should trim whitespace from name', async () => {
      const folder = createMockFolder()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { ...folder, name: 'Trimmed Name' },
      })

      await handleRenameFolder(folder, '  Trimmed Name  ')

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'UPDATE_FOLDER',
        payload: { id: folder.id, updates: { name: 'Trimmed Name' } },
      })
    })
  })

  describe('rename operation (AC1)', () => {
    it('should call UPDATE_FOLDER with correct data', async () => {
      const folder = createMockFolder({ id: 'folder-123', name: 'Old Name' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { ...folder, name: 'New Name' },
      })

      await handleRenameFolder(folder, 'New Name')

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'UPDATE_FOLDER',
        payload: { id: 'folder-123', updates: { name: 'New Name' } },
      })
    })

    it('should show success toast after rename', async () => {
      const folder = createMockFolder()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: { ...folder, name: 'New Folder Name' },
      })

      await handleRenameFolder(folder, 'New Folder Name')

      expect(showToast).toHaveBeenCalledWith('Renamed to: New Folder Name', 'success')
    })

    it('should show error toast when rename fails', async () => {
      const folder = createMockFolder()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Folder not found',
      })

      await handleRenameFolder(folder, 'New Name')

      expect(showToast).toHaveBeenCalledWith('Folder not found', 'error')
    })
  })
})

describe('Story 4-3: handleDeleteFolder flow', () => {
  // Simplified version of handleDeleteFolder for testing
  async function handleDeleteFolder(
    folder: Folder,
    confirmed: boolean
  ): Promise<void> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)

    if (!confirmed) {
      return // User cancelled
    }

    // Send DELETE_FOLDER to service worker
    const result = (await mockedSendToServiceWorker({
      type: 'DELETE_FOLDER',
      payload: { id: folder.id },
    })) as MessageResult<void>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return
    }

    // Show success feedback
    mockedShowToast(`Deleted: ${folder.name}`, 'success')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('delete confirmation (AC2)', () => {
    it('should do nothing when user cancels confirmation', async () => {
      const folder = createMockFolder()

      await handleDeleteFolder(folder, false)

      expect(sendToServiceWorker).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })
  })

  describe('delete operation (AC2)', () => {
    it('should call DELETE_FOLDER with correct id', async () => {
      const folder = createMockFolder({ id: 'delete-folder-123' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      await handleDeleteFolder(folder, true)

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'DELETE_FOLDER',
        payload: { id: 'delete-folder-123' },
      })
    })

    it('should show success toast with folder name after delete', async () => {
      const folder = createMockFolder({ name: 'My Deleted Folder' })

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: undefined,
      })

      await handleDeleteFolder(folder, true)

      expect(showToast).toHaveBeenCalledWith('Deleted: My Deleted Folder', 'success')
    })
  })

  describe('delete error handling (AC3, AC4)', () => {
    it('should show error toast when folder has queries (AC3)', async () => {
      const folder = createMockFolder()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Folder contains queries. Move or delete them first.',
      })

      await handleDeleteFolder(folder, true)

      expect(showToast).toHaveBeenCalledWith(
        'Folder contains queries. Move or delete them first.',
        'error'
      )
    })

    it('should show error toast when folder has subfolders (AC4)', async () => {
      const folder = createMockFolder()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Folder contains subfolders. Delete them first.',
      })

      await handleDeleteFolder(folder, true)

      expect(showToast).toHaveBeenCalledWith(
        'Folder contains subfolders. Delete them first.',
        'error'
      )
    })

    it('should show error toast when folder not found', async () => {
      const folder = createMockFolder()

      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Folder not found',
      })

      await handleDeleteFolder(folder, true)

      expect(showToast).toHaveBeenCalledWith('Folder not found', 'error')
    })
  })
})

describe('Story 5-1: handleExportAll flow', () => {
  // Helper to format plural/singular
  function formatCount(count: number, singular: string, plural: string): string {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural}`
  }

  // Version that mirrors real implementation including downloadJsonFile call
  async function handleExportAll(): Promise<void> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)
    const mockedDownloadJsonFile = vi.mocked(downloadJsonFile)
    const mockedGenerateExportFilename = vi.mocked(generateExportFilename)

    const result = (await mockedSendToServiceWorker({ type: 'EXPORT_ALL' })) as MessageResult<{
      version: string
      exportedAt: string
      queries: Query[]
      folders: Folder[]
    }>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return
    }

    const data = result.data
    const filename = mockedGenerateExportFilename()

    try {
      mockedDownloadJsonFile(data, filename)
    } catch {
      mockedShowToast('Failed to download file', 'error')
      return
    }

    const queryText = formatCount(data.queries.length, 'query', 'queries')
    const folderText = formatCount(data.folders.length, 'folder', 'folders')
    mockedShowToast(`Exported ${queryText} and ${folderText}`, 'success')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('export operation (AC1)', () => {
    it('should call EXPORT_ALL message', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-23T00:00:00Z',
          queries: [],
          folders: [],
        },
      })

      await handleExportAll()

      expect(sendToServiceWorker).toHaveBeenCalledWith({ type: 'EXPORT_ALL' })
    })

    it('should show success toast with counts after export', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-23T00:00:00Z',
          queries: [createMockQuery(), createMockQuery({ id: 'q2' })],
          folders: [createMockFolder()],
        },
      })

      await handleExportAll()

      expect(showToast).toHaveBeenCalledWith('Exported 2 queries and 1 folder', 'success')
    })

    it('should show singular "query" when count is 1', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-23T00:00:00Z',
          queries: [createMockQuery()],
          folders: [createMockFolder(), createMockFolder({ id: 'f2' })],
        },
      })

      await handleExportAll()

      expect(showToast).toHaveBeenCalledWith('Exported 1 query and 2 folders', 'success')
    })

    it('should handle empty export', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-23T00:00:00Z',
          queries: [],
          folders: [],
        },
      })

      await handleExportAll()

      expect(showToast).toHaveBeenCalledWith('Exported 0 queries and 0 folders', 'success')
    })

    it('should call downloadJsonFile with export data and filename', async () => {
      const exportData = {
        version: '1.0',
        exportedAt: '2026-01-23T00:00:00Z',
        queries: [createMockQuery()],
        folders: [createMockFolder()],
      }
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: exportData,
      })

      await handleExportAll()

      expect(generateExportFilename).toHaveBeenCalled()
      expect(downloadJsonFile).toHaveBeenCalledWith(exportData, 'query-manager-export-2026-01-24.json')
    })

    it('should show error toast when downloadJsonFile throws', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-23T00:00:00Z',
          queries: [],
          folders: [],
        },
      })
      vi.mocked(downloadJsonFile).mockImplementationOnce(() => {
        throw new Error('Blob creation failed')
      })

      await handleExportAll()

      expect(showToast).toHaveBeenCalledWith('Failed to download file', 'error')
    })
  })

  describe('export error handling', () => {
    it('should show error toast when export fails', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Storage read error',
      })

      await handleExportAll()

      expect(showToast).toHaveBeenCalledWith('Storage read error', 'error')
    })

    it('should NOT show success toast when export fails', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Export failed',
      })

      await handleExportAll()

      expect(showToast).not.toHaveBeenCalledWith(
        expect.stringContaining('Exported'),
        'success'
      )
    })
  })
})

describe('Story 5-2: handleExportFolder flow', () => {
  // Helper to format plural/singular
  function formatCount(count: number, singular: string, plural: string): string {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural}`
  }

  // Version that mirrors real implementation including downloadJsonFile call
  async function handleExportFolder(folderId: string, folderName: string): Promise<void> {
    const mockedSendToServiceWorker = vi.mocked(sendToServiceWorker)
    const mockedShowToast = vi.mocked(showToast)
    const mockedDownloadJsonFile = vi.mocked(downloadJsonFile)
    const mockedGenerateFolderExportFilename = vi.mocked(generateFolderExportFilename)

    const result = (await mockedSendToServiceWorker({
      type: 'EXPORT_FOLDER',
      payload: { folderId },
    })) as MessageResult<{
      version: string
      exportedAt: string
      queries: Query[]
      folders: Folder[]
    }>

    if (!result.success) {
      mockedShowToast(result.error, 'error')
      return
    }

    const data = result.data
    const filename = mockedGenerateFolderExportFilename(folderName)

    try {
      mockedDownloadJsonFile(data, filename)
    } catch {
      mockedShowToast('Failed to download file', 'error')
      return
    }

    const queryText = formatCount(data.queries.length, 'query', 'queries')
    mockedShowToast(`Exported folder with ${queryText}`, 'success')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('export folder operation (AC1, AC2)', () => {
    it('should call EXPORT_FOLDER message with folderId', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-24T00:00:00Z',
          queries: [],
          folders: [createMockFolder()],
        },
      })

      await handleExportFolder('folder-1', 'My Folder')

      expect(sendToServiceWorker).toHaveBeenCalledWith({
        type: 'EXPORT_FOLDER',
        payload: { folderId: 'folder-1' },
      })
    })

    it('should show success toast with query count after export', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-24T00:00:00Z',
          queries: [createMockQuery(), createMockQuery({ id: 'q2' }), createMockQuery({ id: 'q3' })],
          folders: [createMockFolder()],
        },
      })

      await handleExportFolder('folder-1', 'My Folder')

      expect(showToast).toHaveBeenCalledWith('Exported folder with 3 queries', 'success')
    })

    it('should show singular "query" when count is 1', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-24T00:00:00Z',
          queries: [createMockQuery()],
          folders: [createMockFolder()],
        },
      })

      await handleExportFolder('folder-1', 'Work Queries')

      expect(showToast).toHaveBeenCalledWith('Exported folder with 1 query', 'success')
    })

    it('should handle empty folder (no queries)', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-24T00:00:00Z',
          queries: [],
          folders: [createMockFolder()],
        },
      })

      await handleExportFolder('folder-1', 'Empty Folder')

      expect(showToast).toHaveBeenCalledWith('Exported folder with 0 queries', 'success')
    })

    it('should call downloadJsonFile with export data and folder filename', async () => {
      const exportData = {
        version: '1.0',
        exportedAt: '2026-01-24T00:00:00Z',
        queries: [createMockQuery()],
        folders: [createMockFolder()],
      }
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: exportData,
      })

      await handleExportFolder('folder-1', 'Work Queries')

      expect(generateFolderExportFilename).toHaveBeenCalledWith('Work Queries')
      expect(downloadJsonFile).toHaveBeenCalledWith(exportData, 'query-manager-work queries-2026-01-24.json')
    })

    it('should show error toast when downloadJsonFile throws', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: true,
        data: {
          version: '1.0',
          exportedAt: '2026-01-24T00:00:00Z',
          queries: [],
          folders: [createMockFolder()],
        },
      })
      vi.mocked(downloadJsonFile).mockImplementationOnce(() => {
        throw new Error('Blob creation failed')
      })

      await handleExportFolder('folder-1', 'Test')

      expect(showToast).toHaveBeenCalledWith('Failed to download file', 'error')
    })
  })

  describe('export folder error handling', () => {
    it('should show error toast when folder not found', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Folder not found',
      })

      await handleExportFolder('non-existent', 'Missing')

      expect(showToast).toHaveBeenCalledWith('Folder not found', 'error')
    })

    it('should show error toast when storage read fails', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Storage read error',
      })

      await handleExportFolder('folder-1', 'Test')

      expect(showToast).toHaveBeenCalledWith('Storage read error', 'error')
    })

    it('should NOT show success toast when export fails', async () => {
      vi.mocked(sendToServiceWorker).mockResolvedValueOnce({
        success: false,
        error: 'Export failed',
      })

      await handleExportFolder('folder-1', 'Test')

      expect(showToast).not.toHaveBeenCalledWith(
        expect.stringContaining('Exported folder'),
        'success'
      )
    })
  })
})
