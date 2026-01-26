# Story 6.4: Implement Warning Modal Actions

Status: done

## Story

As a **user**,
I want **to confirm or cancel pasting from the warning modal**,
So that **I can proceed safely or abort when pasting destructive queries** (FR25).

## Acceptance Criteria

1. **Given** the warning modal is displayed **When** I click "Cancel" **Then** the modal closes and no paste occurs (FR25)

2. **Given** the warning modal is displayed **When** I click "Paste Anyway" **Then** the query is pasted to SMP and modal closes (FR25)

3. **Given** keyboard interaction **When** I press Escape **Then** it acts as Cancel (modal closes, no paste)

4. **Given** the modal buttons **When** displayed **Then** "Cancel" is primary (left) and "Paste Anyway" is secondary (right)

5. **Given** a successful paste after modal confirmation **When** the operation completes **Then** a success toast appears confirming the paste

## Tasks / Subtasks

- [x] Task 1: Integrate warning modal into paste flow in popup/index.ts (AC: 1, 2, 3, 4, 5)
  - [x] 1.1: Import `showWarningModal`, `hideWarningModal` from `./components/warning-modal`
  - [x] 1.2: Import `detectDestructiveKeywords` from `../../shared/services/sql-detection-service`
  - [x] 1.3: Modify `handleQueryActivate()` to use new warning modal:
    - Call `detectDestructiveKeywords(query.sql)` to check for destructive keywords
    - If `isDestructive === true`, show warning modal instead of `window.confirm()`
    - Pass `onConfirm` callback that executes paste and shows toast
    - Pass `onCancel` callback that just hides modal (no paste)
  - [x] 1.4: Remove the current `checkSqlSafety` and `getDangerousSqlWarning` usage (replaced by new modal)
  - [x] 1.5: Ensure modal buttons are correctly ordered per AC4 (Cancel left, Paste Anyway right)

- [x] Task 2: Update context menu paste action (AC: 1, 2, 3, 4, 5)
  - [x] 2.1: Ensure context menu "Paste" action also triggers warning modal flow
  - [x] 2.2: Both click and context menu paste should use same `handleQueryActivate()` function

- [x] Task 3: Write integration tests for warning modal in paste flow (AC: 1, 2, 3, 4, 5)
  - [x] 3.1: Add test: destructive query shows warning modal before paste
  - [x] 3.2: Add test: clicking Cancel closes modal without paste
  - [x] 3.3: Add test: clicking Paste Anyway pastes and shows success toast
  - [x] 3.4: Add test: pressing Escape closes modal without paste
  - [x] 3.5: Add test: safe SELECT query pastes directly without modal
  - [x] 3.6: Add test: modal shows correct header for danger vs caution severity

- [x] Task 4: Remove deprecated sql-utils.ts file (cleanup)
  - [x] 4.1: Verify `checkSqlSafety` and `getDangerousSqlWarning` are no longer used
  - [x] 4.2: Remove imports from popup/index.ts
  - [x] 4.3: Delete `src/shared/utils/sql-utils.ts` if no other consumers
  - [x] 4.4: Delete `src/shared/utils/sql-utils.test.ts` if exists

## Dev Notes

### Architecture Context

This is the **final story in Epic 6: Safety & Destructive Query Warnings**. It integrates the warning modal (Story 6-3) into the paste flow, replacing the current `window.confirm()` approach with the proper styled modal.

**Component Dependencies:**
- `sql-detection-service.ts` (Story 6-1) - Provides `detectDestructiveKeywords()` function
- `warning-badge.ts` (Story 6-2) - Already integrated in tree items
- `warning-modal.ts` (Story 6-3) - Provides `showWarningModal()` and `hideWarningModal()`
- `popup/index.ts` - Main popup entry point, contains `handleQueryActivate()`

### Current Implementation to Replace

The current `handleQueryActivate()` in `popup/index.ts` (lines 390-425) uses:

```typescript
import { checkSqlSafety, getDangerousSqlWarning } from '../shared/utils/sql-utils'

// Current implementation (lines 401-409):
const safetyCheck = checkSqlSafety(query.sql)

if (safetyCheck.isDangerous) {
  const warning = getDangerousSqlWarning(safetyCheck.keyword!)
  const confirmed = window.confirm(warning)
  if (!confirmed) {
    return // User cancelled
  }
}
```

This should be replaced with:

```typescript
import { detectDestructiveKeywords } from '../shared/services/sql-detection-service'
import { showWarningModal, hideWarningModal } from './components/warning-modal'

// New implementation:
const detection = detectDestructiveKeywords(query.sql)

if (detection.isDestructive) {
  showWarningModal({
    queryName: query.name,
    sql: query.sql,
    detection,
    onConfirm: async () => {
      hideWarningModal()
      await executePaste(query)
    },
    onCancel: () => {
      hideWarningModal()
    },
  })
  return // Wait for modal interaction
}

// If not destructive, paste immediately
await executePaste(query)
```

### Helper Function Pattern

Extract paste logic into reusable helper:

```typescript
/**
 * Execute paste operation and show feedback
 * Called after safety check passes or user confirms in modal
 */
async function executePaste(query: Query): Promise<void> {
  const result = await sendToServiceWorker<null>({
    type: 'PASTE_QUERY',
    payload: { sql: query.sql },
  })

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  showToast(`Pasted: ${query.name}`, 'success')
}
```

### Warning Modal Integration

From Story 6-3, the warning modal is already fully implemented with:
- `showWarningModal(options)` - Displays the modal
- `hideWarningModal()` - Closes and removes the modal
- Focus trap and Escape key handling
- Cancel button focused by default (safer option)
- Correct button order: Cancel (primary/left) and Paste Anyway (secondary/right)

### Files to Modify

1. **`src/popup/index.ts`** - Main integration point:
   - Add imports for `showWarningModal`, `hideWarningModal`, `detectDestructiveKeywords`
   - Remove imports for `checkSqlSafety`, `getDangerousSqlWarning`
   - Modify `handleQueryActivate()` to use modal flow
   - Extract `executePaste()` helper function

2. **`src/popup/index.test.ts`** - Add integration tests:
   - Test modal appears for destructive queries
   - Test cancel behavior
   - Test confirm behavior
   - Test escape key behavior
   - Test safe queries bypass modal

### Files to Remove (Cleanup)

After verifying no other consumers:
- `src/shared/utils/sql-utils.ts` - Replaced by `sql-detection-service.ts`
- `src/shared/utils/sql-utils.test.ts` - Tests for deprecated file

### Previous Story Learnings (from 6-1, 6-2, 6-3)

1. **Type exports** - Import types directly from source (no barrel exports)
2. **Result objects** - All async service calls return `{ success, data/error }`
3. **Test co-location** - Place tests next to source files
4. **Module state** - Warning modal uses module-level variables for singleton pattern
5. **Focus management** - Modal traps focus and restores on close
6. **Callback pattern** - Use `onConfirm` and `onCancel` callbacks for modal actions

### Architecture Compliance

From `project-context.md`:

1. **Never throw from services** - Use Result objects for all async operations
2. **File naming** - kebab-case for all files
3. **Type imports** - Use `import type` syntax for type-only imports
4. **Chrome message pattern** - Return `true` from async message handlers
5. **CSS BEM naming** - `.warning-modal`, `.warning-modal__btn--cancel`

### Test Strategy

Integration tests in `popup/index.test.ts` should mock:
- `sendToServiceWorker` - Mock service worker responses
- `showWarningModal` / `hideWarningModal` - Verify called with correct args
- `showToast` - Verify success/error feedback

```typescript
// Example test structure
describe('handleQueryActivate with warning modal', () => {
  it('shows warning modal for DELETE query', async () => {
    const query = { id: '1', name: 'Clear Users', sql: 'DELETE FROM users', ... }

    // Trigger activation
    await handleQueryActivate(query)

    // Verify modal was shown with correct options
    expect(showWarningModal).toHaveBeenCalledWith(
      expect.objectContaining({
        queryName: 'Clear Users',
        sql: 'DELETE FROM users',
        detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      })
    )
  })

  it('pastes and shows toast when user confirms', async () => {
    const query = { id: '1', name: 'Clear Users', sql: 'DELETE FROM users', ... }

    // Capture onConfirm callback
    let capturedOnConfirm: (() => void) | undefined
    vi.mocked(showWarningModal).mockImplementation((options) => {
      capturedOnConfirm = options.onConfirm
    })

    await handleQueryActivate(query)

    // Simulate user clicking Paste Anyway
    capturedOnConfirm?.()

    // Verify paste was executed
    expect(sendToServiceWorker).toHaveBeenCalledWith({
      type: 'PASTE_QUERY',
      payload: { sql: 'DELETE FROM users' },
    })
    expect(showToast).toHaveBeenCalledWith('Pasted: Clear Users', 'success')
  })

  it('does not paste when user cancels', async () => {
    const query = { id: '1', name: 'Clear Users', sql: 'DELETE FROM users', ... }

    let capturedOnCancel: (() => void) | undefined
    vi.mocked(showWarningModal).mockImplementation((options) => {
      capturedOnCancel = options.onCancel
    })

    await handleQueryActivate(query)
    capturedOnCancel?.()

    expect(sendToServiceWorker).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PASTE_QUERY' })
    )
  })

  it('bypasses modal for safe SELECT query', async () => {
    const query = { id: '2', name: 'Get Users', sql: 'SELECT * FROM users', ... }

    await handleQueryActivate(query)

    // Modal should not be shown
    expect(showWarningModal).not.toHaveBeenCalled()

    // Paste should happen directly
    expect(sendToServiceWorker).toHaveBeenCalledWith({
      type: 'PASTE_QUERY',
      payload: { sql: 'SELECT * FROM users' },
    })
  })
})
```

### Performance Notes

- SQL detection is O(n) but typically < 1ms for normal queries
- Modal creation is synchronous DOM manipulation
- No additional async operations beyond existing paste flow

### Project Structure Notes

**Alignment with unified project structure:**
- All modifications in `src/popup/` (correct location)
- Uses existing component patterns from warning-modal.ts
- Tests co-located with source files

**No conflicts detected with existing code.**

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR25]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Warning Modal]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules]
- [Source: _bmad-output/project-context.md#Chrome Extension Rules]
- [Source: _bmad-output/implementation-artifacts/6-1-implement-sql-detection-service.md]
- [Source: _bmad-output/implementation-artifacts/6-2-implement-warning-badge-component.md]
- [Source: _bmad-output/implementation-artifacts/6-3-implement-warning-modal-component.md]
- [Source: src/popup/index.ts]
- [Source: src/popup/components/warning-modal.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered

### Completion Notes List

- **Task 1**: Integrated warning modal into `handleQueryActivate()` in `popup/index.ts`. Replaced `checkSqlSafety`/`getDangerousSqlWarning` with `detectDestructiveKeywords` from the new sql-detection-service. Added `executePaste()` helper function to extract paste logic. Modal displays for destructive queries (DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT) with appropriate severity levels.

- **Task 2**: Context menu "Paste" action already used `handleQueryActivate()` function (line 494-495), so the warning modal flow was automatically inherited. No changes needed.

- **Task 3**: Added comprehensive integration tests in `popup/index.test.ts` covering all ACs:
  - AC1: Modal displays for destructive queries (DELETE, DROP, UPDATE)
  - AC1: Cancel closes modal without paste
  - AC2: Confirm pastes query and shows success toast
  - AC3: Escape key handled via onCancel callback
  - AC5: Safe SELECT queries bypass modal and paste directly
  - Total: 10 new Story 6-4 specific tests added

- **Task 4**: Removed deprecated sql-utils.ts and its test file. Verified no other consumers existed. Updated test mocks from `checkSqlSafety` to `detectDestructiveKeywords`.

### File List

**Modified:**
- `src/popup/index.ts` - Replaced sql-utils imports with sql-detection-service and warning-modal; refactored `handleQueryActivate()` to use modal
- `src/popup/index.test.ts` - Updated mocks and added Story 6-4 test suite (10 new tests)
- `src/popup/components/warning-modal.ts` - Updated `onConfirm` type signature to support async callbacks

**Deleted:**
- `src/shared/utils/sql-utils.ts` - Replaced by sql-detection-service.ts
- `src/shared/utils/sql-utils.test.ts` - Tests for deleted file

### Change Log

- 2026-01-25: Story 6-4 implementation complete. Integrated warning modal into paste flow, replaced deprecated sql-utils with sql-detection-service, added 10 integration tests. All 805 tests pass.
- 2026-01-25: Code review fixes applied:
  - Removed redundant `hideWarningModal()` calls from `onConfirm` and `onCancel` callbacks (modal handles its own cleanup)
  - Updated `WarningModalOptions.onConfirm` type to `() => void | Promise<void>` for proper async support
  - All 805 tests still pass after fixes
