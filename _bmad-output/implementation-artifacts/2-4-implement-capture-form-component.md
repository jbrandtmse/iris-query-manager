# Story 2.4: Implement Capture Form Component

Status: done

## Story

As a **user**,
I want **to capture the current SQL query with a name**,
So that **I can save it for later retrieval**. (FR1, FR2)

## Acceptance Criteria

1. **Given** I click the capture button in the popup **When** the capture form appears **Then** it shows a text input for query name (required) and folder dropdown (optional) (FR2, FR3)

2. **Given** the capture form is open **When** I enter a query name and click Save **Then** the current SQL is captured from the SMP textarea (FR1)

3. **Given** valid capture input **When** the save operation completes **Then** it takes less than 100ms (NFR1)

4. **Given** I leave the name field empty **When** I try to save **Then** the Save button is disabled and validation message appears

5. **Given** the folder dropdown **When** folders exist in storage **Then** they appear as options; default is "No folder" (root level)

## Tasks / Subtasks

- [x] Task 1: Create capture form component (AC: 1, 4)
  - [x] 1.1: Create `src/popup/components/capture-form.ts`
  - [x] 1.2: Create `src/popup/components/capture-form.css`
  - [x] 1.3: Implement form with name input (required) and folder dropdown (optional)
  - [x] 1.4: Add inline panel layout that slides down from header area
  - [x] 1.5: Implement "No folder" as default dropdown option
  - [x] 1.6: Implement form validation (name required, min 1 char)
  - [x] 1.7: Disable Save button when name is empty
  - [x] 1.8: Show validation message when name is empty on blur

- [x] Task 2: Implement capture flow integration (AC: 2, 3)
  - [x] 2.1: Wire capture button in header to toggle capture form visibility
  - [x] 2.2: On Save click, send `CAPTURE_QUERY` to service worker (orchestrates SQL retrieval)
  - [x] 2.3: Service worker handles GET_CURRENT_SQL → SAVE_QUERY flow
  - [x] 2.4: Handle success: close form (toast deferred to Story 2-5)
  - [x] 2.5: Handle error: show error message in form
  - [x] 2.6: Add loading state to Save button during async operation

- [x] Task 3: Load folders for dropdown (AC: 5)
  - [x] 3.1: On form open, send `GET_FOLDERS` to service worker
  - [x] 3.2: Populate dropdown with folders list
  - [x] 3.3: Nested folders: display with indentation (— prefix per level)
  - [x] 3.4: Handle empty folders array (only show "No folder" option)

- [x] Task 4: Update popup entry point (AC: 1, 2)
  - [x] 4.1: Import and initialize capture form in `index.ts`
  - [x] 4.2: Update `handleCaptureClick` to toggle form visibility
  - [x] 4.3: Add form show/hide animation (CSS transitions)
  - [x] 4.4: Close form on successful save

- [x] Task 5: Write unit tests
  - [x] 5.1: Create `src/popup/components/capture-form.test.ts`
  - [x] 5.2: Test form rendering with name input and folder dropdown
  - [x] 5.3: Test validation (empty name disables save, shows message)
  - [x] 5.4: Test folder dropdown population
  - [x] 5.5: Test form show/hide toggle

## Dev Notes

### Architecture Compliance

**Critical patterns from `project-context.md` and Architecture doc:**

1. **Result<T> pattern - NEVER throw from services:**
   ```typescript
   // ✅ CORRECT
   const result = await sendToServiceWorker<string>({ type: 'GET_CURRENT_SQL' });
   if (!result.success) {
     showError(result.error);
     return;
   }

   // ❌ WRONG - throwing errors
   throw new Error('Failed to get SQL');
   ```

2. **Message handler async pattern - MUST return true:**
   ```typescript
   // Content script already handles this correctly - reference for understanding
   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     handleAsync(message).then(sendResponse);
     return true; // REQUIRED for async response
   });
   ```

3. **File naming - kebab-case required:**
   ```
   src/popup/components/
   ├── capture-form.ts      # ✅ kebab-case
   ├── capture-form.css
   └── capture-form.test.ts
   ```

4. **CSS class naming - BEM-inspired:**
   ```css
   .capture-form { }                    /* Component */
   .capture-form__input { }             /* Element */
   .capture-form__dropdown { }          /* Element */
   .capture-form__actions { }           /* Element */
   .capture-form--visible { }           /* Modifier */
   .capture-form--loading { }           /* Modifier */
   .js-capture-form { }                 /* JS hook */
   ```

5. **Import order:** Chrome APIs → Third-party → Shared modules → Local modules

### UX Design Specifications

**From UX Spec (Component Strategy - Capture Form):**

| Aspect | Value |
|--------|-------|
| Display | Inline panel that slides down from header |
| Fields | Query name (required), Folder dropdown (optional) |
| Position | Between header and content area |

**States:**

| State | Behavior |
|-------|----------|
| Empty name | Save button disabled |
| Valid name | Save button enabled |
| Saving | Button shows spinner, disabled |
| Success | Form closes, toast appears |
| Error | Error message shown in form |

**Form Validation (from UX Spec):**

| Field | Validation | Error Message |
|-------|------------|---------------|
| Query Name | Required, max 100 chars | "Name is required" / "Name too long" |
| Folder | Optional, valid folder ID | (No error - defaults to root) |

**Input States:**

| State | Border | Background | Label |
|-------|--------|------------|-------|
| Default | `#dadce0` | White | `#5f6368` |
| Focused | `#4285f4` | White | `#4285f4` |
| Error | `#ea4335` | White | `#ea4335` |
| Disabled | `#dadce0` | `#f8f9fa` | `#9aa0a6` |

### Form Layout Structure

**HTML Structure:**

```html
<div class="capture-form js-capture-form" hidden>
  <div class="capture-form__field">
    <label class="capture-form__label" for="query-name">Query Name</label>
    <input
      type="text"
      id="query-name"
      class="capture-form__input js-query-name"
      placeholder="Enter a name for this query"
      required
      maxlength="100"
    />
    <span class="capture-form__error js-name-error" hidden>Name is required</span>
  </div>

  <div class="capture-form__field">
    <label class="capture-form__label" for="folder-select">Folder (optional)</label>
    <select id="folder-select" class="capture-form__dropdown js-folder-select">
      <option value="">No folder</option>
      <!-- Folders populated dynamically -->
    </select>
  </div>

  <div class="capture-form__actions">
    <button type="button" class="btn btn--secondary js-cancel-btn">Cancel</button>
    <button type="button" class="btn btn--primary js-save-btn" disabled>Save</button>
  </div>
</div>
```

**CSS Layout:**

```css
.capture-form {
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  display: none;
}

.capture-form[hidden="false"],
.capture-form.capture-form--visible {
  display: block;
}

.capture-form__field {
  margin-bottom: var(--space-sm);
}

.capture-form__label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.capture-form__input,
.capture-form__dropdown {
  width: 100%;
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
}

.capture-form__input:focus,
.capture-form__dropdown:focus {
  outline: none;
  border-color: var(--color-primary);
}

.capture-form__input--error {
  border-color: var(--color-danger);
}

.capture-form__error {
  display: none;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin-top: var(--space-xs);
}

.capture-form__error:not([hidden]) {
  display: block;
}

.capture-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}
```

### Button Component

**Add to `index.css` or create `button.css`:**

```css
.btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  font-weight: 500;
  cursor: pointer;
  border: none;
  min-width: 64px;
  transition: background-color 0.15s ease;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #3367d6;
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover {
  background: var(--color-hover);
}

.btn--loading {
  position: relative;
  color: transparent;
}

.btn--loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Capture Flow Implementation

**Component Interface:**

```typescript
// src/popup/components/capture-form.ts

import type { Folder } from '../../shared/types/storage.types';
import type { MessageResult } from '../../shared/types/message.types';
import { sendToServiceWorker } from '../../shared/services/message-service';

export interface CaptureFormOptions {
  onSave: (name: string, folderId: string | null) => Promise<void>;
  onCancel: () => void;
}

export interface CaptureFormState {
  isVisible: boolean;
  isLoading: boolean;
  folders: Folder[];
  error: string | null;
}

export function createCaptureForm(options: CaptureFormOptions): HTMLElement {
  // Create form element
  // Wire up event handlers
  // Return form element
}

export function showCaptureForm(form: HTMLElement): void {
  form.hidden = false;
  form.classList.add('capture-form--visible');
  // Focus name input
  const nameInput = form.querySelector('.js-query-name') as HTMLInputElement;
  nameInput?.focus();
  // Load folders
  loadFolders(form);
}

export function hideCaptureForm(form: HTMLElement): void {
  form.hidden = true;
  form.classList.remove('capture-form--visible');
  // Reset form state
  resetForm(form);
}

async function loadFolders(form: HTMLElement): Promise<void> {
  const result = await sendToServiceWorker<Folder[]>({ type: 'GET_FOLDERS' });
  if (result.success) {
    populateFolderDropdown(form, result.data);
  }
}

function populateFolderDropdown(form: HTMLElement, folders: Folder[]): void {
  const select = form.querySelector('.js-folder-select') as HTMLSelectElement;
  if (!select) return;

  // Clear existing options except "No folder"
  select.innerHTML = '<option value="">No folder</option>';

  // Build tree structure and add options with indentation
  const tree = buildFolderTree(folders);
  addFolderOptions(select, tree, 0);
}

function buildFolderTree(folders: Folder[]): TreeNode[] {
  // Build hierarchical tree from flat folder list
  // Sort alphabetically at each level
}

function addFolderOptions(select: HTMLSelectElement, nodes: TreeNode[], depth: number): void {
  for (const node of nodes) {
    const option = document.createElement('option');
    option.value = node.folder.id;
    option.textContent = '—'.repeat(depth) + (depth > 0 ? ' ' : '') + node.folder.name;
    select.appendChild(option);

    if (node.children.length > 0) {
      addFolderOptions(select, node.children, depth + 1);
    }
  }
}

function resetForm(form: HTMLElement): void {
  const nameInput = form.querySelector('.js-query-name') as HTMLInputElement;
  const folderSelect = form.querySelector('.js-folder-select') as HTMLSelectElement;
  const errorSpan = form.querySelector('.js-name-error') as HTMLElement;
  const saveBtn = form.querySelector('.js-save-btn') as HTMLButtonElement;

  if (nameInput) {
    nameInput.value = '';
    nameInput.classList.remove('capture-form__input--error');
  }
  if (folderSelect) folderSelect.value = '';
  if (errorSpan) errorSpan.hidden = true;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.remove('btn--loading');
  }
}
```

**Integration in index.ts:**

```typescript
// In initializePopup()
const captureForm = createCaptureForm({
  onSave: handleCaptureSave,
  onCancel: () => hideCaptureForm(captureForm),
});

// Insert form between header and content
popup.insertBefore(captureForm, content);

// Update handleCaptureClick
function handleCaptureClick(): void {
  const form = document.querySelector('.js-capture-form') as HTMLElement;
  if (form) {
    if (form.hidden) {
      showCaptureForm(form);
    } else {
      hideCaptureForm(form);
    }
  }
}

// Save handler
async function handleCaptureSave(name: string, folderId: string | null): Promise<void> {
  // 1. Get current SQL from content script
  const sqlResult = await sendToServiceWorker<string>({ type: 'GET_CURRENT_SQL' });
  if (!sqlResult.success) {
    // Show error in form
    return;
  }

  // 2. Save query
  const saveResult = await sendToServiceWorker<Query>({
    type: 'SAVE_QUERY',
    payload: { name, sql: sqlResult.data, folderId },
  });

  if (!saveResult.success) {
    // Show error in form
    return;
  }

  // 3. Success - close form, show toast
  hideCaptureForm(form);
  showToast('Query saved'); // Story 2-5
}
```

### Existing Code Context

**Files that will be modified:**

1. `src/popup/index.ts` (lines 66-70) - Update `handleCaptureClick`
2. `src/popup/index.css` - Add button styles and form slide animation

**Files that will be created:**

1. `src/popup/components/capture-form.ts`
2. `src/popup/components/capture-form.css`
3. `src/popup/components/capture-form.test.ts`

**Existing code to reuse:**

1. `sendToServiceWorker` from `src/shared/services/message-service.ts`
2. `Query`, `Folder` types from `src/shared/types/storage.types.ts`
3. Message types already defined: `GET_CURRENT_SQL`, `SAVE_QUERY`, `GET_FOLDERS`
4. Design tokens from `src/popup/design-tokens.css`
5. Icon button pattern from `src/popup/components/icon-button.ts`

### Message Flow Diagram

```
User clicks Save
       │
       ▼
[Popup] validate form
       │ valid
       ▼
[Popup] sendToServiceWorker({ type: 'GET_CURRENT_SQL' })
       │
       ▼
[Service Worker] chrome.tabs.sendMessage(tabId, { type: 'GET_CURRENT_SQL' })
       │
       ▼
[Content Script] read textarea value
       │
       ▼
[Content Script] sendResponse({ success: true, data: sql })
       │
       ▼
[Service Worker] forward response to popup
       │
       ▼
[Popup] sendToServiceWorker({ type: 'SAVE_QUERY', payload })
       │
       ▼
[Service Worker] storageService.saveQuery(payload)
       │
       ▼
[Service Worker] sendResponse({ success: true, data: Query })
       │
       ▼
[Popup] close form, show toast
```

### Testing Strategy

**Unit tests for capture-form.ts:**

```typescript
describe('capture-form', () => {
  describe('createCaptureForm', () => {
    it('should create form with name input and folder dropdown');
    it('should have Save button disabled by default');
    it('should call onCancel when Cancel clicked');
  });

  describe('validation', () => {
    it('should enable Save button when name has content');
    it('should disable Save button when name is empty');
    it('should show error message on blur with empty name');
    it('should hide error message when name is entered');
  });

  describe('folder dropdown', () => {
    it('should have "No folder" as default option');
    it('should populate with folders from storage');
    it('should show nested folders with indentation');
  });

  describe('form visibility', () => {
    it('should be hidden by default');
    it('should show when showCaptureForm called');
    it('should hide when hideCaptureForm called');
    it('should focus name input when shown');
    it('should reset form state when hidden');
  });
});
```

### Performance Requirement (NFR1)

**Capture must complete in < 100ms:**

The 100ms target is for perceived latency. Breakdown:
- Form validation: < 1ms (synchronous)
- GET_CURRENT_SQL message: ~10-20ms (DOM read)
- SAVE_QUERY message: ~20-30ms (chrome.storage write)
- UI update: < 5ms

Total: ~50ms typical, well under 100ms threshold.

**Optimization notes:**
- No unnecessary re-renders
- Minimal DOM manipulation
- Use event delegation where possible

### Accessibility Requirements

**From UX Spec:**

1. **Label association:**
   - All inputs have associated `<label>` elements with `for` attribute
   - Screen readers announce field purpose

2. **Error announcement:**
   - Error messages linked via `aria-describedby`
   - `aria-invalid="true"` on invalid inputs

3. **Focus management:**
   - Focus name input when form opens
   - Return focus to capture button when form closes
   - Tab order: Name → Folder → Cancel → Save

4. **Keyboard interaction:**
   - Enter in name input triggers Save (if valid)
   - Escape closes form

### Previous Story Learnings (Story 2-3)

1. **Test coverage is critical** - Add tests from the start (14 tests for icon-button, 19 for header)
2. **Empty CSS files cause issues** - Don't create empty style files
3. **type="button" required** - Prevent accidental form submission
4. **Console.log placeholders** - Replace with real implementation
5. **CSS organization** - Consider where styles live (component file vs index.css)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Capture Form]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Message Protocol]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: _bmad-output/project-context.md#Chrome Extension Rules]
- [Source: src/popup/index.ts:66-70] - handleCaptureClick to update
- [Source: src/shared/services/message-service.ts] - sendToServiceWorker helper
- [Source: src/shared/types/message.types.ts] - Message types defined

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation completed without blocking issues.

### Completion Notes List

- **Task 1**: Created capture form component following project patterns (BEM CSS, kebab-case files, Result<T> pattern)
  - Form includes name input (required, max 100 chars), folder dropdown (optional)
  - Validation: Save button disabled when empty, error message on blur
  - Accessibility: aria-describedby, aria-invalid, proper label associations
  - Keyboard support: Enter to save, Escape to cancel

- **Task 2**: Integrated capture flow using existing `CAPTURE_QUERY` message type
  - Service worker already handles SQL retrieval and storage save
  - Error handling displays messages in form via `__showError` method
  - Loading state with spinner animation during async operations
  - Toast notification deferred to Story 2-5

- **Task 3**: Folder dropdown loads dynamically on form open
  - Hierarchical folders displayed with em-dash indentation (—, ——, etc.)
  - Folders sorted alphabetically at each nesting level
  - Empty state shows only "No folder" option

- **Task 4**: Popup entry point updated
  - Capture form inserted between header and content
  - Capture button toggles form visibility
  - CSS animation (slideDown) for smooth appearance
  - Reduced motion support included

- **Task 5**: 40 unit tests covering all component functionality
  - Form creation, validation, save/cancel actions
  - Folder dropdown population with nested structure
  - Form visibility states and reset behavior
  - Keyboard interactions and accessibility

### Change Log

- 2026-01-21: Implemented capture form component (Story 2-4)
  - Created capture-form.ts, capture-form.css, capture-form.test.ts
  - Updated popup/index.ts to integrate form
  - All 155 tests passing, build successful

- 2026-01-21: Code Review fixes applied
  - Added "Name too long" validation message when at 100 char limit
  - Added aria-live="polite" to error elements for screen reader announcements
  - Added __destroy() cleanup function to prevent memory leaks
  - Added 7 new tests (162 total passing)

### File List

**Created:**
- src/popup/components/capture-form.ts
- src/popup/components/capture-form.css
- src/popup/components/capture-form.test.ts

**Modified:**
- src/popup/index.ts

## Senior Developer Review (AI)

**Reviewer:** Developer Agent (Claude Opus 4.5)
**Date:** 2026-01-21
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | Missing "Name too long" validation message | Added validation in handleInput() showing error at 100 chars |
| HIGH | No test for max length validation | Added 2 tests for too-long and recovery behavior |
| MEDIUM | Missing aria-live for screen readers | Added aria-live="polite" to nameError and formError |
| MEDIUM | No test for formError reset on hide | Added test verifying formError hidden after hideCaptureForm() |
| MEDIUM | Potential memory leak (event listeners) | Added __destroy() cleanup function with all listener removals |

### Verification Summary

- All 5 Acceptance Criteria: ✅ Implemented
- All Tasks/Subtasks: ✅ Verified complete
- Test count: 162 passing (up from 155)
- Build: ✅ Successful
- Git changes: Match story File List

