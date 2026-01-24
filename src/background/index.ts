import type { MessageType, MessageResult } from '../shared/types/message.types'
import { isSmpUrl } from '../shared/utils/url-utils'
import { setActiveState, setInactiveState } from './icon-state'
import { sendToContentScript } from '../shared/services/message-service'
import * as storageService from '../shared/services/storage-service'
import { exportAll, exportFolder, mergeImportData } from '../shared/services/import-export-service'
import type { MergeStats } from '../shared/services/import-export-service'

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

    // Handle CAPTURE_QUERY: Orchestrate getting SQL from content script then saving
    if (message.type === 'CAPTURE_QUERY') {
      const { name, folderId } = message.payload
      // Validate name early to provide clear error message
      if (!name || name.trim() === '') {
        sendResponse({ success: false, error: 'Query name is required' })
        return true
      }
      handleCaptureQuery(name, folderId ?? null, sendResponse).catch((err) => {
        console.error('[IRIS Query Manager] handleCaptureQuery error:', err)
        sendResponse({ success: false, error: String(err) })
      })
      return true // Async response
    }

    // Handle GET_QUERIES: Return all queries from storage
    if (message.type === 'GET_QUERIES') {
      storageService.getQueries().then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle GET_FOLDERS: Return all folders from storage
    if (message.type === 'GET_FOLDERS') {
      storageService.getFolders().then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle DELETE_QUERY: Delete a query by ID
    if (message.type === 'DELETE_QUERY') {
      const { id } = message.payload
      storageService.deleteQuery(id).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle UPDATE_QUERY: Update a query by ID
    if (message.type === 'UPDATE_QUERY') {
      const { id, updates } = message.payload
      storageService.updateQuery(id, updates).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle SAVE_QUERY: Direct save (used internally or by popup with known SQL)
    if (message.type === 'SAVE_QUERY') {
      const { name, sql, folderId } = message.payload
      storageService.saveQuery({ name, sql, folderId: folderId ?? null }).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle CREATE_FOLDER: Create a new folder (Story 4-2)
    if (message.type === 'CREATE_FOLDER') {
      const { name, parentId } = message.payload
      storageService.createFolder({ name, parentId: parentId ?? null }).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle UPDATE_FOLDER: Update a folder by ID (Story 4-3)
    if (message.type === 'UPDATE_FOLDER') {
      const { id, updates } = message.payload
      storageService.updateFolder(id, updates).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle DELETE_FOLDER: Delete a folder by ID (Story 4-3)
    if (message.type === 'DELETE_FOLDER') {
      const { id } = message.payload
      storageService.deleteFolder(id).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle MOVE_QUERY: Move a query to a different folder (Story 4-4)
    if (message.type === 'MOVE_QUERY') {
      const { queryId, targetFolderId } = message.payload
      storageService.moveQuery(queryId, targetFolderId).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle MOVE_FOLDER: Move a folder to a different parent (Story 4-5)
    if (message.type === 'MOVE_FOLDER') {
      const { folderId, targetParentId } = message.payload
      storageService.moveFolder(folderId, targetParentId).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle EXPORT_ALL: Export all queries and folders (Story 5-1)
    if (message.type === 'EXPORT_ALL') {
      exportAll().then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle EXPORT_FOLDER: Export a specific folder and its contents (Story 5-2)
    if (message.type === 'EXPORT_FOLDER') {
      const { folderId } = message.payload
      exportFolder(folderId).then((result) => {
        sendResponse(result)
      })
      return true // Async response
    }

    // Handle IMPORT_MERGE: Merge imported data with existing library (Story 5-4)
    if (message.type === 'IMPORT_MERGE') {
      const { importData } = message.payload
      handleImportMerge(importData, sendResponse)
      return true // Async response
    }

    // Handle PASTE_QUERY: Send SQL to content script to paste into SMP textarea
    if (message.type === 'PASTE_QUERY') {
      const { sql } = message.payload
      handlePasteQuery(sql, sendResponse)
      return true // Async response
    }

    return false
  }
)

/**
 * Handle CAPTURE_QUERY message: Get SQL from content script, then save to storage
 */
async function handleCaptureQuery(
  name: string,
  folderId: string | null,
  sendResponse: (response: MessageResult<unknown>) => void
): Promise<void> {
  // Get active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const activeTab = tabs[0]
  const tabId = activeTab?.id

  if (tabId === undefined) {
    sendResponse({ success: false, error: 'No active tab found' })
    return
  }

  // Check if we have SMP status for this tab (content script must be loaded)
  const hasSmpStatus = tabSmpStatus.has(tabId)
  if (!hasSmpStatus) {
    sendResponse({
      success: false,
      error: 'Not on an SMP page. Please navigate to an SMP SQL page and refresh.',
    })
    return
  }

  // Get current SQL from content script
  const sqlResult = await sendToContentScript<string>(tabId, { type: 'GET_CURRENT_SQL' })

  if (!sqlResult.success) {
    // Provide user-friendly error message for common issues
    const errorMsg = sqlResult.error
    if (errorMsg?.includes('Receiving end does not exist') || errorMsg?.includes('message port closed')) {
      sendResponse({
        success: false,
        error: 'Content script not loaded. Please refresh the SMP page and try again.',
      })
    } else {
      sendResponse({ success: false, error: `Failed to get SQL: ${errorMsg}` })
    }
    return
  }

  const sql = sqlResult.data
  if (!sql || sql.trim() === '') {
    sendResponse({ success: false, error: 'No SQL found in SMP textarea' })
    return
  }

  // Save query to storage
  const saveResult = await storageService.saveQuery({ name, sql, folderId })
  sendResponse(saveResult)
}

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

/**
 * Handle PASTE_QUERY message: Send SQL to content script to paste into SMP textarea
 */
async function handlePasteQuery(
  sql: string,
  sendResponse: (response: MessageResult<unknown>) => void
): Promise<void> {
  // Get active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const activeTab = tabs[0]
  const tabId = activeTab?.id

  if (tabId === undefined) {
    sendResponse({ success: false, error: 'No active tab found' })
    return
  }

  // Check if we have SMP status for this tab (content script must be loaded)
  const hasSmpStatus = tabSmpStatus.has(tabId)
  if (!hasSmpStatus) {
    sendResponse({
      success: false,
      error: 'Not on an SMP page. Please navigate to an SMP SQL page and refresh.',
    })
    return
  }

  // Send paste command to content script
  const result = await sendToContentScript<null>(tabId, {
    type: 'PASTE_QUERY',
    payload: { sql },
  })

  // Provide user-friendly error for common issues
  if (!result.success) {
    const errorMsg = result.error
    if (errorMsg?.includes('Receiving end does not exist') || errorMsg?.includes('message port closed')) {
      sendResponse({
        success: false,
        error: 'Content script not loaded. Please refresh the SMP page and try again.',
      })
      return
    }
  }

  sendResponse(result)
}

/**
 * Handle IMPORT_MERGE message: Merge imported data with existing library (Story 5-4)
 */
async function handleImportMerge(
  importData: Parameters<typeof mergeImportData>[1],
  sendResponse: (response: MessageResult<MergeStats>) => void
): Promise<void> {
  // Get current data from storage
  const [foldersResult, queriesResult] = await Promise.all([
    storageService.getFolders(),
    storageService.getQueries(),
  ])

  if (!foldersResult.success) {
    sendResponse({ success: false, error: 'Failed to read current folders' })
    return
  }
  if (!queriesResult.success) {
    sendResponse({ success: false, error: 'Failed to read current queries' })
    return
  }

  const existing = {
    folders: foldersResult.data,
    queries: queriesResult.data,
  }

  // Merge data
  const { folders, queries, stats } = mergeImportData(existing, importData)

  // Save merged data atomically
  const saveResult = await storageService.replaceAll({ folders, queries })

  if (!saveResult.success) {
    sendResponse({ success: false, error: 'Failed to save merged data' })
    return
  }

  sendResponse({ success: true, data: stats })
}
