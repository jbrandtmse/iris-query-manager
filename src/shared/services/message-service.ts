/**
 * Message service helpers for cross-context communication
 * Wraps chrome.runtime.sendMessage and chrome.tabs.sendMessage
 * with proper error handling and Result<T> pattern
 */

import type { MessageType, MessageResult } from '../types/message.types'

/**
 * Send message to service worker with Result wrapper
 * Handles chrome.runtime.lastError
 *
 * @param message - The typed message to send
 * @returns Promise<MessageResult<T>> - Success with data or failure with error
 */
export async function sendToServiceWorker<T>(
  message: MessageType
): Promise<MessageResult<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResult<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message ?? 'Unknown error',
        })
        return
      }
      // Handle undefined response (no handler matched the message)
      if (response === undefined) {
        resolve({
          success: false,
          error: 'No response from service worker',
        })
        return
      }
      resolve(response)
    })
  })
}

/**
 * Send message to content script in specific tab
 * Handles chrome.runtime.lastError
 *
 * @param tabId - The tab ID to send the message to
 * @param message - The typed message to send
 * @returns Promise<MessageResult<T>> - Success with data or failure with error
 */
export async function sendToContentScript<T>(
  tabId: number,
  message: MessageType
): Promise<MessageResult<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: MessageResult<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message ?? 'Unknown error',
        })
        return
      }
      // Handle undefined response (no handler matched the message)
      if (response === undefined) {
        resolve({
          success: false,
          error: 'No response from content script',
        })
        return
      }
      resolve(response)
    })
  })
}
