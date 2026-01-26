# Story 6.3: Implement Warning Modal Component

Status: done

## Story

As a **user**,
I want **to see a warning before pasting destructive queries**,
So that **I can review and confirm the action before potentially dangerous SQL is executed** (FR23, FR24).

## Acceptance Criteria

1. **Given** I click a query containing destructive keywords (DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT) **When** paste is initiated **Then** a warning modal appears BEFORE pasting (FR23)

2. **Given** the warning modal **When** displayed for DELETE/DROP/TRUNCATE **Then** it shows red header: "Destructive Query Warning"

3. **Given** the warning modal **When** displayed for UPDATE/ALTER/INSERT **Then** it shows amber header: "Caution: Data Modification"

4. **Given** the warning modal content **When** displayed **Then** it shows the query SQL preview (first few lines) (FR24)

5. **Given** the modal **When** displayed **Then** focus is trapped within the modal and Esc dismisses it

6. **Given** the modal **When** accessed by screen reader **Then** it has `role="alertdialog"` with `aria-modal="true"` and descriptive labels

## Tasks / Subtasks

- [x] Task 1: Create warning-modal.ts component (AC: 1, 2, 3, 4)
  - [x] 1.1: Create file `src/popup/components/warning-modal.ts`
  - [x] 1.2: Import types from sql-detection-service.ts (`Severity`, `SqlDetectionResult`)
  - [x] 1.3: Define `WarningModalOptions` interface:
    ```typescript
    interface WarningModalOptions {
      queryName: string
      sql: string
      detection: SqlDetectionResult
      onConfirm: () => void
      onCancel: () => void
    }
    ```
  - [x] 1.4: Implement `showWarningModal(options: WarningModalOptions): void`
  - [x] 1.5: Implement `hideWarningModal(): void`
  - [x] 1.6: Create modal overlay with semi-transparent backdrop
  - [x] 1.7: Create modal content with header, preview, warning text, and buttons

- [x] Task 2: Create warning-modal.css styles (AC: 2, 3)
  - [x] 2.1: Create file `src/popup/components/warning-modal.css`
  - [x] 2.2: Define `.warning-modal-overlay` backdrop styles:
    - Background: `rgba(0, 0, 0, 0.5)`
    - Position: fixed, full viewport
    - Z-index: 1000 (above all content)
  - [x] 2.3: Define `.warning-modal` container styles:
    - Width: 320px max
    - Background: white
    - Border-radius: 8px
    - Box-shadow: elevation shadow
    - Padding: 24px (--space-lg)
  - [x] 2.4: Define `.warning-modal__header--danger` variant (red):
    - Color: `#ea4335` (--color-danger)
  - [x] 2.5: Define `.warning-modal__header--caution` variant (amber):
    - Color: `#b06000` (dark amber for contrast, same as warning-badge)
  - [x] 2.6: Define `.warning-modal__preview` for SQL preview:
    - Font: monospace
    - Background: `#f8f9fa`
    - Max-height: 80px
    - Overflow: auto
  - [x] 2.7: Define button styles (Cancel primary left, Paste Anyway secondary right)

- [x] Task 3: Implement SQL preview truncation (AC: 4)
  - [x] 3.1: Show first 5 lines of SQL or ~300 characters
  - [x] 3.2: Add ellipsis "..." if truncated
  - [x] 3.3: Preserve SQL formatting in preview

- [x] Task 4: Add accessibility and focus trap (AC: 5, 6)
  - [x] 4.1: Add `role="alertdialog"` to modal
  - [x] 4.2: Add `aria-modal="true"`
  - [x] 4.3: Add `aria-labelledby` pointing to header
  - [x] 4.4: Add `aria-describedby` pointing to warning text
  - [x] 4.5: Implement focus trap (Tab cycles within modal)
  - [x] 4.6: Focus Cancel button on open (safer default)
  - [x] 4.7: Handle Esc key to dismiss modal
  - [x] 4.8: Return focus to trigger element on close

- [x] Task 5: Write unit tests for warning-modal.ts (AC: 1, 2, 3, 4, 5, 6)
  - [x] 5.1: Create `src/popup/components/warning-modal.test.ts`
  - [x] 5.2: Test danger modal creation (DELETE, DROP, TRUNCATE)
  - [x] 5.3: Test caution modal creation (UPDATE, ALTER, INSERT)
  - [x] 5.4: Test correct header text and color classes
  - [x] 5.5: Test SQL preview display
  - [x] 5.6: Test SQL truncation for long queries
  - [x] 5.7: Test onConfirm callback fires when "Paste Anyway" clicked
  - [x] 5.8: Test onCancel callback fires when "Cancel" clicked
  - [x] 5.9: Test Esc key triggers onCancel
  - [x] 5.10: Test focus trap behavior
  - [x] 5.11: Test ARIA attributes are set correctly
  - [x] 5.12: Test modal is removed from DOM after hide

## Dev Notes

### Architecture Context

This is **Story 6-3 in Epic 6: Safety & Destructive Query Warnings**. It builds on Stories 6-1 (SQL Detection Service) and 6-2 (Warning Badge) to provide the modal confirmation before pasting destructive queries.

**Component Dependencies:**
- `sql-detection-service.ts` (Story 6-1) - Provides detection result and severity
- `warning-badge.ts` (Story 6-2) - Uses same severity/color patterns
- `toast.ts` (Story 2-5) - Similar modal/overlay patterns to reference
- `icons.ts` - Warning triangle icon

**Next Story (6-4):** Will integrate this modal into the paste flow in tree-item.ts

### UX Specifications (from ux-design-specification.md)

**Warning Modal Component:**

| Aspect | Specification |
|--------|---------------|
| **Overlay** | Semi-transparent black backdrop |
| **Width** | 320px centered |
| **Padding** | 24px (--space-lg) |

**Modal Anatomy:**

```
+----------------------------------+
| Warning Icon  Destructive Query  |  <- Header (red/amber)
+----------------------------------+
| DELETE FROM Orders               |  <- Query preview (mono)
| WHERE Status = 'PENDING'         |
+----------------------------------+
| This query contains DELETE.      |  <- Warning text
| Review carefully before execute. |
+----------------------------------+
|        [Cancel]  [Paste Anyway]  |  <- Actions
+----------------------------------+
```

**Variants:**

| Variant | Header Color | Header Text | Keywords |
|---------|--------------|-------------|----------|
| **Danger** | Red `#ea4335` | "Destructive Query Warning" | DELETE, DROP, TRUNCATE |
| **Caution** | Amber `#b06000` | "Caution: Data Modification" | UPDATE, ALTER, INSERT |

**Button Placement (from UX spec):**
- Cancel is PRIMARY (left) - safer action should be easier to hit
- "Paste Anyway" is SECONDARY (right) - requires deliberate choice

**Focus Management:**
1. On open: Focus Cancel button (safer default)
2. Trap focus within modal
3. On close: Return focus to trigger element

### SQL Detection Service Integration

From Story 6-1, the detection service provides:

```typescript
import {
  detectDestructiveKeywords,
  type SqlDetectionResult,
  type Severity,
} from '../../shared/services/sql-detection-service'

// SqlDetectionResult structure:
interface SqlDetectionResult {
  isDestructive: boolean
  keywords: DestructiveKeyword[]
  severity: Severity // 'danger' | 'caution'
}
```

### Implementation Pattern (based on toast.ts)

```typescript
// src/popup/components/warning-modal.ts

import './warning-modal.css'
import { ICONS } from '../icons'
import type { SqlDetectionResult, Severity } from '../../shared/services/sql-detection-service'

export interface WarningModalOptions {
  queryName: string
  sql: string
  detection: SqlDetectionResult
  onConfirm: () => void
  onCancel: () => void
}

// Module state
let modalOverlay: HTMLDivElement | null = null
let previousActiveElement: HTMLElement | null = null

/**
 * Show warning modal before pasting destructive query
 */
export function showWarningModal(options: WarningModalOptions): void {
  // Store current focus for restoration
  previousActiveElement = document.activeElement as HTMLElement

  // Remove existing modal if any
  hideWarningModal()

  // Create and show modal
  modalOverlay = createModalOverlay(options)
  document.body.appendChild(modalOverlay)

  // Setup focus trap and keyboard handling
  setupFocusTrap(modalOverlay)
  setupKeyboardHandling(options.onCancel)

  // Focus cancel button (safer default)
  const cancelBtn = modalOverlay.querySelector('.warning-modal__btn--cancel') as HTMLButtonElement
  cancelBtn?.focus()
}

/**
 * Hide and remove the warning modal
 */
export function hideWarningModal(): void {
  if (modalOverlay) {
    modalOverlay.remove()
    modalOverlay = null
  }

  // Restore focus
  if (previousActiveElement) {
    previousActiveElement.focus()
    previousActiveElement = null
  }
}
```

### CSS Implementation Pattern

```css
/* src/popup/components/warning-modal.css */

.warning-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.warning-modal {
  background: var(--color-bg);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  width: 320px;
  max-width: calc(100% - 32px);
  padding: var(--space-lg);
}

.warning-modal__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  font-weight: 600;
  font-size: var(--font-size-md);
}

.warning-modal__header--danger {
  color: var(--color-danger);
}

.warning-modal__header--caution {
  color: #b06000; /* Dark amber for contrast */
}

.warning-modal__preview {
  background: #f8f9fa;
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-md);
  max-height: 80px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
}

.warning-modal__text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin-bottom: var(--space-md);
  line-height: 1.5;
}

.warning-modal__actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.warning-modal__btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

.warning-modal__btn--cancel {
  background: var(--color-primary);
  color: white;
  border: none;
}

.warning-modal__btn--cancel:hover {
  background: #3b78e7; /* Slightly darker blue */
}

.warning-modal__btn--confirm {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.warning-modal__btn--confirm:hover {
  background: var(--color-hover);
}

/* Focus styles for accessibility */
.warning-modal__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Focus Trap Implementation

```typescript
function setupFocusTrap(modal: HTMLElement): void {
  const focusableElements = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  })
}

function setupKeyboardHandling(onCancel: () => void): void {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      hideWarningModal()
      document.removeEventListener('keydown', handleKeydown)
    }
  }
  document.addEventListener('keydown', handleKeydown)
}
```

### SQL Preview Truncation

```typescript
function truncateSql(sql: string, maxLines = 5, maxChars = 300): string {
  const lines = sql.split('\n')
  let result = lines.slice(0, maxLines).join('\n')

  if (result.length > maxChars) {
    result = result.slice(0, maxChars)
  }

  const wasTruncated = lines.length > maxLines || sql.length > maxChars
  if (wasTruncated) {
    result = result.trimEnd() + '\n...'
  }

  return result
}
```

### Existing Icons to Use

From `icons.ts`:
- `ICONS.warningTriangle` - For modal header icon

### Previous Story Learnings (from 6-1, 6-2)

1. **Type exports** - Export types directly from the source file (no barrel exports per project-context.md)
2. **CSS BEM naming** - Use `.warning-modal`, `.warning-modal__header`, `.warning-modal--danger` patterns
3. **Test co-location** - Place `warning-modal.test.ts` next to `warning-modal.ts`
4. **Accessibility first** - ARIA roles, labels, and focus management from the start
5. **Module state** - Use module-level variables for singleton patterns (like toast.ts)

### Architecture Compliance

From `project-context.md`:

1. **File naming** - kebab-case: `warning-modal.ts`, `warning-modal.css`
2. **CSS naming** - BEM-inspired: `.warning-modal`, `.warning-modal__header--danger`
3. **Type imports** - Use `import type` syntax
4. **Test co-location** - Test file next to source file
5. **Never throw** - Use callbacks for success/failure, not exceptions

### File Structure

**Files to Create:**
- `src/popup/components/warning-modal.ts` - Modal component
- `src/popup/components/warning-modal.css` - Modal styles
- `src/popup/components/warning-modal.test.ts` - Unit tests

**Files NOT Modified in This Story:**
- `tree-item.ts` - Integration happens in Story 6-4
- `popup.ts` - No changes needed

### Test Examples

```typescript
// warning-modal.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { showWarningModal, hideWarningModal } from './warning-modal'

describe('showWarningModal', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    hideWarningModal()
  })

  it('creates danger modal for DELETE keyword', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    showWarningModal({
      queryName: 'Clear Users',
      sql: 'DELETE FROM users WHERE status = "inactive"',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm,
      onCancel,
    })

    const modal = document.querySelector('.warning-modal')
    expect(modal).not.toBeNull()

    const header = modal?.querySelector('.warning-modal__header')
    expect(header?.textContent).toContain('Destructive Query Warning')
    expect(header?.classList.contains('warning-modal__header--danger')).toBe(true)
  })

  it('creates caution modal for UPDATE keyword', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    showWarningModal({
      queryName: 'Update Status',
      sql: 'UPDATE users SET status = "active"',
      detection: { isDestructive: true, keywords: ['UPDATE'], severity: 'caution' },
      onConfirm,
      onCancel,
    })

    const header = document.querySelector('.warning-modal__header')
    expect(header?.textContent).toContain('Caution: Data Modification')
    expect(header?.classList.contains('warning-modal__header--caution')).toBe(true)
  })

  it('shows SQL preview in modal', () => {
    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM orders',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    const preview = document.querySelector('.warning-modal__preview')
    expect(preview?.textContent).toContain('DELETE FROM orders')
  })

  it('truncates long SQL with ellipsis', () => {
    const longSql = Array(10).fill('SELECT * FROM table').join('\n')

    showWarningModal({
      queryName: 'Long Query',
      sql: longSql,
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    const preview = document.querySelector('.warning-modal__preview')
    expect(preview?.textContent).toContain('...')
  })

  it('calls onConfirm when Paste Anyway clicked', () => {
    const onConfirm = vi.fn()

    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM users',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm,
      onCancel: vi.fn(),
    })

    const confirmBtn = document.querySelector('.warning-modal__btn--confirm') as HTMLButtonElement
    confirmBtn.click()

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn()

    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM users',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel,
    })

    const cancelBtn = document.querySelector('.warning-modal__btn--cancel') as HTMLButtonElement
    cancelBtn.click()

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Escape pressed', () => {
    const onCancel = vi.fn()

    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM users',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel,
    })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('has correct ARIA attributes', () => {
    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM users',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    const modal = document.querySelector('.warning-modal')
    expect(modal?.getAttribute('role')).toBe('alertdialog')
    expect(modal?.getAttribute('aria-modal')).toBe('true')
    expect(modal?.getAttribute('aria-labelledby')).toBeTruthy()
  })

  it('focuses Cancel button on open', () => {
    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM users',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    const cancelBtn = document.querySelector('.warning-modal__btn--cancel')
    expect(document.activeElement).toBe(cancelBtn)
  })

  it('removes modal from DOM after hide', () => {
    showWarningModal({
      queryName: 'Test',
      sql: 'DELETE FROM users',
      detection: { isDestructive: true, keywords: ['DELETE'], severity: 'danger' },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    expect(document.querySelector('.warning-modal')).not.toBeNull()

    hideWarningModal()

    expect(document.querySelector('.warning-modal')).toBeNull()
  })
})
```

### Performance Notes

- Modal creation is O(1) - simple DOM element creation
- Focus trap uses querySelectorAll once on open, not on every keypress
- No async operations - pure synchronous rendering
- Modal should be destroyed after use, not cached

### Project Structure Notes

**Alignment with unified project structure:**
- Component in `src/popup/components/` (correct location)
- CSS co-located with component
- Tests co-located with component

**No conflicts detected with existing code.**

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Warning Modal]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules]
- [Source: _bmad-output/project-context.md#CSS class naming]
- [Source: _bmad-output/implementation-artifacts/6-1-implement-sql-detection-service.md]
- [Source: _bmad-output/implementation-artifacts/6-2-implement-warning-badge-component.md]
- [Source: src/popup/components/toast.ts] (modal pattern reference)
- [Source: src/popup/components/warning-badge.ts] (severity colors reference)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - implementation was straightforward.

### Completion Notes List

- Implemented warning modal component with showWarningModal/hideWarningModal functions
- Created CSS with BEM naming: `.warning-modal`, `.warning-modal__header--danger`, `.warning-modal__header--caution`
- SQL preview truncation: first 5 lines or 300 chars, ellipsis if truncated
- Full accessibility: role="alertdialog", aria-modal="true", aria-labelledby, aria-describedby
- Focus management: Cancel button focused on open, focus trap with Tab cycling, Esc dismisses
- Focus restoration to previous element on close
- 25 unit tests covering all acceptance criteria
- All 812 project tests pass (no regressions)

### File List

- `src/popup/components/warning-modal.ts` (new)
- `src/popup/components/warning-modal.css` (new)
- `src/popup/components/warning-modal.test.ts` (new)

### Change Log

- 2026-01-25: Story 6-3 implementation complete - Warning Modal Component with full accessibility and 25 tests
- 2026-01-25: Code Review (AI) - Updated warning-modal.css to use --color-caution design token
