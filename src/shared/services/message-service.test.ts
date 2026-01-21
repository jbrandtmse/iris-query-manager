import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendToServiceWorker, sendToContentScript } from './message-service'
import type { MessageType } from '../types/message.types'

// Helper to create mock chrome API
const createMockChrome = () => {
  const mockChrome = {
    runtime: {
      sendMessage: vi.fn(),
      lastError: undefined as chrome.runtime.LastError | undefined,
    },
    tabs: {
      sendMessage: vi.fn(),
    },
  }

  return {
    mockChrome,
    setLastError: (error: string | undefined) => {
      mockChrome.runtime.lastError = error ? { message: error } : undefined
    },
    clearLastError: () => {
      mockChrome.runtime.lastError = undefined
    },
  }
}

describe('message-service', () => {
  let mock: ReturnType<typeof createMockChrome>

  beforeEach(() => {
    mock = createMockChrome()
    vi.stubGlobal('chrome', mock.mockChrome)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('sendToServiceWorker', () => {
    it('should send message and return success response', async () => {
      const message: MessageType = { type: 'GET_QUERIES' }
      const expectedResponse = { success: true, data: [{ id: '1', name: 'Test' }] }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.clearLastError()
          callback(expectedResponse)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(mock.mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        message,
        expect.any(Function)
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should handle chrome.runtime.lastError and return error result', async () => {
      const message: MessageType = { type: 'GET_QUERIES' }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.setLastError('Extension context invalidated')
          callback(undefined)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Extension context invalidated')
      }
    })

    it('should return unknown error when lastError has no message', async () => {
      const message: MessageType = { type: 'GET_QUERIES' }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.mockChrome.runtime.lastError = {} as chrome.runtime.LastError
          callback(undefined)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Unknown error')
      }
    })

    it('should pass correct message structure for CAPTURE_QUERY', async () => {
      const message: MessageType = {
        type: 'CAPTURE_QUERY',
        payload: { name: 'My Query', folderId: 'folder-1' },
      }
      const expectedResponse = { success: true, data: { id: 'new-query-id' } }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.clearLastError()
          callback(expectedResponse)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(mock.mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          type: 'CAPTURE_QUERY',
          payload: { name: 'My Query', folderId: 'folder-1' },
        },
        expect.any(Function)
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should handle DELETE_QUERY message type', async () => {
      const message: MessageType = {
        type: 'DELETE_QUERY',
        payload: { id: 'query-to-delete' },
      }
      const expectedResponse = { success: true, data: undefined }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.clearLastError()
          callback(expectedResponse)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(result).toEqual(expectedResponse)
    })

    it('should handle UPDATE_QUERY message type', async () => {
      const message: MessageType = {
        type: 'UPDATE_QUERY',
        payload: { id: 'query-id', updates: { name: 'New Name' } },
      }
      const expectedResponse = {
        success: true,
        data: { id: 'query-id', name: 'New Name' },
      }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.clearLastError()
          callback(expectedResponse)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(result).toEqual(expectedResponse)
    })

    it('should return error response from service worker', async () => {
      const message: MessageType = { type: 'GET_QUERIES' }
      const errorResponse = { success: false, error: 'Storage not available' }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.clearLastError()
          callback(errorResponse)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Storage not available')
      }
    })

    it('should return error when response is undefined (no handler matched)', async () => {
      const message: MessageType = { type: 'GET_QUERIES' }

      mock.mockChrome.runtime.sendMessage.mockImplementation(
        (_message: MessageType, callback: (response: unknown) => void) => {
          mock.clearLastError()
          callback(undefined)
        }
      )

      const result = await sendToServiceWorker(message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('No response from service worker')
      }
    })
  })

  describe('sendToContentScript', () => {
    const tabId = 123

    it('should send message to correct tab and return success response', async () => {
      const message: MessageType = { type: 'GET_CURRENT_SQL' }
      const expectedResponse = { success: true, data: 'SELECT * FROM users' }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.clearLastError()
          callback(expectedResponse)
        }
      )

      const result = await sendToContentScript(tabId, message)

      expect(mock.mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        message,
        expect.any(Function)
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should handle chrome.runtime.lastError when content script not available', async () => {
      const message: MessageType = { type: 'GET_CURRENT_SQL' }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.setLastError('Could not establish connection. Receiving end does not exist.')
          callback(undefined)
        }
      )

      const result = await sendToContentScript(tabId, message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe(
          'Could not establish connection. Receiving end does not exist.'
        )
      }
    })

    it('should return unknown error when lastError has no message', async () => {
      const message: MessageType = { type: 'GET_CURRENT_SQL' }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.mockChrome.runtime.lastError = {} as chrome.runtime.LastError
          callback(undefined)
        }
      )

      const result = await sendToContentScript(tabId, message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Unknown error')
      }
    })

    it('should handle PASTE_QUERY message type', async () => {
      const message: MessageType = {
        type: 'PASTE_QUERY',
        payload: { sql: 'SELECT * FROM orders' },
      }
      const expectedResponse = { success: true, data: null }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.clearLastError()
          callback(expectedResponse)
        }
      )

      const result = await sendToContentScript(tabId, message)

      expect(mock.mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        {
          type: 'PASTE_QUERY',
          payload: { sql: 'SELECT * FROM orders' },
        },
        expect.any(Function)
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should return error response from content script', async () => {
      const message: MessageType = { type: 'GET_CURRENT_SQL' }
      const errorResponse = { success: false, error: 'SMP textarea not found' }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.clearLastError()
          callback(errorResponse)
        }
      )

      const result = await sendToContentScript(tabId, message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('SMP textarea not found')
      }
    })

    it('should use the provided tab ID', async () => {
      const customTabId = 456
      const message: MessageType = { type: 'GET_CURRENT_SQL' }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.clearLastError()
          callback({ success: true, data: 'SELECT 1' })
        }
      )

      await sendToContentScript(customTabId, message)

      expect(mock.mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        customTabId,
        message,
        expect.any(Function)
      )
    })

    it('should return error when response is undefined (no handler matched)', async () => {
      const message: MessageType = { type: 'GET_CURRENT_SQL' }

      mock.mockChrome.tabs.sendMessage.mockImplementation(
        (
          _tabId: number,
          _message: MessageType,
          callback: (response: unknown) => void
        ) => {
          mock.clearLastError()
          callback(undefined)
        }
      )

      const result = await sendToContentScript(tabId, message)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('No response from content script')
      }
    })
  })

  describe('type safety', () => {
    it('should enforce UPPER_SNAKE_CASE message type names', () => {
      // This test verifies that the discriminated union uses UPPER_SNAKE_CASE
      // Compile-time check - if this compiles, the types are correct
      const validMessages: MessageType[] = [
        // SMP detection messages
        { type: 'CHECK_SMP_AVAILABLE', payload: { available: true, textareaFound: true } },
        { type: 'GET_CURRENT_SQL' },
        { type: 'PASTE_QUERY', payload: { sql: 'SELECT *' } },
        { type: 'GET_SMP_STATUS' },
        // Capture flow
        { type: 'CAPTURE_QUERY', payload: { name: 'test' } },
        // Storage CRUD operations
        { type: 'SAVE_QUERY', payload: { name: 'test', sql: 'SELECT 1' } },
        { type: 'GET_QUERIES' },
        { type: 'GET_FOLDERS' },
        { type: 'DELETE_QUERY', payload: { id: '123' } },
        { type: 'UPDATE_QUERY', payload: { id: '123', updates: { name: 'new' } } },
        // Folder operations
        { type: 'SAVE_FOLDER', payload: { name: 'folder' } },
        { type: 'DELETE_FOLDER', payload: { id: '456' } },
        { type: 'UPDATE_FOLDER', payload: { id: '456', updates: { name: 'renamed' } } },
      ]

      // All 13 message types in the union are represented
      expect(validMessages).toHaveLength(13)
    })

    it('should require payload for CAPTURE_QUERY', () => {
      // Type-level test - verifies payload structure
      const message: Extract<MessageType, { type: 'CAPTURE_QUERY' }> = {
        type: 'CAPTURE_QUERY',
        payload: { name: 'Query Name', folderId: null },
      }

      expect(message.payload.name).toBe('Query Name')
      expect(message.payload.folderId).toBe(null)
    })

    it('should allow optional folderId in CAPTURE_QUERY', () => {
      const messageWithFolder: Extract<MessageType, { type: 'CAPTURE_QUERY' }> = {
        type: 'CAPTURE_QUERY',
        payload: { name: 'Query', folderId: 'folder-123' },
      }

      const messageWithoutFolder: Extract<MessageType, { type: 'CAPTURE_QUERY' }> = {
        type: 'CAPTURE_QUERY',
        payload: { name: 'Query' },
      }

      expect(messageWithFolder.payload.folderId).toBe('folder-123')
      expect(messageWithoutFolder.payload.folderId).toBeUndefined()
    })
  })
})
