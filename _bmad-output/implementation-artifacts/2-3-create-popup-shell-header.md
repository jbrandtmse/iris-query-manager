# Story 2.3: Create Popup Shell & Header

Status: done

## Story

As a **user**,
I want **to open the extension popup and see a clean interface**,
So that **I can access query management features**.

## Acceptance Criteria

1. **Given** I click the extension icon on an SMP page **When** the popup opens **Then** it displays at 360px width with a header containing the extension name

2. **Given** the popup shell **When** it renders **Then** it uses design tokens from CSS custom properties (per architecture)

3. **Given** the popup header **When** displayed **Then** it includes icon buttons for primary actions (capture, menu)

4. **Given** the popup loads **When** rendering completes **Then** it takes less than 300ms (NFR3)

## Tasks / Subtasks

- [x] Task 1: Create design tokens CSS file (AC: 2)
  - [x] 1.1: Create `src/popup/design-tokens.css` with all color, spacing, typography variables
  - [x] 1.2: Define colors: primary (#4285f4), danger (#ea4335), warning (#fbbc04), success (#34a853), text, bg, border
  - [x] 1.3: Define spacing: xs (4px), sm (8px), md (16px), lg (24px)
  - [x] 1.4: Define typography: font-family (system), font-mono, font sizes
  - [x] 1.5: Import design-tokens.css in popup entry point

- [x] Task 2: Create popup shell layout (AC: 1, 2)
  - [x] 2.1: Replace template CSS in `src/popup/index.css` with production styles
  - [x] 2.2: Set popup width to 360px fixed
  - [x] 2.3: Set popup max-height to 500px with overflow-y: auto on content area
  - [x] 2.4: Create header section (fixed at top)
  - [x] 2.5: Create content area (scrollable, will contain tree view later)
  - [x] 2.6: Add bottom preview panel area (hidden by default, for later stories)

- [x] Task 3: Create icon button component (AC: 3)
  - [x] 3.1: Create `src/popup/components/icon-button.ts`
  - [x] 3.2: Create `src/popup/components/icon-button.css`
  - [x] 3.3: Implement `createIconButton(icon, label, onClick)` function
  - [x] 3.4: Support states: default, hover, active, disabled
  - [x] 3.5: Size: 28x28px with 16px centered SVG icon

- [x] Task 4: Create popup header component (AC: 1, 3)
  - [x] 4.1: Create `src/popup/components/header.ts`
  - [x] 4.2: Create `src/popup/components/header.css`
  - [x] 4.3: Implement header with extension name "IRIS Query Manager"
  - [x] 4.4: Add capture (+) icon button on the right
  - [x] 4.5: Add menu (...) icon button on the right
  - [x] 4.6: Header height: 48px with bottom border

- [x] Task 5: Update popup entry point (AC: 1, 4)
  - [x] 5.1: Replace placeholder content in `src/popup/index.ts`
  - [x] 5.2: Import and render header component
  - [x] 5.3: Create empty content area with "No queries saved yet" placeholder
  - [x] 5.4: Ensure popup renders in < 300ms (no async blocking)

- [x] Task 6: Add inline SVG icons (AC: 3)
  - [x] 6.1: Create `src/popup/icons.ts` with SVG string constants
  - [x] 6.2: Add Plus icon for capture action
  - [x] 6.3: Add MoreVertical (kebab menu) icon
  - [x] 6.4: Add Folder icon (for future use)
  - [x] 6.5: Add Search icon (for future use)

## Dev Notes

### Architecture Compliance

**Critical patterns from `project-context.md` and Architecture doc:**

1. **File naming - kebab-case required:**
   ```
   src/popup/
   ├── design-tokens.css      # CSS custom properties
   ├── index.css              # Main popup styles
   ├── index.ts               # Entry point
   └── components/
       ├── header.ts          # ✅ kebab-case
       ├── header.css
       ├── icon-button.ts     # ✅ kebab-case
       └── icon-button.css
   ```

2. **CSS class naming - BEM-inspired:**
   ```css
   .header { }                    /* Component */
   .header__title { }             /* Element */
   .header__actions { }           /* Element */
   .icon-button { }               /* Component */
   .icon-button--disabled { }     /* Modifier */
   .js-capture-btn { }            /* JS hook prefix */
   ```

3. **No barrel exports** - Import directly from source files

### Design Tokens (from UX Spec)

**CRITICAL: Use these EXACT values from UX Design Specification:**

```css
:root {
  /* Colors */
  --color-primary: #4285f4;
  --color-danger: #ea4335;
  --color-warning: #fbbc04;
  --color-success: #34a853;
  --color-text: #202124;
  --color-text-secondary: #5f6368;
  --color-bg: #ffffff;
  --color-border: #dadce0;
  --color-hover: #e8f0fe;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;
  --font-size-sm: 12px;
  --font-size-base: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;

  /* Layout */
  --popup-width: 360px;
  --popup-max-height: 500px;
  --header-height: 48px;
  --tree-item-height: 32px;
  --icon-button-size: 28px;
  --border-radius: 4px;
}
```

### Popup Layout Structure

**HTML Structure:**

```html
<div class="popup">
  <header class="header">
    <h1 class="header__title">IRIS Query Manager</h1>
    <div class="header__actions">
      <button class="icon-button js-capture-btn" aria-label="Capture query">
        <!-- Plus SVG -->
      </button>
      <button class="icon-button js-menu-btn" aria-label="Menu">
        <!-- MoreVertical SVG -->
      </button>
    </div>
  </header>

  <main class="content">
    <!-- Tree view will go here -->
    <div class="empty-state">
      <p>No queries saved yet</p>
      <p class="empty-state__hint">Write a query in SMP and click + to capture</p>
    </div>
  </main>

  <footer class="preview-panel" hidden>
    <!-- Query preview will go here -->
  </footer>
</div>
```

**CSS Layout:**

```css
.popup {
  width: var(--popup-width);
  max-height: var(--popup-max-height);
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.header {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.content {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.preview-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}
```

### Icon Button Component Specification

**From UX Spec (Component Strategy section):**

| Aspect | Value |
|--------|-------|
| Size | 28px x 28px |
| Icon | 16px SVG centered |
| Border-radius | 4px |

**States:**

| State | Style |
|-------|-------|
| Default | `background: transparent; color: #5f6368` |
| Hover | `background: #e8f0fe; color: #4285f4` |
| Active | `background: #d2e3fc` |
| Disabled | `opacity: 0.5; cursor: not-allowed` |

**Implementation:**

```typescript
// src/popup/components/icon-button.ts

export interface IconButtonOptions {
  icon: string;        // SVG string
  label: string;       // aria-label
  onClick?: () => void;
  disabled?: boolean;
  className?: string;  // Additional classes (e.g., 'js-capture-btn')
}

export function createIconButton(options: IconButtonOptions): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `icon-button ${options.className ?? ''}`.trim();
  button.setAttribute('aria-label', options.label);
  button.innerHTML = options.icon;

  if (options.disabled) {
    button.disabled = true;
    button.classList.add('icon-button--disabled');
  }

  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}
```

### SVG Icons

**Use inline SVG strings (from Feather Icons or similar):**

```typescript
// src/popup/icons.ts

export const ICONS = {
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,

  moreVertical: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`,

  folder: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,

  search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
};
```

### Existing Code to Replace

**Current popup entry (src/popup/index.ts:1-28):**
- Replace entirely with new shell structure
- Template placeholder UI should be replaced with production layout

**Current popup CSS (src/popup/index.css:1-81):**
- Replace dark theme template CSS with light theme design tokens
- Keep `body { margin: 0; }` and system font stack
- Remove `.calc`, unused `.a` styles, and dark mode defaults

### Accessibility Requirements

**From UX Spec:**

1. **Keyboard navigation:**
   - Tab between focusable elements
   - `:focus-visible` outline for keyboard users

2. **Screen reader support:**
   - `aria-label` on icon-only buttons
   - Semantic HTML (`<header>`, `<main>`, `<footer>`)

3. **Focus visible:**
   ```css
   :focus-visible {
     outline: 2px solid var(--color-primary);
     outline-offset: 2px;
   }
   ```

4. **Reduced motion:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

### Performance Requirement (NFR3)

**Popup must render in < 300ms:**

- No async operations blocking initial render
- Design tokens loaded synchronously via CSS import
- DOM manipulation is minimal (create header + content shell)
- No network requests during initial load

### Previous Story Learnings

From Story 2-1 and 2-2:
1. **Follow established patterns** - Use kebab-case files, BEM CSS classes
2. **Canonical Result<T>** - Already established, no need to change
3. **Template structure** - Files named `index.ts`, folders like `contentScript/`
4. **First-pass quality** - Get CSS right the first time to avoid iterations

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy - Icon Button]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Tokens]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: _bmad-output/project-context.md#CSS class naming]
- [Source: src/popup/index.ts:1-28] - Existing popup to replace
- [Source: src/popup/index.css:1-81] - Existing CSS to replace

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - implementation proceeded without issues.

### Completion Notes List

- Created `design-tokens.css` with all CSS custom properties from UX spec (colors, spacing, typography, layout)
- Replaced template CSS in `index.css` with production BEM-style classes
- Added accessibility features: `:focus-visible` outline, reduced motion media query
- Created `icon-button` component with proper states (default, hover, active, disabled)
- Created `header` component with title and action buttons (capture +, menu ...)
- Created `icons.ts` with inline SVG constants (plus, moreVertical, folder, search)
- Updated `index.ts` entry point with new popup shell structure
- No async operations in initial render path (NFR3 compliance)
- All 115 tests pass (33 new tests added in review), TypeScript compilation clean, build successful

### File List

**Created:**
- `src/popup/design-tokens.css` - CSS custom properties
- `src/popup/components/icon-button.ts` - Icon button component
- `src/popup/components/icon-button.css` - Icon button styles
- `src/popup/components/icon-button.test.ts` - Unit tests (14 tests)
- `src/popup/components/header.ts` - Header component
- `src/popup/components/header.test.ts` - Unit tests (19 tests)
- `src/popup/icons.ts` - SVG icon constants

**Modified:**
- `src/popup/index.css` - Replaced template with production styles
- `src/popup/index.ts` - Replaced placeholder with popup shell

**Removed (code review):**
- `src/popup/components/header.css` - Empty file removed, styles consolidated in index.css

### Change Log

- 2026-01-21: Implemented Story 2-3 - Created popup shell with header, icon buttons, design tokens, and empty state
- 2026-01-21: Code review fixes - Added 33 unit tests for popup components, removed empty header.css, added type="button" to icon buttons

## Senior Developer Review (AI)

**Review Date:** 2026-01-21
**Outcome:** Approved with fixes applied

### Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | N/A |
| High | 0 | N/A |
| Medium | 3 | ✅ Fixed |
| Low | 4 | Noted (not blocking) |

### Issues Fixed

- [x] M1: Added unit tests for popup components (14 tests for icon-button, 19 tests for header)
- [x] M2: Removed empty `header.css` file, updated `header.ts` to not import it
- [x] M3: Added `type="button"` to icon buttons to prevent accidental form submission

### Low Issues (Not Fixed - Noted for Future)

- L1: Inconsistent CSS organization (icon-button has own CSS, header uses index.css)
- L2: Header title hardcoded, not i18n-ready
- L3: Console.log in placeholder click handlers
- L4: No aria-live region for dynamic content (future stories)
