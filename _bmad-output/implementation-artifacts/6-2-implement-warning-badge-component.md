# Story 6.2: Implement Warning Badge Component

Status: done

## Story

As a **user**,
I want **to see a visual indicator on destructive queries in my library**,
So that **I know which queries require extra caution before pasting**.

## Acceptance Criteria

1. **Given** a query containing DELETE, DROP, or TRUNCATE **When** displayed in tree view **Then** it shows a red warning badge on the right side (e.g., "DELETE" or "DROP")

2. **Given** a query containing UPDATE or ALTER **When** displayed in tree view **Then** it shows an amber warning badge (e.g., "UPDATE" or "ALTER")

3. **Given** a safe SELECT query **When** displayed in tree view **Then** no warning badge appears

4. **Given** the warning badge **When** rendered **Then** it uses semantic colors from design tokens (red for danger, amber for caution)

5. **Given** the warning badge **When** accessed by screen reader **Then** it has appropriate aria-label (e.g., "Destructive query: DELETE")

## Tasks / Subtasks

- [x] Task 1: Create warning-badge.ts component (AC: 1, 2, 3, 4)
  - [x] 1.1: Create file `src/popup/components/warning-badge.ts`
  - [x] 1.2: Import types from sql-detection-service.ts (`Severity`, `DestructiveKeyword`)
  - [x] 1.3: Define `WarningBadgeOptions` interface:
    ```typescript
    interface WarningBadgeOptions {
      keyword: DestructiveKeyword
      severity: Severity
    }
    ```
  - [x] 1.4: Implement `createWarningBadge(options: WarningBadgeOptions): HTMLSpanElement`
  - [x] 1.5: Apply correct CSS class based on severity:
    - `warning-badge--danger` for DELETE, DROP, TRUNCATE
    - `warning-badge--caution` for UPDATE, ALTER, INSERT
  - [x] 1.6: Set text content to keyword (e.g., "DELETE", "UPDATE")

- [x] Task 2: Create warning-badge.css styles (AC: 4)
  - [x] 2.1: Create file `src/popup/components/warning-badge.css`
  - [x] 2.2: Define `.warning-badge` base styles:
    - Font size: 10px
    - Padding: 2px 6px
    - Border radius: 2px
    - Font weight: 500
  - [x] 2.3: Define `.warning-badge--danger` variant:
    - Background: `#fce8e6` (light red)
    - Color: `#ea4335` (danger red)
  - [x] 2.4: Define `.warning-badge--caution` variant:
    - Background: `#fef7e0` (light amber)
    - Color: `#b06000` (dark amber for contrast)

- [x] Task 3: Add accessibility attributes (AC: 5)
  - [x] 3.1: Add `role="status"` to badge element
  - [x] 3.2: Add `aria-label` with descriptive text (e.g., "Destructive query: DELETE")

- [x] Task 4: Integrate badge into tree-item.ts (AC: 1, 2, 3)
  - [x] 4.1: Import `createWarningBadge` and `detectDestructiveKeywords` in tree-item.ts
  - [x] 4.2: Update `TreeItemOptions` to include optional `sql?: string` property
  - [x] 4.3: In `createTreeItem()`, after creating name span:
    - Call `detectDestructiveKeywords(query.sql)` if sql is available
    - If `isDestructive === true`, create badge with first keyword and severity
    - Append badge after name span
  - [x] 4.4: Ensure badge is positioned on right side of tree item (flexbox)

- [x] Task 5: Write unit tests for warning-badge.ts (AC: 1, 2, 3, 4, 5)
  - [x] 5.1: Create `src/popup/components/warning-badge.test.ts`
  - [x] 5.2: Test danger badge creation (DELETE, DROP, TRUNCATE)
  - [x] 5.3: Test caution badge creation (UPDATE, ALTER, INSERT)
  - [x] 5.4: Test correct CSS classes applied
  - [x] 5.5: Test correct text content
  - [x] 5.6: Test aria-label is set correctly
  - [x] 5.7: Test role="status" is set

- [x] Task 6: Update tree-item tests for badge integration (AC: 1, 2, 3)
  - [x] 6.1: Add test: query with DELETE shows danger badge
  - [x] 6.2: Add test: query with UPDATE shows caution badge
  - [x] 6.3: Add test: safe SELECT query shows no badge
  - [x] 6.4: Add test: query with multiple keywords shows first keyword's badge

## Dev Notes

### Architecture Context

This is **Story 6-2 in Epic 6: Safety & Destructive Query Warnings**. It builds directly on Story 6-1's SQL Detection Service and provides the visual indicator that later stories (6-3, 6-4) will complement with warning modals.

**Component Dependencies:**
- `sql-detection-service.ts` (Story 6-1) - Provides `detectDestructiveKeywords()` function
- `tree-item.ts` - Will render badges inline with query names

### UX Specifications (from ux-design-specification.md)

**Warning Badge Component:**

| Aspect | Specification |
|--------|---------------|
| **Size** | 10px font, 2px/6px padding |
| **Position** | Right side of tree item |

**Variants:**

| Variant | Text | Background | Color |
|---------|------|------------|-------|
| **Danger** | DELETE, DROP, TRUNCATE | `#fce8e6` | `#ea4335` |
| **Caution** | UPDATE, ALTER, INSERT | `#fef7e0` | `#b06000` |

**Accessibility:**
- `aria-label="Destructive query: DELETE"` for screen readers

### SQL Detection Service Integration

From Story 6-1, the detection service provides:

```typescript
import {
  detectDestructiveKeywords,
  type DestructiveKeyword,
  type Severity,
  type SqlDetectionResult,
} from '../../shared/services/sql-detection-service'

// Example usage in tree-item.ts:
const detection = detectDestructiveKeywords(query.sql)
if (detection.isDestructive) {
  const badge = createWarningBadge({
    keyword: detection.keywords[0], // Show first/most severe keyword
    severity: detection.severity,
  })
  item.appendChild(badge)
}
```

### Badge Component Implementation

```typescript
// src/popup/components/warning-badge.ts

import './warning-badge.css'
import type { DestructiveKeyword, Severity } from '../../shared/services/sql-detection-service'

export interface WarningBadgeOptions {
  keyword: DestructiveKeyword
  severity: Severity
}

/**
 * Create a warning badge element for destructive queries
 */
export function createWarningBadge(options: WarningBadgeOptions): HTMLSpanElement {
  const { keyword, severity } = options

  const badge = document.createElement('span')
  badge.className = `warning-badge warning-badge--${severity}`
  badge.textContent = keyword

  // Accessibility
  badge.setAttribute('role', 'status')
  badge.setAttribute('aria-label', `Destructive query: ${keyword}`)

  return badge
}
```

### CSS Implementation

```css
/* src/popup/components/warning-badge.css */

.warning-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 2px;
  margin-left: auto; /* Push to right in flexbox */
  flex-shrink: 0; /* Don't shrink badge */
}

.warning-badge--danger {
  background-color: #fce8e6;
  color: #ea4335;
}

.warning-badge--caution {
  background-color: #fef7e0;
  color: #b06000;
}
```

### Tree Item Integration

**Current tree-item.ts structure:**

```typescript
// In createTreeItem():
const item = document.createElement('div')
item.className = 'tree-item tree-item--query'

// Icon
const iconSpan = document.createElement('span')
iconSpan.className = 'tree-item__icon'
iconSpan.innerHTML = ICONS.query
item.appendChild(iconSpan)

// Name
const nameSpan = document.createElement('span')
nameSpan.className = 'tree-item__name'
nameSpan.textContent = query.name
item.appendChild(nameSpan)

// ADD WARNING BADGE HERE (after name span)
```

**Required CSS update to tree-item.css:**

```css
.tree-item {
  display: flex;
  align-items: center;
  /* existing styles... */
}

.tree-item__name {
  flex: 1; /* Take remaining space, but allow badge to push right */
  /* existing styles... */
}
```

### Previous Story Learnings (from 6-1)

1. **Type exports** - Export types directly from the source file (no barrel exports per project-context.md)
2. **Result objects** - Not needed for badge creation (pure render function)
3. **Test organization** - Co-locate tests with source files
4. **Edge case coverage** - Handle null/undefined gracefully

### Architecture Compliance

From `project-context.md`:

1. **File naming** - kebab-case: `warning-badge.ts`, `warning-badge.css` ✓
2. **CSS naming** - BEM-inspired: `.warning-badge`, `.warning-badge--danger` ✓
3. **Type imports** - Use `import type` syntax ✓
4. **Test co-location** - Test file next to source file ✓
5. **Never throw** - Pure render function, no errors to handle ✓

### File Structure

**Files to Create:**
- `src/popup/components/warning-badge.ts` - Badge component
- `src/popup/components/warning-badge.css` - Badge styles
- `src/popup/components/warning-badge.test.ts` - Unit tests

**Files to Modify:**
- `src/popup/components/tree-item.ts` - Import and render badge
- `src/popup/components/tree-item.css` - Ensure flexbox layout for badge positioning
- `src/popup/components/tree-item.test.ts` - Add badge integration tests

### Test Examples

```typescript
// warning-badge.test.ts
describe('createWarningBadge', () => {
  it('creates danger badge for DELETE keyword', () => {
    const badge = createWarningBadge({ keyword: 'DELETE', severity: 'danger' })

    expect(badge.textContent).toBe('DELETE')
    expect(badge.classList.contains('warning-badge')).toBe(true)
    expect(badge.classList.contains('warning-badge--danger')).toBe(true)
    expect(badge.getAttribute('aria-label')).toBe('Destructive query: DELETE')
  })

  it('creates caution badge for UPDATE keyword', () => {
    const badge = createWarningBadge({ keyword: 'UPDATE', severity: 'caution' })

    expect(badge.textContent).toBe('UPDATE')
    expect(badge.classList.contains('warning-badge--caution')).toBe(true)
  })
})

// tree-item.test.ts additions
describe('createTreeItem with warning badge', () => {
  it('shows danger badge for query with DELETE', () => {
    const query = { id: '1', name: 'Clear Users', sql: 'DELETE FROM users', ... }
    const item = createTreeItem({ query, isSelected: false })

    const badge = item.querySelector('.warning-badge')
    expect(badge).not.toBeNull()
    expect(badge?.textContent).toBe('DELETE')
    expect(badge?.classList.contains('warning-badge--danger')).toBe(true)
  })

  it('shows no badge for safe SELECT query', () => {
    const query = { id: '2', name: 'Get Users', sql: 'SELECT * FROM users', ... }
    const item = createTreeItem({ query, isSelected: false })

    const badge = item.querySelector('.warning-badge')
    expect(badge).toBeNull()
  })
})
```

### Performance Notes

- Badge creation is O(1) - simple DOM element creation
- SQL detection (from 6-1) is O(n) where n = SQL length, but cached via detectDestructiveKeywords
- Badge should be created once per tree render, not on every frame
- No async operations - pure synchronous rendering

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Warning Badge]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules]
- [Source: _bmad-output/project-context.md#CSS class naming]
- [Source: _bmad-output/implementation-artifacts/6-1-implement-sql-detection-service.md]
- [Source: src/popup/components/tree-item.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation completed without errors.

### Completion Notes List

- ✅ Created `warning-badge.ts` component with `createWarningBadge()` function
- ✅ Created `warning-badge.css` with danger (red) and caution (amber) variants
- ✅ Added accessibility: `role="status"` and `aria-label="Destructive query: {keyword}"`
- ✅ Integrated badge into `tree-item.ts` using `detectDestructiveKeywords()` from Story 6-1
- ✅ Badge displays after name span, positioned right via CSS flexbox (`margin-left: auto`)
- ✅ 17 unit tests for warning-badge component (all passing)
- ✅ 14 integration tests for tree-item badge display (all passing)
- ✅ Full test suite: 786 tests passing, 0 regressions

### Implementation Notes

- Used existing `query.sql` property from Query type - no need to add `sql` to TreeItemOptions
- Badge shows first detected keyword when multiple destructive keywords present
- Severity determined by `detectDestructiveKeywords()` - danger keywords take precedence
- tree-item.css already had correct flexbox layout (`display: flex`, `.tree-item__name { flex: 1 }`)

### File List

**Created:**
- `src/popup/components/warning-badge.ts` - Badge component
- `src/popup/components/warning-badge.css` - Badge styles
- `src/popup/components/warning-badge.test.ts` - Unit tests (17 tests)

**Modified:**
- `src/popup/components/tree-item.ts` - Added badge integration
- `src/popup/components/tree-item.test.ts` - Added 14 integration tests
- `src/popup/design-tokens.css` - Added --color-danger-bg, --color-caution, --color-caution-bg tokens

### Change Log

- 2026-01-25: Implemented Story 6-2 Warning Badge Component (all ACs satisfied)
- 2026-01-25: Code Review (AI) - Fixed aria-label to use "Caution:" prefix for non-destructive keywords (UPDATE, ALTER, INSERT)
- 2026-01-25: Code Review (AI) - Updated warning-badge.css to use design tokens instead of hardcoded colors
- 2026-01-25: Code Review (AI) - Added --color-danger-bg, --color-caution, --color-caution-bg to design-tokens.css
- 2026-01-25: Code Review (AI) - Fixed mid-file imports in tree-item.test.ts (moved to top)

### Senior Developer Review (AI)

**Review Date:** 2026-01-25
**Reviewer:** Claude Opus 4.5
**Outcome:** ✅ APPROVED

**Summary:**
- All 5 Acceptance Criteria implemented correctly
- All tasks marked [x] verified as complete
- 787 tests passing (0 regressions)
- Code follows project conventions (kebab-case files, BEM CSS, Result types)

**Issues Found & Fixed:**
1. **L1 (Fixed):** aria-label now uses "Caution: {keyword}" for INSERT/UPDATE/ALTER instead of misleading "Destructive query"
2. Added additional test for caution badge aria-label verification

**Issues Noted (No Fix Required):**
- M2: INSERT as "caution" keyword is a design decision - product may want to revisit
- L2-L4: Minor documentation/style preferences, no functional impact

