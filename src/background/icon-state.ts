import type { MessageResult } from '../shared/types/message.types'

/**
 * Set extension icon to active state (clear badge)
 * Used when SMP textarea is detected
 *
 * @param tabId - Optional tab ID. If omitted, sets global default.
 * @returns Result indicating success or error
 */
export async function setActiveState(
  tabId?: number
): Promise<MessageResult<void>> {
  try {
    const textOptions: chrome.action.BadgeTextDetails = { text: '' }
    // Reset badge color to transparent/default when clearing badge
    // This prevents gray color from persisting after switching from inactive state
    const colorOptions: chrome.action.BadgeBackgroundColorDetails = {
      color: [0, 0, 0, 0], // Transparent
    }

    if (tabId !== undefined) {
      textOptions.tabId = tabId
      colorOptions.tabId = tabId
    }

    await chrome.action.setBadgeText(textOptions)
    await chrome.action.setBadgeBackgroundColor(colorOptions)

    return { success: true, data: undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Failed to set active state: ${message}` }
  }
}

/**
 * Set extension icon to inactive state (show "OFF" badge)
 * Used when not on SMP page or textarea not found
 *
 * @param tabId - Optional tab ID. If omitted, sets global default.
 * @returns Result indicating success or error
 */
export async function setInactiveState(
  tabId?: number
): Promise<MessageResult<void>> {
  try {
    const textOptions: chrome.action.BadgeTextDetails = { text: 'OFF' }
    const colorOptions: chrome.action.BadgeBackgroundColorDetails = {
      color: '#666',
    }

    if (tabId !== undefined) {
      textOptions.tabId = tabId
      colorOptions.tabId = tabId
    }

    await chrome.action.setBadgeText(textOptions)
    await chrome.action.setBadgeBackgroundColor(colorOptions)

    return { success: true, data: undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Failed to set inactive state: ${message}` }
  }
}
