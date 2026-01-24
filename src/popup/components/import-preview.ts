/**
 * Import Preview Component
 * Shows preview of import data before merge/replace (AC4)
 */

import './import-preview.css'
import type { ImportPreview } from '../../shared/services/import-export-service'

export interface ImportPreviewCallbacks {
  onMerge: () => void
  onReplace: () => void
  onCancel: () => void
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Render import preview component (AC4)
 * Shows folder/query counts and action buttons
 *
 * @param container - Container element to render into
 * @param preview - ImportPreview data with counts
 * @param callbacks - Event handlers for merge/replace/cancel
 */
export function renderImportPreview(
  container: HTMLElement,
  preview: ImportPreview,
  callbacks: ImportPreviewCallbacks
): void {
  const folderText = `${preview.folderCount} folder${preview.folderCount !== 1 ? 's' : ''}`
  const queryText = `${preview.queryCount} quer${preview.queryCount !== 1 ? 'ies' : 'y'}`

  container.innerHTML = `
    <div class="import-preview">
      <div class="import-preview__header">
        <h3 class="import-preview__title">Import Preview</h3>
        <button class="import-preview__close js-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="import-preview__content">
        <div class="import-preview__summary">
          <span class="import-preview__count">${folderText}</span>
          <span class="import-preview__separator">&middot;</span>
          <span class="import-preview__count">${queryText}</span>
        </div>
        ${preview.folderNames.length > 0 ? `
          <div class="import-preview__folders">
            <span class="import-preview__label">Folders:</span>
            <div class="import-preview__folder-list">
              ${preview.folderNames.map((name) => `<span class="import-preview__folder-chip">${escapeHtml(name)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        ${preview.rootQueryCount > 0 ? `
          <div class="import-preview__root-queries">
            ${preview.rootQueryCount} quer${preview.rootQueryCount !== 1 ? 'ies' : 'y'} at root level
          </div>
        ` : ''}
      </div>
      <div class="import-preview__actions">
        <button class="btn btn--secondary js-cancel" type="button">Cancel</button>
        <button class="btn btn--secondary js-replace" type="button">Replace All</button>
        <button class="btn btn--primary js-merge" type="button">Merge</button>
      </div>
    </div>
  `

  // Wire up callbacks
  container.querySelector('.js-close')?.addEventListener('click', callbacks.onCancel)
  container.querySelector('.js-cancel')?.addEventListener('click', callbacks.onCancel)
  container.querySelector('.js-merge')?.addEventListener('click', callbacks.onMerge)
  container.querySelector('.js-replace')?.addEventListener('click', callbacks.onReplace)
}
