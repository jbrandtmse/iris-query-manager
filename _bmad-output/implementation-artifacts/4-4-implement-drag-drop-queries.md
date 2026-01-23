# Story 4.4: Implement Drag-Drop for Queries

Status: dev-complete

## Story

As a **user**,
I want **to drag queries between folders**,
So that **I can reorganize my library easily**. (FR14)

## Acceptance Criteria

1. **Given** I start dragging a query **When** I drag over a folder **Then** the folder shows a drop target indicator

2. **Given** I drop a query on a folder **When** the drop completes **Then** the query's folderId updates and it moves to that folder (FR14)

3. **Given** I drop a query on the root area **When** the drop completes **Then** the query's folderId becomes null (moved to root)

4. **Given** drag operation **When** I drag outside valid drop targets **Then** the drag is cancelled with visual feedback

## Tasks / Subtasks

- [x] Task 1: Add MOVE_QUERY message type and update storage service (AC: 2, 3)
  - [x] 1.1: Add `moveQuery(queryId: string, targetFolderId: string | null): Promise<Result<Query>>` function to storage-service.ts
  - [x] 1.2: In `moveQuery`, validate query exists
  - [x] 1.3: In `moveQuery`, validate target folder exists (if not null)
  - [x] 1.4: Update query's `folderId` and `updatedAt`
  - [x] 1.5: Add `MOVE_QUERY` to message.types.ts with payload `{ queryId: string; targetFolderId: string | null }`
  - [x] 1.6: Add message handler in background/index.ts
  - [x] 1.7: Write unit tests for `moveQuery` (success to folder, success to root, query not found, target folder not found)

- [x] Task 2: Add drag-drop data attributes and CSS classes to tree items (AC: 1, 4)
  - [x] 2.1: Add `draggable="true"` attribute to query tree items in tree-item.ts
  - [x] 2.2: Add `data-draggable="query"` attribute to query items
  - [x] 2.3: Add `data-droppable="folder"` attribute to folder items
  - [x] 2.4: Add drop target CSS classes: `.tree-item--drop-target`, `.tree-item--drop-invalid`
  - [x] 2.5: Add drag ghost CSS class: `.tree-item--dragging`

- [x] Task 3: Implement drag events on query tree items (AC: 1)
  - [x] 3.1: Add `ondragstart` handler to query items - set dataTransfer with query ID
  - [x] 3.2: Add `ondragend` handler to clean up drag state
  - [x] 3.3: Set `dataTransfer.effectAllowed = 'move'`
  - [x] 3.4: Add visual feedback class on drag start (`.tree-item--dragging`)
  - [x] 3.5: Store drag data type as 'application/x-query-id'

- [x] Task 4: Implement drop events on folder tree items (AC: 1, 2)
  - [x] 4.1: Add `ondragover` handler to folder items - check if drop is valid, call `e.preventDefault()` to allow drop
  - [x] 4.2: Add `ondragenter` handler - add `.tree-item--drop-target` class
  - [x] 4.3: Add `ondragleave` handler - remove `.tree-item--drop-target` class
  - [x] 4.4: Add `ondrop` handler - extract query ID, send MOVE_QUERY message
  - [x] 4.5: Expand target folder if collapsed when dropping

- [x] Task 5: Implement root drop zone for moving queries to root (AC: 3)
  - [x] 5.1: Add drop zone element to tree-view container (at bottom or as separate area)
  - [x] 5.2: Add `ondragover`, `ondragenter`, `ondragleave`, `ondrop` handlers for root zone
  - [x] 5.3: On drop, send MOVE_QUERY with `targetFolderId: null`
  - [x] 5.4: Style root drop zone with `.tree-view__root-drop-zone` class

- [x] Task 6: Implement drag feedback and invalid drop handling (AC: 4)
  - [x] 6.1: Show `not-allowed` cursor when dragging over invalid targets
  - [x] 6.2: Reset drag state on dragend (remove all drag classes)
  - [x] 6.3: Show toast on successful move: "Moved to: {folderName}" or "Moved to: root"
  - [x] 6.4: Handle move errors with error toast

- [x] Task 7: Wire up popup/index.ts to handle drag-drop state refresh (AC: 2, 3)
  - [x] 7.1: After successful MOVE_QUERY, call `loadQueriesAndFolders()` to refresh tree
  - [x] 7.2: Preserve expanded folders state during refresh
  - [x] 7.3: Re-select moved query after refresh (optional UX improvement)

- [x] Task 8: Write integration tests (AC: 1, 2, 3, 4)
  - [x] 8.1: Test drag start sets correct data transfer
  - [x] 8.2: Test drag over folder shows drop target indicator
  - [x] 8.3: Test drop on folder moves query to folder
  - [x] 8.4: Test drop on root zone moves query to root
  - [x] 8.5: Test drag over non-droppable area shows invalid cursor
  - [x] 8.6: Test drag end cleans up all drag state

- [ ] Task 9: Manual E2E verification (Developer to perform)
  - [ ] 9.1: Drag query from root to folder, verify it moves
  - [ ] 9.2: Drag query from folder to different folder, verify it moves
  - [ ] 9.3: Drag query from folder to root zone, verify it moves to root
  - [ ] 9.4: Drag query, release outside valid drop zone, verify no change
  - [ ] 9.5: Verify visual feedback during drag (ghost, drop target highlight)
  - [ ] 9.6: Verify folder expands when dropping query on collapsed folder

## Dev Notes

### CRITICAL: Follow Existing Patterns

This story adds drag-drop functionality to the existing tree view. Follow the patterns established in Stories 4-1, 4-2, and 4-3.

**Key existing patterns to follow:**

1. **Result objects:** Never throw from services, return `Result<T>`
2. **Message naming:** UPPER_SNAKE_CASE (`MOVE_QUERY`)
3. **Storage updates:** Use `updateQuery` pattern for modifying query's folderId
4. **Tree refresh:** Call `loadQueriesAndFolders()` after state changes

### Architecture Compliance

**From `project-context.md` - MUST follow:**

1. **Never throw from services:** Return `Result<T>` objects
   ```typescript
   export async function moveQuery(
     queryId: string,
     targetFolderId: string | null
   ): Promise<Result<Query>>
   ```

2. **Message type naming:** UPPER_SNAKE_CASE
   - `MOVE_QUERY`

3. **Error messages must be user-friendly:**
   - "Query not found"
   - "Target folder not found"

### Storage Service Extension

**Add to `src/shared/services/storage-service.ts`:**

```typescript
/**
 * Move a query to a different folder (or to root) (Story 4-4: FR14)
 * @param queryId - The ID of the query to move
 * @param targetFolderId - The target folder ID, or null to move to root
 */
export async function moveQuery(
  queryId: string,
  targetFolderId: string | null
): Promise<Result<Query>> {
  // Get current state
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

  const queries = queriesResult.data
  const folders = foldersResult.data

  // Find query
  const queryIndex = queries.findIndex((q) => q.id === queryId)
  if (queryIndex === -1) {
    return { success: false, error: 'Query not found' }
  }

  // Validate target folder exists (if not moving to root)
  if (targetFolderId !== null) {
    const folderExists = folders.some((f) => f.id === targetFolderId)
    if (!folderExists) {
      return { success: false, error: 'Target folder not found' }
    }
  }

  // Skip if already in target location
  if (queries[queryIndex].folderId === targetFolderId) {
    return { success: true, data: queries[queryIndex] }
  }

  // Update query
  const updatedQuery: Query = {
    ...queries[queryIndex],
    folderId: targetFolderId,
    updatedAt: new Date().toISOString(),
  }

  const updatedQueries = [...queries]
  updatedQueries[queryIndex] = updatedQuery

  const setResult = await setInStorage(STORAGE_KEY_QUERIES, updatedQueries)
  if (!setResult.success) {
    return setResult
  }

  return { success: true, data: updatedQuery }
}
```

### Message Types Extension

**Add to `src/shared/types/message.types.ts`:**

```typescript
// Query drag-drop message (Story 4-4)
| { type: 'MOVE_QUERY'; payload: { queryId: string; targetFolderId: string | null } }
```

### Service Worker Handler

**Add to `src/background/index.ts`:**

```typescript
case 'MOVE_QUERY': {
  const { queryId, targetFolderId } = message.payload
  const result = await moveQuery(queryId, targetFolderId)
  sendResponse(result)
  break
}
```

### Tree Item Drag Events Implementation

**Add to query tree items in `src/popup/components/tree-item.ts`:**

```typescript
// Make query items draggable
item.setAttribute('draggable', 'true')
item.setAttribute('data-draggable', 'query')

// Drag start - set data and visual feedback
item.addEventListener('dragstart', (e) => {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('application/x-query-id', query.id)
  e.dataTransfer.effectAllowed = 'move'
  item.classList.add('tree-item--dragging')
})

// Drag end - clean up
item.addEventListener('dragend', () => {
  item.classList.remove('tree-item--dragging')
})
```

### Folder Drop Events Implementation

**Add to folder tree items in `src/popup/components/tree-item.ts`:**

```typescript
// Mark folders as drop targets
item.setAttribute('data-droppable', 'folder')

// Allow drop when dragging over
item.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
})

// Visual feedback on enter
item.addEventListener('dragenter', (e) => {
  e.preventDefault()
  item.classList.add('tree-item--drop-target')
})

// Remove visual feedback on leave
item.addEventListener('dragleave', () => {
  item.classList.remove('tree-item--drop-target')
})

// Handle drop
item.addEventListener('drop', (e) => {
  e.preventDefault()
  item.classList.remove('tree-item--drop-target')

  const queryId = e.dataTransfer?.getData('application/x-query-id')
  if (queryId) {
    // Callback to parent to handle the move
    onQueryDrop?.(queryId, folder.id)
  }
})
```

### CSS Classes for Drag-Drop

**Add to `src/popup/components/tree-item.css`:**

```css
/* Query being dragged */
.tree-item--dragging {
  opacity: 0.5;
}

/* Valid drop target */
.tree-item--drop-target {
  background-color: var(--color-hover);
  outline: 2px dashed var(--color-primary);
  outline-offset: -2px;
}

/* Invalid drop target (optional cursor feedback) */
.tree-item--drop-invalid {
  cursor: not-allowed;
}
```

### Root Drop Zone

**Add to `src/popup/components/tree-view.ts` and `tree-view.css`:**

```typescript
// Create root drop zone at bottom of tree
const rootDropZone = document.createElement('div')
rootDropZone.className = 'tree-view__root-drop-zone'
rootDropZone.textContent = 'Drop here to move to root'
rootDropZone.setAttribute('data-droppable', 'root')

// Add same drag handlers as folder
rootDropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
})

rootDropZone.addEventListener('dragenter', () => {
  rootDropZone.classList.add('tree-view__root-drop-zone--active')
})

rootDropZone.addEventListener('dragleave', () => {
  rootDropZone.classList.remove('tree-view__root-drop-zone--active')
})

rootDropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  rootDropZone.classList.remove('tree-view__root-drop-zone--active')

  const queryId = e.dataTransfer?.getData('application/x-query-id')
  if (queryId) {
    // Move to root (folderId = null)
    onQueryDrop?.(queryId, null)
  }
})
```

```css
.tree-view__root-drop-zone {
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-sm);
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 12px;
  display: none; /* Hidden by default, shown during drag */
}

/* Show when dragging is active */
.tree-view--dragging .tree-view__root-drop-zone {
  display: block;
}

.tree-view__root-drop-zone--active {
  background-color: var(--color-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
```

### TreeViewOptions Extension

**Update `src/popup/components/tree-view.ts` TreeViewOptions:**

```typescript
export interface TreeViewOptions {
  // ... existing options
  onQueryDrop?: (queryId: string, targetFolderId: string | null) => void
}
```

### Popup Handler

**Add to `src/popup/index.ts`:**

```typescript
async function handleQueryDrop(queryId: string, targetFolderId: string | null): Promise<void> {
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
    ? currentFolders.find(f => f.id === targetFolderId)?.name ?? 'folder'
    : 'root'

  showToast(`Moved to: ${folderName}`, 'success')

  // Preserve expanded state and refresh
  const expandedIds = getExpandedFolders()
  await loadQueriesAndFolders()
  setExpandedFolders(expandedIds)

  // Expand target folder if it was collapsed
  if (targetFolderId && !expandedIds.includes(targetFolderId)) {
    toggleFolder(targetFolderId)
  }
}
```

### Previous Story Learnings (4-3)

From Story 4-3 completion notes:

1. **Storage service pattern:** Follow `updateQuery` exactly - get, validate, update, save
2. **Message handler pattern:** Extract payload, call storage function, send response
3. **UI refresh pattern:** Call `loadQueriesAndFolders()` after successful operation
4. **Toast messages:** Use descriptive success messages

### Edge Cases to Handle

1. **Query not found** - Return error (shouldn't happen in normal use)
2. **Target folder not found** - Return error (could happen if folder deleted during drag)
3. **Query already in target folder** - Skip update (no-op)
4. **Drag cancelled** - Clean up drag state, no changes
5. **Drop on query item** - Ignore (queries are not drop targets)
6. **Drop outside tree** - Cancel drag, no changes
7. **Nested folder expansion** - Auto-expand collapsed folder on drop

### Test Cases for storage-service.test.ts

```typescript
describe('moveQuery', () => {
  it('should move query to folder')
  it('should move query to root (null folderId)')
  it('should return error when query not found')
  it('should return error when target folder not found')
  it('should skip update if already in target location')
  it('should update updatedAt timestamp')
})
```

### File Modifications Summary

**Files to MODIFY:**
- `src/shared/services/storage-service.ts` - Add `moveQuery` function
- `src/shared/services/storage-service.test.ts` - Add tests for `moveQuery`
- `src/shared/types/message.types.ts` - Add `MOVE_QUERY` type
- `src/background/index.ts` - Add message handler
- `src/popup/components/tree-item.ts` - Add drag/drop event handlers
- `src/popup/components/tree-item.css` - Add drag/drop CSS classes
- `src/popup/components/tree-view.ts` - Add root drop zone, drag state tracking
- `src/popup/components/tree-view.css` - Add root drop zone styles
- `src/popup/index.ts` - Add `handleQueryDrop`, wire up to tree options

### Flow Diagrams

**Drag-Drop to Folder Flow:**
```
[Drag query starts]
       |
       v
 Set dataTransfer
 Add .tree-item--dragging
       |
       v
[Drag over folder]
       |
       v
 preventDefault()
 Add .tree-item--drop-target
       |
       v
[Drop on folder]
       |
       v
 Get queryId from dataTransfer
 Remove .tree-item--drop-target
       |
       v
 sendToServiceWorker(MOVE_QUERY)
       |
    +--+--+
    |     |
[Success] [Error]
    |     |
    v     v
showToast showToast
refresh   (error)
```

**Drag-Drop to Root Flow:**
```
[Drag query starts]
       |
       v
[Drag over root drop zone]
       |
       v
 preventDefault()
 Add .tree-view__root-drop-zone--active
       |
       v
[Drop on root zone]
       |
       v
 Get queryId from dataTransfer
 Remove active class
       |
       v
 sendToServiceWorker(MOVE_QUERY, { targetFolderId: null })
       |
       v
showToast("Moved to: root")
refresh
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR14]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - Query interface]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Drag-drop reorder pattern]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: src/shared/services/storage-service.ts (existing updateQuery pattern)]
- [Source: src/popup/components/tree-item.ts (existing tree item structure)]
- [Source: src/popup/components/tree-view.ts (existing tree refresh pattern)]
- [Source: _bmad-output/implementation-artifacts/4-3-implement-folder-rename-delete.md (learnings)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered

### Completion Notes List

1. **Storage service `moveQuery` function:** Implemented following existing `updateQuery` pattern - validates query exists, validates target folder exists (if not null), skips update if already in location, updates `folderId` and `updatedAt`.

2. **Message type and handler:** Added `MOVE_QUERY` to message.types.ts and handler in background/index.ts following existing pattern.

3. **Tree item drag events:** Query items now have `draggable="true"`, `data-draggable="query"` attributes. Drag start sets dataTransfer with query ID and adds `.tree-item--dragging` class. Drag end cleans up class.

4. **Folder drop events:** Folder items have `data-droppable="folder"` attribute. Drop events handle visual feedback (`.tree-item--drop-target` class) and call `onQueryDrop` callback. Auto-expands collapsed folder on drop.

5. **Root drop zone:** Added `.tree-view__root-drop-zone` element that appears during drag (controlled by `.tree-view--dragging` class). Handles drop to move query to root (folderId = null).

6. **Popup handler:** `handleQueryDrop` sends `MOVE_QUERY` message, shows success/error toast, preserves expanded folder state during refresh, and auto-expands target folder.

7. **Tests:** Added 25 new tests:
   - 7 tests for `moveQuery` in storage-service.test.ts
   - 8 tests for query drag events in tree-item.test.ts
   - 10 tests for root drop zone and tree drag state in tree-view.test.ts

8. **All 545 tests pass** after implementation.

### Senior Developer Review (AI)

**Reviewed:** 2026-01-23 by Claude Opus 4.5

**Review Outcome:** ✅ APPROVED with fixes applied

**Issues Found and Fixed:**

1. **[M1] Unused `isDragging` variable** - Removed redundant module-level variable that duplicated CSS class state tracking in `tree-view.ts`

2. **[M2] Missing drag data validation** - Added validation that `queryId` is a non-empty string before processing drop events in both `tree-item.ts` and `tree-view.ts` to prevent garbage data from external drags

3. **[M3] Dragleave flickering on child elements** - Implemented `dragEnterCount` tracking pattern to prevent visual flickering when dragging over child elements (icon, name span). The class is only removed when the counter reaches zero, not on every dragleave event.

**Tests Added:** 1 new test for M3 fix (total: 546 tests passing)

**Files Modified During Review:**
- `src/popup/components/tree-view.ts` - M1, M2, M3 fixes
- `src/popup/components/tree-item.ts` - M2, M3 fixes
- `src/popup/components/tree-item.test.ts` - Updated tests for M3
- `src/popup/components/tree-view.test.ts` - Updated tests for M3

### File List

**Modified files:**
- `src/shared/services/storage-service.ts` - Added `moveQuery` function
- `src/shared/services/storage-service.test.ts` - Added 7 tests for `moveQuery`
- `src/shared/types/message.types.ts` - Added `MOVE_QUERY` message type
- `src/background/index.ts` - Added MOVE_QUERY message handler
- `src/popup/components/tree-item.ts` - Added drag/drop handlers, QueryDropHandler type, updated interfaces
- `src/popup/components/tree-item.css` - Added drag-drop CSS classes
- `src/popup/components/tree-item.test.ts` - Added 15 drag-drop tests
- `src/popup/components/tree-view.ts` - Added root drop zone, drag state tracking, QueryDropHandler import
- `src/popup/components/tree-view.css` - Added root drop zone styles
- `src/popup/components/tree-view.test.ts` - Added 10 drag-drop tests
- `src/popup/index.ts` - Added `handleQueryDrop`, wired up `onQueryDrop` to tree options
