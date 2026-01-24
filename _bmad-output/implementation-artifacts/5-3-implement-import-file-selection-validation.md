# Story 5.3: Implement Import File Selection & Validation

Status: done

## Story

As a **user**,
I want **to import queries from a JSON file**,
So that **I can restore backups or receive team query packs**. (FR18, FR21)

## Acceptance Criteria

1. **Given** I click Import in the menu **When** the file picker opens **Then** I can select a JSON file from my system (FR18)

2. **Given** I select a valid JSON file **When** validation runs **Then** it verifies the file has valid folders[] and queries[] structure (FR21)

3. **Given** an invalid file format **When** validation fails **Then** a clear error message describes the problem (NFR9)

4. **Given** a valid import file **When** validation passes **Then** a preview shows folder structure and query count

## Tasks / Subtasks

- [x] Task 1: Add validateImportData function to import-export-service.ts (AC: 2, 3)
  - [x] 1.1: Create `validateImportData(data: unknown): ValidationResult` function
  - [x] 1.2: Check that data is an object with required structure
  - [x] 1.3: Validate `version` field exists and is string
  - [x] 1.4: Validate `folders` is array with proper Folder structure (id, name, parentId nullable)
  - [x] 1.5: Validate `queries` is array with proper Query structure (id, name, sql, folderId nullable, createdAt, updatedAt)
  - [x] 1.6: Return validation result with specific error messages for each failure case
  - [x] 1.7: Handle edge cases: empty arrays, missing fields, wrong types

- [x] Task 2: Add parseImportFile function to import-export-service.ts (AC: 1, 2, 3)
  - [x] 2.1: Create `parseImportFile(file: File): Promise<Result<ExportData>>` function
  - [x] 2.2: Read file contents using FileReader
  - [x] 2.3: Parse JSON and handle JSON.parse errors with clear message
  - [x] 2.4: Call validateImportData and return appropriate error on failure
  - [x] 2.5: Return parsed ExportData on success

- [x] Task 3: Create ImportPreview type and getImportPreview function (AC: 4)
  - [x] 3.1: Define `ImportPreview` interface: `{ folderCount: number, queryCount: number, folderNames: string[], rootQueryCount: number }`
  - [x] 3.2: Create `getImportPreview(data: ExportData): ImportPreview` function
  - [x] 3.3: Count total folders and queries
  - [x] 3.4: Extract root-level folder names for display
  - [x] 3.5: Count queries not in any folder (root queries)

- [x] Task 4: Create import-preview component in popup (AC: 4)
  - [x] 4.1: Create `src/popup/components/import-preview.ts`
  - [x] 4.2: Create `src/popup/components/import-preview.css`
  - [x] 4.3: CSS imported via direct import in import-preview.ts (following existing component pattern)
  - [x] 4.4: Render preview showing: folder count, query count, folder names list
  - [x] 4.5: Display summary like "3 folders, 15 queries" with folder name pills/chips
  - [x] 4.6: Include action buttons area for merge/replace (wired in Story 5-4/5-5)

- [x] Task 5: Add IMPORT_VALIDATE message type and handler (AC: 2)
  - [x] 5.1: Not needed - file reading happens entirely in popup (per story Dev Notes)
  - [x] 5.2: Note: Actual file reading happens in popup, service worker receives parsed data

- [x] Task 6: Add Import button to popup menu and file input handling (AC: 1)
  - [x] 6.1: Add "Import" icon button to popup header (next to Export button)
  - [x] 6.2: Create hidden file input element (`<input type="file" accept=".json">`)
  - [x] 6.3: Trigger file input click when Import button clicked
  - [x] 6.4: Handle file input change event to process selected file

- [x] Task 7: Implement import flow handler in popup (AC: 1, 2, 3, 4)
  - [x] 7.1: Add `handleImportFile(file: File)` function to popup
  - [x] 7.2: Call parseImportFile to read and validate
  - [x] 7.3: On validation error, show error toast with specific message
  - [x] 7.4: On success, store parsed data in popup state
  - [x] 7.5: Show import-preview component with parsed data
  - [x] 7.6: Disable tree interaction while preview is showing (modal-like overlay)

- [x] Task 8: Write unit tests (AC: 2, 3, 4)
  - [x] 8.1: Add tests to `import-export-service.test.ts`:
    - [x] Test validateImportData accepts valid ExportData structure
    - [x] Test validateImportData rejects missing version field
    - [x] Test validateImportData rejects missing folders array
    - [x] Test validateImportData rejects missing queries array
    - [x] Test validateImportData rejects invalid folder structure (missing id, name)
    - [x] Test validateImportData rejects invalid query structure (missing id, name, sql)
    - [x] Test validateImportData accepts empty folders and queries arrays
    - [x] Test getImportPreview calculates correct counts
    - [x] Test getImportPreview extracts folder names
  - [x] 8.2: Updated header.test.ts for new Import button (5 tests added)

- [x] Task 9: Manual E2E verification (Developer to perform)
  - [x] 9.1: Click Import, verify file picker opens with .json filter
  - [x] 9.2: Select valid export file, verify preview appears with correct counts
  - [x] 9.3: Select invalid JSON, verify error toast with "Invalid JSON format" message
  - [x] 9.4: Select JSON with missing version, verify error toast with specific message
  - [x] 9.5: Select JSON with invalid query structure, verify error toast
  - [x] 9.6: Verify preview shows folder names and query count
  - [x] 9.7: Verify tree is disabled/overlay while preview showing

## Dev Notes

### Validation Strategy

**CRITICAL: Lenient validation with specific error messages per Architecture**

The Architecture specifies "Lenient" validation: import valid entries, skip invalid with warning. However, for MVP Story 5-3, we need basic structural validation to prevent catastrophic errors. Full lenient parsing with partial success will be in Story 5-4/5-5.

For this story, focus on:
1. **Structural validation** - Is it valid JSON with required arrays?
2. **Type checking** - Are folders and queries objects with required fields?
3. **Graceful error messages** - Tell user exactly what's wrong

### ValidationResult Type

```typescript
// Add to import-export-service.ts

export interface ValidationResult {
  valid: boolean
  error?: string  // Human-readable error message
  warnings?: string[]  // Non-fatal issues (for lenient mode in 5-4/5-5)
}

/**
 * Validate imported data structure matches ExportData format (FR21)
 * Returns detailed error messages for user feedback (NFR9)
 */
export function validateImportData(data: unknown): ValidationResult {
  // Check basic structure
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Import file must be a JSON object' }
  }

  const obj = data as Record<string, unknown>

  // Check version field
  if (!('version' in obj) || typeof obj.version !== 'string') {
    return { valid: false, error: 'Import file missing version field' }
  }

  // Check folders array
  if (!('folders' in obj) || !Array.isArray(obj.folders)) {
    return { valid: false, error: 'Import file missing folders array' }
  }

  // Validate each folder structure
  for (let i = 0; i < obj.folders.length; i++) {
    const folder = obj.folders[i] as Record<string, unknown>
    if (!folder || typeof folder !== 'object') {
      return { valid: false, error: `Folder at index ${i} is not an object` }
    }
    if (typeof folder.id !== 'string' || !folder.id) {
      return { valid: false, error: `Folder at index ${i} missing valid id` }
    }
    if (typeof folder.name !== 'string') {
      return { valid: false, error: `Folder at index ${i} missing name` }
    }
    // parentId can be null or string
    if (folder.parentId !== null && typeof folder.parentId !== 'string') {
      return { valid: false, error: `Folder "${folder.name}" has invalid parentId` }
    }
  }

  // Check queries array
  if (!('queries' in obj) || !Array.isArray(obj.queries)) {
    return { valid: false, error: 'Import file missing queries array' }
  }

  // Validate each query structure
  for (let i = 0; i < obj.queries.length; i++) {
    const query = obj.queries[i] as Record<string, unknown>
    if (!query || typeof query !== 'object') {
      return { valid: false, error: `Query at index ${i} is not an object` }
    }
    if (typeof query.id !== 'string' || !query.id) {
      return { valid: false, error: `Query at index ${i} missing valid id` }
    }
    if (typeof query.name !== 'string') {
      return { valid: false, error: `Query at index ${i} missing name` }
    }
    if (typeof query.sql !== 'string') {
      return { valid: false, error: `Query "${query.name}" missing sql content` }
    }
    // folderId can be null or string
    if (query.folderId !== null && typeof query.folderId !== 'string') {
      return { valid: false, error: `Query "${query.name}" has invalid folderId` }
    }
    // createdAt and updatedAt are required but we'll be lenient about format
    if (typeof query.createdAt !== 'string') {
      return { valid: false, error: `Query "${query.name}" missing createdAt` }
    }
    if (typeof query.updatedAt !== 'string') {
      return { valid: false, error: `Query "${query.name}" missing updatedAt` }
    }
  }

  return { valid: true }
}
```

### File Parsing Function

```typescript
/**
 * Parse and validate an import file (FR18, FR21)
 * Reads file, parses JSON, validates structure
 *
 * @param file - File object from file input
 * @returns Result containing validated ExportData or error message
 */
export async function parseImportFile(file: File): Promise<Result<ExportData>> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const content = reader.result as string
        const data = JSON.parse(content)

        const validation = validateImportData(data)
        if (!validation.valid) {
          resolve({ success: false, error: validation.error! })
          return
        }

        // Cast is safe after validation
        resolve({ success: true, data: data as ExportData })
      } catch (e) {
        if (e instanceof SyntaxError) {
          resolve({ success: false, error: 'Invalid JSON format. Please select a valid export file.' })
        } else {
          resolve({ success: false, error: 'Failed to read file' })
        }
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' })
    }

    reader.readAsText(file)
  })
}
```

### Import Preview Type and Function

```typescript
/**
 * Preview information for import confirmation (AC4)
 * Shows user what they're about to import
 */
export interface ImportPreview {
  folderCount: number
  queryCount: number
  folderNames: string[]  // Root-level folder names for display
  rootQueryCount: number  // Queries not in any folder
}

/**
 * Generate preview summary from validated import data (AC4)
 */
export function getImportPreview(data: ExportData): ImportPreview {
  // Get root-level folder names (parentId === null)
  const rootFolders = data.folders.filter(f => f.parentId === null)
  const folderNames = rootFolders.map(f => f.name)

  // Count queries not in any folder
  const rootQueryCount = data.queries.filter(q => q.folderId === null).length

  return {
    folderCount: data.folders.length,
    queryCount: data.queries.length,
    folderNames,
    rootQueryCount,
  }
}
```

### Import Preview Component

```typescript
// src/popup/components/import-preview.ts

import type { ImportPreview } from '../../shared/services/import-export-service'

export interface ImportPreviewCallbacks {
  onMerge: () => void
  onReplace: () => void
  onCancel: () => void
}

/**
 * Render import preview component (AC4)
 * Shows folder/query counts and action buttons
 */
export function renderImportPreview(
  container: HTMLElement,
  preview: ImportPreview,
  callbacks: ImportPreviewCallbacks
): void {
  container.innerHTML = `
    <div class="import-preview">
      <div class="import-preview__header">
        <h3 class="import-preview__title">Import Preview</h3>
        <button class="import-preview__close js-close" aria-label="Close">&times;</button>
      </div>
      <div class="import-preview__content">
        <div class="import-preview__summary">
          <span class="import-preview__count">${preview.folderCount} folder${preview.folderCount !== 1 ? 's' : ''}</span>
          <span class="import-preview__separator">·</span>
          <span class="import-preview__count">${preview.queryCount} quer${preview.queryCount !== 1 ? 'ies' : 'y'}</span>
        </div>
        ${preview.folderNames.length > 0 ? `
          <div class="import-preview__folders">
            <span class="import-preview__label">Folders:</span>
            <div class="import-preview__folder-list">
              ${preview.folderNames.map(name => `<span class="import-preview__folder-chip">${escapeHtml(name)}</span>`).join('')}
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
        <button class="btn btn--secondary js-cancel">Cancel</button>
        <button class="btn btn--secondary js-replace">Replace All</button>
        <button class="btn btn--primary js-merge">Merge</button>
      </div>
    </div>
  `

  // Wire up callbacks
  container.querySelector('.js-close')?.addEventListener('click', callbacks.onCancel)
  container.querySelector('.js-cancel')?.addEventListener('click', callbacks.onCancel)
  container.querySelector('.js-merge')?.addEventListener('click', callbacks.onMerge)
  container.querySelector('.js-replace')?.addEventListener('click', callbacks.onReplace)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
```

### Import Preview CSS

```css
/* src/popup/components/import-preview.css */

.import-preview {
  background: var(--color-bg);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 320px;
  width: 100%;
}

.import-preview__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.import-preview__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.import-preview__close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.import-preview__close:hover {
  background: var(--color-hover);
}

.import-preview__content {
  padding: var(--space-md);
}

.import-preview__summary {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-md);
}

.import-preview__separator {
  margin: 0 var(--space-sm);
  color: var(--color-text-secondary);
}

.import-preview__label {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: var(--space-xs);
}

.import-preview__folder-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.import-preview__folder-chip {
  background: var(--color-hover);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--color-text);
}

.import-preview__root-queries {
  margin-top: var(--space-sm);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.import-preview__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-top: 1px solid var(--color-border);
}

/* Overlay for modal-like behavior */
.import-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
```

### Popup Import Flow Handler

```typescript
// Add to src/popup/index.ts

import { parseImportFile, getImportPreview, type ExportData, type ImportPreview } from '../shared/services/import-export-service'
import { renderImportPreview } from './components/import-preview'

// State to hold parsed import data while preview is showing
let pendingImportData: ExportData | null = null

/**
 * Handle file input change event (FR18)
 */
async function handleImportFile(file: File): Promise<void> {
  const result = await parseImportFile(file)

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  // Store for merge/replace actions
  pendingImportData = result.data

  // Show preview
  const preview = getImportPreview(result.data)
  showImportPreview(preview)
}

/**
 * Show import preview overlay (AC4)
 */
function showImportPreview(preview: ImportPreview): void {
  // Create overlay container
  const overlay = document.createElement('div')
  overlay.className = 'import-overlay js-import-overlay'

  const previewContainer = document.createElement('div')
  overlay.appendChild(previewContainer)

  renderImportPreview(previewContainer, preview, {
    onMerge: () => {
      // Will be implemented in Story 5-4
      hideImportPreview()
      showToast('Merge not yet implemented', 'info')
    },
    onReplace: () => {
      // Will be implemented in Story 5-5
      hideImportPreview()
      showToast('Replace not yet implemented', 'info')
    },
    onCancel: () => {
      hideImportPreview()
      pendingImportData = null
    },
  })

  document.body.appendChild(overlay)
}

/**
 * Hide import preview overlay
 */
function hideImportPreview(): void {
  const overlay = document.querySelector('.js-import-overlay')
  overlay?.remove()
}

/**
 * Create and manage file input for import (FR18)
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
 * Trigger import file selection (called from menu)
 */
function triggerImportFileSelect(): void {
  const input = document.getElementById('import-file-input') as HTMLInputElement
  input?.click()
}
```

### Menu Integration

The header menu (three-dot menu) needs an "Import" option:

```typescript
// In the menu click handler or menu rendering
const menuItems = [
  { label: 'Export All', action: 'export-all' },
  { label: 'Import', action: 'import' },  // NEW
]

// In the menu action handler
if (action === 'import') {
  triggerImportFileSelect()
}
```

### Error Message Clarity (NFR9)

Per NFR9, "Invalid files rejected with clear message". Error messages should:
1. Be specific about what's wrong
2. Guide user toward a solution
3. Not expose internal details

Examples:
- "Invalid JSON format. Please select a valid export file."
- "Import file missing version field"
- "Query 'My Query' missing sql content"
- "Folder at index 3 missing valid id"

### Project Structure Notes

**Files to Create:**
- `src/popup/components/import-preview.ts`
- `src/popup/components/import-preview.css`

**Files to Modify:**
- `src/shared/services/import-export-service.ts` (add validation, parsing, preview functions)
- `src/shared/services/import-export-service.test.ts` (add validation tests)
- `src/shared/types/message.types.ts` (add IMPORT_VALIDATE if needed, though file reading is popup-side)
- `src/popup/index.ts` (add import flow handlers, menu integration)
- `src/popup/popup.css` (import the import-preview.css)

### Architecture Compliance

From `project-context.md`:

1. **Never throw from services:** Return `Result<T>` objects - parseImportFile uses Result
2. **Message type naming:** UPPER_SNAKE_CASE - not needed for this story (file reading in popup)
3. **File naming:** kebab-case - `import-preview.ts`, `import-preview.css`
4. **CSS class naming:** BEM-inspired - `.import-preview`, `.import-preview__header`
5. **Use `import type` for type-only imports**

### Previous Story Learnings

From Story 5-2 (Export Selected Folder):
1. **ExportData interface already defined** - Reuse for validation target type
2. **Error handling pattern** - Show error toast with specific message from Result.error
3. **Success feedback** - Show counts in toast message with proper plural handling
4. **File operations in popup** - downloadJsonFile pattern; import will use FileReader

From Story 5-1 (Export All):
1. **Toast messaging** - Use existing showToast function for success/error
2. **Service worker pattern** - Can keep file parsing in popup (no need to send file to service worker)

### Performance Notes (NFR4: < 2 seconds for 100 queries)

File parsing is fast:
1. FileReader.readAsText: < 50ms for typical export files (< 1MB)
2. JSON.parse: < 10ms for 100 queries
3. Validation: O(n) through arrays, < 50ms
4. Total: Well under 100ms for typical usage

### Edge Cases

1. **Empty file** - JSON.parse fails, return "Invalid JSON format"
2. **Empty arrays** - Valid! Just no content to import
3. **Very large file** - FileReader handles streaming, should be fine
4. **Non-.json file selected** - Browser may allow, JSON.parse will fail with clear error
5. **File read permission denied** - FileReader.onerror triggered
6. **Duplicate IDs in import** - Not checked in Story 5-3 (handled in 5-4/5-5 merge logic)

### Flow Diagram

```
[User clicks Import in menu]
       |
       v
 Hidden file input triggers
       |
       v
 File picker opens (.json filter)
       |
       v
[User selects file]
       |
       v
 handleImportFile(file)
       |
       v
 parseImportFile(file)
       |
   +---+---+
   |       |
FileReader.readAsText
   |
   v
 JSON.parse(content)
       |
   +---+---+
   |       |
[Error]  [Success]
   |       |
   v       v
Toast  validateImportData(data)
"Invalid    |
 JSON"  +---+---+
        |       |
     [Invalid] [Valid]
        |       |
        v       v
     Toast   getImportPreview(data)
     with       |
     error      v
             showImportPreview()
                |
                v
         Overlay appears
         with preview info
                |
        +---+---+---+
        |   |       |
    Cancel Merge  Replace
        |   |       |
        v   v       v
      Hide  Story  Story
      preview 5-4    5-5
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/prd.md#FR18, FR21, NFR9]
- [Source: _bmad-output/planning-artifacts/architecture.md#Import Validation - Lenient]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 3: First Day Onboarding (Jordan)]
- [Source: _bmad-output/project-context.md#TypeScript Rules, CSS class naming]
- [Source: src/shared/services/import-export-service.ts (ExportData interface)]
- [Source: src/shared/types/storage.types.ts (Query, Folder interfaces)]
- [Source: _bmad-output/implementation-artifacts/5-2-implement-export-selected-folder.md (error handling patterns)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered.

### Completion Notes List

- Implemented validateImportData function with comprehensive validation for ExportData structure
- Added parseImportFile function using FileReader API with proper error handling
- Created ImportPreview type and getImportPreview function for preview data extraction
- Built import-preview component with modal overlay, folder chips, and action buttons
- Added Import icon button to header (upload icon) next to Export button
- Implemented handleImportClick and handleImportFile flow in popup/index.ts
- Added 30 new unit tests for validation, preview, and import button (654 total tests pass)
- Build compiles successfully
- Task 9 (Manual E2E) requires Developer verification

### Change Log

- 2026-01-24: Implemented Story 5-3 Import File Selection & Validation

### File List

**New Files:**
- src/popup/components/import-preview.ts
- src/popup/components/import-preview.css

**Modified Files:**
- src/shared/services/import-export-service.ts (added ValidationResult, ImportPreview, validateImportData, parseImportFile, getImportPreview)
- src/shared/services/import-export-service.test.ts (added 30 new tests for validation and preview)
- src/popup/icons.ts (added upload icon)
- src/popup/components/header.ts (added onImportClick, import button)
- src/popup/components/header.test.ts (added 5 import button tests, updated button count expectations)
- src/popup/index.ts (added import flow handlers, file input setup)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: in-progress → review)
