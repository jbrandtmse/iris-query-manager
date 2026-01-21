# Story 1.2: Configure Extension Manifest & Service Worker

Status: done

## Story

As a **developer**,
I want **to configure the extension manifest with proper permissions and a service worker**,
So that **the extension has the foundation for background processing and SMP page access**.

## Acceptance Criteria

1. **Given** the initialized project
   **When** I configure manifest.json
   **Then** it includes manifest_version 3, name "IRIS Query Manager", and version "1.0.0"

2. **Given** the manifest configuration
   **When** I set permissions
   **Then** it includes "storage" and "activeTab" permissions only (minimal permissions)

3. **Given** the manifest configuration
   **When** I set host_permissions
   **Then** it includes the SMP URL pattern `*://*/%25CSP.UI.Portal.SQL.Home.zen*`

4. **Given** the manifest configuration
   **When** I configure the service worker
   **Then** background.service_worker points to the compiled service worker file

5. **Given** the configured extension
   **When** I load it in Chrome
   **Then** no permission warnings appear beyond the expected storage and host permissions

## Tasks / Subtasks

- [x] **Task 1: Update manifest.ts with correct metadata** (AC: #1)
  - [x] Set name to "IRIS Query Manager" (via package.json displayName)
  - [x] Set version to "1.0.0"
  - [x] Verify manifest_version is 3

- [x] **Task 2: Configure minimal permissions** (AC: #2)
  - [x] Set permissions to ["storage", "activeTab"] only
  - [x] Remove any unnecessary permissions (sidePanel, etc.)

- [x] **Task 3: Add SMP host_permissions** (AC: #3)
  - [x] Add host_permissions array with SMP URL pattern
  - [x] Pattern: `*://*/%25CSP.UI.Portal.SQL.Home.zen*`

- [x] **Task 4: Configure service worker** (AC: #4)
  - [x] Verify background.service_worker points to correct file
  - [x] Ensure type is "module"

- [x] **Task 5: Clean up unused extension components** (AC: #5)
  - [x] Remove newtab page (not needed for this extension)
  - [x] Remove devtools page (not needed for MVP)
  - [x] Remove sidepanel (not needed for MVP)
  - [x] Remove options page (not needed for MVP)
  - [x] Remove content_scripts broad matching (will be configured in Story 1.3)

- [x] **Task 6: Verify build and load** (AC: #5)
  - [x] Run npm run build successfully
  - [x] Verify manifest.json in build/ has correct configuration

## Dev Notes

### SMP URL Pattern Explanation

The URL pattern `*://*/%25CSP.UI.Portal.SQL.Home.zen*` matches:
- `%25` is URL-encoded `%` (double encoding because the URL itself contains `%CSP`)
- This matches the IRIS System Management Portal SQL Query page
- Works across different IRIS instances (localhost, remote servers)

### Permissions Rationale

- **storage**: Required for chrome.storage.local to persist queries
- **activeTab**: Grants temporary access to the active tab when user clicks extension icon

### Files to Modify

- `src/manifest.ts` - Main manifest configuration
- `package.json` - Ensure displayName and version are correct
- Remove: `newtab.html`, `devtools.html`, `sidepanel.html`, `options.html`
- Remove: `src/newtab/`, `src/devtools/`, `src/sidepanel/`, `src/options/`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Updated package.json version from 0.1.0 to 1.0.0
- Simplified manifest.ts removing unused components (options, devtools, sidepanel, newtab, content_scripts, web_accessible_resources, chrome_url_overrides)
- Changed permissions from ["sidePanel", "storage"] to ["storage", "activeTab"]
- Added host_permissions for SMP URL pattern
- Removed broad content_scripts matching - will be added back in Story 1.3 with specific SMP patterns
- Build output reduced from 24 files to 11 files (cleaner, minimal extension)

### File List

**Modified:**
- `package.json` - Version updated to 1.0.0
- `package-lock.json` - Updated dependencies (vitest, coverage)
- `src/manifest.ts` - Simplified configuration with minimal permissions
- `src/background/index.ts` - Cleaned up boilerplate, placeholder for future message handling
- `src/popup/index.ts` - Cleaned up counter boilerplate, placeholder for query manager UI
- `tsconfig.json` - Added vitest/globals and chrome types

**Added:**
- `vitest.config.ts` - Vitest test configuration with jsdom environment
- `src/manifest.test.ts` - Tests for manifest AC requirements
- `src/shared/` - Shared code directory structure (types, services, test-utils)
- `src/shared/services/example.test.ts` - Framework verification test

**Removed:**
- `newtab.html` - New tab page (not needed)
- `devtools.html` - DevTools page (not needed for MVP)
- `sidepanel.html` - Side panel (not needed for MVP)
- `options.html` - Options page (not needed for MVP)
- `src/newtab/` - New tab source directory
- `src/devtools/` - DevTools source directory
- `src/sidepanel/` - Side panel source directory
- `src/options/` - Options source directory
- `src/assets/logo.png` - Unused asset

## Senior Developer Review (AI)

**Reviewed:** 2026-01-20
**Reviewer:** Amelia (Dev Agent)
**Outcome:** ✅ APPROVED with fixes applied

### Issues Found & Fixed

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| HIGH | File List incomplete - missing 6+ files | Updated File List above |
| HIGH | Popup used chrome.storage.sync (docs said .local) | Removed storage usage entirely (placeholder now) |
| MEDIUM | Boilerplate counter UI in popup | Replaced with placeholder UI |
| MEDIUM | Template COUNT handler in service worker | Replaced with placeholder |
| MEDIUM | No AC validation tests | Added `src/manifest.test.ts` with 8 tests |
| MEDIUM | Missing vitest types in tsconfig | Added types array |
| LOW | Hardcoded GitHub link | Removed |
| LOW | Generic icons | Noted - will be addressed in future story |

### Verification

- ✅ All 10 tests passing
- ✅ Build successful (11 files output)
- ✅ All ACs verified against built manifest.json

## Change Log

- 2026-01-20: Story 1.2 created and started
- 2026-01-20: Story 1.2 implemented - Manifest configured with minimal permissions, unused components removed
- 2026-01-20: Code review completed - 8 issues found and fixed, tests added, File List updated
