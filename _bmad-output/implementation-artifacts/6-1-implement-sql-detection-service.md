# Story 6.1: Implement SQL Detection Service

Status: done

## Story

As a **developer**,
I want **a service that detects destructive SQL keywords**,
So that **the system can identify dangerous queries before pasting**. (FR22)

## Acceptance Criteria

1. **Given** the SQL detection service **When** I pass a query containing DELETE **Then** it returns `{ isDestructive: true, keywords: ['DELETE'], severity: 'danger' }` (FR22)

2. **Given** destructive keyword detection **When** checking for keywords **Then** it detects: DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT

3. **Given** keyword matching **When** checking case variations **Then** detection is case-insensitive (`delete`, `DELETE`, `Delete` all match)

4. **Given** keyword matching **When** checking for false positives **Then** it uses word boundaries (e.g., "DELETED_FLAG" doesn't match DELETE)

5. **Given** unit tests for SQL detection **When** I run `npm run test` **Then** all detection patterns are verified with positive and negative cases

## Tasks / Subtasks

- [x] Task 1: Create sql-detection-service.ts with core detection function (AC: 1, 2, 3, 4)
  - [x] 1.1: Create file `src/shared/services/sql-detection-service.ts`
  - [x] 1.2: Define `SqlDetectionResult` interface:
    ```typescript
    interface SqlDetectionResult {
      isDestructive: boolean
      keywords: DestructiveKeyword[]
      severity: 'none' | 'caution' | 'danger'
    }
    ```
  - [x] 1.3: Define `DestructiveKeyword` type: `'DELETE' | 'DROP' | 'TRUNCATE' | 'UPDATE' | 'ALTER' | 'INSERT'`
  - [x] 1.4: Define severity mapping:
    - `danger`: DELETE, DROP, TRUNCATE (data loss/schema destruction)
    - `caution`: UPDATE, ALTER, INSERT (data modification)
  - [x] 1.5: Implement `detectDestructiveKeywords(sql: string): SqlDetectionResult`
  - [x] 1.6: Use case-insensitive regex with word boundaries: `/\b(DELETE|DROP|...)\b/gi`
  - [x] 1.7: Return all matched keywords (deduplicated) and highest severity

- [x] Task 2: Export types and function for popup/service worker use (AC: 1)
  - [x] 2.1: Export all types from `src/shared/types/index.ts`
  - [x] 2.2: Ensure function can be imported in popup for pre-paste detection

- [x] Task 3: Write comprehensive unit tests (AC: 5)
  - [x] 3.1: Create `src/shared/services/sql-detection-service.test.ts`
  - [x] 3.2: Test DELETE detection (various cases)
  - [x] 3.3: Test DROP detection (DROP TABLE, DROP INDEX, etc.)
  - [x] 3.4: Test TRUNCATE detection
  - [x] 3.5: Test UPDATE detection
  - [x] 3.6: Test ALTER detection
  - [x] 3.7: Test INSERT detection
  - [x] 3.8: Test case insensitivity (lowercase, UPPERCASE, MixedCase)
  - [x] 3.9: Test word boundary enforcement:
    - "DELETED_FLAG" should NOT match DELETE
    - "DROPDOWN" should NOT match DROP
    - "ALTERATIONS" should NOT match ALTER
    - "INSERTS_LOG" should NOT match INSERT
    - "UPDATED_AT" should NOT match UPDATE
  - [x] 3.10: Test multiple keywords in single query (e.g., "DELETE... INSERT...")
  - [x] 3.11: Test severity calculation (highest severity wins)
  - [x] 3.12: Test safe SELECT queries return `{ isDestructive: false, keywords: [], severity: 'none' }`
  - [x] 3.13: Test edge cases: empty string, whitespace-only, null/undefined
  - [x] 3.14: Test SQL with comments (keywords in comments should still match - conservative approach)

## Dev Notes

### Architecture Context

This is the **first story in Epic 6: Safety & Destructive Query Warnings**. It creates the foundation that Stories 6-2 (Warning Badge), 6-3 (Warning Modal), and 6-4 (Modal Actions) will build upon.

The SQL detection service will be called:
1. **At render time** - When tree items display, to show warning badges
2. **Before paste** - When user clicks a query, to show warning modal if needed

### Keyword Categorization

From PRD FR22 and UX spec:

| Keyword | Severity | Rationale |
|---------|----------|-----------|
| DELETE | danger | Data loss - rows removed permanently |
| DROP | danger | Schema destruction - tables/indexes removed |
| TRUNCATE | danger | Data loss - all rows removed |
| UPDATE | caution | Data modification - can be undone with backups |
| ALTER | caution | Schema modification - usually reversible |
| INSERT | caution | Data addition - can be rolled back |

**Severity Display (from UX spec):**
- **danger** (red `#ea4335`): DELETE, DROP, TRUNCATE
- **caution** (amber `#fbbc04`): UPDATE, ALTER, INSERT

### Regex Pattern

```typescript
// Word boundary matching - case insensitive
const DESTRUCTIVE_PATTERN = /\b(DELETE|DROP|TRUNCATE|UPDATE|ALTER|INSERT)\b/gi

// Why word boundaries matter:
// ✅ "DELETE FROM users" → matches DELETE
// ❌ "DELETED_FLAG = 1" → does NOT match (DELETED is not DELETE)
// ❌ "SELECT * FROM DROPDOWN_OPTIONS" → does NOT match (DROPDOWN is not DROP)
```

### Function Signature

```typescript
// src/shared/services/sql-detection-service.ts

export type DestructiveKeyword = 'DELETE' | 'DROP' | 'TRUNCATE' | 'UPDATE' | 'ALTER' | 'INSERT'

export type Severity = 'none' | 'caution' | 'danger'

export interface SqlDetectionResult {
  isDestructive: boolean
  keywords: DestructiveKeyword[]
  severity: Severity
}

const DANGER_KEYWORDS: DestructiveKeyword[] = ['DELETE', 'DROP', 'TRUNCATE']
const CAUTION_KEYWORDS: DestructiveKeyword[] = ['UPDATE', 'ALTER', 'INSERT']
const ALL_KEYWORDS = [...DANGER_KEYWORDS, ...CAUTION_KEYWORDS]

const DESTRUCTIVE_PATTERN = new RegExp(
  `\\b(${ALL_KEYWORDS.join('|')})\\b`,
  'gi'
)

/**
 * Detect destructive SQL keywords in a query (FR22)
 *
 * Uses word boundary matching to avoid false positives like:
 * - "DELETED_FLAG" matching DELETE
 * - "DROPDOWN" matching DROP
 *
 * @param sql - The SQL query to analyze
 * @returns Detection result with keywords found and severity level
 */
export function detectDestructiveKeywords(sql: string): SqlDetectionResult {
  if (!sql || typeof sql !== 'string') {
    return { isDestructive: false, keywords: [], severity: 'none' }
  }

  const matches = sql.match(DESTRUCTIVE_PATTERN)

  if (!matches || matches.length === 0) {
    return { isDestructive: false, keywords: [], severity: 'none' }
  }

  // Normalize to uppercase and deduplicate
  const keywords = [...new Set(matches.map(m => m.toUpperCase()))] as DestructiveKeyword[]

  // Determine severity (highest wins)
  const hasDanger = keywords.some(k => DANGER_KEYWORDS.includes(k))
  const severity: Severity = hasDanger ? 'danger' : 'caution'

  return {
    isDestructive: true,
    keywords,
    severity,
  }
}
```

### Usage in Later Stories

**Story 6-2 (Warning Badge):**
```typescript
// In tree-item.ts
import { detectDestructiveKeywords } from '../shared/services/sql-detection-service'

function renderQueryItem(query: Query): string {
  const detection = detectDestructiveKeywords(query.sql)
  const badge = detection.isDestructive
    ? renderWarningBadge(detection.keywords[0], detection.severity)
    : ''
  // ...
}
```

**Story 6-3 (Warning Modal):**
```typescript
// In popup/index.ts or paste handler
import { detectDestructiveKeywords } from '../shared/services/sql-detection-service'

async function handleQueryClick(query: Query): Promise<void> {
  const detection = detectDestructiveKeywords(query.sql)

  if (detection.isDestructive) {
    const confirmed = await showWarningModal(query, detection)
    if (!confirmed) return
  }

  // Proceed with paste
  await pasteQuery(query.id)
}
```

### Test Coverage Priorities

1. **Core functionality** - All 6 keywords detected correctly
2. **Case insensitivity** - Must work regardless of case
3. **Word boundaries** - CRITICAL: No false positives
4. **Multiple keywords** - Queries can have multiple destructive operations
5. **Severity calculation** - Danger takes precedence over caution
6. **Edge cases** - Empty/null inputs handled gracefully

### Test Examples

```typescript
// Positive cases (should detect)
detectDestructiveKeywords('DELETE FROM users WHERE id = 1')
// → { isDestructive: true, keywords: ['DELETE'], severity: 'danger' }

detectDestructiveKeywords('drop table if exists temp_data')
// → { isDestructive: true, keywords: ['DROP'], severity: 'danger' }

detectDestructiveKeywords('UPDATE users SET name = "test" WHERE id = 1')
// → { isDestructive: true, keywords: ['UPDATE'], severity: 'caution' }

// Negative cases (should NOT detect)
detectDestructiveKeywords('SELECT * FROM DELETED_RECORDS')
// → { isDestructive: false, keywords: [], severity: 'none' }

detectDestructiveKeywords('SELECT dropdown_id FROM options')
// → { isDestructive: false, keywords: [], severity: 'none' }

// Multiple keywords
detectDestructiveKeywords('DELETE FROM old; INSERT INTO archive SELECT * FROM old')
// → { isDestructive: true, keywords: ['DELETE', 'INSERT'], severity: 'danger' }

// Edge cases
detectDestructiveKeywords('')
// → { isDestructive: false, keywords: [], severity: 'none' }

detectDestructiveKeywords(null as unknown as string)
// → { isDestructive: false, keywords: [], severity: 'none' }
```

### Previous Story Learnings Applied

From Story 5-5 (Import Replace):
1. **Result objects pattern** - Return structured objects, never throw
2. **Type exports** - Export all types from shared/types/index.ts
3. **Test organization** - Co-locate tests with source files
4. **Edge case coverage** - Always handle null/undefined/empty inputs

### Project Structure Notes

**Files to Create:**
- `src/shared/services/sql-detection-service.ts` - Core detection logic
- `src/shared/services/sql-detection-service.test.ts` - Unit tests

**Files to Modify:**
- `src/shared/types/index.ts` - Export new types (SqlDetectionResult, DestructiveKeyword, Severity)

### Architecture Compliance

From `project-context.md`:

1. **Never throw from services** - Return result objects ✓
2. **File naming** - kebab-case: `sql-detection-service.ts` ✓
3. **Type exports** - Use `export type` for type-only exports ✓
4. **Test co-location** - Test file next to source file ✓
5. **Import type syntax** - `import type { SqlDetectionResult }` in consumers

### Performance Notes

- Regex compilation happens once at module load (static pattern)
- Detection is O(n) where n = SQL string length
- Expected execution time: < 1ms for typical queries
- No async operations needed - pure synchronous function

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR22]
- [Source: _bmad-output/planning-artifacts/architecture.md#SQL Pattern Detection]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Warning Badge, Warning Modal]
- [Source: _bmad-output/project-context.md#TypeScript Rules, Testing Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without issues.

### Completion Notes List

- Implemented SQL detection service following red-green-refactor TDD cycle
- Created `detectDestructiveKeywords()` function with word boundary regex matching
- Defined types: `DestructiveKeyword`, `Severity`, `SqlDetectionResult`
- Exported `DANGER_KEYWORDS` and `CAUTION_KEYWORDS` constants for reuse
- Wrote 50 comprehensive unit tests covering all acceptance criteria
- All 749 tests pass (no regressions)
- TypeScript compiles without errors
- Note on Task 2.1: Project follows "no barrel exports" pattern per project-context.md, so types are exported directly from the service file rather than creating an index.ts

### Code Review Fixes (2026-01-25)

- Removed redundant `DESTRUCTIVE_PATTERN.lastIndex = 0` reset (`.match()` handles this internally)
- Added type export verification tests for `Severity`, `DestructiveKeyword`, and `SqlDetectionResult`
- Added edge case tests for non-string input types (number, object, array, boolean)
- Test count increased from 50 to 57 tests
- All 756 tests pass (full suite)

### File List

- `src/shared/services/sql-detection-service.ts` (created)
- `src/shared/services/sql-detection-service.test.ts` (created)

### Change Log

- 2026-01-25: Story 6-1 implemented - SQL Detection Service with comprehensive test coverage

