# Story 3.3: Implement Query Preview Panel

Status: done

## Story

As a **user**,
I want **to preview a query's SQL before pasting**,
So that **I can confirm it's the right query**. (FR8)

## Acceptance Criteria

1. **Given** I select a query in the tree view **When** the selection changes **Then** a preview panel appears at the bottom showing the SQL content

2. **Given** the preview panel **When** displayed **Then** it shows SQL in monospace font (12px) with max-height 80px

3. **Given** a long SQL query **When** displayed in preview **Then** it is scrollable within the panel

4. **Given** no query is selected **When** I view the popup **Then** the preview panel is hidden (collapsed)

## Tasks / Subtasks

- [x] Task 1: Create query-preview component (AC: 1, 2, 3, 4)
  - [x] 1.1: Create `src/popup/components/query-preview.ts` module
  - [x] 1.2: Create `src/popup/components/query-preview.css` stylesheet
  - [x] 1.3: Implement `createQueryPreview()` function returning HTMLElement
  - [x] 1.4: Implement `updateQueryPreview(sql: string | null)` function to show/hide
  - [x] 1.5: Style with monospace font 12px, max-height 80px, scrollable overflow
  - [x] 1.6: Add top border separator (`--color-border`)
  - [x] 1.7: Set background to `#f8f9fa` per UX spec

- [x] Task 2: Integrate preview panel with popup layout (AC: 1, 4)
  - [x] 2.1: Import query-preview into `src/popup/index.ts`
  - [x] 2.2: Replace placeholder preview panel with actual component
  - [x] 2.3: Wire `handleQuerySelectionChange` to update preview panel
  - [x] 2.4: Clear preview panel when selection is null

- [x] Task 3: Handle selection state changes (AC: 1, 4)
  - [x] 3.1: Update tree-view to track selected query (not just ID)
  - [x] 3.2: Pass selected query object to preview update
  - [N/A] 3.3: Handle folder selection (hide preview - folders have no SQL) - Deferred to Epic 4 when folders are implemented
  - [x] 3.4: Handle deselection (hide preview) - Preview hidden by default; re-hiding on explicit deselection deferred to future story

- [x] Task 4: Implement scrollable content for long SQL (AC: 3)
  - [x] 4.1: Add `overflow-y: auto` to preview panel content area
  - [x] 4.2: Preserve whitespace and line breaks in SQL (`white-space: pre-wrap`)
  - [x] 4.3: Test with multi-line SQL queries (10+ lines)

- [x] Task 5: Write comprehensive unit tests
  - [x] 5.1: Test preview panel renders with correct structure
  - [x] 5.2: Test preview shows SQL content when query selected
  - [x] 5.3: Test preview hidden when no selection
  - [x] 5.4: Test preview updates when selection changes
  - [x] 5.5: Test preview has correct CSS class for styling
  - [x] 5.6: Test preview is scrollable for long content
  - [N/A] 5.7: Test folder selection hides preview - Deferred to Epic 4

- [x] Task 6: Accessibility compliance
  - [x] 6.1: Add `role="region"` with `aria-label="Query preview"`
  - [x] 6.2: Ensure preview content is readable by screen readers
  - [x] 6.3: Add `aria-hidden="true"` when panel is collapsed

## Dev Notes

### Architecture Compliance

**CRITICAL patterns from `project-context.md`:**

1. **File naming - kebab-case REQUIRED:**
   - `query-preview.ts` - Component logic
   - `query-preview.css` - Component styles
   - `query-preview.test.ts` - Unit tests

2. **CSS class naming - BEM-inspired:**
   ```css
   .query-preview { }                 /* Component */
   .query-preview__content { }        /* Element */
   .query-preview--hidden { }         /* Modifier */
   ```

3. **TypeScript strict mode - Never throw from services:**
   - Use Result<T> pattern if needed
   - Return void from update functions

4. **Import type for type-only imports:**
   ```typescript
   import type { Query } from '../../shared/types/storage.types';
   ```

### UX Design Specifications

**From UX Spec - Query Preview Panel:**

| Aspect | Specification |
|--------|---------------|
| **Position** | Fixed at bottom of popup |
| **Height** | 80px max, scrollable if longer |
| **Font** | Monospace, 12px |
| **Background** | `#f8f9fa` with top border |

**Preview States (from UX Spec):**

| State | Display |
|-------|---------|
| No selection | Hidden (panel collapsed) |
| Query selected | Shows first ~5 lines of SQL |
| Folder selected | Hidden |

**From Design Tokens:**
```css
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;
--color-border: #dadce0;
--space-sm: 8px;
```

### Current Implementation Status

**Already Exists in `src/popup/index.ts`:**
- Placeholder `<footer class="preview-panel">` element (line 72-74)
- `hidden = true` attribute on placeholder
- `handleQuerySelectionChange()` function (line 197-201) - currently only calls `selectItem()`

**What This Story Implements:**
1. **New Component**: `query-preview.ts` and `query-preview.css`
2. **Integration**: Replace placeholder footer with actual preview component
3. **State Binding**: Wire selection changes to preview updates
4. **Styling**: Monospace, scrollable, 80px max-height

### Implementation Details

**Component Interface:**

```typescript
// query-preview.ts

export interface QueryPreviewOptions {
  // No callbacks needed - purely display component
}

/**
 * Creates the query preview panel element
 * @returns HTMLElement - The preview panel container
 */
export function createQueryPreview(): HTMLDivElement;

/**
 * Updates the preview panel with query SQL
 * @param sql - SQL content to display, or null to hide
 */
export function updateQueryPreview(sql: string | null): void;
```

**Expected DOM Structure:**

```html
<footer class="query-preview" role="region" aria-label="Query preview">
  <pre class="query-preview__content">
    SELECT * FROM Users
    WHERE Status = 'active'
  </pre>
</footer>
```

**CSS Implementation:**

```css
.query-preview {
  background-color: #f8f9fa;
  border-top: 1px solid var(--color-border, #dadce0);
  max-height: 80px;
  overflow-y: auto;
  padding: var(--space-sm, 8px);
}

.query-preview--hidden {
  display: none;
}

.query-preview__content {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text, #202124);
}
```

### Integration with Popup

**Update `src/popup/index.ts`:**

1. Import the new component:
   ```typescript
   import { createQueryPreview, updateQueryPreview } from './components/query-preview'
   ```

2. Replace placeholder:
   ```typescript
   // Before (line 72-74):
   const previewPanel = document.createElement('footer')
   previewPanel.className = 'preview-panel'
   previewPanel.hidden = true

   // After:
   const previewPanel = createQueryPreview()
   ```

3. Update selection handler:
   ```typescript
   function handleQuerySelectionChange(query: Query): void {
     selectItem(query.id)
     updateQueryPreview(query.sql)  // NEW: Update preview
   }
   ```

4. Handle deselection (when clicking elsewhere):
   ```typescript
   // When tree loses selection or folder selected
   updateQueryPreview(null)
   ```

### Previous Story Intelligence (Story 3-2)

**Key Learnings from Story 3-2:**

1. **Separation of Selection vs Activation:**
   - Story 3-2 separated `onItemSelect` (keyboard nav) from `onItemActivate` (click/Enter)
   - Preview should update on `onItemSelect`, NOT on activation
   - This prevents the preview from updating after paste

2. **SQL Safety Utils Already Exist:**
   - `src/shared/utils/sql-utils.ts` has `checkSqlSafety()` function
   - Can be used to show warning badge in preview (future enhancement)

3. **Test Patterns Established:**
   - DOM cleanup in `beforeEach/afterEach`
   - Mock chrome APIs before tests
   - Use `aria-*` attributes for accessibility tests

4. **File Structure Pattern:**
   - Component in `components/[name].ts`
   - CSS in `components/[name].css`
   - Tests co-located in `components/[name].test.ts`

### Git Intelligence

**Recent Commit Pattern (from bc55d00):**
- Service worker handlers added for new message types
- Tests added comprehensively (77+ new tests in tree-item.test.ts)
- CSS follows design tokens from `index.css`
- All changes pass 289 tests

**Files Modified in Recent Work:**
- `src/popup/index.ts` - Primary integration point
- `src/popup/components/` - Component directory
- Tests added next to source files

### Testing Strategy

**Unit Test Coverage Required:**

```typescript
// query-preview.test.ts

describe('Query Preview Panel', () => {
  describe('createQueryPreview', () => {
    it('should return a footer element', () => {});
    it('should have class "query-preview"', () => {});
    it('should have role="region"', () => {});
    it('should have aria-label', () => {});
    it('should be hidden by default', () => {});
  });

  describe('updateQueryPreview', () => {
    it('should show panel when SQL provided', () => {});
    it('should hide panel when null provided', () => {});
    it('should display SQL content in pre element', () => {});
    it('should update content when called multiple times', () => {});
    it('should preserve whitespace in SQL', () => {});
  });

  describe('styling', () => {
    it('should have monospace font class', () => {});
    it('should have correct max-height in CSS', () => {});
    it('should be scrollable for long content', () => {});
  });

  describe('accessibility', () => {
    it('should have aria-hidden when collapsed', () => {});
    it('should remove aria-hidden when visible', () => {});
  });
});
```

### Project Structure Notes

**Files to Create:**
- `src/popup/components/query-preview.ts` - Component logic
- `src/popup/components/query-preview.css` - Component styles
- `src/popup/components/query-preview.test.ts` - Unit tests

**Files to Modify:**
- `src/popup/index.ts` - Import and integrate component
- `src/popup/index.css` - May need to adjust layout for preview

**Expected Test Count After Story:**
- `query-preview.test.ts` - ~15-20 tests
- Total project tests: ~310+

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Query Preview Panel]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: _bmad-output/project-context.md#CSS class naming]
- [Source: _bmad-output/implementation-artifacts/3-2-implement-tree-item-component-query-variant.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered

### Completion Notes List

- **Task 1**: Created `query-preview.ts` component with `createQueryPreview()` and `updateQueryPreview()` functions. Created `query-preview.css` with monospace 12px font, 80px max-height, scrollable overflow, #f8f9fa background, and top border separator.
- **Task 2**: Integrated preview panel into popup by importing the component, replacing placeholder footer, and wiring `handleQuerySelectionChange` to call `updateQueryPreview()` with query SQL.
- **Task 3**: Selection state handling works correctly - tree-view already tracks query objects via `onItemSelect` callback. Task 3.3 (folder selection) deferred to Epic 4 when folders are implemented. Task 3.4 (deselection) partially met - preview hidden by default; explicit deselection (click away, Escape key) not implemented as no deselection mechanism exists in current tree-view.
- **Task 4**: Scrollable content implemented via CSS (`overflow-y: auto`, `white-space: pre-wrap`).
- **Task 5**: Created 18 comprehensive unit tests covering structure, content updates, visibility, accessibility attributes, and long content handling.
- **Task 6**: Accessibility implemented with `role="region"`, `aria-label="Query preview"`, and `aria-hidden` that toggles with visibility.

### File List

**Created:**
- `src/popup/components/query-preview.ts`
- `src/popup/components/query-preview.css`
- `src/popup/components/query-preview.test.ts`

**Modified:**
- `src/popup/index.ts`
- `src/popup/index.css` (removed dead .preview-panel CSS)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-01-22: Story 3-3 implemented - Query preview panel component with full test coverage (307 total tests passing)
- 2026-01-22: Code review fixes - Updated task status for folder-related items (deferred to Epic 4), removed dead CSS from index.css
