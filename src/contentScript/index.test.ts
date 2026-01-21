import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'

// Mock Chrome APIs before importing module
const mockSendMessage = vi.fn()
const mockAddListener = vi.fn()
const mockOnRemoved = { addListener: vi.fn() }

vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: mockAddListener,
    },
    lastError: null,
  },
  tabs: {
    onRemoved: mockOnRemoved,
  },
})

// Mock smp-detector module
vi.mock('./smp-detector', () => ({
  findSmpTextarea: vi.fn(),
  waitForTextarea: vi.fn(),
  observeForTextarea: vi.fn(),
}))

import { findSmpTextarea, waitForTextarea, observeForTextarea } from './smp-detector'

describe('content script message handlers', () => {
  let messageHandler: (
    message: unknown,
    sender: unknown,
    sendResponse: (response: unknown) => void
  ) => boolean | undefined

  beforeEach(() => {
    vi.clearAllMocks()

    // Capture the message handler when addListener is called
    mockAddListener.mockImplementation((handler) => {
      messageHandler = handler
    })

    // Default mock for waitForTextarea (initialize needs this)
    vi.mocked(waitForTextarea).mockResolvedValue({
      success: false,
      error: 'Not found',
    })

    vi.mocked(observeForTextarea).mockReturnValue(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper to trigger module load and capture handler
  async function loadModule() {
    // Clear module cache and re-import to trigger registration
    vi.resetModules()

    // Re-stub chrome after reset
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: mockSendMessage,
        onMessage: {
          addListener: mockAddListener,
        },
        lastError: null,
      },
      tabs: {
        onRemoved: mockOnRemoved,
      },
    })

    await import('./index')

    // Wait for async initialize to complete
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  describe('GET_CURRENT_SQL handler', () => {
    it('returns textarea value when found', async () => {
      const mockTextarea = { value: 'SELECT * FROM Users' } as HTMLTextAreaElement
      vi.mocked(findSmpTextarea).mockReturnValue({
        success: true,
        data: mockTextarea,
      })

      await loadModule()

      const sendResponse = vi.fn()
      const result = messageHandler(
        { type: 'GET_CURRENT_SQL' },
        {},
        sendResponse
      )

      expect(result).toBe(true)
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: 'SELECT * FROM Users',
      })
    })

    it('returns error when textarea not found', async () => {
      vi.mocked(findSmpTextarea).mockReturnValue({
        success: false,
        error: 'SMP textarea not found',
      })

      await loadModule()

      const sendResponse = vi.fn()
      messageHandler({ type: 'GET_CURRENT_SQL' }, {}, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'SMP textarea not found',
      })
    })
  })

  describe('PASTE_QUERY handler', () => {
    it('sets textarea value and dispatches events when found', async () => {
      const dispatchEvent = vi.fn()
      const mockTextarea = {
        value: '',
        dispatchEvent,
      } as unknown as HTMLTextAreaElement

      vi.mocked(findSmpTextarea).mockReturnValue({
        success: true,
        data: mockTextarea,
      })

      await loadModule()

      const sendResponse = vi.fn()
      messageHandler(
        { type: 'PASTE_QUERY', payload: { sql: 'SELECT 1' } },
        {},
        sendResponse
      )

      expect(mockTextarea.value).toBe('SELECT 1')
      expect(dispatchEvent).toHaveBeenCalledTimes(2)
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: null,
      })
    })

    it('returns error when textarea not found', async () => {
      vi.mocked(findSmpTextarea).mockReturnValue({
        success: false,
        error: 'SMP textarea not found',
      })

      await loadModule()

      const sendResponse = vi.fn()
      messageHandler(
        { type: 'PASTE_QUERY', payload: { sql: 'SELECT 1' } },
        {},
        sendResponse
      )

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'SMP textarea not found',
      })
    })
  })

  describe('unknown message types', () => {
    it('returns false for unknown message types', async () => {
      await loadModule()

      const sendResponse = vi.fn()
      const result = messageHandler(
        { type: 'UNKNOWN_TYPE' },
        {},
        sendResponse
      )

      expect(result).toBe(false)
      expect(sendResponse).not.toHaveBeenCalled()
    })
  })
})

describe('notifyServiceWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(waitForTextarea).mockResolvedValue({
      success: true,
      data: document.createElement('textarea'),
    })
    vi.mocked(observeForTextarea).mockReturnValue(() => {})
  })

  it('sends CHECK_SMP_AVAILABLE message with status', async () => {
    vi.resetModules()

    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: mockSendMessage,
        onMessage: { addListener: vi.fn() },
        lastError: null,
      },
      tabs: { onRemoved: { addListener: vi.fn() } },
    })

    await import('./index')
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockSendMessage).toHaveBeenCalledWith(
      {
        type: 'CHECK_SMP_AVAILABLE',
        payload: { available: true, textareaFound: true },
      },
      expect.any(Function)
    )
  })
})
