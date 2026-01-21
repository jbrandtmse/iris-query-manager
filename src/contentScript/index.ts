import type { MessageType, MessageResult, SmpStatus } from '../shared/types/message.types'
import { waitForTextarea, observeForTextarea, findSmpTextarea } from './smp-detector'

console.info('[IRIS Query Manager] Content script loaded')

let cleanupObserver: (() => void) | null = null

/**
 * Send SMP availability status to service worker
 * Handles errors gracefully (e.g., extension context invalidated)
 */
function notifyServiceWorker(available: boolean): void {
  const status: SmpStatus = {
    available,
    textareaFound: available,
  }

  chrome.runtime.sendMessage(
    {
      type: 'CHECK_SMP_AVAILABLE',
      payload: status,
    },
    () => {
      // Check for errors (extension context invalidated, service worker not ready)
      if (chrome.runtime.lastError) {
        console.warn(
          '[IRIS Query Manager] Failed to notify service worker:',
          chrome.runtime.lastError.message
        )
      }
    }
  )
}

/**
 * Initialize content script by detecting SMP textarea
 * and notifying service worker of availability
 */
async function initialize(): Promise<void> {
  const result = await waitForTextarea()

  if (result.success) {
    console.info('[IRIS Query Manager] SMP textarea found')
    notifyServiceWorker(true)
  } else {
    console.warn('[IRIS Query Manager] SMP textarea not found:', result.error)
    notifyServiceWorker(false)

    // Continue observing for late-appearing textarea
    console.info('[IRIS Query Manager] Continuing to observe for textarea...')
    cleanupObserver = observeForTextarea(() => {
      console.info('[IRIS Query Manager] SMP textarea found (late)')
      notifyServiceWorker(true)
    })
  }
}

// Cleanup observer on page unload
window.addEventListener('beforeunload', () => {
  if (cleanupObserver) {
    cleanupObserver()
  }
})

/**
 * Handle messages from service worker/popup
 * NOTE: Listener registered before initialize() to ensure no messages are missed
 */
chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResult<unknown>) => void
  ) => {
    if (message.type === 'GET_CURRENT_SQL') {
      const result = findSmpTextarea()
      if (result.success) {
        sendResponse({ success: true, data: result.data.value })
      } else {
        sendResponse({ success: false, error: result.error })
      }
      return true
    }

    if (message.type === 'PASTE_QUERY') {
      const result = findSmpTextarea()
      if (result.success) {
        result.data.value = message.payload.sql
        // Dispatch both input and change events for SMP/Zen framework compatibility
        result.data.dispatchEvent(new Event('input', { bubbles: true }))
        result.data.dispatchEvent(new Event('change', { bubbles: true }))
        sendResponse({ success: true, data: null })
      } else {
        sendResponse({ success: false, error: result.error })
      }
      return true
    }

    return false
  }
)

initialize()
