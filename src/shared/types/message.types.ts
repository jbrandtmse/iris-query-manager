/**
 * Message types for communication between contexts
 * (content script, service worker, popup)
 */

import type { Result } from './result.types'
import type { Query, Folder } from './storage.types'

// Message type discriminated union
export type MessageType =
  // SMP detection messages (Story 1-3, 2-1)
  | { type: 'CHECK_SMP_AVAILABLE'; payload: SmpStatus }
  | { type: 'GET_CURRENT_SQL' }
  | { type: 'PASTE_QUERY'; payload: { sql: string } }
  | { type: 'GET_SMP_STATUS' }
  // Capture flow: Popup initiates, service worker orchestrates (Story 2-2)
  | { type: 'CAPTURE_QUERY'; payload: { name: string; folderId?: string | null } }
  // Storage CRUD operations: Popup → Service Worker (Story 2-2)
  | { type: 'SAVE_QUERY'; payload: { name: string; sql: string; folderId?: string | null } }
  | { type: 'GET_QUERIES' }
  | { type: 'GET_FOLDERS' }
  | { type: 'DELETE_QUERY'; payload: { id: string } }
  | { type: 'UPDATE_QUERY'; payload: { id: string; updates: Partial<Pick<Query, 'name' | 'sql' | 'folderId'>> } }
  // Folder operations (Story 4-2, 4-3)
  | { type: 'CREATE_FOLDER'; payload: { name: string; parentId?: string | null } }
  | { type: 'UPDATE_FOLDER'; payload: { id: string; updates: { name: string } } }
  | { type: 'DELETE_FOLDER'; payload: { id: string } }
  // Query drag-drop message (Story 4-4)
  | { type: 'MOVE_QUERY'; payload: { queryId: string; targetFolderId: string | null } }

// Re-export Result as MessageResult for backwards compatibility
export type MessageResult<T> = Result<T>

// SMP availability status sent from content script
export type SmpStatus = {
  available: boolean
  textareaFound: boolean
}
