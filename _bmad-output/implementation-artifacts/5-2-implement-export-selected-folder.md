# Story 5.2: Implement Export Selected Folder

Status: done

## Story

As a **user**,
I want **to export a specific folder and its contents**,
So that **I can share curated query packs with colleagues**. (FR17)

## Acceptance Criteria

1. **Given** I right-click on a folder **When** I select "Export" **Then** a JSON file downloads containing that folder and its queries (FR17)

2. **Given** a folder with nested subfolders **When** I export it **Then** all descendants (subfolders and their queries) are included

3. **Given** the export file **When** downloaded **Then** filename includes the folder name

## Tasks / Subtasks

- [x] Task 1: Add exportFolder function to import-export-service.ts (AC: 1, 2)
  - [x] 1.1: Create `exportFolder(folderId: string): Promise<Result<ExportData>>` function
  - [x] 1.2: Retrieve the target folder by ID (return error if not found)
  - [x] 1.3: Implement `getDescendantFolderIds(folderId, folders)` helper to recursively find all subfolder IDs
  - [x] 1.4: Collect all descendant folders (target + all subfolders at any depth)
  - [x] 1.5: Collect all queries that belong to any of the collected folder IDs
  - [x] 1.6: Return ExportData with version, exportedAt, folders array, and queries array
  - [x] 1.7: Include the root exported folder's parentId as null in the export (so import can place it at root)

- [x] Task 2: Add generateFolderExportFilename function to file-utils.ts (AC: 3)
  - [x] 2.1: Create `generateFolderExportFilename(folderName: string): string`
  - [x] 2.2: Sanitize folder name (remove special chars that could cause file system issues)
  - [x] 2.3: Format: `query-manager-{sanitized-folder-name}-YYYY-MM-DD.json`

- [x] Task 3: Add EXPORT_FOLDER message type and handler (AC: 1)
  - [x] 3.1: Add `EXPORT_FOLDER` message type to `src/shared/types/message.types.ts` with `{ folderId: string }` payload
  - [x] 3.2: Add handler in `src/background/index.ts` that calls `exportFolder(payload.folderId)`
  - [x] 3.3: Return full export data to popup for download trigger

- [x] Task 4: Add "Export" option to folder context menu (AC: 1)
  - [x] 4.1: Modify context menu items array when showing for folders (in tree-view.ts or popup/index.ts)
  - [x] 4.2: Add `{ label: 'Export', action: 'export' }` item to folder context menu
  - [x] 4.3: Position after "New Subfolder" and before "Rename"

- [x] Task 5: Implement export flow handler in popup (AC: 1, 2, 3)
  - [x] 5.1: Add `handleExportFolder(folderId: string, folderName: string)` function to `src/popup/index.ts`
  - [x] 5.2: Send EXPORT_FOLDER message to service worker with folderId
  - [x] 5.3: On success, call `downloadJsonFile()` with `generateFolderExportFilename(folderName)`
  - [x] 5.4: Show success toast: "Exported folder with X queries"
  - [x] 5.5: Show error toast on failure
  - [x] 5.6: Wire context menu action='export' to call handleExportFolder

- [x] Task 6: Write unit tests (AC: 1, 2, 3)
  - [x] 6.1: Add tests to `src/shared/services/import-export-service.test.ts`:
    - [x] Test exportFolder returns target folder and its queries
    - [x] Test exportFolder includes all descendant subfolders recursively
    - [x] Test exportFolder includes queries from all descendant folders
    - [x] Test exportFolder returns error for non-existent folder ID
    - [x] Test exportFolder handles empty folder (no queries, no subfolders)
    - [x] Test exportFolder sets exported folder's parentId to null (root in export)
  - [x] 6.2: Add tests to `src/shared/utils/file-utils.test.ts`:
    - [x] Test generateFolderExportFilename includes folder name
    - [x] Test generateFolderExportFilename includes date
    - [x] Test generateFolderExportFilename sanitizes special characters

- [x] Task 7: Manual E2E verification (Developer to perform)
  - [x] 7.1: Right-click folder with queries, select Export, verify file downloads
  - [x] 7.2: Open JSON, verify folder and queries are included
  - [x] 7.3: Export folder with nested subfolders, verify all descendants included
  - [x] 7.4: Verify filename format includes folder name and date
  - [x] 7.5: Export empty folder, verify valid JSON with empty queries array
  - [x] 7.6: Verify success toast displays with query count

## Dev Notes

### Export Folder Function

**CRITICAL: Must recursively collect all descendant folders and their queries**

```typescript
// src/shared/services/import-export-service.ts

/**
 * Get all descendant folder IDs recursively
 * Used for collecting all subfolders at any nesting depth
 */
function getDescendantFolderIds(folderId: string, folders: Folder[]): string[] {
  const descendants: string[] = []
  const directChildren = folders.filter((f) => f.parentId === folderId)

  for (const child of directChildren) {
    descendants.push(child.id)
    descendants.push(...getDescendantFolderIds(child.id, folders))
  }

  return descendants
}

/**
 * Export a specific folder with all its contents (FR17)
 * Includes all descendant subfolders and their queries at any depth
 *
 * @param folderId - The folder ID to export
 * @returns Result containing ExportData or error message
 */
export async function exportFolder(folderId: string): Promise<Result<ExportData>> {
  const [queriesResult, foldersResult] = await Promise.all([
    getQueries(),
    getFolders(),
  ])

  if (!queriesResult.success) {
    return queriesResult
  }
  if (!foldersResult.success) {
    return foldersResult
  }

  const allFolders = foldersResult.data
  const allQueries = queriesResult.data

  // Find the target folder
  const targetFolder = allFolders.find((f) => f.id === folderId)
  if (!targetFolder) {
    return { success: false, error: 'Folder not found' }
  }

  // Get all descendant folder IDs
  const descendantIds = getDescendantFolderIds(folderId, allFolders)
  const allFolderIds = [folderId, ...descendantIds]

  // Collect all folders (target + descendants)
  // Important: Set the root folder's parentId to null for clean import
  const exportFolders = allFolders
    .filter((f) => allFolderIds.includes(f.id))
    .map((f) => {
      if (f.id === folderId) {
        return { ...f, parentId: null } // Root folder in export
      }
      return f
    })

  // Collect all queries in any of these folders
  const exportQueries = allQueries.filter((q) =>
    q.folderId !== null && allFolderIds.includes(q.folderId)
  )

  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    folders: exportFolders,
    queries: exportQueries,
  }

  return { success: true, data: exportData }
}
```

### Folder Export Filename Utility

```typescript
// Add to src/shared/utils/file-utils.ts

/**
 * Sanitize folder name for use in filename
 * Removes/replaces characters that could cause file system issues
 */
function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[<>:"/\\|?*]/g, '') // Remove forbidden file chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '')         // Trim leading/trailing hyphens
    .substring(0, 50)              // Limit length
}

/**
 * Generate export filename for a specific folder (AC3)
 * Format: query-manager-{folder-name}-YYYY-MM-DD.json
 *
 * @param folderName - The folder name to include in filename
 * @returns Formatted filename string
 */
export function generateFolderExportFilename(folderName: string): string {
  const sanitized = sanitizeFolderName(folderName)
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `query-manager-${sanitized}-${date}.json`
}
```

### Message Type Addition

```typescript
// Add to src/shared/types/message.types.ts
| { type: 'EXPORT_FOLDER'; payload: { folderId: string } }

// Response type will be MessageResult<ExportData>
```

### Service Worker Handler

```typescript
// Add to src/background/index.ts
case 'EXPORT_FOLDER': {
  const { folderId } = message.payload as { folderId: string }
  const result = await exportFolder(folderId)
  sendResponse(result)
  break
}
```

### Context Menu Integration

The folder context menu currently shows: "New Subfolder", "Rename", "Delete"

Add "Export" between "New Subfolder" and "Rename":

```typescript
// In the folder context menu items (wherever constructed)
const folderMenuItems: ContextMenuItem[] = [
  { label: 'New Subfolder', action: 'new-subfolder' },
  { label: 'Export', action: 'export' },  // NEW
  { label: 'Rename', action: 'rename' },
  { label: 'Delete', action: 'delete', danger: true },
]
```

### Popup Export Handler

```typescript
// Add to src/popup/index.ts
import { downloadJsonFile, generateFolderExportFilename } from '../shared/utils/file-utils'
import type { ExportData } from '../shared/services/import-export-service'

/**
 * Handle exporting a specific folder and its contents (FR17)
 */
async function handleExportFolder(folderId: string, folderName: string): Promise<void> {
  const result = await sendToServiceWorker<ExportData>({
    type: 'EXPORT_FOLDER',
    payload: { folderId }
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  try {
    const data = result.data
    const filename = generateFolderExportFilename(folderName)

    downloadJsonFile(data, filename)

    const queryCount = data.queries.length
    const label = queryCount === 1 ? 'query' : 'queries'
    showToast(`Exported folder with ${queryCount} ${label}`, 'success')
  } catch (err) {
    showToast('Failed to download file', 'error')
  }
}
```

### Wire Context Menu Action

```typescript
// In context menu onSelect handler for folders
if (action === 'export') {
  handleExportFolder(folderId, folderName)
}
```

### Test Cases for import-export-service.test.ts

```typescript
describe('exportFolder', () => {
  it('should export target folder and its direct queries')
  it('should include all descendant subfolders recursively')
  it('should include queries from all descendant folders')
  it('should return error for non-existent folder ID')
  it('should handle empty folder (no queries, no subfolders)')
  it('should set exported root folder parentId to null')
  it('should include version and exportedAt metadata')
})
```

### Test Cases for file-utils.test.ts

```typescript
describe('generateFolderExportFilename', () => {
  it('should include folder name in filename')
  it('should include date in YYYY-MM-DD format')
  it('should sanitize special characters from folder name')
  it('should replace spaces with hyphens')
  it('should handle empty folder name')
  it('should limit filename length')
})
```

### Edge Cases

1. **Empty folder** - Export works, JSON has folder but empty queries array
2. **Deeply nested folders** - Recursion must handle arbitrary depth
3. **Folder name with special characters** - Sanitize for valid filename (e.g., "Dev/Test" → "devtest")
4. **Folder name with only special characters** - Handle gracefully (fallback to "folder")
5. **Large folder tree** - Should still complete < 1 second per NFR5

### Architecture Compliance

**From `project-context.md`:**

1. **Never throw from services:** Return `Result<T>` objects - `exportFolder` uses Result
2. **Message type naming:** UPPER_SNAKE_CASE (`EXPORT_FOLDER`)
3. **Return `true` in async message handlers** - Must add in service worker
4. **File naming:** kebab-case - `import-export-service.ts`, `file-utils.ts`
5. **Import order:** Chrome APIs → Third-party → Shared modules → Local modules
6. **Use `import type` for type-only imports**

### Previous Story Learnings

From Story 5-1 (Export All):

1. **ExportData interface:** Already defined with version, exportedAt, folders[], queries[] - reuse exactly
2. **downloadJsonFile utility:** Already exists and works - reuse for download
3. **Message pattern:** EXPORT_ALL pattern established, follow same structure
4. **Toast feedback:** Show query count in success toast with proper plural handling
5. **Error handling:** Wrap downloadJsonFile in try/catch for edge cases

From Stories 4-4, 4-5 (Drag-Drop):

1. **Recursive folder operations:** isDescendantOf helper pattern useful - similar approach for getDescendantFolderIds
2. **Result object pattern:** All async operations return Result<T>

### Files to Create

None - all new code goes in existing files

### Files to Modify

| File | Changes |
|------|---------|
| `src/shared/services/import-export-service.ts` | Add `getDescendantFolderIds` helper, add `exportFolder` function |
| `src/shared/services/import-export-service.test.ts` | Add exportFolder tests |
| `src/shared/utils/file-utils.ts` | Add `sanitizeFolderName` helper, add `generateFolderExportFilename` |
| `src/shared/utils/file-utils.test.ts` | Add generateFolderExportFilename tests |
| `src/shared/types/message.types.ts` | Add `EXPORT_FOLDER` message type |
| `src/background/index.ts` | Add `EXPORT_FOLDER` handler |
| `src/popup/index.ts` | Add `handleExportFolder` function |
| `src/popup/components/tree-view.ts` or context menu handler | Add "Export" menu item for folders |

### Flow Diagram

```
[User right-clicks folder]
       |
       v
 Context Menu appears with "Export"
       |
       v
 User clicks "Export"
       |
       v
 handleExportFolder(folderId, folderName)
       |
       v
 sendToServiceWorker({ type: 'EXPORT_FOLDER', payload: { folderId } })
       |
       v
 Service Worker receives message
       |
       v
 exportFolder(folderId) in import-export-service
       |
   +---+---+
   |       |
getQueries() getFolders()
   |       |
   +---+---+
       |
       v
 Find target folder
       |
       v
 getDescendantFolderIds() - recursive
       |
       v
 Filter folders and queries by collected IDs
       |
       v
 Create ExportData (version, exportedAt, folders, queries)
       |
       v
 Return Result<ExportData> to popup
       |
       v
 generateFolderExportFilename(folderName)
       |
       v
 downloadJsonFile(data, filename)
       |
       v
 Blob → anchor.click() → file downloads
       |
       v
 showToast("Exported folder with X queries")
```

### Performance Notes (NFR5: < 1 second)

The export operation is simple even with recursion:
1. Two storage reads (< 50ms each)
2. Recursive folder traversal (O(n) where n = total folders, typically < 100)
3. Filter operations (< 10ms)
4. JSON serialization (< 10ms)
5. Blob creation (< 10ms)

Total should be well under 100ms for typical usage.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: _bmad-output/planning-artifacts/prd.md#FR17]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - StorageSchema]
- [Source: _bmad-output/planning-artifacts/architecture.md#Import/Export Service location]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: _bmad-output/implementation-artifacts/5-1-implement-export-all-functionality.md (ExportData interface, downloadJsonFile pattern)]
- [Source: src/shared/services/import-export-service.ts (exportAll pattern)]
- [Source: src/shared/utils/file-utils.ts (generateExportFilename, downloadJsonFile)]
- [Source: src/popup/components/context-menu.ts (ContextMenuItem interface)]
- [Source: src/shared/services/storage-service.ts (getQueries, getFolders, isDescendantOf pattern)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Implemented `exportFolder()` function with `getDescendantFolderIds()` helper in `import-export-service.ts`. Uses recursive traversal to collect all descendant folders and their queries. Sets exported root folder's parentId to null for clean import.
- Task 2: Implemented `generateFolderExportFilename()` with `sanitizeFolderName()` helper in `file-utils.ts`. Sanitizes folder names by removing forbidden file characters, converting spaces to hyphens, collapsing multiple hyphens, and limiting length to 50 chars.
- Task 3: Added `EXPORT_FOLDER` message type to `message.types.ts` and handler in `src/background/index.ts`.
- Task 4: Added "Export" option to folder context menu in `popup/index.ts`, positioned between "New Subfolder" and "Rename".
- Task 5: Implemented `handleExportFolder()` function in popup with proper toast messaging (singular/plural query handling).
- Task 6: Added 7 tests for `exportFolder` in `import-export-service.test.ts` and 8 tests for `generateFolderExportFilename` in `file-utils.test.ts`. Also added 7 tests for the popup flow in `index.test.ts`.

### File List

- `src/shared/services/import-export-service.ts` (modified)
- `src/shared/services/import-export-service.test.ts` (modified)
- `src/shared/utils/file-utils.ts` (modified)
- `src/shared/utils/file-utils.test.ts` (modified)
- `src/shared/types/message.types.ts` (modified)
- `src/background/index.ts` (modified)
- `src/popup/index.ts` (modified)
- `src/popup/index.test.ts` (modified)

## Change Log

- 2026-01-24: Story 5-2 created by SM agent with comprehensive context for developer implementation
- 2026-01-24: Implementation complete - All automated tests passing (610 total). Tasks 1-6 completed. Task 7 (manual E2E verification) requires developer to perform in Chrome.
- 2026-01-24: Manual E2E verification completed by developer. All acceptance criteria verified. Story ready for review.
- 2026-01-24: Code review complete. Fixed 3 MEDIUM issues (exported getDescendantFolderIds helper, improved popup tests to verify downloadJsonFile calls) and 2 LOW issues (prefix verification in test, story file tracked in git). Tests: 619 passing.
