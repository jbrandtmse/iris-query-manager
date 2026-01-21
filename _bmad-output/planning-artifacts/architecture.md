---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-01-20'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/product-brief-querymanager-2026-01-20.md"
  - "docs/context.md"
  - "docs/tech-details.md"
workflowType: 'architecture'
project_name: 'IRIS Query Manager'
user_name: 'Developer'
date: '2026-01-20'
---

# Architecture Decision Document - IRIS Query Manager

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The PRD defines 31 functional requirements across 7 categories:

| Category | FR Count | Architectural Implication |
|----------|----------|---------------------------|
| **Query Capture & Storage** | FR1-FR5 | Content script for DOM extraction, storage service for persistence |
| **Query Retrieval & Paste** | FR6-FR9 | Two-way content script communication, state sync with popup |
| **Folder Organization** | FR10-FR15 | Hierarchical data model, drag-drop UI events |
| **Import/Export** | FR16-FR21 | File system API, JSON validation, merge logic |
| **Safety & Warnings** | FR22-FR25 | SQL pattern detection service, modal injection |
| **Query Management** | FR26-FR28 | CRUD operations on storage layer |
| **SMP Integration** | FR29-FR31 | URL pattern matching, DOM detection, graceful degradation |

**Non-Functional Requirements:**

| Category | Requirements | Architectural Driver |
|----------|--------------|---------------------|
| **Performance** | NFR1-NFR5 | <100ms capture/paste, <300ms popup render, <2s import |
| **Reliability** | NFR6-NFR10 | Zero data loss, 100% operation success rate, cross-version SMP support |
| **Security** | NFR11-NFR13 | All data local, zero network requests, minimal permissions |
| **Maintainability** | NFR14-NFR16 | Single-developer codebase, standard Chrome patterns, clear separation |

**Scale & Complexity:**

- **Primary domain:** Browser Extension (Chrome Manifest V3)
- **Complexity level:** Low-Medium (no backend, local storage only)
- **Estimated architectural components:** 7 modules

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| **Chrome Manifest V3** | Must use service worker (not background page), no remote code execution |
| **Popup lifecycle** | Popup closes when focus lost; state must persist independently |
| **Content script isolation** | Cannot share JavaScript context with SMP page; must use DOM manipulation |
| **Storage limits** | 5MB for `chrome.storage.local` (sufficient for thousands of queries) |
| **SMP DOM variability** | Target `div#QueryText > textarea` may have different IDs across IRIS versions |
| **Permission minimization** | Only `storage` + `activeTab` + host permission for SMP URL pattern |

### Cross-Cutting Concerns Identified

1. **Message Passing Architecture** - Popup, content script, and service worker must communicate reliably via Chrome messaging APIs

2. **State Synchronization** - Query library state must stay consistent across all extension contexts

3. **Error Boundaries** - Every operation needs graceful degradation (e.g., SMP not detected, storage full)

4. **Data Integrity** - Import validation, storage transactions, no silent failures

5. **Accessibility** - ARIA roles on tree view, keyboard navigation, focus management in modals

6. **Testability** - Business logic should be separable from Chrome APIs for unit testing

## Starter Template Evaluation

### Primary Technology Domain

Browser Extension (Chrome Manifest V3) based on project requirements analysis.

### Starter Options Considered

| Option | Tool | Evaluation |
|--------|------|------------|
| **vanilla-ts** | create-chrome-ext | Modern Vite build, TypeScript, HMR - Recommended |
| **vanilla-js** | create-chrome-ext | Vite without TypeScript - simpler but loses type safety |
| **Manual Setup** | None | Maximum control, zero deps - viable but slower development |

### Selected Starter: create-chrome-ext (vanilla-ts)

**Rationale for Selection:**
- TypeScript provides type safety for Chrome API message passing between popup, content script, and service worker
- Vite HMR significantly improves development experience for UI iteration
- Production build is still lightweight (TypeScript compiles away)
- Native CSS works perfectly - no framework imposed
- Aligns with PRD goal of "standard Chrome extension patterns" with modern tooling

**Initialization Command:**

```bash
npx create-chrome-ext query-manager --template vanilla-ts
```

**Architectural Decisions Provided by Starter:**

| Decision Area | What Starter Provides |
|---------------|----------------------|
| **Language & Runtime** | TypeScript 5.x with strict mode, ES2020+ target |
| **Styling Solution** | None imposed - compatible with native CSS design tokens |
| **Build Tooling** | Vite for development (HMR) and production builds |
| **Testing Framework** | None included - to be added per architectural decision |
| **Code Organization** | `/src/popup/`, `/src/content/`, `/src/background/`, `/public/` |
| **Development Experience** | Hot Module Reload, TypeScript error checking, `npm run dev`/`build` |

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model structure (flat with references)
- Message passing architecture (direct messaging)
- Error handling strategy (result objects)

**Important Decisions (Shape Architecture):**
- Popup state management (vanilla)
- Content script DOM strategy (direct query with fallback)
- Import validation strategy (lenient)

**Deferred Decisions (Post-MVP):**
- E2E testing infrastructure
- CI/CD pipeline
- Chrome Web Store automation

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Model** | Flat with References | Separate `folders[]` and `queries[]` arrays; queries reference `folderId`. Simple CRUD, tree built at render time. Matches PRD JSON structure. |
| **Storage API** | `chrome.storage.local` | 5MB limit sufficient for thousands of queries. No sync for MVP - deferred to v1.1. |
| **Import Validation** | Lenient | Import valid entries, skip invalid with warning. Better UX for hand-edited or partial JSON files. |
| **ID Generation** | `crypto.randomUUID()` | Built-in browser API, no dependencies, collision-resistant. |

**Data Types (TypeScript):**

```typescript
interface Query {
  id: string;
  name: string;
  sql: string;
  folderId: string | null;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface StorageSchema {
  queries: Query[];
  folders: Folder[];
}
```

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Authentication** | None (MVP) | Fully local extension, no user accounts. All data in chrome.storage.local. |
| **SQL Pattern Detection** | Regex-based service | Detect destructive keywords: `DELETE`, `DROP`, `TRUNCATE`, `UPDATE`, `ALTER`, `INSERT`. Case-insensitive, word-boundary matching. |
| **Content Security Policy** | Default Manifest V3 | `script-src 'self'` - no remote code, no eval. |
| **Permissions** | Minimal | `storage`, `activeTab`, host permission for SMP URL pattern only. |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Message Passing** | Direct Messaging | `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`. Simpler than ports, sufficient for request/response. |
| **Error Handling** | Result Objects | All operations return `{ success: boolean, data?, error? }`. Explicit handling across message boundaries. |
| **Message Types** | Typed Actions | Discriminated union pattern: `{ type: 'CAPTURE_QUERY' | 'PASTE_QUERY' | ... }` |

**Message Protocol:**

```typescript
type MessageType =
  | { type: 'CAPTURE_QUERY'; payload: { name: string; folderId?: string } }
  | { type: 'PASTE_QUERY'; payload: { queryId: string } }
  | { type: 'GET_CURRENT_SQL' }
  | { type: 'CHECK_SMP_AVAILABLE' };

type MessageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | Vanilla (No Library) | Direct DOM manipulation with manual state tracking. Keeps bundle tiny, sufficient for popup's simple state. |
| **Component Structure** | Module-based | 9 custom components per UX spec, each as TypeScript module with render/update functions. |
| **CSS Architecture** | Design Tokens | CSS custom properties defined in `:root`, no preprocessor needed. |
| **DOM Strategy (Content Script)** | Direct Query with Fallback | `document.querySelector('#QueryText textarea')` on demand. Re-query on failure handles SMP reload. |

**Component Modules:**

| Component | Module | Responsibility |
|-----------|--------|----------------|
| Tree View | `tree-view.ts` | Render folder/query hierarchy |
| Tree Item | `tree-item.ts` | Individual folder or query row |
| Capture Form | `capture-form.ts` | Query name input, folder selection |
| Warning Modal | `warning-modal.ts` | Destructive query confirmation |
| Query Preview | `query-preview.ts` | SQL preview panel |
| Warning Badge | `warning-badge.ts` | Inline danger indicator |
| Icon Button | `icon-button.ts` | Header action buttons |
| Context Menu | `context-menu.ts` | Right-click actions |
| Toast | `toast.ts` | Success/error notifications |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Development** | Vite dev server | HMR for popup development, load unpacked in Chrome |
| **Testing** | Unit tests (core logic) | Vitest for business logic (SQL detection, validation, data ops). Defer E2E to post-MVP. |
| **Distribution (MVP)** | Unpacked extension | Developer mode for personal use and team testing |
| **Distribution (Public)** | Chrome Web Store | Target Month 6 per PRD roadmap |
| **CI/CD** | None (MVP) | Solo developer; manual build and test sufficient |

### Decision Impact Analysis

**Implementation Sequence:**

1. **Project scaffold** - `npx create-chrome-ext query-manager --template vanilla-ts`
2. **Data layer** - Storage service with TypeScript interfaces
3. **Message protocol** - Typed message handlers across contexts
4. **Content script** - SMP detection and DOM interaction
5. **Popup UI** - Tree view and capture form
6. **Safety features** - SQL detection and warning modal
7. **Import/Export** - File operations with validation

**Cross-Component Dependencies:**

```
Storage Service ─────────────────────────────────────┐
       │                                              │
       ▼                                              ▼
Message Protocol ◄──────► Content Script ◄───► SMP Page DOM
       │
       ▼
  Popup UI ──────► Component Modules
       │
       ▼
SQL Detection Service ──────► Warning Modal
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Addressed:** 12 areas where AI agents could make different choices, now standardized.

### Naming Patterns

**File Naming Convention:**

| Type | Pattern | Example |
|------|---------|---------|
| **TypeScript modules** | kebab-case | `tree-view.ts`, `storage-service.ts` |
| **Type definition files** | kebab-case + `.types.ts` | `message.types.ts`, `storage.types.ts` |
| **Test files** | `.test.ts` suffix | `storage-service.test.ts` |
| **CSS files** | kebab-case | `popup.css`, `design-tokens.css` |

**TypeScript Naming:**

| Type | Convention | Example |
|------|------------|---------|
| **Interfaces** | PascalCase | `Query`, `Folder`, `MessageResult` |
| **Types** | PascalCase | `MessageType`, `StorageSchema` |
| **Functions** | camelCase | `getQueries()`, `pasteQuery()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_QUERY_LENGTH`, `STORAGE_KEY` |
| **Variables** | camelCase | `currentQuery`, `selectedFolderId` |

**CSS Class Naming:**

| Pattern | Convention | Example |
|---------|------------|---------|
| **Components** | BEM-inspired, kebab-case | `.tree-item`, `.tree-item--selected` |
| **State modifiers** | Double-dash | `.tree-item--expanded`, `.btn--primary` |
| **JavaScript hooks** | `js-` prefix | `.js-tree-item`, `.js-capture-btn` |

**Message Type Naming:**

| Pattern | Convention | Example |
|---------|------------|---------|
| **Action types** | UPPER_SNAKE_CASE | `CAPTURE_QUERY`, `PASTE_QUERY`, `GET_CURRENT_SQL` |
| **Payload fields** | camelCase | `{ queryId, folderId, name }` |

### Structure Patterns

**Project Organization:**

```
src/
├── popup/                 # Popup UI
│   ├── components/        # UI component modules
│   ├── popup.html
│   ├── popup.ts          # Entry point
│   └── popup.css
├── content/              # Content script
│   └── content.ts        # SMP interaction
├── background/           # Service worker
│   └── service-worker.ts
├── shared/               # Shared code (all contexts)
│   ├── types/            # TypeScript interfaces
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
└── assets/               # Icons, static files
```

**Test Organization:**

| Pattern | Location | Rationale |
|---------|----------|-----------|
| **Unit tests** | Co-located with source | `storage-service.test.ts` next to `storage-service.ts` |
| **Test utilities** | `src/shared/test-utils/` | Shared mocks and helpers |

**Import Order (Enforced by Linter):**

```typescript
// 1. Chrome/Browser APIs
// 2. Third-party packages
// 3. Shared modules (relative paths)
// 4. Local modules (relative paths)

import type { Query, Folder } from '../shared/types/storage.types';
import { StorageService } from '../shared/services/storage-service';
import { renderTreeItem } from './tree-item';
```

### Format Patterns

**Result Object Structure (Consistent Everywhere):**

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Usage:
const result = await storageService.saveQuery(query);
if (result.success) {
  showToast('Saved!');
} else {
  showError(result.error);
}
```

**Date/Time Format:**

| Context | Format | Example |
|---------|--------|---------|
| **Storage** | ISO 8601 string | `"2026-01-20T14:30:00.000Z"` |
| **Display** | Localized | `new Date(iso).toLocaleDateString()` |

**JSON Field Names:** camelCase everywhere (`folderId`, `createdAt`, `updatedAt`).

### Communication Patterns

**Chrome Message Protocol:**

```typescript
// Message request structure
interface Message<T = unknown> {
  type: string;          // UPPER_SNAKE_CASE action
  payload?: T;           // Optional payload
}

// Message response structure
type MessageResponse<T> = Result<T>;

// Handler pattern (MUST return true for async)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_QUERY') {
    handleCapture(message.payload).then(sendResponse);
    return true; // Required for async response
  }
});
```

**Popup State Pattern:**

```typescript
const state = {
  queries: [] as Query[],
  folders: [] as Folder[],
  selectedId: null as string | null,
  expandedFolders: new Set<string>(),
};

function updateState(partial: Partial<typeof state>) {
  Object.assign(state, partial);
  render();
}
```

### Process Patterns

**Error Handling:**

| Layer | Pattern |
|-------|---------|
| **Service layer** | Return `Result<T>`, never throw |
| **UI layer** | Display toast for user errors, `console.error` for debug |
| **Content script** | Graceful degradation if SMP not found |

**Loading States:**

| Pattern | Usage |
|---------|-------|
| **Button loading** | Disable button, show spinner inside |
| **Tree loading** | Show skeleton or spinner in tree area |
| **No indicator** | Operations < 100ms (capture, paste) |

### Enforcement Guidelines

**All AI Agents MUST:**

1. ✅ Use Result objects for all async operations
2. ✅ Follow file naming conventions (kebab-case for files)
3. ✅ Place shared code in `src/shared/`
4. ✅ Use UPPER_SNAKE_CASE for message types
5. ✅ Co-locate test files with source files
6. ✅ Import types with `import type` syntax
7. ✅ Return `true` from message listeners for async responses

**Anti-Patterns to Avoid:**

```typescript
// ❌ DON'T throw errors from services
throw new Error('Failed'); // Use Result instead

// ❌ DON'T use PascalCase for files
UserCard.ts  // Use user-card.ts

// ❌ DON'T mix message type conventions
{ type: 'captureQuery' }  // Use CAPTURE_QUERY

// ❌ DON'T forget async response flag
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  doAsyncWork().then(sendResponse);
  // Missing: return true;
});
```

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Category | Primary Location | Supporting Files |
|-------------|------------------|------------------|
| **Query Capture & Storage** (FR1-FR5) | `src/shared/services/storage-service.ts` | `storage.types.ts` |
| **Query Retrieval & Paste** (FR6-FR9) | `src/content/content.ts` | `message.types.ts` |
| **Folder Organization** (FR10-FR15) | `src/popup/components/tree-view.ts` | `tree-item.ts` |
| **Import/Export** (FR16-FR21) | `src/shared/services/import-export-service.ts` | `validation.ts` |
| **Safety & Warnings** (FR22-FR25) | `src/shared/services/sql-detection-service.ts` | `warning-modal.ts` |
| **Query Management** (FR26-FR28) | `src/popup/components/context-menu.ts` | `capture-form.ts` |
| **SMP Integration** (FR29-FR31) | `src/content/content.ts` | `smp-detector.ts` |

### Complete Project Directory Structure

```
query-manager/
├── README.md                           # Project documentation
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Lock file
├── tsconfig.json                       # TypeScript configuration
├── vite.config.ts                      # Vite build configuration
├── vitest.config.ts                    # Test configuration
├── .gitignore                          # Git ignore patterns
├── .eslintrc.json                      # ESLint rules
├── .prettierrc                         # Prettier configuration
│
├── public/                             # Static assets (copied to dist)
│   ├── manifest.json                   # Chrome extension manifest
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       ├── icon-96.png
│       └── icon-128.png
│
├── src/
│   ├── popup/                          # Extension popup UI
│   │   ├── popup.html                  # Popup HTML entry
│   │   ├── popup.ts                    # Popup entry point
│   │   ├── popup.css                   # Popup styles
│   │   ├── design-tokens.css           # CSS custom properties
│   │   ├── state.ts                    # Popup state management
│   │   └── components/
│   │       ├── tree-view.ts            # Folder/query tree container
│   │       ├── tree-view.css
│   │       ├── tree-item.ts            # Individual tree row
│   │       ├── tree-item.css
│   │       ├── capture-form.ts         # Query capture dialog
│   │       ├── capture-form.css
│   │       ├── warning-modal.ts        # Destructive query warning
│   │       ├── warning-modal.css
│   │       ├── query-preview.ts        # SQL preview panel
│   │       ├── query-preview.css
│   │       ├── warning-badge.ts        # Inline danger indicator
│   │       ├── icon-button.ts          # Header action buttons
│   │       ├── context-menu.ts         # Right-click menu
│   │       ├── context-menu.css
│   │       ├── toast.ts                # Success/error notifications
│   │       └── toast.css
│   │
│   ├── content/                        # Content script (SMP injection)
│   │   ├── content.ts                  # Main content script
│   │   └── smp-detector.ts             # SMP textarea detection
│   │
│   ├── background/                     # Service worker
│   │   └── service-worker.ts           # Background message handler
│   │
│   └── shared/                         # Shared across all contexts
│       ├── types/
│       │   ├── storage.types.ts        # Query, Folder, StorageSchema
│       │   ├── message.types.ts        # MessageType, MessageResult
│       │   └── index.ts                # Type exports
│       ├── services/
│       │   ├── storage-service.ts      # chrome.storage CRUD
│       │   ├── storage-service.test.ts
│       │   ├── sql-detection-service.ts # Destructive query detection
│       │   ├── sql-detection-service.test.ts
│       │   ├── import-export-service.ts # JSON import/export
│       │   ├── import-export-service.test.ts
│       │   └── message-service.ts      # Chrome messaging helpers
│       ├── utils/
│       │   ├── id-generator.ts         # crypto.randomUUID wrapper
│       │   ├── date-utils.ts           # ISO date helpers
│       │   └── validation.ts           # Import validation
│       └── constants.ts                # Shared constants
│
├── dist/                               # Build output (gitignored)
│
└── docs/                               # Documentation
    ├── context.md                      # Tech stack context
    └── tech-details.md                 # SMP integration details
```

### Architectural Boundaries

**Context Isolation:**

| Context | Can Access | Cannot Access |
|---------|------------|---------------|
| **Popup** | `chrome.runtime`, `chrome.storage`, own DOM | SMP page DOM, `chrome.tabs.sendMessage` directly |
| **Content Script** | SMP page DOM, `chrome.runtime` | `chrome.storage` directly, popup DOM |
| **Service Worker** | `chrome.storage`, `chrome.tabs`, all messaging | Any DOM |

**Communication Flow:**

```
┌─────────────┐     sendMessage      ┌─────────────────┐
│   Popup     │─────────────────────►│ Service Worker  │
│             │◄─────────────────────│                 │
└─────────────┘     response         └────────┬────────┘
                                              │
                                              │ tabs.sendMessage
                                              ▼
                                     ┌─────────────────┐
                                     │ Content Script  │◄───► SMP DOM
                                     └─────────────────┘
```

**Service Boundaries:**

| Service | Responsibility | Used By |
|---------|---------------|---------|
| `storage-service.ts` | CRUD operations on queries/folders | Popup, Service Worker |
| `sql-detection-service.ts` | Detect destructive SQL patterns | Popup (before paste) |
| `import-export-service.ts` | JSON file import/export + validation | Popup |
| `message-service.ts` | Typed message send/receive helpers | All contexts |

### Data Flow

**Capture Query Flow:**

```
SMP Textarea → Content Script (GET_CURRENT_SQL)
                    ↓
              Service Worker
                    ↓
              Storage Service → chrome.storage.local
                    ↓
              Popup receives storage change event → re-render
```

**Paste Query Flow:**

```
Popup (user clicks query) → sql-detection-service.ts
                                   ↓
                    [if destructive: show warning-modal]
                                   ↓
              Service Worker (PASTE_QUERY)
                    ↓
              Storage Service → get query SQL
                    ↓
              Content Script → SMP Textarea.value = sql
```

### Development Workflow Integration

**Development:**

```bash
npm run dev          # Start Vite dev server with HMR
# Load dist/ as unpacked extension in chrome://extensions
```

**Testing:**

```bash
npm run test         # Run Vitest unit tests
npm run test:watch   # Watch mode for TDD
```

**Build:**

```bash
npm run build        # Production build to dist/
```

**Manifest.json Key Sections:**

```json
{
  "manifest_version": 3,
  "name": "IRIS Query Manager",
  "version": "1.0.0",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["*://*/%25CSP.UI.Portal.SQL.Home.zen*"],
  "background": {
    "service_worker": "service-worker.js"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["*://*/%25CSP.UI.Portal.SQL.Home.zen*"],
    "js": ["content.js"]
  }]
}
```

## Architecture Validation Results

### Coherence Validation ✅

All architectural decisions work together without conflicts:
- TypeScript + Vite + Native CSS = lightweight, type-safe extension
- Direct messaging + Result objects = clear async error handling
- Manifest V3 + Service Worker = Chrome best practices

### Requirements Coverage ✅

| Coverage Area | Status |
|---------------|--------|
| 31 Functional Requirements | 100% covered |
| 16 Non-Functional Requirements | 100% covered |
| 9 UX Components | All architecturally supported |
| 5 User Personas | All journeys implementable |

### Implementation Readiness ✅

| Readiness Criterion | Status |
|--------------------|--------|
| Decisions documented | Complete with examples |
| Patterns comprehensive | 12 conflict points standardized |
| Structure complete | 40+ files specified |
| Boundaries clear | Context isolation defined |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analyzed (PRD, UX spec)
- [x] Scale assessed (Low-Medium complexity)
- [x] Constraints identified (Manifest V3, storage limits)
- [x] Cross-cutting concerns mapped (6 concerns)

**✅ Architectural Decisions**
- [x] Data architecture (flat with references)
- [x] Communication (direct messaging, Result objects)
- [x] Frontend (vanilla state, 9 components)
- [x] Infrastructure (Vite, Vitest, unpacked distribution)

**✅ Implementation Patterns**
- [x] Naming conventions (files, TypeScript, CSS, messages)
- [x] Structure patterns (project organization, imports)
- [x] Communication patterns (Chrome messaging protocol)
- [x] Process patterns (error handling, loading states)

**✅ Project Structure**
- [x] Complete directory tree defined
- [x] All components mapped to files
- [x] FR categories mapped to locations
- [x] Service boundaries established

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clear separation between popup, content script, and service worker
- Type-safe message protocol prevents runtime errors
- Comprehensive patterns prevent AI agent conflicts
- Lightweight architecture meets all NFRs

**First Implementation Priority:**

```bash
npx create-chrome-ext query-manager --template vanilla-ts
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-20
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**
- 15+ architectural decisions made
- 12 implementation patterns defined
- 7 architectural components specified
- 47 requirements fully supported (31 FRs + 16 NFRs)

**📚 AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing IRIS Query Manager. Follow all decisions, patterns, and structures exactly as documented.

**Development Sequence:**
1. Initialize project using documented starter template
2. Set up development environment per architecture
3. Implement core architectural foundations (storage service, message protocol)
4. Build features following established patterns
5. Maintain consistency with documented rules

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

