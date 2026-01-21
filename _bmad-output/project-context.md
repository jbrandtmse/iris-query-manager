---
project_name: 'IRIS Query Manager'
user_name: 'Developer'
date: '2026-01-20'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 32
optimized_for_llm: true
source_documents:
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Platform:** Chrome Extension (Manifest V3)
- **Language:** TypeScript 5.x (strict mode required)
- **Build:** Vite (latest)
- **Test:** Vitest (latest)
- **Styling:** Native CSS with Design Tokens
- **Runtime:** Service Worker (background), Content Script (SMP injection), Popup (UI)

## Critical Implementation Rules

### TypeScript Rules

- **Strict mode required** - `"strict": true` in tsconfig.json
- **Never throw from services** - Always return `Result<T>` objects:
  ```typescript
  type Result<T> = { success: true; data: T } | { success: false; error: string };
  ```
- **Use `import type`** for type-only imports:
  ```typescript
  import type { Query, Folder } from '../shared/types/storage.types';
  ```
- **Import order:** Chrome APIs → Third-party → Shared modules → Local modules
- **Naming:**
  - Interfaces/Types: `PascalCase` (Query, Folder, MessageResult)
  - Functions/Variables: `camelCase` (getQueries, selectedId)
  - Constants: `UPPER_SNAKE_CASE` (MAX_QUERY_LENGTH, STORAGE_KEY)

### Chrome Extension Rules

- **CRITICAL: Return `true` for async message handlers:**
  ```typescript
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleAsync(message).then(sendResponse);
    return true; // REQUIRED for async - forgetting this breaks messaging
  });
  ```
- **Message type naming:** `UPPER_SNAKE_CASE` (CAPTURE_QUERY, PASTE_QUERY, GET_CURRENT_SQL)
- **Context boundaries:**
  - Popup → Service Worker: `chrome.runtime.sendMessage()`
  - Service Worker → Content Script: `chrome.tabs.sendMessage(tabId, message)`
  - Content Script cannot access `chrome.storage` directly - must message Service Worker
- **Popup lifecycle:** Popup closes when focus lost; never store state only in popup memory

### Testing Rules

- **Co-locate tests:** Place `*.test.ts` files next to source files
  ```
  services/
  ├── storage-service.ts
  └── storage-service.test.ts
  ```
- **Test framework:** Vitest (not Jest) - configured in `vitest.config.ts`
- **Mock Chrome APIs:** Business logic should be testable without Chrome runtime
- **Focus unit tests on:** storage-service, sql-detection-service, import-export-service
- **Test utilities location:** `src/shared/test-utils/` for shared mocks and helpers

### Code Quality & Style Rules

- **File naming:** Always `kebab-case`
  - ✅ `tree-view.ts`, `storage-service.ts`
  - ❌ `TreeView.ts`, `storageService.ts`
- **CSS class naming:** BEM-inspired
  - Components: `.tree-item`, `.capture-form`
  - States: `.tree-item--selected`, `.tree-item--expanded`
  - JS hooks: `.js-tree-item` (prefix with `js-`)
- **Design tokens:** CSS custom properties in `design-tokens.css`
  ```css
  :root {
    --color-primary: #0066cc;
    --spacing-sm: 4px;
  }
  ```
- **Shared code location:** All reusable code in `src/shared/`
- **No barrel exports:** Import directly from source, not index files

### Development Workflow Rules

- **Development:**
  ```bash
  npm run dev      # Start Vite dev server with HMR
  # Load dist/ as unpacked extension in chrome://extensions
  ```
- **Testing:**
  ```bash
  npm run test         # Run unit tests
  npm run test:watch   # Watch mode for TDD
  ```
- **Build:**
  ```bash
  npm run build    # Production build to dist/
  ```
- **Extension reload:** After service worker or content script changes, manually reload extension in chrome://extensions
- **HMR scope:** Only popup UI benefits from HMR; other contexts require extension reload

### Critical Don't-Miss Rules

**Anti-Patterns (NEVER do these):**
- ❌ `throw new Error()` from services → Use `Result<T>` objects
- ❌ `UserCard.ts` file names → Use `user-card.ts` (kebab-case)
- ❌ `{ type: 'captureQuery' }` → Use `{ type: 'CAPTURE_QUERY' }`
- ❌ Forget `return true` in async message handlers → Silently breaks messaging

**SMP Integration Gotchas:**
- Textarea selector may vary across IRIS versions - implement fallback detection
- Re-query DOM on each operation; never cache textarea reference
- Content script cannot access SMP's JavaScript - DOM manipulation only

**SQL Safety:**
- Detect: `DELETE`, `DROP`, `TRUNCATE`, `UPDATE`, `ALTER`, `INSERT`
- Case-insensitive with word boundaries: `/\b(DELETE|DROP|...)\b/i`
- Show warning BEFORE paste, not after

**Storage:**
- 5MB limit for `chrome.storage.local` (sufficient for thousands of queries)
- Always handle storage errors gracefully

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-01-20
