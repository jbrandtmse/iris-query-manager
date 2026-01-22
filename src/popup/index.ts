/**
 * Popup Entry Point
 * Creates the main popup shell with header and content areas
 */

import './index.css'
import { createHeader } from './components/header'
import {
  createCaptureForm,
  showCaptureForm,
  hideCaptureForm,
} from './components/capture-form'
import { showToast } from './components/toast'
import { createTreeView, updateTreeView, selectItem, activateSelectedItem } from './components/tree-view'
import { createQueryPreview, updateQueryPreview } from './components/query-preview'
import { sendToServiceWorker } from '../shared/services/message-service'
import type { Folder, Query } from '../shared/types/storage.types'
import { checkSqlSafety, getDangerousSqlWarning } from '../shared/utils/sql-utils'

// Module-level references for component access
let captureFormElement: HTMLDivElement | null = null
let treeViewElement: HTMLDivElement | null = null
let currentQueries: Query[] = []
let currentFolders: Folder[] = []

/**
 * Initialize the popup UI
 * Note: No async operations to ensure < 300ms render (NFR3)
 */
function initializePopup(): void {
  const appElement = document.getElementById('app')
  if (!appElement) {
    console.error('Popup: #app element not found')
    return
  }

  // Create popup container
  const popup = document.createElement('div')
  popup.className = 'popup'

  // Create header with action handlers
  const header = createHeader({
    onCaptureClick: handleCaptureClick,
    onMenuClick: handleMenuClick,
  })

  // Create capture form (hidden by default)
  captureFormElement = createCaptureForm({
    onSave: handleCaptureSave,
    onCancel: handleCaptureCancel,
  })

  // Create content area
  const content = document.createElement('main')
  content.className = 'content'

  // Create tree view for query library (Story 3-1)
  // onItemSelect: called on keyboard navigation (selection only, no paste)
  // onItemActivate: called on click or Enter (triggers paste)
  treeViewElement = createTreeView({
    onItemSelect: handleQuerySelectionChange,
    onItemActivate: handleQueryActivate,
  })
  content.appendChild(treeViewElement)

  // Add Enter key handler for paste activation
  treeViewElement.addEventListener('keydown', handleTreeViewKeydown)

  // Load queries async (does not block initial render for NFR3)
  loadQueriesAndFolders()

  // Create preview panel (Story 3-3)
  const previewPanel = createQueryPreview()

  // Assemble popup: header → capture form → content → preview
  popup.appendChild(header)
  popup.appendChild(captureFormElement)
  popup.appendChild(content)
  popup.appendChild(previewPanel)

  // Mount to DOM
  appElement.appendChild(popup)
}

/**
 * Handle capture button click - toggle capture form visibility
 */
function handleCaptureClick(): void {
  if (!captureFormElement) return

  if (captureFormElement.hidden) {
    showCaptureForm(captureFormElement)
    // Load folders when form opens
    loadFoldersForDropdown()
  } else {
    hideCaptureForm(captureFormElement)
  }
}

/**
 * Handle capture form save - send CAPTURE_QUERY to service worker
 * Uses CAPTURE_QUERY which orchestrates getting SQL from content script
 */
async function handleCaptureSave(name: string, folderId: string | null): Promise<void> {
  const showError = (captureFormElement as any)?.__showError as ((msg: string) => void) | undefined

  // Send CAPTURE_QUERY to service worker
  // Service worker will: get SQL from content script → save to storage
  const result = await sendToServiceWorker<Query>({
    type: 'CAPTURE_QUERY',
    payload: { name, folderId },
  })

  if (!result.success) {
    showError?.(result.error)
    // Show error toast per AC3 (Story 2-5)
    showToast(result.error, 'error')
    return
  }

  // Success - close form
  if (captureFormElement) {
    hideCaptureForm(captureFormElement)
  }

  // Show success toast (Story 2-5)
  showToast('Query saved', 'success')

  // Refresh tree view with new query (Story 3-1)
  loadQueriesAndFolders()
}

/**
 * Handle capture form cancel - hide form
 */
function handleCaptureCancel(): void {
  if (captureFormElement) {
    hideCaptureForm(captureFormElement)
  }
}

/**
 * Load folders from storage and populate the form dropdown
 */
async function loadFoldersForDropdown(): Promise<void> {
  if (!captureFormElement) return

  const populateFolders = (captureFormElement as any)?.__populateFolders as
    | ((folders: Folder[]) => void)
    | undefined

  if (!populateFolders) return

  const result = await sendToServiceWorker<Folder[]>({ type: 'GET_FOLDERS' })

  if (result.success) {
    populateFolders(result.data)
  }
}

/**
 * Handle menu button click
 * TODO: Implement menu dropdown in future story
 */
function handleMenuClick(): void {
  console.log('[IRIS Query Manager] Menu button clicked')
  // Will open menu dropdown in future story
}

/**
 * Load queries and folders from storage and update tree view
 */
async function loadQueriesAndFolders(): Promise<void> {
  const [queriesResult, foldersResult] = await Promise.all([
    sendToServiceWorker<Query[]>({ type: 'GET_QUERIES' }),
    sendToServiceWorker<Folder[]>({ type: 'GET_FOLDERS' }),
  ])

  if (queriesResult.success) {
    currentQueries = queriesResult.data
  }
  if (foldersResult.success) {
    currentFolders = foldersResult.data
  }

  updateTreeView(currentQueries, currentFolders, {
    onItemSelect: handleQuerySelectionChange,
    onItemActivate: handleQueryActivate,
  })
}

/**
 * Handle query selection change (keyboard navigation)
 * Updates selection state and preview panel, does NOT trigger paste
 */
function handleQuerySelectionChange(query: Query): void {
  selectItem(query.id)
  // Update preview panel with selected query's SQL (Story 3-3)
  updateQueryPreview(query.sql)
}

/**
 * Handle query activation (click or Enter)
 * Triggers paste to SMP textarea with SQL safety check
 */
async function handleQueryActivate(query: Query): Promise<void> {
  // Check for dangerous SQL before paste (per project-context.md)
  const safetyCheck = checkSqlSafety(query.sql)

  if (safetyCheck.isDangerous) {
    const warning = getDangerousSqlWarning(safetyCheck.keyword!)
    const confirmed = window.confirm(warning)
    if (!confirmed) {
      return // User cancelled
    }
  }

  // Paste query SQL to SMP textarea (Story 3-2 AC2)
  const result = await sendToServiceWorker<null>({
    type: 'PASTE_QUERY',
    payload: { sql: query.sql },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Show success feedback
  showToast(`Pasted: ${query.name}`, 'success')
}

/**
 * Handle keydown events in tree view
 * Enter key triggers paste of selected query
 */
function handleTreeViewKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    activateSelectedItem()
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializePopup)
