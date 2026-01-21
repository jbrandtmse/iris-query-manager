# Story 2.1: Implement Storage Service & Data Model

Status: done

## Story

As a **developer**,
I want **a storage service with TypeScript interfaces for queries and folders**,
So that **I have a reliable foundation for persisting user data**. (FR4, FR5)

## Acceptance Criteria

1. **Given** the storage service module **When** I define the data model **Then** Query interface includes: id, name, sql, folderId, createdAt, updatedAt

2. **Given** the storage service module **When** I define the Folder interface **Then** it includes: id, name, parentId (nullable for root folders)

3. **Given** the storage service **When** I call `saveQuery(query)` **Then** it returns a Result object `{ success: true, data: Query }` or `{ success: false, error: string }`

4. **Given** the storage service **When** I save a query **Then** a unique ID is generated using `crypto.randomUUID()` (FR5)

5. **Given** the storage service **When** I call `getQueries()` **Then** it returns all stored queries from chrome.storage.local

6. **Given** unit tests for the storage service **When** I run `npm run test` **Then** all storage operations are tested with mocked chrome.storage API

## Tasks / Subtasks

- [x] Task 1: Create storage type definitions (AC: 1, 2)
  - [x] 1.1: Create `src/shared/types/storage.types.ts` with Query and Folder interfaces
  - [x] 1.2: Create StorageSchema interface with queries[] and folders[] arrays
  - [x] 1.3: Export types from the module

- [x] Task 2: Create storage service (AC: 3, 4, 5)
  - [x] 2.1: Create `src/shared/services/storage-service.ts`
  - [x] 2.2: Implement `getQueries(): Promise<Result<Query[]>>`
  - [x] 2.3: Implement `getFolders(): Promise<Result<Folder[]>>`
  - [x] 2.4: Implement `saveQuery(input: SaveQueryInput): Promise<Result<Query>>` with UUID generation
  - [x] 2.5: Implement `deleteQuery(id: string): Promise<Result<void>>`
  - [x] 2.6: Implement `updateQuery(id: string, updates: Partial<Query>): Promise<Result<Query>>`

- [x] Task 3: Create unit tests (AC: 6)
  - [x] 3.1: Create `src/shared/services/storage-service.test.ts`
  - [x] 3.2: Write tests for getQueries() with empty and populated storage
  - [x] 3.3: Write tests for saveQuery() including UUID generation verification
  - [x] 3.4: Write tests for deleteQuery()
  - [x] 3.5: Write tests for updateQuery() with timestamp verification
  - [x] 3.6: Write tests for error handling when storage operations fail

## Dev Notes

### Architecture Compliance

**Critical patterns from `project-context.md` and Architecture doc:**

1. **Result<T> Pattern - NEVER throw from services:**
   ```typescript
   type Result<T> = { success: true; data: T } | { success: false; error: string };
   ```

2. **File naming - kebab-case required:**
   - ✅ `storage-service.ts`, `storage.types.ts`
   - ❌ `StorageService.ts`, `storageTypes.ts`

3. **Import type syntax for type-only imports:**
   ```typescript
   import type { Query, Folder } from '../types/storage.types';
   ```

4. **ID Generation:**
   - Use `crypto.randomUUID()` - built-in browser API, no dependencies

5. **Date Format:**
   - Storage: ISO 8601 string `"2026-01-20T14:30:00.000Z"`
   - Use `new Date().toISOString()` for createdAt/updatedAt

### Data Model (from Architecture)

```typescript
interface Query {
  id: string;
  name: string;
  sql: string;
  folderId: string | null;  // null = root level
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;  // null = root folder
}

interface StorageSchema {
  queries: Query[];
  folders: Folder[];
}
```

### Chrome Storage API Notes

**API to use:** `chrome.storage.local`
- 5MB limit (sufficient for thousands of queries)
- Async API with callbacks (can wrap in Promise)

**Example pattern:**
```typescript
async function getStorage<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}
```

### Testing Notes

**Mock chrome.storage.local:**
```typescript
const mockStorage: Record<string, unknown> = {};

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        const result: Record<string, unknown> = {};
        if (Array.isArray(keys)) {
          keys.forEach(k => { result[k] = mockStorage[k]; });
        }
        callback(result);
      }),
      set: vi.fn((items, callback) => {
        Object.assign(mockStorage, items);
        callback?.();
      }),
    },
  },
} as unknown as typeof chrome;
```

### Existing Codebase Context

**Current project structure:**
```
src/
├── shared/
│   ├── types/
│   │   └── message.types.ts  // Existing - has Result<T> pattern
│   ├── services/
│   │   └── example.test.ts   // Placeholder - can remove
│   └── utils/
│       └── url-utils.ts      // Existing utility pattern
├── background/
│   ├── index.ts              // Service worker
│   └── icon-state.ts         // Icon state management
├── contentScript/
│   ├── index.ts              // Content script
│   └── smp-detector.ts       // SMP detection
└── popup/
    └── index.ts              // Popup entry
```

**Existing MessageResult<T> type in `message.types.ts`:**
The same `Result<T>` pattern is already defined as `MessageResult<T>`. Consider:
- Reuse `MessageResult<T>` as the standard Result type
- Or create a separate `Result<T>` in storage.types.ts (may cause confusion)
- **Recommendation:** Create a `src/shared/types/result.types.ts` with a canonical `Result<T>` type that both message and storage can use

### Epic 1 Retrospective Learnings

From `epic-1-retro-2026-01-21.md`:

1. **Follow established patterns** - Reference `project-context.md` before implementing
2. **First-pass quality** - Reduces code review iterations
3. **Template structure differs** - Files are named `index.ts`, folders are `contentScript/` not `content/`

### Project Structure Notes

- Files go in `src/shared/types/` for types
- Files go in `src/shared/services/` for service modules
- Tests co-located with source: `storage-service.test.ts` next to `storage-service.ts`
- Follow existing patterns from `url-utils.ts` and `smp-detector.ts`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4, FR5]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-01-21.md#Key Insights]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation

### Completion Notes List

1. **Task 1 - Type Definitions:**
   - Created canonical `Result<T>` type in `src/shared/types/result.types.ts` per Dev Notes recommendation
   - Created `Query`, `Folder`, `StorageSchema`, and `SaveQueryInput` interfaces in `storage.types.ts`
   - All types match Architecture specification exactly
   - Updated `message.types.ts` to re-export `MessageResult<T>` from canonical `Result<T>`

2. **Task 2 - Storage Service:**
   - Implemented all CRUD operations following Result<T> pattern (never throws)
   - `saveQuery()` uses `crypto.randomUUID()` per AC4
   - All timestamps use ISO 8601 format via `new Date().toISOString()`
   - Chrome storage API wrapped in Promises with proper error handling

3. **Task 3 - Unit Tests:**
   - 15 comprehensive tests covering all operations
   - Mocked `chrome.storage.local` and `crypto.randomUUID`
   - Tests verify: empty storage, populated storage, UUID generation, timestamp updates, error handling
   - All 60 project tests pass

### File List

**Created:**
- `src/shared/types/result.types.ts`
- `src/shared/types/storage.types.ts`
- `src/shared/types/message.types.ts`
- `src/shared/services/storage-service.ts`
- `src/shared/services/storage-service.test.ts`

## Change Log

- 2026-01-21: Implemented Story 2.1 - Storage Service & Data Model with full test coverage
- 2026-01-21: Code Review Fixes Applied:
  - [M1] Fixed File List: message.types.ts is "Created" not "Modified"
  - [M3] Added input validation to saveQuery() - rejects empty name/sql
  - [M4] Removed unused Folder import from test file
  - Added 4 new validation tests (64 total tests passing)
