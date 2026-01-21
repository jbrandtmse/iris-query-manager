# Story 1.3: Implement SMP Page Detection

Status: done

## Story

As a **user**,
I want **the extension to automatically detect when I'm on an SMP SQL page**,
So that **it can interact with the SQL textarea**. (FR29)

## Acceptance Criteria

1. **Given** a content script configured for SMP URL patterns
   **When** I navigate to an SMP SQL page (`%25CSP.UI.Portal.SQL.Home.zen`)
   **Then** the content script is injected into the page

2. **Given** the content script is active
   **When** it searches for the SQL textarea
   **Then** it looks for `textarea` within `div#QueryText` container

3. **Given** the textarea is found
   **When** the content script initializes
   **Then** it sends a `CHECK_SMP_AVAILABLE` message to the service worker with success status

4. **Given** the textarea is NOT found (different IRIS version)
   **When** the content script searches with fallback strategies
   **Then** it attempts alternative selectors before reporting failure (FR31)

5. **Given** the SMP page loads dynamically
   **When** the textarea appears after initial page load
   **Then** the content script detects it using MutationObserver or re-query on demand

## Tasks / Subtasks

- [x] **Task 1: Add content_scripts to manifest** (AC: #1)
  - [x] Add `content_scripts` array to `src/manifest.ts`
  - [x] Set `matches: ['*://*/%25CSP.UI.Portal.SQL.Home.zen*']`
  - [x] Set `js: ['src/contentScript/index.ts']`
  - [x] Set `run_at: 'document_idle'` for reliable DOM access
  - [x] Run build and verify content script appears in manifest.json

- [x] **Task 2: Create message types** (AC: #3)
  - [x] Create `src/shared/types/message.types.ts`
  - [x] Define `MessageType` discriminated union with `CHECK_SMP_AVAILABLE`
  - [x] Define `MessageResult<T>` type for success/error responses
  - [x] Export types for use in content script and service worker

- [x] **Task 3: Create SMP detector module** (AC: #2, #4)
  - [x] Create `src/contentScript/smp-detector.ts`
  - [x] Implement `findSmpTextarea()` function with primary selector `#QueryText textarea`
  - [x] Implement fallback selectors for IRIS version variations
  - [x] Return `Result<HTMLTextAreaElement>` with success/error

- [x] **Task 4: Implement content script initialization** (AC: #2, #3)
  - [x] Update `src/contentScript/index.ts` to import and use smp-detector
  - [x] On load, attempt to find textarea
  - [x] Send `CHECK_SMP_AVAILABLE` message to service worker with result
  - [x] Log detection status to console for debugging

- [x] **Task 5: Handle dynamic page loading** (AC: #5)
  - [x] Implement MutationObserver in smp-detector.ts
  - [x] Watch for `#QueryText` container or textarea appearing
  - [x] Re-send `CHECK_SMP_AVAILABLE` when textarea becomes available
  - [x] Clean up observer when textarea found or page unloads

- [x] **Task 6: Update service worker message handler** (AC: #3)
  - [x] Update `src/background/index.ts` to handle `CHECK_SMP_AVAILABLE` message
  - [x] Store SMP availability state per tab (in-memory Map)
  - [x] Return `true` from listener for async response
  - [x] Log received messages for debugging

- [x] **Task 7: Add message listener to content script** (AC: #3)
  - [x] Add `chrome.runtime.onMessage` listener in content script
  - [x] Handle `GET_CURRENT_SQL` message type (return textarea value)
  - [x] Handle `PASTE_QUERY` message type (set textarea value)
  - [x] Return `true` for async responses

- [x] **Task 8: Write unit tests**
  - [x] Create `src/contentScript/smp-detector.test.ts`
  - [x] Test primary selector finds textarea in mock DOM
  - [x] Test fallback selectors are tried
  - [x] Test returns error Result when textarea not found
  - [x] Run `npm run test` to verify all tests pass

## Dev Notes

### SMP DOM Structure

The IRIS System Management Portal SQL page has this structure:

```html
<div id="QueryText">
  <textarea id="queryText">SELECT * FROM ...</textarea>
</div>
```

**Key points:**
- Container div has ID `QueryText` (capital Q, capital T)
- Textarea inside may have ID `queryText` (lowercase q, capital T) - but ID may vary
- **Strategy:** Find textarea within `#QueryText` container, don't rely on textarea ID

### Selector Strategy

**Primary selector (recommended):**
```typescript
document.querySelector('#QueryText textarea')
```

**Fallback selectors (for IRIS version variations):**
```typescript
// Fallback 1: Direct textarea ID
document.querySelector('#queryText')

// Fallback 2: Any textarea in query area
document.querySelector('.queryText textarea')

// Fallback 3: Textarea with specific attributes
document.querySelector('textarea[name*="query" i]')
```

### Message Protocol

**Message types for this story:**

```typescript
// src/shared/types/message.types.ts

export type MessageType =
  | { type: 'CHECK_SMP_AVAILABLE' }
  | { type: 'GET_CURRENT_SQL' }
  | { type: 'PASTE_QUERY'; payload: { sql: string } };

export type MessageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type SmpStatus = {
  available: boolean;
  textareaFound: boolean;
};
```

**CRITICAL:** Message handlers MUST `return true` for async responses:

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleAsync(message).then(sendResponse);
  return true; // REQUIRED for async response
});
```

### Content Script Architecture

```
src/contentScript/
├── index.ts           # Entry point, initialization, message listener
└── smp-detector.ts    # DOM detection logic (testable without Chrome)
```

**smp-detector.ts** should be a pure module that:
- Takes no Chrome API dependencies
- Accepts `document` or element as parameter for testability
- Returns `Result<HTMLTextAreaElement>` type

### MutationObserver Pattern

For dynamic SMP pages where textarea loads after initial page render:

```typescript
function waitForTextarea(timeout = 5000): Promise<Result<HTMLTextAreaElement>> {
  return new Promise((resolve) => {
    // Try immediate detection first
    const immediate = findSmpTextarea();
    if (immediate.success) {
      resolve(immediate);
      return;
    }

    // Set up observer for dynamic loading
    const observer = new MutationObserver(() => {
      const result = findSmpTextarea();
      if (result.success) {
        observer.disconnect();
        resolve(result);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve({ success: false, error: 'Textarea not found within timeout' });
    }, timeout);
  });
}
```

### Service Worker Tab State

Track SMP availability per tab in service worker:

```typescript
// src/background/index.ts
const tabSmpStatus = new Map<number, boolean>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_SMP_AVAILABLE') {
    const tabId = sender.tab?.id;
    if (tabId) {
      tabSmpStatus.set(tabId, message.payload?.available ?? false);
    }
    sendResponse({ success: true, data: null });
    return true;
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSmpStatus.delete(tabId);
});
```

### File Structure After This Story

```
src/
├── contentScript/
│   ├── index.ts              # MODIFY - Add detection and messaging
│   └── smp-detector.ts       # NEW - DOM detection logic
├── background/
│   └── index.ts              # MODIFY - Handle CHECK_SMP_AVAILABLE
├── shared/
│   └── types/
│       └── message.types.ts  # NEW - Message type definitions
└── manifest.ts               # MODIFY - Add content_scripts
```

### Previous Story Learnings (from 1-1, 1-2)

**Project structure notes:**
- Content script folder is `contentScript/` (not `content/`)
- Source files are named `index.ts` (not descriptive names)
- Output directory is `build/` (not `dist/`)

**Code patterns established:**
- TypeScript strict mode enabled
- Vitest for testing
- Result objects for error handling: `{ success: true, data: T } | { success: false, error: string }`
- Message types use `UPPER_SNAKE_CASE`
- File naming uses `kebab-case`

**Current state of content script:**
```typescript
// src/contentScript/index.ts - CURRENT (placeholder only)
console.info('contentScript is running')
```

**Current state of service worker:**
```typescript
// src/background/index.ts - CURRENT
console.log('IRIS Query Manager service worker initialized')

chrome.runtime.onMessage.addListener((_request, _sender, _sendResponse) => {
  // Future: Handle query capture, storage, and retrieval messages
  return false
})
```

### Testing Strategy

**Unit tests for smp-detector.ts:**
- Mock DOM with `document.body.innerHTML = '...'`
- Test primary selector success
- Test fallback selectors
- Test failure case with no matching elements

**Integration testing (manual):**
1. Load extension in Chrome
2. Navigate to SMP SQL page
3. Check console for "SMP textarea found" message
4. Check service worker console for received message

### References

- [Source: epics.md#Story 1.3] - Story requirements and acceptance criteria
- [Source: architecture.md#DOM Strategy] - `document.querySelector('#QueryText textarea')` on demand
- [Source: architecture.md#Message Protocol] - MessageType and MessageResult definitions
- [Source: architecture.md#Context Isolation] - Content script can access SMP DOM, chrome.runtime
- [Source: prd.md#SMP Integration] - DOM structure details
- [Source: prd.md#Content Script Injection] - Inject only on matching SMP pages
- [Source: project-context.md#Chrome Extension Rules] - MUST return true for async message handlers
- [Source: 1-2-configure-extension-manifest-service-worker.md] - content_scripts deferred to Story 1.3

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Build verified: `npm run build` produces manifest.json with content_scripts
- Tests verified: `npm run test` - 29 tests pass (13 smp-detector + 6 content script index)

### Completion Notes List

- Implemented SMP page detection with multi-selector fallback strategy
- Created message protocol types (MessageType, MessageResult, SmpStatus)
- Content script uses MutationObserver for dynamic page loading
- Service worker tracks SMP availability per tab with cleanup on tab close
- All message handlers return `true` for async responses per Chrome extension requirements
- Unit tests cover primary selector, all fallbacks, error cases, and dynamic detection

### File List

- `src/manifest.ts` - MODIFIED: Added content_scripts configuration
- `src/shared/types/message.types.ts` - NEW: Message type definitions
- `src/contentScript/smp-detector.ts` - NEW: DOM detection logic with fallbacks
- `src/contentScript/smp-detector.test.ts` - NEW: Unit tests (13 tests)
- `src/contentScript/index.ts` - MODIFIED: Initialization and message handling
- `src/contentScript/index.test.ts` - NEW: Unit tests for content script (6 tests)
- `src/background/index.ts` - MODIFIED: CHECK_SMP_AVAILABLE handler with tab tracking

### Change Log

- 2026-01-21: Implemented Story 1.3 - SMP Page Detection (all 8 tasks complete)
- 2026-01-21: Code Review fixes applied:
  - H1: Added sendMessage error handling in content script
  - H2: Documented message listener registration order
  - M1: Added 6 unit tests for content script index.ts (29 total tests now)
  - M2: Removed unnecessary type assertion in service worker
  - M3: Added payload validation in service worker message handler
  - M4: Added change event dispatch for SMP/Zen framework compatibility
  - L1: Consistent console logging prefix across all files
  - L2: Extracted timeout magic number to named constant
