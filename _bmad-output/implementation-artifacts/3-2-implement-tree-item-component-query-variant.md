# Story 3.2: Implement Tree Item Component (Query Variant)

Status: done

## Story

As a **user**,
I want **to see each query as a clickable item in the tree**,
So that **I can select and interact with queries**.

## Acceptance Criteria

1. **Given** a query tree item **When** rendered **Then** it displays at 32px height with query name and icon

2. **Given** a query tree item **When** I click on it **Then** it becomes selected (blue left border, light blue background)

3. **Given** a query tree item **When** selected **Then** only one item can be selected at a time

4. **Given** keyboard navigation **When** I press Up/Down arrows **Then** selection moves between tree items

## Tasks / Subtasks

- [x] Task 1: Extend tree-item.ts with enhanced selection feedback (AC: 1, 2)
  - [x] 1.1: Verify 32px height is correctly applied in tree-item.css
  - [x] 1.2: Add visual selection indicator (2px blue left border when selected)
  - [x] 1.3: Ensure selected background color is `#e8f0fe` (light blue)
  - [x] 1.4: Verify query icon displays correctly (16x16px, blue `#4285f4`)

- [x] Task 2: Implement single-selection constraint in tree-view.ts (AC: 3)
  - [x] 2.1: Verify `selectItem()` function clears previous selection
  - [x] 2.2: Ensure only one `tree-item--selected` class exists at a time
  - [x] 2.3: Update `aria-selected` attribute correctly for all items
  - [x] 2.4: Confirm state.selectedId tracks current selection accurately

- [x] Task 3: Implement keyboard navigation for selection (AC: 4)
  - [x] 3.1: Verify existing ArrowUp/ArrowDown handlers in tree-view.ts move focus
  - [x] 3.2: Ensure focus movement triggers selection change (not just focus)
  - [x] 3.3: Add Home key to select first item
  - [x] 3.4: Add End key to select last item
  - [x] 3.5: Ensure focus-visible indicator shows on keyboard navigation

- [x] Task 4: Add click-to-paste behavior (AC: 2)
  - [x] 4.1: Single click on query should both select AND trigger paste action
  - [x] 4.2: Dispatch custom event or callback for paste handling
  - [x] 4.3: Integrate with existing `onItemSelect` callback in tree-view options

- [x] Task 5: Write comprehensive unit tests
  - [x] 5.1: Test tree item renders at 32px height
  - [x] 5.2: Test selection adds correct CSS class and ARIA attribute
  - [x] 5.3: Test single selection constraint (previous selection cleared)
  - [x] 5.4: Test ArrowUp/ArrowDown moves selection
  - [x] 5.5: Test Home/End selects first/last item
  - [x] 5.6: Test click handler triggers selection callback

- [x] Task 6: Accessibility verification (AC: 4)
  - [x] 6.1: Verify `role="treeitem"` is set
  - [x] 6.2: Verify `aria-selected` updates on selection
  - [x] 6.3: Verify `aria-level` is set correctly
  - [x] 6.4: Test with keyboard-only navigation

## Dev Notes

### Architecture Compliance

**CRITICAL patterns from `project-context.md`:**

1. **File naming - kebab-case REQUIRED:**
   - All existing files follow this: `tree-item.ts`, `tree-view.ts`
   - No changes needed to file structure

2. **CSS class naming - BEM-inspired:**
   ```css
   .tree-item { }                     /* Component */
   .tree-item__icon { }               /* Element */
   .tree-item__name { }               /* Element */
   .tree-item--selected { }           /* Modifier */
   .tree-item--query { }              /* Type modifier */
   ```

3. **TypeScript strict mode - Never throw from services:**
   - All callbacks return void
   - Selection operations don't throw

4. **Import type for type-only imports:**
   ```typescript
   import type { Query } from '../../shared/types/storage.types';
   ```

### UX Design Specifications

**From UX Spec - Tree Item Component:**

| Aspect | Specification |
|--------|---------------|
| **Height** | 32px |
| **Padding** | 8px horizontal, centered vertically |
| **Indent** | 16px per nesting level |

**Tree Item States:**

| State | Style |
|-------|-------|
| Default | `background: transparent` |
| Hover | `background: #e8f0fe` |
| Selected | `background: #e8f0fe; border-left: 2px solid #4285f4` |
| Focused | `outline: 2px solid #4285f4` |

**Keyboard Navigation (from UX Spec):**

| Key | Action |
|-----|--------|
| `Up/Down` | Move selection up/down |
| `Enter` | Paste selected query |
| `Tab` | Move to next focusable element |

### Current Implementation Status

**Already Implemented in Story 3-1:**
- Basic `createTreeItem()` function in `tree-item.ts`
- CSS styling for hover and selected states
- ARIA attributes (`role="treeitem"`, `aria-selected`, `aria-level`)
- Click and keyboard (Enter/Space) handlers
- Arrow key navigation (ArrowUp, ArrowDown, Home, End) in `tree-view.ts`
- Selection state management via `selectItem()` function

**What This Story Enhances:**
1. **Verify selection visual indicator** - Confirm 2px blue left border shows on selection
2. **Ensure selection triggers paste** - Click should both select AND paste
3. **Keyboard selection** - Arrow keys should change selection, not just focus
4. **Single selection constraint** - Verify only one item selected at a time

### Implementation Details

**Key Code Locations:**

| File | Purpose |
|------|---------|
| `src/popup/components/tree-item.ts` | Create individual tree items |
| `src/popup/components/tree-item.css` | Tree item styling |
| `src/popup/components/tree-view.ts` | Container, selection management, keyboard nav |
| `src/popup/components/tree-view.css` | Container styling |
| `src/popup/index.ts` | Integration point |

**Selection Flow:**

```
User clicks query item
    ↓
tree-item click handler fires onClick(query.id)
    ↓
tree-view selectItem(id) called
    ↓
1. Update state.selectedId
2. Clear previous .tree-item--selected
3. Add .tree-item--selected to new item
4. Update aria-selected on all items
5. Call onItemSelect callback (for paste)
```

**Keyboard Selection Flow:**

```
User presses ArrowDown while tree item focused
    ↓
tree-view keydown handler intercepts
    ↓
1. Find next sibling tree item
2. Focus the next item
3. Call selectItem(nextItem.dataset.id)
4. Selection moves with focus
```

### CSS Verification Checklist

The following CSS should already exist in `tree-item.css`:

```css
.tree-item {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--space-sm, 8px);
  cursor: pointer;
  user-select: none;
  border-left: 2px solid transparent;
  transition: background-color 150ms ease;
}

.tree-item:hover {
  background-color: var(--color-hover, #e8f0fe);
}

.tree-item--selected {
  background-color: var(--color-hover, #e8f0fe);
  border-left-color: var(--color-primary, #4285f4);
}

.tree-item:focus-visible {
  outline: 2px solid var(--color-primary, #4285f4);
  outline-offset: -2px;
}

.tree-item__icon {
  width: 16px;
  height: 16px;
  margin-right: var(--space-sm, 8px);
  color: var(--color-primary, #4285f4);
}

.tree-item__name {
  flex: 1;
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text, #202124);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Integration Notes

**Click-to-Paste Behavior:**

Current implementation in `tree-view.ts` calls `onItemSelect` callback when a query is clicked. This callback should trigger paste. Verify in `index.ts`:

```typescript
const treeView = createTreeView({
  onItemSelect: (query) => {
    // This should trigger paste to SMP
    handlePasteQuery(query);
  },
});
```

**Selection Persistence:**

Selection state is stored in `tree-view.ts` module scope:
```typescript
let state: TreeViewState = { selectedId: null };
```

This resets when popup closes (expected behavior per architecture).

### Previous Story Intelligence (Story 3-1)

**From Story 3-1 Code Review Fixes:**
1. Arrow key navigation was added (ArrowUp, ArrowDown, Home, End)
2. `aria-level` attribute was added for ARIA tree pattern compliance
3. `cleanup()` function was added to remove event listeners
4. Comprehensive tests for scrollable behavior and hover states

**Patterns Established:**
- Use `querySelectorAll('.tree-item')` for item collection
- Use `dataset.id` to identify items
- Focus management uses `element.focus()` directly
- Tests mock DOM with `document.body.innerHTML = ''` cleanup

### Testing Strategy

**Unit Test Coverage Required:**

```typescript
describe('tree-item selection', () => {
  it('should display at 32px height', () => {
    // Verify computed height or CSS class presence
  });

  it('should show selected state with correct styling', () => {
    // Create item, trigger selection, verify classes
  });

  it('should only allow single selection', () => {
    // Create multiple items, select each, verify only one selected
  });

  it('should move selection on ArrowDown', () => {
    // Focus first item, dispatch ArrowDown, verify second selected
  });

  it('should move selection on ArrowUp', () => {
    // Focus second item, dispatch ArrowUp, verify first selected
  });

  it('should select first item on Home key', () => {
    // Focus any item, dispatch Home, verify first selected
  });

  it('should select last item on End key', () => {
    // Focus any item, dispatch End, verify last selected
  });
});
```

### Project Structure Notes

**Files Touched in This Story:**
- `src/popup/components/tree-item.ts` - Minor verification/enhancement
- `src/popup/components/tree-item.css` - Verify existing styles
- `src/popup/components/tree-view.ts` - Verify keyboard selection behavior
- `src/popup/components/tree-item.test.ts` - Add selection-specific tests
- `src/popup/index.ts` - Verify paste integration

**Expected Test File Count After Story:**
- `tree-item.test.ts` - Should have ~30+ tests
- `tree-view.test.ts` - Should have ~30+ tests

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tree Item]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Navigation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules]
- [Source: _bmad-output/project-context.md#CSS class naming]
- [Source: _bmad-output/implementation-artifacts/3-1-implement-tree-view-container.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered

### Completion Notes List

1. **Task 1 (Visual Feedback)**: Verified existing CSS in `tree-item.css` correctly implements 32px height, 2px blue border on selection, and 16x16px blue icon. All styles were already in place from Story 3-1.

2. **Task 2 (Single Selection)**: Verified `selectItem()` in `tree-view.ts:107-120` correctly clears previous selection, toggles classes, and updates ARIA attributes. Tests confirm single selection constraint.

3. **Task 3 (Keyboard Navigation)**: Verified ArrowUp/ArrowDown/Home/End handlers in `tree-view.ts:153-209` move both focus AND selection. Focus-visible CSS rule exists in `tree-item.css:25-28`.

4. **Task 4 (Click-to-Paste)**: **NEW IMPLEMENTATION** - Added `PASTE_QUERY` handler to service worker (`src/background/index.ts`), and updated popup's `handleQuerySelect` (`src/popup/index.ts`) to send paste message and show toast feedback.

5. **Task 5 (Unit Tests)**: Added 18 new tests across `tree-item.test.ts` and `tree-view.test.ts` for Story 3-2 specific requirements. After code review fixes, total test count: 289 passing.

6. **Task 6 (Accessibility)**: Verified and added tests for `role="treeitem"`, `aria-selected`, `aria-level`, and keyboard-only navigation support.

### File List

**Modified:**
- `src/background/index.ts` - Added PASTE_QUERY handler and handlePasteQuery function
- `src/popup/index.ts` - Updated handleQuerySelect to use separate onItemSelect/onItemActivate callbacks; added SQL safety warning before paste; added Enter key handler for explicit paste
- `src/popup/components/tree-view.ts` - Added onItemActivate callback and activateSelectedItem() function to separate navigation from paste
- `src/popup/components/tree-item.test.ts` - Added 10 new tests for visual specs and accessibility
- `src/popup/components/tree-view.test.ts` - Added 12 new tests for single selection, keyboard selection, and activation behavior
- `src/shared/utils/sql-utils.ts` - NEW: Added SQL safety detection utility (checkSqlSafety, getDangerousSqlWarning)
- `src/shared/utils/sql-utils.test.ts` - NEW: Added 16 tests for SQL safety detection
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status

**Unchanged (verified existing implementation):**
- `src/popup/components/tree-item.ts` - Already had correct implementation from Story 3-1
- `src/popup/components/tree-item.css` - Already had correct styles from Story 3-1
- `src/popup/components/tree-view.css` - Already had correct styles

### Change Log

- 2026-01-22: Story 3-2 implementation complete. Added click-to-paste functionality via PASTE_QUERY message flow. Added 18 unit tests for visual specifications and accessibility. All 269 tests pass.
- 2026-01-22: **Code Review Fixes Applied:**
  - M3: Separated keyboard navigation from paste action - Arrow keys now only update selection, Enter key triggers paste (per UX spec)
  - M4: Added SQL safety warning before paste - dangerous operations (DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT) now show confirmation dialog
  - Added `sql-utils.ts` with `checkSqlSafety()` and `getDangerousSqlWarning()` functions
  - Added `onItemActivate` callback to tree-view for explicit paste triggering
  - Added 20 new tests (4 tree-view tests + 16 sql-utils tests). Total: 289 tests passing.
