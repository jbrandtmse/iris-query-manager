# Story 2.5: Implement Toast Notification Component

Status: done

## Story

As a **user**,
I want **to see confirmation when my query is saved**,
So that **I know the capture was successful**.

## Acceptance Criteria

1. **Given** a query is successfully saved **When** the storage operation completes **Then** a success toast appears with checkmark icon and "Query saved" message

2. **Given** the toast is displayed **When** 1.5 seconds pass **Then** it automatically fades out (300ms animation)

3. **Given** a save operation fails **When** an error occurs **Then** an error toast appears and persists until dismissed

4. **Given** the toast component **When** rendered **Then** it uses semantic colors from design tokens (success: green, error: red)

## Tasks / Subtasks

- [x] Task 1: Create toast component (AC: 1, 4)
  - [x] 1.1: Create `src/popup/components/toast.ts`
  - [x] 1.2: Create `src/popup/components/toast.css`
  - [x] 1.3: Implement toast with icon slot (checkmark/X), message text
  - [x] 1.4: Support variants: success (green), error (red), info (blue)
  - [x] 1.5: Position: top-center below header, fixed positioning
  - [x] 1.6: Height: 32px as per UX spec

- [x] Task 2: Implement auto-dismiss behavior (AC: 2)
  - [x] 2.1: Success/info toasts auto-dismiss after 1.5 seconds
  - [x] 2.2: Implement 300ms fade-out animation
  - [x] 2.3: Add `prefers-reduced-motion` support (instant hide, no animation)
  - [x] 2.4: Clean up timeout on manual dismiss or component destroy

- [x] Task 3: Implement persistent error toast (AC: 3)
  - [x] 3.1: Error variant does NOT auto-dismiss
  - [x] 3.2: Add dismiss button (X icon) for error toasts
  - [x] 3.3: Clicking dismiss button removes toast immediately
  - [x] 3.4: Error toast accessible: `aria-live="assertive"`

- [x] Task 4: Integrate toast into popup (AC: 1, 3)
  - [x] 4.1: Export `showToast(message, type)` function
  - [x] 4.2: Update `src/popup/index.ts` to import toast module
  - [x] 4.3: Wire `showToast('Query saved', 'success')` after successful capture
  - [x] 4.4: Replace `console.log` on line 120 with toast call
  - [x] 4.5: Ensure toast container is in DOM (create on first use)

- [x] Task 5: Add icons for toast variants
  - [x] 5.1: Add checkmark SVG icon for success
  - [x] 5.2: Add X-circle SVG icon for error
  - [x] 5.3: Add info-circle SVG icon for info variant
  - [x] 5.4: Update `src/popup/icons.ts` with new icons

- [x] Task 6: Write unit tests
  - [x] 6.1: Create `src/popup/components/toast.test.ts`
  - [x] 6.2: Test toast renders with correct variant classes
  - [x] 6.3: Test success toast auto-dismisses after 1500ms
  - [x] 6.4: Test error toast does NOT auto-dismiss
  - [x] 6.5: Test dismiss button removes error toast
  - [x] 6.6: Test toast has correct ARIA attributes
  - [x] 6.7: Test multiple toasts (new toast replaces existing)

## Dev Notes

### Architecture Compliance

**Critical patterns from `project-context.md` and Architecture doc:**

1. **File naming - kebab-case required:**
   ```
   src/popup/components/
   ├── toast.ts           # ✅ kebab-case
   ├── toast.css
   └── toast.test.ts
   ```

2. **CSS class naming - BEM-inspired:**
   ```css
   .toast { }                        /* Component */
   .toast__icon { }                  /* Element */
   .toast__message { }               /* Element */
   .toast__dismiss { }               /* Element */
   .toast--success { }               /* Modifier */
   .toast--error { }                 /* Modifier */
   .toast--info { }                  /* Modifier */
   .toast--visible { }               /* State modifier */
   .toast--hiding { }                /* Animation state */
   ```

3. **Import order:** Chrome APIs → Third-party → Shared modules → Local modules

4. **TypeScript types:**
   ```typescript
   type ToastType = 'success' | 'error' | 'info';
   ```

### UX Design Specifications

**From UX Spec (Component Strategy - Confirmation Toast):**

| Aspect | Specification |
|--------|---------------|
| Position | Top-center of popup, below header |
| Duration | 1.5s then fade out (300ms) |
| Height | 32px |

**Toast Variants:**

| Variant | Icon | Background | Text Color | Duration |
|---------|------|------------|------------|----------|
| **Success** | Checkmark | `#e6f4ea` | `#137333` | 1.5s auto-dismiss |
| **Info** | Info circle | `#e8f0fe` | `#1967d2` | 2s auto-dismiss |
| **Error** | X circle | `#fce8e6` | `#c5221f` | Persistent until dismissed |

**From UX Spec - Feedback Patterns:**

| Type | Icon | Background | Duration | Use Case |
|------|------|------------|----------|----------|
| Success | Checkmark | `#e6f4ea` | 1.5s auto-dismiss | Query saved, pasted |
| Info | Info circle | `#e8f0fe` | 2s auto-dismiss | Import complete |
| Warning | Warning triangle | `#fef7e0` | Persistent until action | Duplicate name |
| Error | X circle | `#fce8e6` | Persistent until dismissed | Save failed |

### Toast Component Structure

**HTML Structure:**

```html
<div class="toast toast--success toast--visible" role="status" aria-live="polite">
  <span class="toast__icon">
    <!-- Checkmark SVG -->
  </span>
  <span class="toast__message">Query saved</span>
</div>

<!-- Error variant with dismiss button -->
<div class="toast toast--error toast--visible" role="alert" aria-live="assertive">
  <span class="toast__icon">
    <!-- X-circle SVG -->
  </span>
  <span class="toast__message">Failed to save query</span>
  <button class="toast__dismiss" aria-label="Dismiss">
    <!-- X SVG -->
  </button>
</div>
```

**CSS Implementation:**

```css
.toast {
  position: fixed;
  top: 48px; /* Below header (40px) + 8px spacing */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius);
  height: 32px;
  font-size: var(--font-size-sm);
  opacity: 0;
  visibility: hidden;
  transition: opacity 300ms ease-in-out, visibility 300ms ease-in-out;
  z-index: 100;
}

.toast--visible {
  opacity: 1;
  visibility: visible;
}

.toast--hiding {
  opacity: 0;
  /* visibility stays visible during fade */
}

/* Success variant */
.toast--success {
  background: #e6f4ea;
  color: #137333;
}

/* Error variant */
.toast--error {
  background: #fce8e6;
  color: #c5221f;
}

/* Info variant */
.toast--info {
  background: #e8f0fe;
  color: #1967d2;
}

.toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.toast__icon svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.toast__message {
  flex: 1;
  white-space: nowrap;
}

.toast__dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  margin-left: var(--space-xs);
  border-radius: 2px;
}

.toast__dismiss:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: none;
  }
}
```

### Icons to Add

**Add to `src/popup/icons.ts`:**

```typescript
export const checkmarkIcon = `<svg viewBox="0 0 16 16" fill="currentColor">
  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
</svg>`;

export const errorIcon = `<svg viewBox="0 0 16 16" fill="currentColor">
  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm3.28 4.72a.75.75 0 0 0-1.06 0L8 6.94 5.78 4.72a.75.75 0 0 0-1.06 1.06L6.94 8 4.72 10.22a.75.75 0 1 0 1.06 1.06L8 9.06l2.22 2.22a.75.75 0 1 0 1.06-1.06L9.06 8l2.22-2.22a.75.75 0 0 0 0-1.06Z"/>
</svg>`;

export const infoIcon = `<svg viewBox="0 0 16 16" fill="currentColor">
  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm.75 4.75a.75.75 0 0 0-1.5 0v.5a.75.75 0 0 0 1.5 0v-.5Zm-.75 2.5a.75.75 0 0 0-.75.75v3.25a.75.75 0 0 0 1.5 0V8a.75.75 0 0 0-.75-.75Z"/>
</svg>`;

export const closeIcon = `<svg viewBox="0 0 16 16" fill="currentColor">
  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
</svg>`;
```

### Component Interface

```typescript
// src/popup/components/toast.ts

import './toast.css';
import { checkmarkIcon, errorIcon, infoIcon, closeIcon } from '../icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number; // ms, default 1500 for success/info, ignored for error
}

let toastContainer: HTMLDivElement | null = null;
let currentToast: HTMLDivElement | null = null;
let dismissTimeout: number | null = null;

/**
 * Show a toast notification
 * Replaces any existing toast
 */
export function showToast(message: string, type: ToastType = 'success'): void {
  // Remove existing toast if any
  hideToast();

  // Create container if needed
  ensureContainer();

  // Create toast element
  const toast = createToastElement({ message, type });
  currentToast = toast;

  // Add to container
  toastContainer!.appendChild(toast);

  // Trigger reflow then add visible class for animation
  toast.offsetHeight; // Force reflow
  toast.classList.add('toast--visible');

  // Auto-dismiss for non-error toasts
  if (type !== 'error') {
    const duration = type === 'info' ? 2000 : 1500;
    dismissTimeout = window.setTimeout(() => {
      hideToastWithAnimation();
    }, duration);
  }
}

/**
 * Hide the current toast immediately
 */
export function hideToast(): void {
  if (dismissTimeout) {
    clearTimeout(dismissTimeout);
    dismissTimeout = null;
  }
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }
}

/**
 * Hide with fade-out animation
 */
function hideToastWithAnimation(): void {
  if (!currentToast) return;

  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    hideToast();
    return;
  }

  currentToast.classList.add('toast--hiding');
  currentToast.classList.remove('toast--visible');

  // Wait for animation to complete
  setTimeout(hideToast, 300);
}

function ensureContainer(): void {
  if (toastContainer && document.body.contains(toastContainer)) return;

  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

function createToastElement(options: ToastOptions): HTMLDivElement {
  const { message, type } = options;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  // Icon
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast__icon';
  iconSpan.innerHTML = getIconForType(type);
  toast.appendChild(iconSpan);

  // Message
  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast__message';
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);

  // Dismiss button for error toasts
  if (type === 'error') {
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'toast__dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss');
    dismissBtn.innerHTML = closeIcon;
    dismissBtn.addEventListener('click', hideToast);
    toast.appendChild(dismissBtn);
  }

  return toast;
}

function getIconForType(type: ToastType): string {
  switch (type) {
    case 'success':
      return checkmarkIcon;
    case 'error':
      return errorIcon;
    case 'info':
      return infoIcon;
  }
}
```

### Integration in index.ts

**Update `src/popup/index.ts`:**

```typescript
// Add import at top
import { showToast } from './components/toast';

// Update handleCaptureSave function:
async function handleCaptureSave(name: string, folderId: string | null): Promise<void> {
  const showError = (captureFormElement as any)?.__showError as ((msg: string) => void) | undefined;

  // Send CAPTURE_QUERY to service worker
  const result = await sendToServiceWorker<Query>({
    type: 'CAPTURE_QUERY',
    payload: { name, folderId },
  });

  if (!result.success) {
    showError?.(result.error);
    return;
  }

  // Success - close form
  if (captureFormElement) {
    hideCaptureForm(captureFormElement);
  }

  // Show success toast (Story 2-5)
  showToast('Query saved', 'success');
}
```

### Testing Strategy

**Unit tests for toast.ts:**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showToast, hideToast } from './toast';

describe('toast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    hideToast();
    vi.useRealTimers();
  });

  describe('showToast', () => {
    it('should create toast with correct variant class', () => {
      showToast('Test message', 'success');
      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast?.classList.contains('toast--success')).toBe(true);
    });

    it('should display message text', () => {
      showToast('Query saved', 'success');
      const message = document.querySelector('.toast__message');
      expect(message?.textContent).toBe('Query saved');
    });

    it('should have checkmark icon for success', () => {
      showToast('Success', 'success');
      const icon = document.querySelector('.toast__icon svg');
      expect(icon).not.toBeNull();
    });

    it('should have role="status" for success toast', () => {
      showToast('Success', 'success');
      const toast = document.querySelector('.toast');
      expect(toast?.getAttribute('role')).toBe('status');
    });

    it('should have role="alert" for error toast', () => {
      showToast('Error', 'error');
      const toast = document.querySelector('.toast');
      expect(toast?.getAttribute('role')).toBe('alert');
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss success toast after 1500ms', () => {
      showToast('Success', 'success');
      expect(document.querySelector('.toast')).not.toBeNull();

      vi.advanceTimersByTime(1500);
      vi.advanceTimersByTime(300); // Animation duration

      expect(document.querySelector('.toast')).toBeNull();
    });

    it('should auto-dismiss info toast after 2000ms', () => {
      showToast('Info', 'info');
      expect(document.querySelector('.toast')).not.toBeNull();

      vi.advanceTimersByTime(2000);
      vi.advanceTimersByTime(300);

      expect(document.querySelector('.toast')).toBeNull();
    });

    it('should NOT auto-dismiss error toast', () => {
      showToast('Error', 'error');
      expect(document.querySelector('.toast')).not.toBeNull();

      vi.advanceTimersByTime(5000);

      expect(document.querySelector('.toast')).not.toBeNull();
    });
  });

  describe('error toast dismiss button', () => {
    it('should have dismiss button for error variant', () => {
      showToast('Error', 'error');
      const dismissBtn = document.querySelector('.toast__dismiss');
      expect(dismissBtn).not.toBeNull();
    });

    it('should NOT have dismiss button for success variant', () => {
      showToast('Success', 'success');
      const dismissBtn = document.querySelector('.toast__dismiss');
      expect(dismissBtn).toBeNull();
    });

    it('should remove toast when dismiss button clicked', () => {
      showToast('Error', 'error');
      const dismissBtn = document.querySelector('.toast__dismiss') as HTMLButtonElement;
      dismissBtn.click();
      expect(document.querySelector('.toast')).toBeNull();
    });

    it('should have aria-label on dismiss button', () => {
      showToast('Error', 'error');
      const dismissBtn = document.querySelector('.toast__dismiss');
      expect(dismissBtn?.getAttribute('aria-label')).toBe('Dismiss');
    });
  });

  describe('multiple toasts', () => {
    it('should replace existing toast when new one is shown', () => {
      showToast('First', 'success');
      showToast('Second', 'info');

      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(1);
      expect(document.querySelector('.toast__message')?.textContent).toBe('Second');
    });
  });

  describe('hideToast', () => {
    it('should remove toast immediately', () => {
      showToast('Test', 'success');
      expect(document.querySelector('.toast')).not.toBeNull();

      hideToast();

      expect(document.querySelector('.toast')).toBeNull();
    });

    it('should clear pending auto-dismiss timeout', () => {
      showToast('Test', 'success');
      hideToast();

      // Should not error when timeout tries to fire
      vi.advanceTimersByTime(2000);
    });
  });
});
```

### Accessibility Requirements

**From UX Spec:**

1. **ARIA attributes:**
   - Success/Info: `role="status"`, `aria-live="polite"`
   - Error: `role="alert"`, `aria-live="assertive"`

2. **Screen reader announcement:**
   - Toast message is announced when it appears
   - Error toasts are announced more urgently

3. **Dismiss button:**
   - `aria-label="Dismiss"` for screen reader users
   - Keyboard accessible (focusable, activates on Enter/Space)

4. **Reduced motion:**
   - Respects `prefers-reduced-motion: reduce`
   - Instant show/hide instead of animation

### Previous Story Learnings (Story 2-4)

Applied learnings from Story 2-4:

1. **Test coverage is critical** - Add comprehensive tests from the start
2. **Empty CSS files cause issues** - Ensure CSS file has content
3. **aria-live for screen readers** - Already included in spec
4. **Cleanup functions** - Track timeouts and clean up properly
5. **type="button"** - Dismiss button must have explicit type

### Git Integration Notes

**Files that will be created:**
1. `src/popup/components/toast.ts`
2. `src/popup/components/toast.css`
3. `src/popup/components/toast.test.ts`

**Files that will be modified:**
1. `src/popup/icons.ts` - Add new icons (checkmark, error, info, close)
2. `src/popup/index.ts` - Import toast, call showToast on success

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Confirmation Toast]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: _bmad-output/project-context.md#CSS class naming]
- [Source: src/popup/index.ts:119-121] - Console.log to replace with toast
- [Source: src/popup/components/capture-form.ts] - Pattern reference for component structure
- [Source: src/popup/design-tokens.css] - Design tokens to use

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tests needed `window.matchMedia` mock - added to test setup

### Completion Notes List

- Created toast component with success, error, info, and warning variants
- Implemented auto-dismiss (1.5s success, 2s info) with slide+fade animation
- Error and warning toasts persist until manually dismissed via X button
- Added `prefers-reduced-motion` support for accessibility
- Added 5 new icons to icons.ts (checkmark, errorCircle, infoCircle, close, warningTriangle)
- Integrated toast into popup index.ts - shows "Query saved" on success, error toast on failure
- 37 comprehensive unit tests covering all acceptance criteria
- All 199 tests pass, build succeeds

### File List

**Created:**
- src/popup/components/toast.ts
- src/popup/components/toast.css
- src/popup/components/toast.test.ts

**Modified:**
- src/popup/icons.ts - Added checkmark, errorCircle, infoCircle, close, warningTriangle icons
- src/popup/index.ts - Import showToast, call on success and error

### Change Log

- 2026-01-21: Implemented toast notification component (Story 2-5)
- 2026-01-21: Code review fixes applied

## Senior Developer Review (AI)

**Reviewer:** Dev Agent (Claude Opus 4.5)
**Date:** 2026-01-21
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | Missing warning toast variant per UX spec | Added `warning` type with yellow styling, persistent behavior, warningTriangle icon |
| MEDIUM | Animation timing didn't match UX spec (200ms appear, 300ms dismiss) | Updated CSS transitions with slide-down + fade animation |
| MEDIUM | AC3 not fully implemented - error toast not shown on save failure | Added `showToast(error, 'error')` call in index.ts |
| MEDIUM | CSS variables had no fallbacks | Added fallback values to all `var()` calls |

### Test Coverage

- **Before review:** 31 tests (toast.test.ts)
- **After review:** 37 tests (added warning variant coverage)
- **Total project:** 199 tests passing

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1: Success toast | ✅ | toast.ts:134, index.ts:121 |
| AC2: Auto-dismiss 1.5s + fade | ✅ | toast.ts:40, toast.css:29 |
| AC3: Error toast persists | ✅ | toast.ts:39, index.ts:112-113 |
| AC4: Semantic colors | ✅ | toast.css:46-67 |

