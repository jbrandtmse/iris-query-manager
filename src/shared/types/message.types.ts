/**
 * Message types for communication between contexts
 * (content script, service worker, popup)
 */

import type { Result } from './result.types'

// Message type discriminated union
export type MessageType =
  | { type: 'CHECK_SMP_AVAILABLE'; payload: SmpStatus }
  | { type: 'GET_CURRENT_SQL' }
  | { type: 'PASTE_QUERY'; payload: { sql: string } }
  | { type: 'GET_SMP_STATUS' }

// Re-export Result as MessageResult for backwards compatibility
export type MessageResult<T> = Result<T>

// SMP availability status sent from content script
export type SmpStatus = {
  available: boolean
  textareaFound: boolean
}
