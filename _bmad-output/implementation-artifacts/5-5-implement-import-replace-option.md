# Story 5.5: Implement Import Replace Option

Status: review

## Story

As a **user**,
I want **to replace my library with imported queries**,
So that **I can start fresh with a new query set**. (FR20)

## Acceptance Criteria

1. **Given** import preview is showing **When** I select "Replace existing" **Then** a warning confirms this will delete current library

2. **Given** I confirm replacement **When** the import completes **Then** my library contains only the imported queries and folders (FR20)

3. **Given** replacement operation **When** it completes **Then** a success toast confirms "Library replaced with X queries"

## Tasks / Subtasks

- [x] Task 1: Implement replaceWithImportData function in import-export-service.ts (AC: 2)
  - [x] 1.1: Create `replaceWithImportData(importData: ExportData): ReplaceResult` function signature
  - [x] 1.2: Define `ReplaceResult` interface: `{ folders: Folder[], queries: Query[], stats: ReplaceStats }`
  - [x] 1.3: Define `ReplaceStats` interface: `{ foldersImported: number, queriesImported: number }`
  - [x] 1.4: Implement ID regeneration for all imported items:
    - [x] 1.4.1: Build ID mapping for folders: `Map<oldId, newId>`
    - [x] 1.4.2: Process folders level-by-level (root first), generating new IDs
    - [x] 1.4.3: Remap parentId references using the ID map
    - [x] 1.4.4: Generate new query IDs and remap folderId using folder ID map
  - [x] 1.5: Preserve original createdAt timestamps, set updatedAt to current time
  - [x] 1.6: Return new folders array, new queries array, and stats

- [x] Task 2: Add IMPORT_REPLACE message type and handler (AC: 2)
  - [x] 2.1: Add `IMPORT_REPLACE` to MessageType in message.types.ts
  - [x] 2.2: Define payload: `{ importData: ExportData }`
  - [x] 2.3: Define response: `Result<ReplaceStats>`
  - [x] 2.4: Add handler in background/index.ts:
    - [x] 2.4.1: Call replaceWithImportData with import data
    - [x] 2.4.2: Save result to storage via StorageService.replaceAll()
    - [x] 2.4.3: Return stats in response

- [x] Task 3: Implement replacement confirmation modal (AC: 1)
  - [x] 3.1: Create showConfirmModal function in popup/components/confirm-modal.ts (new file)
  - [x] 3.2: Modal structure:
    - [x] 3.2.1: Title: "Replace Library?"
    - [x] 3.2.2: Warning message: "This will permanently delete all your current queries and folders."
    - [x] 3.2.3: Cancel button (secondary, left)
    - [x] 3.2.4: Replace button (danger/destructive style, right)
  - [x] 3.3: Return Promise<boolean> (true = confirmed, false = cancelled)
  - [x] 3.4: Focus trap within modal, Escape key cancels
  - [x] 3.5: Add confirm-modal.css with styles consistent with design tokens

- [x] Task 4: Wire up Replace button in import-preview component (AC: 1, 2, 3)
  - [x] 4.1: In popup/index.ts, update onReplace callback to call handleReplace()
  - [x] 4.2: Implement `handleReplace()` function:
    - [x] 4.2.1: Show confirmation modal via showConfirmModal()
    - [x] 4.2.2: If cancelled, return early (do nothing)
    - [x] 4.2.3: If confirmed, show loading state on Replace button
    - [x] 4.2.4: Send IMPORT_REPLACE message to service worker with pendingImportData
    - [x] 4.2.5: On success: hide preview, show success toast with stats
    - [x] 4.2.6: On error: show error toast, keep preview open
    - [x] 4.2.7: Refresh tree view with new data

- [x] Task 5: Implement success toast with replace stats (AC: 3)
  - [x] 5.1: Create toast message: "Library replaced with X queries"
  - [x] 5.2: Include folder count if > 0: "Library replaced with X folders and Y queries"

- [x] Task 6: Write unit tests (AC: 1, 2, 3)
  - [x] 6.1: Add tests to import-export-service.test.ts:
    - [x] Test replaceWithImportData generates new IDs for all folders
    - [x] Test replaceWithImportData generates new IDs for all queries
    - [x] Test replaceWithImportData remaps folder parentId correctly
    - [x] Test replaceWithImportData remaps query folderId correctly
    - [x] Test replaceWithImportData preserves createdAt from imported queries
    - [x] Test replaceWithImportData updates updatedAt to current time
    - [x] Test replaceWithImportData returns correct stats
    - [x] Test replaceWithImportData handles empty import
    - [x] Test replaceWithImportData handles nested folder structure
  - [x] 6.2: Add tests for confirm-modal.ts:
    - [x] Test showConfirmModal returns true when Replace clicked
    - [x] Test showConfirmModal returns false when Cancel clicked
    - [x] Test showConfirmModal returns false when Escape pressed

- [ ] Task 7: Manual E2E verification (Developer to perform after code review)
  - [ ] 7.1: Click Replace, verify confirmation modal appears with warning
  - [ ] 7.2: Click Cancel in modal, verify nothing changes
  - [ ] 7.3: Click Replace in modal, verify all existing data is gone
  - [ ] 7.4: Verify imported data appears with correct folder structure
  - [ ] 7.5: Verify success toast shows correct counts
  - [ ] 7.6: Verify tree view refreshes with only imported content

## Dev Notes

### Replace Strategy Overview

**CRITICAL: Replace is destructive - user loses all existing data. Confirmation modal is essential.**

The replace strategy is simpler than merge:
- Clear existing data completely
- Import all new data with fresh IDs
- No collision handling needed (nothing to collide with)

### ID Regeneration Strategy

Even though we're replacing everything, we still need to:
1. **Generate new IDs for all imported items** - Never trust imported IDs (could cause issues if user imports same file twice, or file has malformed IDs)
2. **Build folder ID mapping** - Maps old imported ID -> new generated ID
3. **Remap all references** - Folder parentId and Query folderId must use new IDs

```typescript
// ID Mapping structure (same as merge)
type IdMap = Map<string, string>  // oldId -> newId

// Process order:
// 1. Process folders level-by-level (root first, then children)
// 2. Build folder ID map as we go
// 3. Process queries after all folders, using folder ID map
```

### replaceWithImportData Function Signature

```typescript
// Add to import-export-service.ts

export interface ReplaceStats {
  foldersImported: number
  queriesImported: number
}

export interface ReplaceResult {
  folders: Folder[]
  queries: Query[]
  stats: ReplaceStats
}

/**
 * Prepare imported data to completely replace existing library (FR20)
 *
 * Strategy:
 * - All existing data will be discarded
 * - All imported items get new IDs to ensure uniqueness
 * - References (parentId, folderId) are remapped to new IDs
 * - Original timestamps preserved where possible
 *
 * @param imported - Validated data from import file
 * @returns Data ready to save (replaces everything), plus stats for user feedback
 */
export function replaceWithImportData(imported: ExportData): ReplaceResult {
  const stats: ReplaceStats = {
    foldersImported: 0,
    queriesImported: 0,
  }

  const newFolders: Folder[] = []
  const newQueries: Query[] = []

  // Map imported IDs to new IDs
  const folderIdMap: Map<string, string> = new Map()

  // Process folders level by level (root first, then children)
  // Reuse groupBy helper from merge implementation
  const importedFoldersByParent = groupBy(imported.folders, f => f.parentId ?? 'root')

  function processFolderLevel(parentKey: string, newParentId: string | null): void {
    const foldersAtLevel = importedFoldersByParent.get(parentKey) ?? []

    for (const importedFolder of foldersAtLevel) {
      const newId = crypto.randomUUID()
      folderIdMap.set(importedFolder.id, newId)

      newFolders.push({
        id: newId,
        name: importedFolder.name,
        parentId: newParentId,
      })
      stats.foldersImported++

      // Process children of this folder
      processFolderLevel(importedFolder.id, newId)
    }
  }

  // Start with root-level folders
  processFolderLevel('root', null)

  // Process queries
  const now = new Date().toISOString()
  for (const importedQuery of imported.queries) {
    // Map folderId to new folder ID
    const newFolderId = importedQuery.folderId
      ? folderIdMap.get(importedQuery.folderId) ?? null
      : null

    newQueries.push({
      id: crypto.randomUUID(),
      name: importedQuery.name,
      sql: importedQuery.sql,
      folderId: newFolderId,
      createdAt: importedQuery.createdAt,  // Preserve original creation time
      updatedAt: now,  // Mark as updated now (import is a modification)
    })
    stats.queriesImported++
  }

  return {
    folders: newFolders,
    queries: newQueries,
    stats,
  }
}
```

### Message Type Definition

```typescript
// Add to message.types.ts

// In MessageType union:
| { type: 'IMPORT_REPLACE'; payload: { importData: ExportData } }

// Response type: Result<ReplaceStats>
```

### Service Worker Handler

```typescript
// Add to background/index.ts message handler

case 'IMPORT_REPLACE': {
  const { importData } = message.payload

  // Prepare replacement data
  const { folders, queries, stats } = replaceWithImportData(importData)

  // Replace all existing data
  const saveResult = await StorageService.replaceAll({ folders, queries })

  if (!saveResult.success) {
    sendResponse({ success: false, error: 'Failed to save replacement data' })
    return true
  }

  sendResponse({ success: true, data: stats })
  return true
}
```

### Confirmation Modal Implementation

```typescript
// New file: src/popup/components/confirm-modal.ts

/**
 * Show a confirmation modal and return user's choice
 *
 * @param title - Modal title
 * @param message - Warning message to display
 * @param confirmText - Text for confirm button (default: "Confirm")
 * @param confirmDanger - If true, style confirm button as destructive (default: false)
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export function showConfirmModal(
  title: string,
  message: string,
  confirmText = 'Confirm',
  confirmDanger = false
): Promise<boolean> {
  return new Promise((resolve) => {
    // Create modal elements
    const overlay = document.createElement('div')
    overlay.className = 'confirm-modal-overlay'

    const modal = document.createElement('div')
    modal.className = 'confirm-modal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'confirm-modal-title')

    modal.innerHTML = `
      <h2 id="confirm-modal-title" class="confirm-modal__title">${title}</h2>
      <p class="confirm-modal__message">${message}</p>
      <div class="confirm-modal__actions">
        <button type="button" class="confirm-modal__btn confirm-modal__btn--cancel js-modal-cancel">
          Cancel
        </button>
        <button type="button" class="confirm-modal__btn ${confirmDanger ? 'confirm-modal__btn--danger' : 'confirm-modal__btn--confirm'} js-modal-confirm">
          ${confirmText}
        </button>
      </div>
    `

    overlay.appendChild(modal)
    document.body.appendChild(overlay)

    // Focus the cancel button (safer default)
    const cancelBtn = modal.querySelector('.js-modal-cancel') as HTMLButtonElement
    const confirmBtn = modal.querySelector('.js-modal-confirm') as HTMLButtonElement
    cancelBtn.focus()

    function cleanup(result: boolean): void {
      overlay.remove()
      resolve(result)
    }

    // Event handlers
    cancelBtn.addEventListener('click', () => cleanup(false))
    confirmBtn.addEventListener('click', () => cleanup(true))

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false)
    })

    document.addEventListener('keydown', function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape)
        cleanup(false)
      }
    })

    // Focus trap
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === cancelBtn) {
          e.preventDefault()
          confirmBtn.focus()
        } else if (!e.shiftKey && document.activeElement === confirmBtn) {
          e.preventDefault()
          cancelBtn.focus()
        }
      }
    })
  })
}
```

### Confirmation Modal CSS

```css
/* New file: src/popup/components/confirm-modal.css */

.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 8px);
  padding: var(--spacing-lg, 16px);
  max-width: 320px;
  width: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.confirm-modal__title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm, 8px) 0;
  color: var(--color-text-primary, #1a1a1a);
}

.confirm-modal__message {
  font-size: var(--font-size-md, 14px);
  color: var(--color-text-secondary, #666666);
  margin: 0 0 var(--spacing-lg, 16px) 0;
  line-height: 1.4;
}

.confirm-modal__actions {
  display: flex;
  gap: var(--spacing-sm, 8px);
  justify-content: flex-end;
}

.confirm-modal__btn {
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-md, 4px);
  font-size: var(--font-size-md, 14px);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s, border-color 0.15s;
}

.confirm-modal__btn--cancel {
  background-color: transparent;
  border-color: var(--color-border, #d1d5db);
  color: var(--color-text-primary, #1a1a1a);
}

.confirm-modal__btn--cancel:hover {
  background-color: var(--color-hover, #f3f4f6);
}

.confirm-modal__btn--confirm {
  background-color: var(--color-primary, #0066cc);
  color: #ffffff;
}

.confirm-modal__btn--confirm:hover {
  background-color: var(--color-primary-hover, #0052a3);
}

.confirm-modal__btn--danger {
  background-color: var(--color-error, #dc2626);
  color: #ffffff;
}

.confirm-modal__btn--danger:hover {
  background-color: var(--color-error-hover, #b91c1c);
}

.confirm-modal__btn:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}
```

### Popup Replace Handler

```typescript
// Update in popup/index.ts

import { showConfirmModal } from './components/confirm-modal'
import './components/confirm-modal.css'

async function handleReplace(): Promise<void> {
  if (!pendingImportData) return

  // Show confirmation modal
  const confirmed = await showConfirmModal(
    'Replace Library?',
    'This will permanently delete all your current queries and folders.',
    'Replace',
    true  // danger style
  )

  if (!confirmed) return

  // Show loading state
  const replaceBtn = document.querySelector('.js-replace') as HTMLButtonElement
  let originalText = ''
  if (replaceBtn) {
    originalText = replaceBtn.textContent ?? 'Replace'
    replaceBtn.disabled = true
    replaceBtn.textContent = 'Replacing...'
  }

  const result = await chrome.runtime.sendMessage({
    type: 'IMPORT_REPLACE',
    payload: { importData: pendingImportData }
  })

  if (result.success) {
    hideImportPreview()
    pendingImportData = null

    // Build toast message
    const stats = result.data
    let message = ''
    if (stats.foldersImported > 0) {
      message = `Library replaced with ${stats.foldersImported} folder${stats.foldersImported !== 1 ? 's' : ''} and ${stats.queriesImported} quer${stats.queriesImported !== 1 ? 'ies' : 'y'}`
    } else {
      message = `Library replaced with ${stats.queriesImported} quer${stats.queriesImported !== 1 ? 'ies' : 'y'}`
    }
    showToast(message, 'success')

    // Refresh tree view
    await loadAndRenderTree()
  } else {
    showToast(result.error ?? 'Replace failed', 'error')
    // Re-enable button
    if (replaceBtn) {
      replaceBtn.disabled = false
      replaceBtn.textContent = originalText
    }
  }
}
```

### Edge Cases to Handle

1. **Empty import file (valid but no data)**
   - Allow replacement with empty library (user explicitly chose this)
   - Toast: "Library replaced with 0 queries"

2. **User cancels confirmation**
   - Do nothing, keep preview open
   - No toast, no state changes

3. **Orphaned folder references in import**
   - Handle same as merge: orphaned folders become root, orphaned queries go to root

4. **Storage error during save**
   - Show error toast, keep preview open so user can retry
   - Do NOT clear pendingImportData

### Previous Story (5-4) Learnings Applied

1. **replaceAll method exists** - Already added to StorageService in 5-4, reuse it
2. **groupBy helper exists** - Already added to import-export-service.ts in 5-4
3. **pendingImportData state exists** - Already storing validated data in popup state
4. **hideImportPreview exists** - Cleanup function ready to use
5. **Toast pattern established** - Use showToast with proper plural handling
6. **Level-by-level folder processing pattern** - Copy from merge implementation
7. **Button loading state pattern** - Store originalText before changing

### Key Differences from Merge (5-4)

| Aspect | Merge (5-4) | Replace (5-5) |
|--------|-------------|---------------|
| Existing data | Preserved | Deleted |
| Collision handling | Rename imports | N/A (no collisions) |
| Confirmation | Not needed | Required |
| ID mapping | Build from existing | Build from scratch |
| Stats | Added/skipped/renamed | Just counts |

### Architecture Compliance

From `project-context.md`:

1. **Never throw from services:** Return `Result<T>` objects
2. **Message type naming:** UPPER_SNAKE_CASE - `IMPORT_REPLACE`
3. **Return true for async message handlers** - CRITICAL
4. **File naming:** kebab-case - `confirm-modal.ts`, `confirm-modal.css`
5. **CSS class naming:** BEM-inspired - `.confirm-modal__title`, `.confirm-modal__btn--danger`
6. **JS hooks:** `.js-modal-cancel`, `.js-modal-confirm`, `.js-replace`

### Performance Notes

Replace is simpler than merge - no lookups against existing data needed.
- Process folders: O(m) where m = imported folders
- Process queries: O(q) where q = imported queries
- Total: O(m + q), should complete in < 20ms for any reasonable dataset

### Project Structure Notes

**Files to Create:**
- `src/popup/components/confirm-modal.ts` - Confirmation modal component
- `src/popup/components/confirm-modal.css` - Modal styles

**Files to Modify:**
- `src/shared/services/import-export-service.ts` - Add ReplaceStats, ReplaceResult, replaceWithImportData
- `src/shared/services/import-export-service.test.ts` - Add replace tests
- `src/shared/types/message.types.ts` - Add IMPORT_REPLACE type
- `src/background/index.ts` - Add IMPORT_REPLACE handler
- `src/popup/index.ts` - Add handleReplace implementation, import confirm-modal

### Test Coverage Priority

1. **replaceWithImportData** - Core function for ID regeneration and remapping
2. **showConfirmModal** - User interaction for destructive action
3. **Integration via message** - Ensure end-to-end flow works

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5]
- [Source: _bmad-output/planning-artifacts/prd.md#FR20]
- [Source: _bmad-output/planning-artifacts/architecture.md#Import Validation]
- [Source: _bmad-output/project-context.md#TypeScript Rules, Chrome Extension Rules, CSS Class Naming]
- [Source: _bmad-output/implementation-artifacts/5-4-implement-import-merge-option.md (groupBy, replaceAll, level-by-level processing)]
- [Source: src/shared/services/import-export-service.ts (ExportData interface, groupBy helper)]
- [Source: src/shared/types/storage.types.ts (Query, Folder, StorageSchema)]
- [Source: src/shared/services/storage-service.ts (replaceAll method)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - All tests passing (699 tests), build successful.

### Completion Notes List

1. **Task 1 - replaceWithImportData function:** Implemented in `import-export-service.ts`. Uses level-by-level folder processing (reusing existing `groupBy` helper), generates new UUIDs for all items, remaps parentId/folderId references. Added `ReplaceStats` and `ReplaceResult` interfaces. 12 unit tests added covering ID generation, reference remapping, timestamp handling, stats, and edge cases (empty import, nested folders, orphaned references).

2. **Task 2 - IMPORT_REPLACE message type:** Added to `message.types.ts`. Handler in `background/index.ts` calls `replaceWithImportData` then `storageService.replaceAll()` to atomically replace all data.

3. **Task 3 - Confirmation modal:** Created new `confirm-modal.ts` and `confirm-modal.css` components. Modal is accessible (role=dialog, aria-modal, aria-labelledby), has focus trap, responds to Escape key, and uses danger button styling per design tokens. 11 unit tests added.

4. **Task 4 - Replace button wiring:** Updated `popup/index.ts` to call `handleReplace()` which shows confirmation modal, sends IMPORT_REPLACE message on confirm, shows loading state during operation.

5. **Task 5 - Success toast:** Toast message shows "Library replaced with X folders and Y queries" (or just queries if no folders). Uses existing `formatCount` helper for proper singular/plural handling.

6. **Task 6 - Unit tests:** All tests passing. Added 12 tests for `replaceWithImportData` and 11 tests for `showConfirmModal`. Total test count: 699.

### File List

**Created:**
- `src/popup/components/confirm-modal.ts` - Confirmation modal component
- `src/popup/components/confirm-modal.css` - Modal styles
- `src/popup/components/confirm-modal.test.ts` - Modal tests (11 tests)

**Modified:**
- `src/shared/services/import-export-service.ts` - Added `ReplaceStats`, `ReplaceResult`, `replaceWithImportData()`
- `src/shared/services/import-export-service.test.ts` - Added 12 tests for replaceWithImportData
- `src/shared/types/message.types.ts` - Added `IMPORT_REPLACE` message type
- `src/background/index.ts` - Added `IMPORT_REPLACE` handler and `handleImportReplace()` function
- `src/popup/index.ts` - Added `handleReplace()` function, imported `showConfirmModal`, updated onReplace callback

## Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) | **Date:** 2026-01-24 | **Model:** Claude Opus 4.5

### Review Outcome: ✅ APPROVED

### Issues Found & Addressed

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | LOW | CSS variable naming inconsistency (--color-bg vs --color-surface) | Noted, not blocking - fallbacks work correctly |

### Verification

- All 699 tests pass
- Build succeeds
- All ACs validated against implementation:
  - AC1: Confirmation modal shows warning before replace ✅
  - AC2: Library replaced with only imported data ✅
  - AC3: Success toast shows correct counts ✅

### Notes

- Task 7 (Manual E2E) is post-release verification, not blocking done status
- Confirmation modal properly focuses Cancel button by default (safer UX for destructive action)
- Focus trap and Escape key handling implemented for accessibility
