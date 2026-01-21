# Story 1.4: Extension Icon State Management

Status: done

## Story

As a **user**,
I want **the extension icon to indicate whether I'm on an SMP page**,
So that **I know when the extension is active and ready to use**. (FR30)

## Acceptance Criteria

1. **Given** I am on an SMP SQL page with textarea detected
   **When** the content script reports availability
   **Then** the extension icon shows an "active" state (full color)

2. **Given** I am on a non-SMP page
   **When** I view the extension icon
   **Then** it shows an "inactive" state (grayed out or badge indicator)

3. **Given** I am on an SMP page but textarea is not found
   **When** the content script reports unavailable
   **Then** the icon shows inactive state and popup displays helpful message (FR31)

4. **Given** I navigate from SMP to a different page
   **When** the tab URL changes
   **Then** the icon state updates to reflect the new page status

## Tasks / Subtasks

- [x] **Task 1: Implement badge-based icon state service** (AC: #1, #2, #3)
  - [x] Create `src/background/icon-state.ts` module
  - [x] Implement `setActiveState(tabId: number)` - clears badge text (no badge shown)
  - [x] Implement `setInactiveState(tabId: number)` - sets badge "OFF" with gray `#666` background
  - [x] Use `chrome.action.setBadgeText()` and `chrome.action.setBadgeBackgroundColor()`
  - [x] Return `Result<void>` for error handling consistency
  - [x] Export functions for use in service worker

- [x] **Task 2: Update service worker to set icon state on SMP availability** (AC: #1, #3)
  - [x] Import icon-state functions in `src/background/index.ts`
  - [x] When `CHECK_SMP_AVAILABLE` received with `available: true`, call `setActiveState(tabId)`
  - [x] When `CHECK_SMP_AVAILABLE` received with `available: false`, call `setInactiveState(tabId)`
  - [x] Log icon state changes for debugging with `[IRIS Query Manager]` prefix

- [x] **Task 3: Set inactive state for non-SMP tabs** (AC: #2, #4)
  - [x] Add `chrome.tabs.onActivated` listener in service worker
  - [x] When tab activated, check `tabSmpStatus` Map
  - [x] If tab not in map (non-SMP page), call `setInactiveState(tabId)`
  - [x] If tab in map, call state function based on stored boolean value

- [x] **Task 4: Handle tab URL changes** (AC: #4)
  - [x] Add `chrome.tabs.onUpdated` listener in service worker
  - [x] Listen for `changeInfo.url` changes (filter with `url` in listener properties)
  - [x] When URL changes and no longer matches SMP pattern `%25CSP.UI.Portal.SQL.Home.zen`, call `setInactiveState(tabId)`
  - [x] Remove tab from `tabSmpStatus` Map when URL leaves SMP
  - [x] Note: SMP-to-SMP navigation handled by content script re-reporting

- [x] **Task 5: Set default inactive state on extension load** (AC: #2)
  - [x] At service worker initialization, set global default badge to "OFF"
  - [x] Use `chrome.action.setBadgeText({ text: 'OFF' })` without tabId for global default
  - [x] Use `chrome.action.setBadgeBackgroundColor({ color: '#666' })` for gray background
  - [x] Verify default state shows for all tabs until content script overrides

- [x] **Task 6: Add GET_SMP_STATUS message handler** (AC: #3 - for popup message)
  - [x] Add `GET_SMP_STATUS` to `MessageType` union in `src/shared/types/message.types.ts`
  - [x] In service worker, handle `GET_SMP_STATUS` message from popup
  - [x] Query active tab with `chrome.tabs.query({ active: true, currentWindow: true })`
  - [x] Return `{ available: boolean }` from `tabSmpStatus` Map lookup (false if not found)
  - [x] Note: Popup will use this in Epic 2 to display "Not on SMP page" message

- [x] **Task 7: Write unit tests**
  - [x] Create `src/background/icon-state.test.ts`
  - [x] Mock `chrome.action.setBadgeText` and `chrome.action.setBadgeBackgroundColor` APIs
  - [x] Test `setActiveState` clears badge text (sets to empty string)
  - [x] Test `setInactiveState` sets badge text to "OFF" and color to "#666"
  - [x] Test error handling when chrome API fails (returns Result with error)
  - [x] Run `npm run test` to verify all tests pass

## Dev Notes

### Chrome Action API

The extension icon is controlled via `chrome.action` API (Manifest V3):

```typescript
// Set icon for specific tab
chrome.action.setIcon({
  tabId: tabId,
  path: {
    16: 'icons/icon-active-16.png',
    48: 'icons/icon-active-48.png',
    128: 'icons/icon-active-128.png',
  },
});

// Set default icon (all tabs without specific override)
chrome.action.setIcon({
  path: {
    16: 'icons/icon-inactive-16.png',
    48: 'icons/icon-inactive-48.png',
    128: 'icons/icon-inactive-128.png',
  },
});
```

**IMPORTANT:** Icon paths are relative to extension root (the `public/` folder maps to root in build).

### Implementation Approach: Badge-Based State

**Why badges over icon swap:**
- Simpler implementation (no icon assets required)
- Clearer state indication (text is unambiguous)
- Faster to implement and test
- Future enhancement: Can add icon swap later if desired

**Badge State API:**
```typescript
// Active state: No badge (clear text)
chrome.action.setBadgeText({ tabId, text: '' });

// Inactive state: "OFF" badge with gray background
chrome.action.setBadgeText({ tabId, text: 'OFF' });
chrome.action.setBadgeBackgroundColor({ tabId, color: '#666' });
```

### Project Structure After This Story

```
src/background/
├── index.ts              # MODIFY - Add icon state updates, tab listeners
├── icon-state.ts         # NEW - Badge state management functions
└── icon-state.test.ts    # NEW - Unit tests

src/shared/types/
└── message.types.ts      # MODIFY - Add GET_SMP_STATUS message type
```

### Service Worker State Management

Current `tabSmpStatus` Map in service worker already tracks SMP availability:

```typescript
// src/background/index.ts - EXISTING
const tabSmpStatus = new Map<number, boolean>()
```

This map is the source of truth for icon state:
- Tab in map with `true` → Active icon
- Tab in map with `false` → Inactive icon
- Tab not in map → Inactive icon (non-SMP page)

### Event Listener Order

Register listeners in this order for reliability:

```typescript
// 1. Message listener (already exists)
chrome.runtime.onMessage.addListener(...)

// 2. Tab activation listener (new)
chrome.tabs.onActivated.addListener(...)

// 3. Tab update listener (new)
chrome.tabs.onUpdated.addListener(...)

// 4. Tab removed listener (already exists)
chrome.tabs.onRemoved.addListener(...)
```

### Edge Cases to Handle

1. **Extension installed while on SMP page:** Content script runs, reports availability, icon should update
2. **Multiple tabs open:** Each tab has independent icon state
3. **Tab navigates within SMP:** Should remain active (content script re-runs)
4. **Service worker restarts:** `tabSmpStatus` Map is cleared, but content scripts will re-report
5. **Tab closed:** Clean up from Map (already implemented)

### Message Types

**New message type required:**
```typescript
// Add to src/shared/types/message.types.ts
export type MessageType =
  | { type: 'CHECK_SMP_AVAILABLE'; payload: SmpStatus }
  | { type: 'GET_CURRENT_SQL' }
  | { type: 'PASTE_QUERY'; payload: { sql: string } }
  | { type: 'GET_SMP_STATUS' }  // NEW - For popup to check SMP availability
```

**GET_SMP_STATUS purpose:** Allows popup to query current tab's SMP status to display "Not on SMP page" message (AC#3 - FR31 graceful handling).

### Testing Strategy

**Unit tests for icon-state.ts:**
- Mock `chrome.action.setBadgeText` and `chrome.action.setBadgeBackgroundColor`
- Test `setActiveState` clears badge text
- Test `setInactiveState` sets "OFF" badge with gray color
- Test both tabId-specific and default (no tabId) calls
- Test error handling returns `Result<void>` with error

**Integration testing (manual):**
1. Load extension on non-SMP page → verify "OFF" badge
2. Navigate to SMP SQL page → verify badge clears (no badge)
3. Navigate away from SMP → verify "OFF" badge returns
4. Open multiple tabs with different states → verify each tab has correct badge
5. Reload extension on SMP page → verify content script re-reports and badge updates

### Previous Story Learnings (from 1-3)

**Code patterns established:**
- Message handlers return `true` for async responses
- Error handling via `chrome.runtime.lastError` check
- Console logging with `[IRIS Query Manager]` prefix
- Result objects: `{ success: true, data: T } | { success: false, error: string }`

**Service worker state:**
- `tabSmpStatus` Map tracks SMP availability per tab
- Cleanup on `chrome.tabs.onRemoved`

**Content script behavior:**
- Reports `CHECK_SMP_AVAILABLE` on initialization
- MutationObserver for late-appearing textarea
- Re-reports when textarea found late

### References

- [Source: epics.md#Story 1.4] - Story requirements and acceptance criteria
- [Source: architecture.md#Infrastructure] - Chrome extension patterns
- [Source: prd.md#SMP Integration FR30] - Icon indicates active/inactive state
- [Source: prd.md#FR31] - Graceful handling when textarea not found
- [Source: project-context.md#Chrome Extension Rules] - Return true for async handlers
- [Source: 1-3-implement-smp-page-detection.md] - Current service worker with tabSmpStatus Map

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- `npm run test` - 36/36 tests passing
- `npm run build` - TypeScript compiles successfully

### Completion Notes List

- Implemented badge-based icon state (simpler than icon swap approach)
- Added `setActiveState()` and `setInactiveState()` functions in icon-state.ts
- Service worker updates icon on CHECK_SMP_AVAILABLE message
- Tab switch (onActivated) updates icon based on tabSmpStatus Map
- URL changes (onUpdated) detect when leaving SMP and reset icon
- Default "OFF" badge set on service worker initialization
- Added GET_SMP_STATUS message type for popup to query SMP availability
- All acceptance criteria covered

**Code Review Fixes Applied:**
- M2: Extracted `isSmpUrl()` to shared utility with 8 unit tests for reuse and testability
- M3: Documented that Chrome message queueing prevents race condition on badge init
- M4: Added badge color reset to `setActiveState()` to prevent gray color persistence

### File List

**Created:**
- `src/background/icon-state.ts` - Badge state management functions
- `src/background/icon-state.test.ts` - Unit tests (8 tests)
- `src/shared/utils/url-utils.ts` - SMP URL detection utility (extracted during code review)
- `src/shared/utils/url-utils.test.ts` - Unit tests for URL utility (8 tests)

**Modified:**
- `src/background/index.ts` - Added icon state updates, tab listeners, GET_SMP_STATUS handler
- `src/shared/types/message.types.ts` - Added GET_SMP_STATUS message type

