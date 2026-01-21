/**
 * Popup Entry Point
 * Creates the main popup shell with header and content areas
 */

import './index.css'
import { createHeader } from './components/header'

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

  // Create content area
  const content = document.createElement('main')
  content.className = 'content'

  // Empty state (will be replaced with tree view in later stories)
  const emptyState = document.createElement('div')
  emptyState.className = 'empty-state'

  const emptyMessage = document.createElement('p')
  emptyMessage.textContent = 'No queries saved yet'

  const emptyHint = document.createElement('p')
  emptyHint.className = 'empty-state__hint'
  emptyHint.textContent = 'Write a query in SMP and click + to capture'

  emptyState.appendChild(emptyMessage)
  emptyState.appendChild(emptyHint)
  content.appendChild(emptyState)

  // Create preview panel (hidden by default, for future stories)
  const previewPanel = document.createElement('footer')
  previewPanel.className = 'preview-panel'
  previewPanel.hidden = true

  // Assemble popup
  popup.appendChild(header)
  popup.appendChild(content)
  popup.appendChild(previewPanel)

  // Mount to DOM
  appElement.appendChild(popup)
}

/**
 * Handle capture button click
 * TODO: Implement in Story 2-4 (Capture Form Component)
 */
function handleCaptureClick(): void {
  console.log('[IRIS Query Manager] Capture button clicked')
  // Will open capture form in Story 2-4
}

/**
 * Handle menu button click
 * TODO: Implement menu dropdown in future story
 */
function handleMenuClick(): void {
  console.log('[IRIS Query Manager] Menu button clicked')
  // Will open menu dropdown in future story
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializePopup)
