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
import {
  createFolderForm,
  showFolderForm,
  hideFolderForm,
} from './components/folder-form'
import { showToast } from './components/toast'
import { createTreeView, updateTreeView, selectItem, activateSelectedItem, setExpandedFolders, getExpandedFolders, toggleFolder } from './components/tree-view'
import { showContextMenu, hideContextMenu } from './components/context-menu'
import { createQueryPreview, updateQueryPreview } from './components/query-preview'
import { sendToServiceWorker } from '../shared/services/message-service'
import type { Folder, Query } from '../shared/types/storage.types'
import type { ExportData, ImportPreview as ImportPreviewData, MergeStats, ReplaceStats } from '../shared/services/import-export-service'
import { parseImportFile, getImportPreview } from '../shared/services/import-export-service'
import { renderImportPreview } from './components/import-preview'
import { showConfirmModal } from './components/confirm-modal'
import { checkSqlSafety, getDangerousSqlWarning } from '../shared/utils/sql-utils'
import { downloadJsonFile, generateExportFilename, generateFolderExportFilename } from '../shared/utils/file-utils'

// Module-level references for component access
let captureFormElement: HTMLDivElement | null = null
let folderFormElement: HTMLDivElement | null = null
let currentFolderFormParentId: string | null = null
let treeViewElement: HTMLDivElement | null = null
let currentQueries: Query[] = []
let currentFolders: Folder[] = []
// Import state (Story 5-3)
let pendingImportData: ExportData | null = null
let importFileInput: HTMLInputElement | null = null

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
    onNewFolderClick: handleNewFolderClick,
    onExportClick: handleExportAll,
    onImportClick: handleImportClick,
    onMenuClick: handleMenuClick,
  })

  // Create hidden file input for import (Story 5-3 FR18)
  importFileInput = setupImportInput()

  // Create capture form (hidden by default)
  captureFormElement = createCaptureForm({
    onSave: handleCaptureSave,
    onCancel: handleCaptureCancel,
  })

  // Create folder form (hidden by default) - Story 4-2
  folderFormElement = createFolderForm({
    onSave: handleFolderSave,
    onCancel: handleFolderCancel,
  })

  // Create content area
  const content = document.createElement('main')
  content.className = 'content'

  // Create tree view for query library (Story 3-1)
  // onItemSelect: called on keyboard navigation (selection only, no paste)
  // onItemActivate: called on click or Enter (triggers paste)
  // onItemContextMenu: called on right-click (Story 3-5)
  // onQueryDrop: called when query is dropped on folder/root (Story 4-4)
  // onFolderDrop: called when folder is dropped on folder/root (Story 4-5)
  treeViewElement = createTreeView({
    onItemSelect: handleQuerySelectionChange,
    onItemActivate: handleQueryActivate,
    onItemContextMenu: handleQueryContextMenu,
    onQueryDrop: handleQueryDrop,
    onFolderDrop: handleFolderDrop,
  })
  content.appendChild(treeViewElement)

  // Add Enter key handler for paste activation
  treeViewElement.addEventListener('keydown', handleTreeViewKeydown)

  // Load queries async (does not block initial render for NFR3)
  loadQueriesAndFolders()

  // Create preview panel (Story 3-3)
  const previewPanel = createQueryPreview()

  // Assemble popup: header → capture form → folder form → content → preview
  popup.appendChild(header)
  popup.appendChild(captureFormElement)
  popup.appendChild(folderFormElement)
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
 * Format count with singular/plural noun
 * @param count - The number to format
 * @param singular - Singular form (e.g., "query")
 * @param plural - Plural form (e.g., "queries")
 * @returns Formatted string (e.g., "1 query" or "2 queries")
 */
function formatCount(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`
}

/**
 * Handle export button click - export all queries and folders (Story 5-1)
 * Sends EXPORT_ALL message to service worker, triggers JSON file download,
 * and displays success/error toast feedback.
 */
async function handleExportAll(): Promise<void> {
  const result = await sendToServiceWorker<ExportData>({ type: 'EXPORT_ALL' })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  const data = result.data
  const filename = generateExportFilename()

  try {
    downloadJsonFile(data, filename)
  } catch (err) {
    showToast('Failed to download file', 'error')
    return
  }

  const queryText = formatCount(data.queries.length, 'query', 'queries')
  const folderText = formatCount(data.folders.length, 'folder', 'folders')
  showToast(`Exported ${queryText} and ${folderText}`, 'success')
}

/**
 * Handle exporting a specific folder and its contents (Story 5-2 FR17)
 * Sends EXPORT_FOLDER message to service worker, triggers JSON file download,
 * and displays success/error toast feedback.
 */
async function handleExportFolder(folderId: string, folderName: string): Promise<void> {
  const result = await sendToServiceWorker<ExportData>({
    type: 'EXPORT_FOLDER',
    payload: { folderId },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  const data = result.data
  const filename = generateFolderExportFilename(folderName)

  try {
    downloadJsonFile(data, filename)
  } catch (err) {
    showToast('Failed to download file', 'error')
    return
  }

  const queryText = formatCount(data.queries.length, 'query', 'queries')
  showToast(`Exported folder with ${queryText}`, 'success')
}

/**
 * Handle New Folder button click - show folder form for root folder (Story 4-2 AC1)
 */
function handleNewFolderClick(): void {
  openFolderForm(null)
}

/**
 * Open folder form for creating a new folder
 * @param parentId - null for root folder, folder ID for subfolder
 */
function openFolderForm(parentId: string | null): void {
  if (!folderFormElement) return

  // Store parent ID for when form is submitted
  currentFolderFormParentId = parentId

  // Hide capture form if open
  if (captureFormElement && !captureFormElement.hidden) {
    hideCaptureForm(captureFormElement)
  }

  showFolderForm(folderFormElement)
}

/**
 * Handle folder form save - create folder via service worker (Story 4-2 AC2, AC3, AC4)
 */
async function handleFolderSave(name: string, _parentId: string | null): Promise<void> {
  const showError = (folderFormElement as any)?.__showError as ((msg: string) => void) | undefined

  // Use the stored parentId (from openFolderForm) instead of the one passed
  // since we manage the parentId state externally
  const result = await sendToServiceWorker<Folder>({
    type: 'CREATE_FOLDER',
    payload: { name, parentId: currentFolderFormParentId },
  })

  if (!result.success) {
    showError?.(result.error)
    showToast(result.error, 'error')
    return
  }

  // Success - close form
  if (folderFormElement) {
    hideFolderForm(folderFormElement)
  }

  // Show success toast (Story 4-2 Task 5.5)
  showToast('Folder created', 'success')

  // Auto-expand parent folder if creating subfolder (Story 4-2 5.6)
  if (currentFolderFormParentId) {
    const expanded = getExpandedFolders()
    if (!expanded.includes(currentFolderFormParentId)) {
      setExpandedFolders([...expanded, currentFolderFormParentId])
    }
  }

  // Refresh tree view with new folder
  await loadQueriesAndFolders()

  // Reset parentId
  currentFolderFormParentId = null
}

/**
 * Handle folder form cancel - hide form
 */
function handleFolderCancel(): void {
  if (folderFormElement) {
    hideFolderForm(folderFormElement)
  }
  currentFolderFormParentId = null
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
    onItemContextMenu: handleQueryContextMenu,
    onQueryDrop: handleQueryDrop,
    onFolderDrop: handleFolderDrop,
  })
}

/**
 * Handle query selection change (keyboard navigation)
 * Updates selection state and preview panel, does NOT trigger paste
 */
function handleQuerySelectionChange(query: Query): void {
  selectItem(query.id)
  // Update preview panel with full Query object (Story 3-6: includes metadata)
  updateQueryPreview(query)
}

/**
 * Handle query activation (click or Enter)
 * Triggers paste to SMP textarea with SQL safety check
 */
async function handleQueryActivate(query: Query): Promise<void> {
  // Check SMP availability BEFORE attempting paste (Story 3-4 AC4)
  const statusResult = await sendToServiceWorker<{ available: boolean }>({
    type: 'GET_SMP_STATUS',
  })

  if (!statusResult.success || !statusResult.data.available) {
    showToast('SMP textarea not detected on this page', 'error')
    return
  }

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

/**
 * Handle context menu request from tree item (right-click)
 * Shows context menu with appropriate options based on item type (Story 3-5, Story 4-2, Story 4-3)
 * - Query: Paste, Rename, Delete
 * - Folder: New Subfolder, Rename, Delete
 */
function handleQueryContextMenu(itemId: string, x: number, y: number): void {
  // Check if item is a query or folder
  const query = currentQueries.find((q) => q.id === itemId)
  const folder = currentFolders.find((f) => f.id === itemId)

  if (!query && !folder) return

  // Find the trigger element for focus return (accessibility)
  const triggerElement = treeViewElement?.querySelector(
    `[data-id="${itemId}"]`
  ) as HTMLElement | null

  // Close any existing context menu first
  hideContextMenu()

  if (folder) {
    // Folder context menu (Story 4-2 AC3, Story 5-2)
    showContextMenu({
      x,
      y,
      items: [
        { label: 'New Subfolder', action: 'new-subfolder' },
        { label: 'Export', action: 'export' },
        { label: 'Rename', action: 'rename' },
        { label: 'Delete', action: 'delete', danger: true },
      ],
      onSelect: (action) => {
        if (action === 'new-subfolder') {
          openFolderForm(folder.id)
        } else if (action === 'export') {
          handleExportFolder(folder.id, folder.name)
        } else if (action === 'rename') {
          handleRenameFolder(folder)
        } else if (action === 'delete') {
          handleDeleteFolder(folder)
        }
      },
      triggerElement: triggerElement ?? undefined,
    })
  } else if (query) {
    // Query context menu (Story 3-5)
    showContextMenu({
      x,
      y,
      items: [
        { label: 'Paste', action: 'paste' },
        { label: 'Rename', action: 'rename' },
        { label: 'Delete', action: 'delete', danger: true },
      ],
      onSelect: (action) => {
        if (action === 'paste') {
          handleQueryActivate(query)
        } else if (action === 'rename') {
          handleRenameQuery(query)
        } else if (action === 'delete') {
          handleDeleteQuery(query)
        }
      },
      triggerElement: triggerElement ?? undefined,
    })
  }
}

/**
 * Handle rename query action
 * Shows prompt dialog and updates query name via service worker
 */
async function handleRenameQuery(query: Query): Promise<void> {
  const newName = window.prompt('Enter new name:', query.name)

  // Handle cancel or empty input
  if (newName === null) {
    return // User cancelled
  }

  const trimmedName = newName.trim()
  if (!trimmedName) {
    showToast('Name cannot be empty', 'error')
    return
  }

  // Skip if name unchanged
  if (trimmedName === query.name) {
    return
  }

  // Send UPDATE_QUERY to service worker
  const result = await sendToServiceWorker<Query>({
    type: 'UPDATE_QUERY',
    payload: { id: query.id, updates: { name: trimmedName } },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Show success feedback
  showToast(`Renamed to: ${trimmedName}`, 'success')

  // Refresh tree view with updated query
  await loadQueriesAndFolders()
}

/**
 * Handle delete query action
 * Shows confirmation dialog and removes query via service worker
 */
async function handleDeleteQuery(query: Query): Promise<void> {
  const confirmed = window.confirm(`Delete "${query.name}"?\n\nThis cannot be undone.`)

  if (!confirmed) {
    return // User cancelled
  }

  // Send DELETE_QUERY to service worker
  const result = await sendToServiceWorker<void>({
    type: 'DELETE_QUERY',
    payload: { id: query.id },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Show success feedback
  showToast(`Deleted: ${query.name}`, 'success')

  // Clear selection if deleted query was selected
  const selectedId = currentQueries.find((q) => q.id === query.id)?.id
  if (selectedId) {
    selectItem(null)
    updateQueryPreview(null)
  }

  // Refresh tree view
  await loadQueriesAndFolders()
}

/**
 * Handle rename folder action (Story 4-3 AC1)
 * Shows prompt dialog and updates folder name via service worker
 */
async function handleRenameFolder(folder: Folder): Promise<void> {
  const newName = window.prompt('Enter new name:', folder.name)

  // Handle cancel or empty input
  if (newName === null) {
    return // User cancelled
  }

  const trimmedName = newName.trim()
  if (!trimmedName) {
    showToast('Name cannot be empty', 'error')
    return
  }

  // Skip if name unchanged
  if (trimmedName === folder.name) {
    return
  }

  // Send UPDATE_FOLDER to service worker
  const result = await sendToServiceWorker<Folder>({
    type: 'UPDATE_FOLDER',
    payload: { id: folder.id, updates: { name: trimmedName } },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Show success feedback
  showToast(`Renamed to: ${trimmedName}`, 'success')

  // Refresh tree view with updated folder
  await loadQueriesAndFolders()
}

/**
 * Handle delete folder action (Story 4-3 AC2, AC3, AC4)
 * Shows confirmation dialog and removes folder via service worker
 * Returns error if folder contains queries or subfolders
 */
async function handleDeleteFolder(folder: Folder): Promise<void> {
  const confirmed = window.confirm(`Delete "${folder.name}"?\n\nThis cannot be undone.`)

  if (!confirmed) {
    return // User cancelled
  }

  // Send DELETE_FOLDER to service worker
  const result = await sendToServiceWorker<void>({
    type: 'DELETE_FOLDER',
    payload: { id: folder.id },
  })

  if (!result.success) {
    // Error messages from storage service are user-friendly (AC3, AC4)
    showToast(result.error, 'error')
    return
  }

  // Show success feedback
  showToast(`Deleted: ${folder.name}`, 'success')

  // Refresh tree view
  await loadQueriesAndFolders()
}

/**
 * Handle query drop on folder or root (Story 4-4)
 * Moves query to target folder via service worker
 * @param queryId - The query being moved
 * @param targetFolderId - Target folder ID, or null for root
 */
async function handleQueryDrop(queryId: string, targetFolderId: string | null): Promise<void> {
  // Send MOVE_QUERY to service worker
  const result = await sendToServiceWorker<Query>({
    type: 'MOVE_QUERY',
    payload: { queryId, targetFolderId },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Get folder name for toast message
  const folderName = targetFolderId
    ? currentFolders.find((f) => f.id === targetFolderId)?.name ?? 'folder'
    : 'root'

  // Show success feedback
  showToast(`Moved to: ${folderName}`, 'success')

  // Preserve expanded folders state during refresh
  const expandedIds = getExpandedFolders()
  await loadQueriesAndFolders()
  setExpandedFolders(expandedIds)

  // Expand target folder if it was collapsed
  if (targetFolderId && !expandedIds.includes(targetFolderId)) {
    toggleFolder(targetFolderId)
  }
}

/**
 * Handle folder drop on folder or root (Story 4-5)
 * Moves folder to target parent folder via service worker
 * @param folderId - The folder being moved
 * @param targetParentId - Target parent folder ID, or null for root
 */
async function handleFolderDrop(folderId: string, targetParentId: string | null): Promise<void> {
  // Send MOVE_FOLDER to service worker
  const result = await sendToServiceWorker<Folder>({
    type: 'MOVE_FOLDER',
    payload: { folderId, targetParentId },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Get parent name for toast message (consistent with query move: "root")
  const parentName = targetParentId
    ? currentFolders.find((f) => f.id === targetParentId)?.name ?? 'folder'
    : 'root'

  // Show success feedback
  showToast(`Moved folder to: ${parentName}`, 'success')

  // Preserve expanded folders state during refresh
  const expandedIds = getExpandedFolders()
  await loadQueriesAndFolders()
  setExpandedFolders(expandedIds)

  // Expand target parent if it was collapsed
  if (targetParentId && !expandedIds.includes(targetParentId)) {
    toggleFolder(targetParentId)
  }
}

// ============================================================
// Import Functions (Story 5-3)
// ============================================================

/**
 * Create and manage file input for import (FR18)
 * Hidden input element that triggers file picker
 */
function setupImportInput(): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.style.display = 'none'
  input.id = 'import-file-input'

  input.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      await handleImportFile(file)
    }
    // Reset input so same file can be selected again
    target.value = ''
  })

  document.body.appendChild(input)
  return input
}

/**
 * Handle Import button click - trigger file picker (AC1)
 */
function handleImportClick(): void {
  importFileInput?.click()
}

/**
 * Handle file input change event (FR18)
 * Parses and validates the selected file
 */
async function handleImportFile(file: File): Promise<void> {
  const result = await parseImportFile(file)

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Store for merge/replace actions
  pendingImportData = result.data

  // Show preview (AC4)
  const preview = getImportPreview(result.data)
  showImportPreviewOverlay(preview)
}

/**
 * Handle merge action - merge imported data with existing library (Story 5-4)
 * Sends IMPORT_MERGE message to service worker and shows result toast
 */
async function handleMerge(): Promise<void> {
  if (!pendingImportData) return

  // Find and disable merge button to show loading state
  const mergeBtn = document.querySelector('.js-merge') as HTMLButtonElement | null
  let originalText = 'Merge'
  if (mergeBtn) {
    originalText = mergeBtn.textContent ?? 'Merge'
    mergeBtn.disabled = true
    mergeBtn.textContent = 'Merging...'
  }

  const result = await sendToServiceWorker<MergeStats>({
    type: 'IMPORT_MERGE',
    payload: { importData: pendingImportData },
  })

  if (result.success) {
    hideImportPreviewOverlay()
    pendingImportData = null

    // Build toast message with stats (Task 5)
    const stats = result.data
    const folderText = formatCount(stats.foldersAdded, 'folder', 'folders')
    const queryText = formatCount(stats.queriesAdded, 'query', 'queries')
    let message = `Imported ${folderText} and ${queryText}`
    if (stats.queriesRenamed > 0) {
      message += ` (${stats.queriesRenamed} renamed to avoid duplicates)`
    }
    showToast(message, 'success')

    // Refresh tree view with new data
    await loadQueriesAndFolders()
  } else {
    showToast(result.error ?? 'Merge failed', 'error')
    // Re-enable button on error
    if (mergeBtn) {
      mergeBtn.disabled = false
      mergeBtn.textContent = originalText
    }
  }
}

/**
 * Handle replace action - replace existing library with imported data (Story 5-5)
 * Shows confirmation modal and sends IMPORT_REPLACE message to service worker
 */
async function handleReplace(): Promise<void> {
  if (!pendingImportData) return

  // Show confirmation modal (AC1)
  const confirmed = await showConfirmModal(
    'Replace Library?',
    'This will permanently delete all your current queries and folders.',
    'Replace',
    true  // danger style
  )

  if (!confirmed) return

  // Find and disable replace button to show loading state
  const replaceBtn = document.querySelector('.js-replace') as HTMLButtonElement | null
  let originalText = 'Replace'
  if (replaceBtn) {
    originalText = replaceBtn.textContent ?? 'Replace'
    replaceBtn.disabled = true
    replaceBtn.textContent = 'Replacing...'
  }

  const result = await sendToServiceWorker<ReplaceStats>({
    type: 'IMPORT_REPLACE',
    payload: { importData: pendingImportData },
  })

  if (result.success) {
    hideImportPreviewOverlay()
    pendingImportData = null

    // Build toast message with stats (AC3)
    const stats = result.data
    let message: string
    if (stats.foldersImported > 0) {
      const folderText = formatCount(stats.foldersImported, 'folder', 'folders')
      const queryText = formatCount(stats.queriesImported, 'query', 'queries')
      message = `Library replaced with ${folderText} and ${queryText}`
    } else {
      const queryText = formatCount(stats.queriesImported, 'query', 'queries')
      message = `Library replaced with ${queryText}`
    }
    showToast(message, 'success')

    // Refresh tree view with new data
    await loadQueriesAndFolders()
  } else {
    showToast(result.error ?? 'Replace failed', 'error')
    // Re-enable button on error
    if (replaceBtn) {
      replaceBtn.disabled = false
      replaceBtn.textContent = originalText
    }
  }
}

/**
 * Show import preview overlay (AC4)
 * Creates modal-like overlay with preview and action buttons
 */
function showImportPreviewOverlay(preview: ImportPreviewData): void {
  // Create overlay container
  const overlay = document.createElement('div')
  overlay.className = 'import-overlay js-import-overlay'

  const previewContainer = document.createElement('div')
  overlay.appendChild(previewContainer)

  renderImportPreview(previewContainer, preview, {
    onMerge: handleMerge,
    onReplace: handleReplace,
    onCancel: () => {
      hideImportPreviewOverlay()
      pendingImportData = null
    },
  })

  document.body.appendChild(overlay)
}

/**
 * Hide import preview overlay
 */
function hideImportPreviewOverlay(): void {
  const overlay = document.querySelector('.js-import-overlay')
  overlay?.remove()
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializePopup)
