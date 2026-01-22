# Story 3.5: Implement Context Menu (Rename & Delete)

Status: done

## Story

As a **user**,
I want **to right-click a query for additional actions**,
So that **I can rename or delete queries**. (FR26, FR27)

## Acceptance Criteria

1. **Given** I right-click on a query tree item **When** the context menu appears **Then** it shows options: "Rename", "Delete"

2. **Given** I select "Rename" from context menu **When** the rename dialog appears **Then** I can edit the query name and save changes (FR26)

3. **Given** I select "Delete" from context menu **When** I confirm the deletion **Then** the query is removed from storage (FR27)

4. **Given** I click outside the context menu **When** focus is lost **Then** the menu closes

5. **Given** keyboard navigation **When** context menu is open **Then** I can navigate with arrow keys and select with Enter

## Tasks / Subtasks

- [x] Task 1: Create context-menu.ts component (AC: 1, 4, 5)
  - [x] 1.1: Create `src/popup/components/context-menu.ts` with type definitions
  - [x] 1.2: Create `src/popup/components/context-menu.css` matching UX spec (160px width, shadow, positioning)
  - [x] 1.3: Implement `showContextMenu(x, y, items, onSelect)` function
  - [x] 1.4: Implement menu positioning logic (anchor to click, stay in viewport)
  - [x] 1.5: Implement click-outside to close (document click listener)
  - [x] 1.6: Implement Escape key to close menu
  - [x] 1.7: Implement arrow key navigation between menu items
  - [x] 1.8: Implement Enter/Space key to select focused item
  - [x] 1.9: Add ARIA attributes: `role="menu"`, `role="menuitem"`, `aria-activedescendant`

- [x] Task 2: Add right-click handler to tree-item.ts (AC: 1)
  - [x] 2.1: Add `contextmenu` event listener to tree-item element
  - [x] 2.2: Prevent default browser context menu with `e.preventDefault()`
  - [x] 2.3: Add `onContextMenu?: (id: string, x: number, y: number) => void` to TreeItemOptions
  - [x] 2.4: Pass click coordinates to parent for menu positioning

- [x] Task 3: Implement rename functionality (AC: 2)
  - [x] 3.1: Create inline rename input or prompt dialog when "Rename" selected
  - [x] 3.2: Pre-populate input with current query name
  - [x] 3.3: Call `updateQuery(id, { name: newName })` from storage-service
  - [x] 3.4: Show success toast "Renamed to: {newName}"
  - [x] 3.5: Show error toast if rename fails
  - [x] 3.6: Refresh tree view to show updated name
  - [x] 3.7: Handle empty name validation (show error, don't save)

- [x] Task 4: Implement delete functionality (AC: 3)
  - [x] 4.1: Show confirmation dialog: "Delete '{queryName}'? This cannot be undone."
  - [x] 4.2: Call `deleteQuery(id)` from storage-service on confirmation
  - [x] 4.3: Show success toast "Deleted: {queryName}"
  - [x] 4.4: Show error toast if delete fails
  - [x] 4.5: Refresh tree view to remove deleted query
  - [x] 4.6: Clear selection if deleted query was selected

- [x] Task 5: Integrate context menu with popup/index.ts
  - [x] 5.1: Import context-menu component
  - [x] 5.2: Track which query triggered context menu (store query reference)
  - [x] 5.3: Handle "Rename" menu item selection -> trigger rename flow
  - [x] 5.4: Handle "Delete" menu item selection -> trigger delete flow
  - [x] 5.5: Ensure only one context menu open at a time

- [x] Task 6: Write comprehensive unit tests
  - [x] 6.1: Test context menu renders with correct items
  - [x] 6.2: Test menu positioning stays in viewport
  - [x] 6.3: Test click-outside closes menu
  - [x] 6.4: Test Escape closes menu
  - [x] 6.5: Test arrow key navigation
  - [x] 6.6: Test Enter selects item
  - [x] 6.7: Test rename calls updateQuery with correct data
  - [x] 6.8: Test delete calls deleteQuery
  - [x] 6.9: Test toast notifications on success/error

- [x] Task 7: Manual E2E verification
  - [x] 7.1: Right-click query, verify menu appears at cursor
  - [x] 7.2: Test rename flow end-to-end
  - [x] 7.3: Test delete flow end-to-end
  - [x] 7.4: Verify keyboard navigation in menu
  - [x] 7.5: Verify click-outside and Escape close menu

## Dev Notes

### CRITICAL: Reuse Existing Storage Service Functions

**DO NOT reinvent storage operations.** The storage-service already has:
- `updateQuery(id, { name })` - For rename (lines 128-159 in storage-service.ts)
- `deleteQuery(id)` - For delete (lines 107-122 in storage-service.ts)

Both return `Result<T>` objects - handle success/error accordingly.

### Architecture Compliance

**From `project-context.md` - MUST follow:**

1. **File naming:** Use `kebab-case` for all files
   - `context-menu.ts`, `context-menu.css`, `context-menu.test.ts`

2. **Result<T> pattern:** Storage service returns Result objects
   ```typescript
   const result = await updateQuery(queryId, { name: newName })
   if (result.success) {
     showToast(`Renamed to: ${newName}`, 'success')
   } else {
     showToast(result.error, 'error')
   }
   ```

3. **Import patterns:**
   ```typescript
   import type { Query } from '../../shared/types/storage.types'
   import { updateQuery, deleteQuery } from '../../shared/services/storage-service'
   import { showToast } from './toast'
   ```

4. **CSS class naming:** BEM-inspired
   - `.context-menu`, `.context-menu__item`, `.context-menu__item--focused`

### Component Implementation Details

**Context Menu Structure (from UX spec):**
```html
<div class="context-menu" role="menu" style="left: Xpx; top: Ypx;">
  <button class="context-menu__item" role="menuitem" tabindex="-1">Rename</button>
  <button class="context-menu__item" role="menuitem" tabindex="-1">Delete</button>
</div>
```

**CSS Specifications (from UX spec):**
```css
.context-menu {
  width: 160px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  position: fixed;
  z-index: 1000;
}

.context-menu__item {
  display: block;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.context-menu__item:hover,
.context-menu__item--focused {
  background: var(--color-hover);
}
```

**Menu Positioning Logic:**
```typescript
function positionMenu(clickX: number, clickY: number, menuEl: HTMLElement): void {
  const menuWidth = 160
  const menuHeight = menuEl.offsetHeight
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Prevent menu from going off-screen right
  let left = clickX
  if (clickX + menuWidth > viewportWidth) {
    left = viewportWidth - menuWidth - 8
  }

  // Prevent menu from going off-screen bottom
  let top = clickY
  if (clickY + menuHeight > viewportHeight) {
    top = viewportHeight - menuHeight - 8
  }

  menuEl.style.left = `${left}px`
  menuEl.style.top = `${top}px`
}
```

**Keyboard Navigation:**
```typescript
menuEl.addEventListener('keydown', (e) => {
  const items = menuEl.querySelectorAll('.context-menu__item')
  const currentIndex = Array.from(items).findIndex(el =>
    el.classList.contains('context-menu__item--focused')
  )

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusItem((currentIndex + 1) % items.length)
      break
    case 'ArrowUp':
      e.preventDefault()
      focusItem(currentIndex <= 0 ? items.length - 1 : currentIndex - 1)
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      selectCurrentItem()
      break
    case 'Escape':
      closeMenu()
      break
  }
})
```

### Rename Dialog Options

**Option 1: window.prompt() (Simple)**
```typescript
const newName = window.prompt('Enter new name:', currentName)
if (newName && newName.trim()) {
  await updateQuery(id, { name: newName.trim() })
}
```

**Option 2: Inline Edit (Better UX)**
- Replace tree item text with input field
- Focus input, select all text
- Save on Enter, cancel on Escape
- More complex but better experience

**Recommendation:** Start with `window.prompt()` for MVP, can enhance later.

### Delete Confirmation

```typescript
const confirmed = window.confirm(
  `Delete "${queryName}"?\n\nThis cannot be undone.`
)
if (confirmed) {
  const result = await deleteQuery(id)
  // ... handle result
}
```

### Integration with tree-item.ts

**Current tree-item.ts needs update:**
```typescript
export interface TreeItemOptions {
  query: Query
  isSelected: boolean
  level?: number
  onClick?: TreeItemClickHandler
  onContextMenu?: (id: string, x: number, y: number) => void  // NEW
}

// Add in createTreeItem():
item.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  onContextMenu?.(query.id, e.clientX, e.clientY)
})
```

### Integration with popup/index.ts

```typescript
// Track context menu state
let activeContextMenuQueryId: string | null = null

// Handle context menu request from tree item
function handleQueryContextMenu(queryId: string, x: number, y: number): void {
  const query = state.queries.find(q => q.id === queryId)
  if (!query) return

  activeContextMenuQueryId = queryId

  showContextMenu(x, y, [
    { label: 'Rename', action: 'rename' },
    { label: 'Delete', action: 'delete' }
  ], (action) => {
    if (action === 'rename') {
      handleRenameQuery(query)
    } else if (action === 'delete') {
      handleDeleteQuery(query)
    }
  })
}

async function handleRenameQuery(query: Query): Promise<void> {
  const newName = window.prompt('Enter new name:', query.name)
  if (!newName || !newName.trim()) return

  const result = await updateQuery(query.id, { name: newName.trim() })
  if (result.success) {
    showToast(`Renamed to: ${newName.trim()}`, 'success')
    await refreshQueries()
  } else {
    showToast(result.error, 'error')
  }
}

async function handleDeleteQuery(query: Query): Promise<void> {
  const confirmed = window.confirm(
    `Delete "${query.name}"?\n\nThis cannot be undone.`
  )
  if (!confirmed) return

  const result = await deleteQuery(query.id)
  if (result.success) {
    showToast(`Deleted: ${query.name}`, 'success')
    // Clear selection if this was selected query
    if (state.selectedId === query.id) {
      state.selectedId = null
    }
    await refreshQueries()
  } else {
    showToast(result.error, 'error')
  }
}
```

### Previous Story Learnings (from Story 3-4)

1. **Separation of concerns:** Keep context menu as standalone component
2. **Test patterns:** Use `beforeEach`/`afterEach` for DOM cleanup
3. **Toast integration:** `showToast(message, 'success'|'error')` already works
4. **State refresh:** Call `refreshQueries()` after any storage modification

### File Structure

**Files to Create:**
- `src/popup/components/context-menu.ts`
- `src/popup/components/context-menu.css`
- `src/popup/components/context-menu.test.ts`

**Files to Modify:**
- `src/popup/components/tree-item.ts` - Add onContextMenu callback
- `src/popup/components/tree-item.test.ts` - Add tests for context menu trigger
- `src/popup/index.ts` - Integrate context menu handling
- `src/popup/popup.css` - Import context-menu.css

### Test Strategy

```typescript
// context-menu.test.ts
describe('ContextMenu', () => {
  describe('rendering', () => {
    it('should render menu at specified position', () => {})
    it('should render all menu items', () => {})
    it('should have correct ARIA attributes', () => {})
  })

  describe('positioning', () => {
    it('should stay within viewport when near right edge', () => {})
    it('should stay within viewport when near bottom edge', () => {})
  })

  describe('keyboard navigation', () => {
    it('should move focus down on ArrowDown', () => {})
    it('should move focus up on ArrowUp', () => {})
    it('should wrap around at boundaries', () => {})
    it('should select item on Enter', () => {})
    it('should close on Escape', () => {})
  })

  describe('mouse interaction', () => {
    it('should close on click outside', () => {})
    it('should select item on click', () => {})
  })
})

// tree-item.test.ts additions
describe('context menu', () => {
  it('should call onContextMenu on right-click', () => {})
  it('should prevent default context menu', () => {})
  it('should pass correct coordinates', () => {})
})
```

### Accessibility Requirements

From UX spec:
- `role="menu"` on container
- `role="menuitem"` on each item
- Arrow key navigation
- Escape to close
- Focus trapped in menu while open
- Return focus to trigger element on close

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5]
- [Source: _bmad-output/planning-artifacts/prd.md#FR26, FR27]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Modules - context-menu.ts]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Context Menu Component]
- [Source: _bmad-output/project-context.md#TypeScript Rules, CSS class naming]
- [Source: src/shared/services/storage-service.ts#updateQuery, deleteQuery]
- [Source: src/popup/components/tree-item.ts (current implementation)]
- [Source: _bmad-output/implementation-artifacts/3-4-implement-one-click-paste.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build passed with no TypeScript errors
- All 347 unit tests pass (including 22 new context-menu tests, 4 new tree-item context menu tests)

### Completion Notes List

1. **Context Menu Component Created** - `src/popup/components/context-menu.ts` implements showContextMenu(), hideContextMenu(), isContextMenuVisible() with full keyboard navigation (ArrowUp/Down wrap-around, Enter/Space selection, Escape close), mouse interaction (click-outside close, hover focus), and ARIA accessibility (role="menu", role="menuitem", aria-activedescendant).

2. **Context Menu Styling** - `src/popup/components/context-menu.css` matches UX spec: 160px width, fixed positioning, shadow, danger styling for delete option, focus/hover states.

3. **Tree Item Right-Click Handler** - Added onContextMenu callback to TreeItemOptions interface, contextmenu event listener with preventDefault() to suppress browser menu, passes query ID and click coordinates.

4. **Tree View Integration** - Updated tree-view.ts to accept and pass through onItemContextMenu option to tree items.

5. **Rename Functionality** - Uses window.prompt() for MVP (per Dev Notes recommendation), validates non-empty names, sends UPDATE_QUERY message to service worker, shows success/error toasts, refreshes tree view.

6. **Delete Functionality** - Uses window.confirm() for confirmation dialog, sends DELETE_QUERY message to service worker, clears selection if deleted query was selected, shows success/error toasts, refreshes tree view.

7. **Popup Integration** - popup/index.ts imports context-menu, wires handleQueryContextMenu to tree view options, implements handleRenameQuery and handleDeleteQuery async handlers.

### File List

**Files Created:**
- src/popup/components/context-menu.ts
- src/popup/components/context-menu.css
- src/popup/components/context-menu.test.ts

**Files Modified:**
- src/popup/components/tree-item.ts (added onContextMenu callback, contextmenu event listener)
- src/popup/components/tree-item.test.ts (added 4 tests for context menu trigger)
- src/popup/components/tree-view.ts (added onItemContextMenu option pass-through)
- src/popup/index.ts (integrated context menu handling, paste/rename/delete flows)
- src/popup/index.test.ts (added 14 tests for rename/delete flows)

### Change Log

- 2026-01-22: Story 3-5 implemented - Context menu with rename and delete functionality for queries
- 2026-01-22: Code Review fixes applied - Added Paste menu item per UX spec, focus return on close, Tab key trapping, rename/delete unit tests

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Adversarial Code Review)
**Date:** 2026-01-22
**Outcome:** Changes Requested → Fixed

### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| H1 | HIGH | Missing unit tests for rename/delete in popup/index.test.ts | Added 14 tests covering rename/delete flows |
| H2 | HIGH | UX Spec deviation - missing "Paste" menu item | Added Paste as first menu item per spec |
| M1 | MEDIUM | Missing focus return to trigger element on close | Added triggerElement tracking and focus() call |
| M2 | MEDIUM | Tab key closed menu instead of trapping focus | Implemented Tab/Shift+Tab cycling through items |
| M3 | MEDIUM | Story File List incorrectly referenced popup.css | Corrected documentation, added index.test.ts |

### Low Issues (Not Fixed - Documented)

- L1: Redundant hideContextMenu() call in index.ts (harmless)
- L2: selectItem(null) logic inefficiency in delete flow (minor)
- L3: Test file header only referenced Story 3-4 (fixed during H1)
