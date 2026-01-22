# Story 3.4: Implement One-Click Paste

Status: done

## Story

As a **user**,
I want **to paste a query into the SMP textarea with one click**,
So that **I can quickly use my saved queries**. (FR7, FR9)

## Acceptance Criteria

1. **Given** I'm on an SMP page with textarea detected (FR9) **When** I click on a query in the tree view **Then** the query SQL is pasted into the SMP textarea (FR7)

2. **Given** the paste operation **When** it completes **Then** it takes less than 100ms (NFR2)

3. **Given** a successful paste **When** the operation completes **Then** a success toast briefly confirms "Query pasted"

4. **Given** I'm NOT on an SMP page **When** I click a query **Then** a message indicates paste is unavailable on this page

## Tasks / Subtasks

- [x] Task 1: Verify existing paste infrastructure (AC: 1, 2)
  - [x] 1.1: Confirm content script handles `PASTE_QUERY` message correctly
  - [x] 1.2: Confirm service worker routes `PASTE_QUERY` to active tab's content script
  - [x] 1.3: Confirm message-service `sendToServiceWorker` and `sendToContentScript` work
  - [x] 1.4: Verify paste operation dispatches both `input` and `change` events for Zen compatibility

- [x] Task 2: Update tree-item click behavior for one-click paste (AC: 1)
  - [x] 2.1: Verify `onItemActivate` callback triggers on click (not just selection)
  - [x] 2.2: Ensure click on query triggers paste flow, not just selection
  - [x] 2.3: Verify double-click doesn't cause double paste (debounce if needed)

- [x] Task 3: Implement SMP availability check before paste (AC: 4)
  - [x] 3.1: Call `GET_SMP_STATUS` before attempting paste
  - [x] 3.2: If SMP not available, show error toast "SMP textarea not detected"
  - [x] 3.3: Do NOT attempt paste if SMP unavailable (prevent content script errors)

- [x] Task 4: Implement success/error feedback (AC: 3, 4)
  - [x] 4.1: On successful paste, show toast "Pasted: {query.name}" (1.5s auto-dismiss)
  - [x] 4.2: On paste failure, show error toast with error message (persistent until dismissed)
  - [x] 4.3: Ensure toast component handles both success and error variants

- [x] Task 5: Write comprehensive unit tests
  - [x] 5.1: Test paste triggers on query click/activation
  - [x] 5.2: Test paste calls service worker with correct message
  - [x] 5.3: Test success toast shown after successful paste
  - [x] 5.4: Test error toast shown when SMP unavailable
  - [x] 5.5: Test error toast shown on paste failure
  - [x] 5.6: Test SMP status check occurs before paste attempt

- [x] Task 6: Manual E2E verification
  - [x] 6.1: Load extension on SMP page, click query, verify paste
  - [x] 6.2: Load extension on non-SMP page, click query, verify error message
  - [x] 6.3: Verify paste speed < 100ms (NFR2)
  - [x] 6.4: Verify Zen/SMP framework receives value change events

## Dev Notes

### CRITICAL: Most of the infrastructure already exists!

**Story 3-2 already implemented the paste flow.** This story is about:
1. Verifying the one-click behavior works correctly
2. Adding SMP availability check before paste
3. Improving error handling for non-SMP pages
4. Ensuring proper toast feedback

### Existing Implementation (from Story 3-2)

**`src/popup/index.ts` lines 206-231:**
```typescript
async function handleQueryActivate(query: Query): Promise<void> {
  // Check for dangerous SQL before paste (per project-context.md)
  const safetyCheck = checkSqlSafety(query.sql)

  if (safetyCheck.isDangerous) {
    const warning = getDangerousSqlWarning(safetyCheck.keyword!)
    const confirmed = window.confirm(warning)
    if (!confirmed) {
      return // User cancelled
    }
  }

  // Paste query SQL to SMP textarea
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
```

**`src/contentScript/index.ts` lines 85-97:**
```typescript
if (message.type === 'PASTE_QUERY') {
  const result = findSmpTextarea()
  if (result.success) {
    result.data.value = message.payload.sql
    // Dispatch both input and change events for SMP/Zen framework compatibility
    result.data.dispatchEvent(new Event('input', { bubbles: true }))
    result.data.dispatchEvent(new Event('change', { bubbles: true }))
    sendResponse({ success: true, data: null })
  } else {
    sendResponse({ success: false, error: result.error })
  }
  return true
}
```

**`src/background/index.ts` lines 144-148, 244-265:**
- Routes `PASTE_QUERY` from popup to content script
- `handlePasteQuery()` function sends to active tab

### What This Story Adds

1. **SMP Availability Pre-Check (AC: 4)**
   - Before attempting paste, check if SMP is available
   - Use `GET_SMP_STATUS` message to service worker
   - Service worker tracks per-tab SMP status in `tabSmpStatus` Map

2. **Better Error Handling**
   - Currently relies on content script error if SMP not found
   - Should proactively check and show friendly error

3. **Verification of One-Click Behavior**
   - Ensure click triggers activation, not just selection
   - Currently uses `onItemActivate` callback which fires on click/Enter

### Architecture Compliance

**CRITICAL patterns from `project-context.md`:**

1. **Return `true` for async message handlers:**
   ```typescript
   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     handleAsync(message).then(sendResponse);
     return true; // REQUIRED for async
   });
   ```

2. **Message type naming - UPPER_SNAKE_CASE:**
   - `PASTE_QUERY`, `GET_SMP_STATUS`, `CHECK_SMP_AVAILABLE`

3. **Result<T> pattern - Never throw:**
   ```typescript
   type Result<T> = { success: true; data: T } | { success: false; error: string };
   ```

4. **Context boundaries:**
   - Popup → Service Worker: `chrome.runtime.sendMessage()`
   - Service Worker → Content Script: `chrome.tabs.sendMessage(tabId, message)`

### Implementation Details

**SMP Status Check (before paste):**

```typescript
// In src/popup/index.ts - handleQueryActivate()
async function handleQueryActivate(query: Query): Promise<void> {
  // NEW: Check SMP availability first
  const statusResult = await sendToServiceWorker<{ available: boolean }>({
    type: 'GET_SMP_STATUS',
  })

  if (!statusResult.success || !statusResult.data.available) {
    showToast('SMP textarea not detected on this page', 'error')
    return
  }

  // Existing safety check...
  const safetyCheck = checkSqlSafety(query.sql)
  // ... rest of existing code
}
```

**Service Worker `GET_SMP_STATUS` handler (already exists at line 72-86):**
- Returns `{ available: boolean }` based on `tabSmpStatus` Map
- Map is populated by content script's `CHECK_SMP_AVAILABLE` messages

### File Structure

**Files to Modify:**
- `src/popup/index.ts` - Add SMP status check before paste

**Files Already Complete (verify only):**
- `src/contentScript/index.ts` - PASTE_QUERY handler
- `src/background/index.ts` - PASTE_QUERY routing, GET_SMP_STATUS handler
- `src/shared/services/message-service.ts` - sendToServiceWorker, sendToContentScript
- `src/popup/components/toast.ts` - Success/error toast variants

### Test Strategy

**Unit Tests for popup/index.ts:**
```typescript
describe('handleQueryActivate', () => {
  it('should check SMP status before paste', async () => {});
  it('should show error toast when SMP unavailable', async () => {});
  it('should proceed with paste when SMP available', async () => {});
  it('should show success toast on successful paste', async () => {});
  it('should show error toast on paste failure', async () => {});
  it('should check SQL safety before paste', async () => {});
});
```

### Previous Story Intelligence (Story 3-3)

**Key Learnings:**
1. **Separation of Selection vs Activation:** Story 3-2 separated `onItemSelect` (keyboard nav) from `onItemActivate` (click/Enter)
2. **SQL Safety Utils Exist:** `src/shared/utils/sql-utils.ts` has `checkSqlSafety()` - already integrated
3. **Toast Component Complete:** `showToast(message, type)` handles success/error variants
4. **Test Patterns Established:** DOM cleanup in beforeEach/afterEach, mock chrome APIs

### UX Design Specifications

**From UX Spec - Paste Behavior:**
- Single click on query = paste (primary action)
- Paste should feel instant (< 100ms per NFR2)
- Success toast: "Pasted: {query name}" (1.5s auto-dismiss)
- Error toast: Descriptive error (persistent)

**Warning Modal (already implemented in Story 3-2):**
- Safety check via `window.confirm()` for destructive queries
- Full modal component deferred to Epic 6

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7, FR9, NFR2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Message Protocol]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- [Source: _bmad-output/project-context.md#Chrome Extension Rules]
- [Source: _bmad-output/implementation-artifacts/3-3-implement-query-preview-panel.md]
- [Source: src/popup/index.ts (existing handleQueryActivate implementation)]
- [Source: src/contentScript/index.ts (existing PASTE_QUERY handler)]
- [Source: src/background/index.ts (existing routing and GET_SMP_STATUS)]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
