# Story 5.4: Implement Import Merge Option

Status: done

## Story

As a **user**,
I want **to merge imported queries with my existing library**,
So that **I can add new queries without losing my current ones**. (FR19)

## Acceptance Criteria

1. **Given** import preview is showing **When** I select "Merge with existing" **Then** imported queries and folders are added to my library (FR19)

2. **Given** an imported query has the same name as existing **When** merge completes **Then** both queries are kept (imported one may get "(imported)" suffix)

3. **Given** an imported folder has the same name as existing **When** merge completes **Then** contents are merged into the existing folder

4. **Given** the import operation **When** processing 100 queries **Then** it completes in less than 2 seconds (NFR4)

## Tasks / Subtasks

- [x] Task 1: Implement mergeImportData function in import-export-service.ts (AC: 1, 2, 3)
  - [x] 1.1: Create `mergeImportData(existingData: StorageSchema, importData: ExportData): MergeResult` function signature
  - [x] 1.2: Define `MergeResult` interface: `{ folders: Folder[], queries: Query[], stats: MergeStats }`
  - [x] 1.3: Define `MergeStats` interface: `{ foldersAdded: number, foldersSkipped: number, queriesAdded: number, queriesRenamed: number }`
  - [x] 1.4: Implement folder merging logic:
    - [x] 1.4.1: Build map of existing folder names at each level (keyed by parentId + name)
    - [x] 1.4.2: For each imported folder, check if same-name folder exists at same level
    - [x] 1.4.3: If folder exists: map imported folderId → existing folderId for query/subfolder remapping
    - [x] 1.4.4: If folder doesn't exist: generate new ID, add to result, map old ID → new ID
    - [x] 1.4.5: Handle nested folders recursively (process parent folders first)
  - [x] 1.5: Implement query merging logic:
    - [x] 1.5.1: Build map of existing query names per folder (keyed by folderId + name)
    - [x] 1.5.2: For each imported query, check if same-name query exists in same folder
    - [x] 1.5.3: If name collision: append " (imported)" suffix to imported query name
    - [x] 1.5.4: Generate new query ID using crypto.randomUUID()
    - [x] 1.5.5: Update query's folderId using folder ID mapping from step 1.4
    - [x] 1.5.6: Preserve createdAt, update updatedAt to current timestamp
  - [x] 1.6: Return merged folders array, merged queries array, and stats

- [x] Task 2: Add IMPORT_MERGE message type and handler (AC: 1)
  - [x] 2.1: Add `IMPORT_MERGE` to MessageType in message.types.ts
  - [x] 2.2: Define payload: `{ importData: ExportData }`
  - [x] 2.3: Define response: `Result<MergeStats>`
  - [x] 2.4: Add handler in background/index.ts:
    - [x] 2.4.1: Get current storage data via StorageService
    - [x] 2.4.2: Call mergeImportData with current + import data
    - [x] 2.4.3: Save merged result to storage via StorageService.replaceAll()
    - [x] 2.4.4: Return stats in response

- [x] Task 3: Implement StorageService.replaceAll method (AC: 1)
  - [x] 3.1: Add `replaceAll(data: StorageSchema): Promise<Result<void>>` to storage-service.ts
  - [x] 3.2: Atomically replace both folders and queries arrays in chrome.storage.local
  - [x] 3.3: Return Result with success/error

- [x] Task 4: Wire up Merge button in import-preview component (AC: 1)
  - [x] 4.1: In popup/index.ts, update onMerge callback to call handleMerge()
  - [x] 4.2: Implement `handleMerge()` function:
    - [x] 4.2.1: Send IMPORT_MERGE message to service worker with pendingImportData
    - [x] 4.2.2: Show loading state on Merge button
    - [x] 4.2.3: On success: hide preview, show success toast with stats
    - [x] 4.2.4: On error: show error toast, keep preview open
    - [x] 4.2.5: Refresh tree view with new data

- [x] Task 5: Implement success toast with merge stats (AC: 1, 2)
  - [x] 5.1: Create toast message showing: "Imported X folders and Y queries"
  - [x] 5.2: If any queries renamed, add note: "(Z renamed to avoid duplicates)"

- [x] Task 6: Write unit tests (AC: 1, 2, 3, 4)
  - [x] 6.1: Add tests to import-export-service.test.ts:
    - [x] Test mergeImportData adds new folders correctly
    - [x] Test mergeImportData adds new queries correctly
    - [x] Test mergeImportData maps duplicate folder names to existing folder
    - [x] Test mergeImportData renames duplicate query names with "(imported)" suffix
    - [x] Test mergeImportData handles nested folder mapping correctly
    - [x] Test mergeImportData preserves createdAt from imported queries
    - [x] Test mergeImportData updates updatedAt to current time
    - [x] Test mergeImportData returns correct stats
    - [x] Test mergeImportData handles empty import
    - [x] Test mergeImportData handles empty existing library
  - [x] 6.2: Add tests to storage-service.test.ts:
    - [x] Test replaceAll saves both folders and queries
    - [x] Test replaceAll returns error on storage failure

- [x] Task 7: Performance verification (AC: 4)
  - [x] 7.1: Algorithm uses O(1) Map lookups for folder/query matching
  - [x] 7.2: Level-by-level folder processing ensures correct ID mapping
  - [x] 7.3: Single-pass query processing with Set-based collision detection

- [ ] Task 8: Manual E2E verification (Developer to perform after code review)
  - [ ] 8.1: Import file with unique folders/queries, verify all added
  - [ ] 8.2: Import file with duplicate folder name, verify queries merged into existing folder
  - [ ] 8.3: Import file with duplicate query name in same folder, verify "(imported)" suffix
  - [ ] 8.4: Import file with 100+ queries, verify < 2 second completion
  - [ ] 8.5: Verify success toast shows correct counts
  - [ ] 8.6: Verify tree view refreshes with new content

## Dev Notes

### Merge Strategy Overview

**CRITICAL: This is the core merge algorithm that makes import-with-merge work correctly.**

The merge strategy follows the Architecture's "Lenient" approach:
- Import as much as possible
- Handle duplicates gracefully (don't error, rename/merge)
- Preserve user's existing data integrity

### ID Mapping Strategy

Imported data has its own IDs that may conflict with existing IDs. We must:
1. **Generate new IDs for all imported items** - Never trust imported IDs
2. **Build an ID mapping table** - Maps old imported ID → new generated ID
3. **Remap all references** - Folder parentId and Query folderId must use new IDs

```typescript
// ID Mapping structure
type IdMap = Map<string, string>  // oldId → newId

// Process order is critical:
// 1. Process folders level-by-level (root first, then children)
// 2. Build folder ID map as we go
// 3. Process queries after all folders, using folder ID map
```

### mergeImportData Function Signature

```typescript
// Add to import-export-service.ts

export interface MergeStats {
  foldersAdded: number
  foldersSkipped: number  // Folders that matched existing (merged content instead)
  queriesAdded: number
  queriesRenamed: number  // Queries that needed "(imported)" suffix
}

export interface MergeResult {
  folders: Folder[]
  queries: Query[]
  stats: MergeStats
}

/**
 * Merge imported data with existing library (FR19)
 *
 * Strategy:
 * - Folders with same name at same level → merge contents into existing
 * - Queries with same name in same folder → rename imported with "(imported)" suffix
 * - All imported items get new IDs to prevent conflicts
 * - References (parentId, folderId) are remapped to new IDs
 *
 * @param existing - Current library from storage
 * @param imported - Validated data from import file
 * @returns Merged data ready to save, plus stats for user feedback
 */
export function mergeImportData(
  existing: StorageSchema,
  imported: ExportData
): MergeResult {
  const stats: MergeStats = {
    foldersAdded: 0,
    foldersSkipped: 0,
    queriesAdded: 0,
    queriesRenamed: 0,
  }

  // Start with copies of existing data
  const mergedFolders = [...existing.folders]
  const mergedQueries = [...existing.queries]

  // Map imported IDs to new/existing IDs
  const folderIdMap: Map<string, string> = new Map()

  // Build lookup for existing folder names at each level
  // Key: `${parentId ?? 'root'}:${name.toLowerCase()}` → Folder
  const existingFolderByKey = new Map<string, Folder>()
  for (const folder of existing.folders) {
    const key = `${folder.parentId ?? 'root'}:${folder.name.toLowerCase()}`
    existingFolderByKey.set(key, folder)
  }

  // Process folders level by level (root first, then children)
  // This ensures parent folder IDs are mapped before processing children
  const importedFoldersByParent = groupBy(imported.folders, f => f.parentId ?? 'root')

  function processFolderLevel(parentKey: string, newParentId: string | null): void {
    const foldersAtLevel = importedFoldersByParent.get(parentKey) ?? []

    for (const importedFolder of foldersAtLevel) {
      const lookupKey = `${newParentId ?? 'root'}:${importedFolder.name.toLowerCase()}`
      const existingFolder = existingFolderByKey.get(lookupKey)

      if (existingFolder) {
        // Folder with same name exists at this level → map to existing, don't create new
        folderIdMap.set(importedFolder.id, existingFolder.id)
        stats.foldersSkipped++
      } else {
        // New folder → generate new ID and add
        const newId = crypto.randomUUID()
        folderIdMap.set(importedFolder.id, newId)

        const newFolder: Folder = {
          id: newId,
          name: importedFolder.name,
          parentId: newParentId,
        }
        mergedFolders.push(newFolder)

        // Add to lookup so nested imported folders with same name can find it
        existingFolderByKey.set(lookupKey, newFolder)
        stats.foldersAdded++
      }

      // Process children of this folder
      processFolderLevel(importedFolder.id, folderIdMap.get(importedFolder.id)!)
    }
  }

  // Start with root-level folders
  processFolderLevel('root', null)

  // Build lookup for existing query names in each folder
  // Key: `${folderId ?? 'root'}:${name.toLowerCase()}` → exists
  const existingQueryNames = new Set<string>()
  for (const query of existing.queries) {
    const key = `${query.folderId ?? 'root'}:${query.name.toLowerCase()}`
    existingQueryNames.add(key)
  }

  // Process queries
  const now = new Date().toISOString()
  for (const importedQuery of imported.queries) {
    // Map folderId to new/existing folder ID
    const newFolderId = importedQuery.folderId
      ? folderIdMap.get(importedQuery.folderId) ?? null
      : null

    // Check for name collision
    let queryName = importedQuery.name
    const lookupKey = `${newFolderId ?? 'root'}:${queryName.toLowerCase()}`

    if (existingQueryNames.has(lookupKey)) {
      queryName = `${queryName} (imported)`
      stats.queriesRenamed++
      // Note: In rare case of "(imported)" also colliding, we add anyway
      // This is acceptable per lenient strategy
    }

    const newQuery: Query = {
      id: crypto.randomUUID(),
      name: queryName,
      sql: importedQuery.sql,
      folderId: newFolderId,
      createdAt: importedQuery.createdAt,  // Preserve original creation time
      updatedAt: now,  // Mark as updated now (import is a modification)
    }

    mergedQueries.push(newQuery)
    existingQueryNames.add(`${newFolderId ?? 'root'}:${queryName.toLowerCase()}`)
    stats.queriesAdded++
  }

  return {
    folders: mergedFolders,
    queries: mergedQueries,
    stats,
  }
}

// Helper function
function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const arr = map.get(key) ?? []
    arr.push(item)
    map.set(key, arr)
  }
  return map
}
```

### StorageService.replaceAll Implementation

```typescript
// Add to storage-service.ts

/**
 * Atomically replace entire storage with new data
 * Used for import operations (merge and replace)
 */
async replaceAll(data: StorageSchema): Promise<Result<void>> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.FOLDERS]: data.folders,
      [STORAGE_KEYS.QUERIES]: data.queries,
    })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save data'
    }
  }
}
```

### Message Type Definition

```typescript
// Add to message.types.ts

// In MessageType union:
| { type: 'IMPORT_MERGE'; payload: { importData: ExportData } }

// Response type (already using Result<T> pattern)
// Result<MergeStats>
```

### Service Worker Handler

```typescript
// Add to service-worker.ts message handler

case 'IMPORT_MERGE': {
  const { importData } = message.payload

  // Get current data
  const foldersResult = await StorageService.getFolders()
  const queriesResult = await StorageService.getQueries()

  if (!foldersResult.success || !queriesResult.success) {
    sendResponse({ success: false, error: 'Failed to read current data' })
    return true
  }

  const existing: StorageSchema = {
    folders: foldersResult.data,
    queries: queriesResult.data,
  }

  // Merge data
  const { folders, queries, stats } = mergeImportData(existing, importData)

  // Save merged data
  const saveResult = await StorageService.replaceAll({ folders, queries })

  if (!saveResult.success) {
    sendResponse({ success: false, error: 'Failed to save merged data' })
    return true
  }

  sendResponse({ success: true, data: stats })
  return true
}
```

### Popup Merge Handler

```typescript
// Update in popup/index.ts

async function handleMerge(): Promise<void> {
  if (!pendingImportData) return

  // Show loading state
  const mergeBtn = document.querySelector('.js-merge') as HTMLButtonElement
  if (mergeBtn) {
    mergeBtn.disabled = true
    mergeBtn.textContent = 'Merging...'
  }

  const result = await chrome.runtime.sendMessage({
    type: 'IMPORT_MERGE',
    payload: { importData: pendingImportData }
  })

  if (result.success) {
    hideImportPreview()
    pendingImportData = null

    // Build toast message
    const stats = result.data
    let message = `Imported ${stats.foldersAdded} folder${stats.foldersAdded !== 1 ? 's' : ''} and ${stats.queriesAdded} quer${stats.queriesAdded !== 1 ? 'ies' : 'y'}`
    if (stats.queriesRenamed > 0) {
      message += ` (${stats.queriesRenamed} renamed to avoid duplicates)`
    }
    showToast(message, 'success')

    // Refresh tree view
    await loadAndRenderTree()
  } else {
    showToast(result.error ?? 'Merge failed', 'error')
    // Re-enable button
    if (mergeBtn) {
      mergeBtn.disabled = false
      mergeBtn.textContent = 'Merge'
    }
  }
}
```

### Edge Cases to Handle

1. **Imported folder parentId points to non-existent parent in import**
   - Treat as root folder (parentId = null)

2. **Circular folder references in import**
   - Should be caught by level-by-level processing (orphaned folders become root)

3. **Query folderId points to non-existent folder in import**
   - Place query at root level (folderId = null)

4. **Empty strings for names**
   - Accept them (validation already passed in 5-3)

5. **Very long query names after adding "(imported)"**
   - No max length enforced, allow it

6. **Multiple queries with same name getting "(imported)"**
   - Each gets its own "(imported)" suffix, may result in duplicates in edge cases
   - Acceptable per lenient strategy

### Previous Story (5-3) Learnings Applied

1. **ValidationResult and parseImportFile are ready** - Import preview shows data is valid, we receive ExportData
2. **pendingImportData state exists** - Already storing validated data in popup state for merge/replace
3. **hideImportPreview exists** - Cleanup function ready to use
4. **Toast pattern established** - Use showToast with proper plural handling
5. **File structure** - No new files needed, modifications to existing

### Architecture Compliance

From `project-context.md`:

1. **Never throw from services:** Return `Result<T>` objects - mergeImportData returns MergeResult, service worker returns Result<MergeStats>
2. **Message type naming:** UPPER_SNAKE_CASE - `IMPORT_MERGE`
3. **Return true for async message handlers** - CRITICAL: service worker handler must return true
4. **Use `import type` for type-only imports**

### Performance Notes (NFR4: < 2 seconds for 100 queries)

The algorithm is O(n + m) where:
- n = number of existing items
- m = number of imported items

Operations:
1. Build existing folder lookup: O(n)
2. Process imported folders: O(m)
3. Build existing query name lookup: O(n)
4. Process imported queries: O(m)

With 100 queries and ~20 folders, total operations < 300. Should complete in < 50ms.

### Project Structure Notes

**Files to Modify:**
- `src/shared/services/import-export-service.ts` - Add MergeStats, MergeResult, mergeImportData, groupBy
- `src/shared/services/import-export-service.test.ts` - Add merge tests
- `src/shared/services/storage-service.ts` - Add replaceAll method
- `src/shared/services/storage-service.test.ts` - Add replaceAll tests
- `src/shared/types/message.types.ts` - Add IMPORT_MERGE type
- `src/background/service-worker.ts` - Add IMPORT_MERGE handler
- `src/popup/index.ts` - Update handleMerge implementation

**No new files needed** - All changes are additions to existing files.

### Test Coverage Priority

1. **mergeImportData** - Core algorithm with multiple code paths
2. **StorageService.replaceAll** - Critical storage operation
3. **Integration via message** - Ensure end-to-end flow works

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR19, NFR4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Import Validation - Lenient]
- [Source: _bmad-output/project-context.md#TypeScript Rules, Chrome Extension Rules]
- [Source: _bmad-output/implementation-artifacts/5-3-implement-import-file-selection-validation.md (pendingImportData, ExportData)]
- [Source: src/shared/services/import-export-service.ts (ExportData interface)]
- [Source: src/shared/types/storage.types.ts (Query, Folder, StorageSchema)]
- [Source: src/shared/services/storage-service.ts (existing service pattern)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Implemented mergeImportData function following the exact algorithm specified in Dev Notes
- Used Map-based lookups for O(1) folder/query matching by `parentId:name` key
- Level-by-level folder processing ensures correct ID remapping for nested structures
- Case-insensitive matching for folder and query names (per lenient import strategy)
- Handles edge cases: orphaned folderIds default to root, multiple imports with same name
- MergeStats tracks: foldersAdded, foldersSkipped, queriesAdded, queriesRenamed
- Success toast shows full stats with plural handling
- 20 new unit tests added for mergeImportData covering all merge scenarios
- 4 new unit tests added for replaceAll covering atomic storage replacement
- All 674 tests pass, build succeeds

### Performance Analysis

Algorithm complexity: O(n + m) where n = existing items, m = imported items
- Folder lookup: Map<string, Folder> with `${parentId ?? 'root'}:${name.toLowerCase()}` key
- Query lookup: Set<string> with same key pattern
- No nested loops, single pass for each collection
- Expected performance: < 50ms for 100 queries + 20 folders (well under NFR4 2s limit)

### Change Log

1. src/shared/services/import-export-service.ts - Added MergeStats, MergeResult interfaces, groupBy helper, mergeImportData function
2. src/shared/services/import-export-service.test.ts - Added 20 tests for mergeImportData
3. src/shared/services/storage-service.ts - Added replaceAll method
4. src/shared/services/storage-service.test.ts - Added 4 tests for replaceAll
5. src/shared/types/message.types.ts - Added IMPORT_MERGE message type
6. src/background/index.ts - Added IMPORT_MERGE handler with handleImportMerge async function
7. src/popup/index.ts - Added handleMerge function, wired to onMerge callback

### File List

- src/shared/services/import-export-service.ts (modified)
- src/shared/services/import-export-service.test.ts (modified)
- src/shared/services/storage-service.ts (modified)
- src/shared/services/storage-service.test.ts (modified)
- src/shared/types/message.types.ts (modified)
- src/background/index.ts (modified)
- src/popup/index.ts (modified)

## Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) | **Date:** 2026-01-24 | **Model:** Claude Opus 4.5

### Review Outcome: ✅ APPROVED (with fixes applied)

### Issues Found & Fixed

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | HIGH | Duplicate "(imported)" suffix collision - multiple queries with same name could get identical suffixes | Added incremented suffix logic: `(imported)`, `(imported 2)`, etc. |
| 2 | HIGH | Missing MergeStats type import in test file | Added `type MergeStats` to imports |
| 3 | MEDIUM | Button text capture before null check | Moved `originalText` capture inside null check block |
| 4 | MEDIUM | Task 8 unclear as manual testing | Clarified Task 8 is post-code-review |

### Tests Added

- `should handle multiple collisions with incremented suffix` - verifies "(imported 2)" when "(imported)" exists
- `should handle three imported queries with same name all colliding` - verifies "(imported)", "(imported 2)", "(imported 3)"

### Verification

- All 676 tests pass (2 new tests added)
- Build succeeds
- All ACs validated against implementation

### Notes

- Task 8 (Manual E2E) remains for developer to perform post-review
- Consider adding background handler unit tests in future story (currently covered by integration)
