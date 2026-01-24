/**
 * Header Component
 * Creates the popup header with title and action buttons
 * Note: Header styles are in popup/index.css with .header, .header__title, .header__actions
 */

import { createIconButton } from './icon-button'
import { ICONS } from '../icons'

export interface HeaderOptions {
  onCaptureClick?: () => void
  onNewFolderClick?: () => void
  onExportClick?: () => void
  onImportClick?: () => void
  onMenuClick?: () => void
}

/**
 * Create the popup header element
 *
 * @param options - Header configuration with click handlers
 * @returns HTMLElement containing the complete header
 */
export function createHeader(options: HeaderOptions = {}): HTMLElement {
  const header = document.createElement('header')
  header.className = 'header'

  // Title
  const title = document.createElement('h1')
  title.className = 'header__title'
  title.textContent = 'IRIS Query Manager'

  // Actions container
  const actions = document.createElement('div')
  actions.className = 'header__actions'

  // Capture button (+)
  const captureButton = createIconButton({
    icon: ICONS.plus,
    label: 'Capture query',
    className: 'js-capture-btn',
    onClick: options.onCaptureClick,
  })

  // New Folder button (Story 4-2)
  const newFolderButton = createIconButton({
    icon: ICONS.folderPlus,
    label: 'Create new folder',
    className: 'js-new-folder-btn',
    onClick: options.onNewFolderClick,
  })

  // Export button (Story 5-1)
  const exportButton = createIconButton({
    icon: ICONS.download,
    label: 'Export all',
    className: 'js-export-btn',
    onClick: options.onExportClick,
  })

  // Import button (Story 5-3)
  const importButton = createIconButton({
    icon: ICONS.upload,
    label: 'Import',
    className: 'js-import-btn',
    onClick: options.onImportClick,
  })

  // Menu button (...)
  const menuButton = createIconButton({
    icon: ICONS.moreVertical,
    label: 'Menu',
    className: 'js-menu-btn',
    onClick: options.onMenuClick,
  })

  actions.appendChild(captureButton)
  actions.appendChild(newFolderButton)
  actions.appendChild(exportButton)
  actions.appendChild(importButton)
  actions.appendChild(menuButton)

  header.appendChild(title)
  header.appendChild(actions)

  return header
}
