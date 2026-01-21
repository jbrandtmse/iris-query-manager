import type { MessageType } from '../shared/types/message.types'
import { isSmpUrl } from '../shared/utils/url-utils'
import { setActiveState, setInactiveState } from './icon-state'

console.log('[IRIS Query Manager] Service worker initialized')

// Track SMP availability per tab
const tabSmpStatus = new Map<number, boolean>()

// Set default inactive badge on extension load
// This ensures all tabs show "OFF" until content script reports SMP availability
// Note: Chrome queues messages until service worker is ready, so no race condition
setInactiveState().then((result) => {
  if (result.success) {
    console.log('[IRIS Query Manager] Default inactive badge set')
  } else {
    console.warn('[IRIS Query Manager] Failed to set default badge:', result.error)
  }
})

// Message handler for content script and popup communication
chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    if (message.type === 'CHECK_SMP_AVAILABLE') {
      const tabId = sender.tab?.id
      const payload = message.payload

      // Validate payload exists
      if (!payload) {
        console.warn('[IRIS Query Manager] CHECK_SMP_AVAILABLE received without payload')
        sendResponse({ success: false, error: 'Missing payload' })
        return true
      }

      if (tabId) {
        tabSmpStatus.set(tabId, payload.available)
        console.log(
          `[IRIS Query Manager] Tab ${tabId} SMP status: ${payload.available ? 'available' : 'not available'}`
        )

        // Update icon state based on SMP availability
        if (payload.available) {
          setActiveState(tabId).then((result) => {
            if (!result.success) {
              console.warn('[IRIS Query Manager] Failed to set active icon state:', result.error)
            } else {
              console.log(`[IRIS Query Manager] Tab ${tabId} icon set to active`)
            }
          })
        } else {
          setInactiveState(tabId).then((result) => {
            if (!result.success) {
              console.warn('[IRIS Query Manager] Failed to set inactive icon state:', result.error)
            } else {
              console.log(`[IRIS Query Manager] Tab ${tabId} icon set to inactive`)
            }
          })
        }
      }

      sendResponse({ success: true, data: null })
      return true
    }

    // Handle popup requesting current tab's SMP status
    if (message.type === 'GET_SMP_STATUS') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        const tabId = activeTab?.id

        if (tabId === undefined) {
          sendResponse({ success: true, data: { available: false } })
          return
        }

        const available = tabSmpStatus.get(tabId) ?? false
        sendResponse({ success: true, data: { available } })
      })
      return true // Async response
    }

    // Future: Handle other message types (CAPTURE_QUERY, etc.)
    return false
  }
)

// Update icon state when user switches to a different tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId
  const status = tabSmpStatus.get(tabId)

  if (status === true) {
    // Tab is known to have SMP available
    setActiveState(tabId).then((result) => {
      if (!result.success) {
        console.warn('[IRIS Query Manager] Failed to set active icon on tab switch:', result.error)
      }
    })
  } else {
    // Tab not in map (non-SMP) or explicitly marked as unavailable
    setInactiveState(tabId).then((result) => {
      if (!result.success) {
        console.warn('[IRIS Query Manager] Failed to set inactive icon on tab switch:', result.error)
      }
    })
  }
})

// Handle tab URL changes - reset icon when leaving SMP
chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  // Only process URL changes
  if (!changeInfo.url) {
    return
  }

  const wasOnSmp = tabSmpStatus.has(tabId)
  const isNowOnSmp = isSmpUrl(changeInfo.url)

  if (wasOnSmp && !isNowOnSmp) {
    // User navigated away from SMP page
    console.log(`[IRIS Query Manager] Tab ${tabId} left SMP page`)
    tabSmpStatus.delete(tabId)
    setInactiveState(tabId).then((result) => {
      if (!result.success) {
        console.warn('[IRIS Query Manager] Failed to set inactive icon on URL change:', result.error)
      }
    })
  }
  // Note: If navigating TO SMP or between SMP pages, content script will re-report availability
})

// Clean up tab status on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSmpStatus.delete(tabId)
})
