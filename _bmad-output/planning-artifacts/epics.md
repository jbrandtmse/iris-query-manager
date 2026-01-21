---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
validation:
  fr_coverage: '31/31 (100%)'
  architecture_compliance: 'pass'
  story_quality: 'pass'
  epic_structure: 'pass'
  dependency_flow: 'pass'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# IRIS Query Manager - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for IRIS Query Manager, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Query Capture & Storage (FR1-FR5)**
- FR1: User can capture the current SQL query from the SMP textarea with one click
- FR2: User can assign a name to a captured query before saving
- FR3: User can save a query to a specific folder during capture
- FR4: System persists all queries in local browser storage across sessions
- FR5: System assigns unique identifiers to each stored query

**Query Retrieval & Paste (FR6-FR9)**
- FR6: User can browse all saved queries in a hierarchical tree view
- FR7: User can paste a selected query into the SMP textarea with one click
- FR8: User can preview a query's SQL content before pasting
- FR9: System detects when user is on an SMP SQL page and enables paste functionality

**Folder Organization (FR10-FR15)**
- FR10: User can create folders to organize queries
- FR11: User can create nested folders (subfolders within folders)
- FR12: User can rename folders
- FR13: User can delete empty folders
- FR14: User can move queries between folders via drag-and-drop
- FR15: User can move folders within the hierarchy

**Import & Export (FR16-FR21)**
- FR16: User can export all queries and folders to a JSON file
- FR17: User can export selected queries/folders to a JSON file
- FR18: User can import queries from a JSON file
- FR19: User can choose to merge imported queries with existing library
- FR20: User can choose to replace existing library with imported queries
- FR21: System validates import file format before processing

**Safety & Warnings (FR22-FR25)**
- FR22: System detects destructive SQL keywords (DELETE, UPDATE, INSERT, DROP, ALTER, TRUNCATE)
- FR23: System displays a warning modal when user attempts to paste a destructive query
- FR24: Warning modal shows the query content for user review
- FR25: User can confirm or cancel the paste action from the warning modal

**Query Management (FR26-FR28)**
- FR26: User can rename a saved query
- FR27: User can delete a saved query
- FR28: User can view query metadata (created date, last modified)

**SMP Integration (FR29-FR31)**
- FR29: Extension activates automatically when user navigates to SMP SQL page
- FR30: Extension icon indicates active/inactive state based on current page
- FR31: System gracefully handles cases where SMP textarea is not found

### NonFunctional Requirements

**Performance (NFR1-NFR5)**
- NFR1: Query capture completes < 100ms (perceived instant)
- NFR2: Query paste completes < 100ms (perceived instant)
- NFR3: Popup opens and renders tree < 300ms
- NFR4: Import file processing < 2 seconds for 100 queries
- NFR5: Export file generation < 1 second

**Reliability (NFR6-NFR10)**
- NFR6: Data persistence - Zero data loss across browser sessions
- NFR7: Storage operations - 100% success rate or clear error
- NFR8: SMP detection - Works across IRIS 2020.1+ versions
- NFR9: Import validation - Invalid files rejected with clear message
- NFR10: Graceful degradation - Extension functional when SMP not detected

**Security (NFR11-NFR13)**
- NFR11: Data locality - All data stays in Chrome local storage
- NFR12: No network requests - MVP makes zero external HTTP calls
- NFR13: Permission minimization - Only storage + activeTab permissions

**Maintainability (NFR14-NFR16)**
- NFR14: Codebase simplicity - Single developer can understand entire codebase
- NFR15: Standard patterns - Use standard Chrome extension patterns
- NFR16: Clear separation - Popup, content script, service worker separation

### Additional Requirements

**From Architecture:**
- **Starter Template:** `npx create-chrome-ext query-manager --template vanilla-ts` (EPIC 1, STORY 1)
- TypeScript 5.x with strict mode enabled
- Vite for build tooling with HMR
- Vitest for unit testing
- Manifest V3 Service Worker architecture
- Data model: Flat with references (separate folders[] and queries[] arrays)
- Message passing: Direct messaging with Result objects
- Chrome APIs: `chrome.storage.local`, `chrome.runtime`, `chrome.tabs`

**From UX Design:**
- 9 custom UI components (Tree View, Tree Item, Capture Form, Warning Modal, Query Preview, Warning Badge, Icon Button, Context Menu, Toast)
- Popup dimensions: 360px width, 500px max height
- Tree item height: 32px
- Design tokens via CSS custom properties
- WCAG 2.1 Level AA accessibility compliance
- Warning modal variants: Danger (red) for DELETE/DROP/TRUNCATE, Caution (amber) for UPDATE/ALTER
- BEM-inspired CSS naming convention

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | One-click capture from SMP textarea |
| FR2 | Epic 2 | Assign name to captured query |
| FR3 | Epic 2 | Save query to specific folder |
| FR4 | Epic 2 | Persist queries in local storage |
| FR5 | Epic 2 | Assign unique identifiers |
| FR6 | Epic 3 | Browse queries in tree view |
| FR7 | Epic 3 | One-click paste to SMP |
| FR8 | Epic 3 | Preview query SQL before paste |
| FR9 | Epic 3 | Detect SMP page for paste |
| FR10 | Epic 4 | Create folders |
| FR11 | Epic 4 | Create nested folders |
| FR12 | Epic 4 | Rename folders |
| FR13 | Epic 4 | Delete empty folders |
| FR14 | Epic 4 | Drag-drop queries between folders |
| FR15 | Epic 4 | Move folders in hierarchy |
| FR16 | Epic 5 | Export all queries to JSON |
| FR17 | Epic 5 | Export selected queries/folders |
| FR18 | Epic 5 | Import queries from JSON |
| FR19 | Epic 5 | Merge imported queries |
| FR20 | Epic 5 | Replace library with import |
| FR21 | Epic 5 | Validate import file format |
| FR22 | Epic 6 | Detect destructive SQL keywords |
| FR23 | Epic 6 | Display warning modal |
| FR24 | Epic 6 | Show query content in warning |
| FR25 | Epic 6 | Confirm/cancel paste from modal |
| FR26 | Epic 3 | Rename saved query |
| FR27 | Epic 3 | Delete saved query |
| FR28 | Epic 3 | View query metadata |
| FR29 | Epic 1 | Auto-activate on SMP SQL page |
| FR30 | Epic 1 | Icon indicates active/inactive state |
| FR31 | Epic 1 | Graceful handling when textarea not found |

## Epic List

### Epic 1: Project Foundation & SMP Detection

**Goal:** Extension installs in Chrome, recognizes SMP SQL pages, and provides visual feedback about its state.

**FRs covered:** FR29, FR30, FR31

**Scope:**
- Initialize project with `npx create-chrome-ext query-manager --template vanilla-ts`
- Configure Manifest V3 with permissions (storage, activeTab, host_permissions)
- Implement service worker for background processing
- Create content script with SMP URL pattern matching
- Implement SMP textarea detection with fallback strategies
- Extension icon state management (active/inactive)

---

### Epic 2: Query Capture & Storage

**Goal:** Users can save SQL queries from the SMP textarea with a name, and queries persist across browser sessions.

**FRs covered:** FR1, FR2, FR3, FR4, FR5

**Scope:**
- Storage service with chrome.storage.local
- Data model implementation (Query, Folder interfaces)
- Message protocol for popup ↔ content script communication
- Popup shell with header and capture form
- Capture form component (name input, folder dropdown)
- Toast notification component for success feedback
- Unit tests for storage service

---

### Epic 3: Query Library & Retrieval

**Goal:** Users can browse their saved queries in a tree view, preview SQL content, and paste queries back into SMP with one click.

**FRs covered:** FR6, FR7, FR8, FR9, FR26, FR27, FR28

**Scope:**
- Tree view container component
- Tree item component (query variant)
- Query preview panel
- Paste functionality via content script
- Context menu component (rename, delete)
- Query metadata display (created/updated dates)
- Unit tests for message service

---

### Epic 4: Folder Organization

**Goal:** Users can create hierarchical folders to organize queries, move queries between folders, and manage their folder structure.

**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15

**Scope:**
- Tree item component (folder variant with expand/collapse)
- Create folder functionality
- Nested folder support (parentId references)
- Folder rename and delete operations
- Drag-and-drop for queries between folders
- Drag-and-drop for folder reordering
- Empty folder validation before delete

---

### Epic 5: Import/Export & Team Sharing

**Goal:** Users can export their query library to JSON files for backup or sharing, and import query packs from colleagues.

**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21

**Scope:**
- Import/export service
- Export all functionality (JSON file download)
- Export selected folder functionality
- Import file picker and validation
- Import preview showing folder structure
- Merge vs replace options
- Duplicate handling strategy
- Unit tests for import validation

---

### Epic 6: Safety & Destructive Query Warnings

**Goal:** Users are protected from accidentally pasting destructive queries (DELETE, DROP, etc.) by a warning modal that requires confirmation.

**FRs covered:** FR22, FR23, FR24, FR25

**Scope:**
- SQL detection service (regex-based keyword detection)
- Warning badge component on tree items
- Warning modal component (danger/caution variants)
- Integration with paste flow (intercept before paste)
- Query preview in warning modal
- Confirm/cancel actions
- Unit tests for SQL detection service

---

## Epic 1: Project Foundation & SMP Detection

### Story 1.1: Initialize Chrome Extension Project

**As a** developer,
**I want** to initialize the Chrome extension project with the proper tooling and structure,
**So that** I have a solid foundation for building the Query Manager features.

**Acceptance Criteria:**

**Given** an empty project directory
**When** I run `npx create-chrome-ext query-manager --template vanilla-ts`
**Then** a new Chrome extension project is created with TypeScript and Vite configuration

**Given** the initialized project
**When** I run `npm install`
**Then** all dependencies install successfully with no errors

**Given** the project is installed
**When** I run `npm run dev`
**Then** the extension builds and is ready to load as an unpacked extension

**Given** the built extension
**When** I load it in Chrome via chrome://extensions (developer mode)
**Then** the extension appears in the browser toolbar with a default popup

---

### Story 1.2: Configure Extension Manifest & Service Worker

**As a** developer,
**I want** to configure the extension manifest with proper permissions and a service worker,
**So that** the extension has the foundation for background processing and SMP page access.

**Acceptance Criteria:**

**Given** the initialized project
**When** I configure manifest.json
**Then** it includes manifest_version 3, name "IRIS Query Manager", and version "1.0.0"

**Given** the manifest configuration
**When** I set permissions
**Then** it includes "storage" and "activeTab" permissions only (minimal permissions)

**Given** the manifest configuration
**When** I set host_permissions
**Then** it includes the SMP URL pattern `*://*/%25CSP.UI.Portal.SQL.Home.zen*`

**Given** the manifest configuration
**When** I configure the service worker
**Then** background.service_worker points to the compiled service worker file

**Given** the configured extension
**When** I load it in Chrome
**Then** no permission warnings appear beyond the expected storage and host permissions

---

### Story 1.3: Implement SMP Page Detection

**As a** user,
**I want** the extension to automatically detect when I'm on an SMP SQL page,
**So that** it can interact with the SQL textarea. (FR29)

**Acceptance Criteria:**

**Given** a content script configured for SMP URL patterns
**When** I navigate to an SMP SQL page (`%25CSP.UI.Portal.SQL.Home.zen`)
**Then** the content script is injected into the page

**Given** the content script is active
**When** it searches for the SQL textarea
**Then** it looks for `textarea` within `div#QueryText` container

**Given** the textarea is found
**When** the content script initializes
**Then** it sends a `CHECK_SMP_AVAILABLE` message to the service worker with success status

**Given** the textarea is NOT found (different IRIS version)
**When** the content script searches with fallback strategies
**Then** it attempts alternative selectors before reporting failure (FR31)

**Given** the SMP page loads dynamically
**When** the textarea appears after initial page load
**Then** the content script detects it using MutationObserver or re-query on demand

---

### Story 1.4: Extension Icon State Management

**As a** user,
**I want** the extension icon to indicate whether I'm on an SMP page,
**So that** I know when the extension is active and ready to use. (FR30)

**Acceptance Criteria:**

**Given** I am on an SMP SQL page with textarea detected
**When** the content script reports availability
**Then** the extension icon shows an "active" state (full color)

**Given** I am on a non-SMP page
**When** I view the extension icon
**Then** it shows an "inactive" state (grayed out or badge indicator)

**Given** I am on an SMP page but textarea is not found
**When** the content script reports unavailable
**Then** the icon shows inactive state and popup displays helpful message (FR31)

**Given** I navigate from SMP to a different page
**When** the tab URL changes
**Then** the icon state updates to reflect the new page status

---

## Epic 2: Query Capture & Storage

### Story 2.1: Implement Storage Service & Data Model

**As a** developer,
**I want** a storage service with TypeScript interfaces for queries and folders,
**So that** I have a reliable foundation for persisting user data. (FR4, FR5)

**Acceptance Criteria:**

**Given** the storage service module
**When** I define the data model
**Then** Query interface includes: id, name, sql, folderId, createdAt, updatedAt

**Given** the storage service module
**When** I define the Folder interface
**Then** it includes: id, name, parentId (nullable for root folders)

**Given** the storage service
**When** I call `saveQuery(query)`
**Then** it returns a Result object `{ success: true, data: Query }` or `{ success: false, error: string }`

**Given** the storage service
**When** I save a query
**Then** a unique ID is generated using `crypto.randomUUID()` (FR5)

**Given** the storage service
**When** I call `getQueries()`
**Then** it returns all stored queries from chrome.storage.local

**Given** unit tests for the storage service
**When** I run `npm run test`
**Then** all storage operations are tested with mocked chrome.storage API

---

### Story 2.2: Implement Message Protocol

**As a** developer,
**I want** a typed message protocol between popup, content script, and service worker,
**So that** components can communicate reliably across extension contexts.

**Acceptance Criteria:**

**Given** the message types module
**When** I define message types
**Then** they use discriminated unions with UPPER_SNAKE_CASE action names

**Given** a message handler in the service worker
**When** it receives an async message
**Then** it returns `true` from the listener to enable async response

**Given** the message service
**When** popup sends `GET_CURRENT_SQL` to content script
**Then** content script responds with `{ success: true, data: string }` containing textarea value

**Given** message communication
**When** any operation fails
**Then** it returns `{ success: false, error: string }` with descriptive message

---

### Story 2.3: Create Popup Shell & Header

**As a** user,
**I want** to open the extension popup and see a clean interface,
**So that** I can access query management features.

**Acceptance Criteria:**

**Given** I click the extension icon on an SMP page
**When** the popup opens
**Then** it displays at 360px width with a header containing the extension name

**Given** the popup shell
**When** it renders
**Then** it uses design tokens from CSS custom properties (per architecture)

**Given** the popup header
**When** displayed
**Then** it includes icon buttons for primary actions (capture, menu)

**Given** the popup loads
**When** rendering completes
**Then** it takes less than 300ms (NFR3)

---

### Story 2.4: Implement Capture Form Component

**As a** user,
**I want** to capture the current SQL query with a name,
**So that** I can save it for later retrieval. (FR1, FR2)

**Acceptance Criteria:**

**Given** I click the capture button in the popup
**When** the capture form appears
**Then** it shows a text input for query name (required) and folder dropdown (optional) (FR2, FR3)

**Given** the capture form is open
**When** I enter a query name and click Save
**Then** the current SQL is captured from the SMP textarea (FR1)

**Given** valid capture input
**When** the save operation completes
**Then** it takes less than 100ms (NFR1)

**Given** I leave the name field empty
**When** I try to save
**Then** the Save button is disabled and validation message appears

**Given** the folder dropdown
**When** folders exist in storage
**Then** they appear as options; default is "No folder" (root level)

---

### Story 2.5: Implement Toast Notification Component

**As a** user,
**I want** to see confirmation when my query is saved,
**So that** I know the capture was successful.

**Acceptance Criteria:**

**Given** a query is successfully saved
**When** the storage operation completes
**Then** a success toast appears with checkmark icon and "Query saved" message

**Given** the toast is displayed
**When** 1.5 seconds pass
**Then** it automatically fades out (300ms animation)

**Given** a save operation fails
**When** an error occurs
**Then** an error toast appears and persists until dismissed

**Given** the toast component
**When** rendered
**Then** it uses semantic colors from design tokens (success: green, error: red)

---

## Epic 3: Query Library & Retrieval

### Story 3.1: Implement Tree View Container

**As a** user,
**I want** to see my saved queries in a scrollable tree view,
**So that** I can browse my query library. (FR6)

**Acceptance Criteria:**

**Given** I open the popup with saved queries
**When** the tree view renders
**Then** queries appear as tree items with their names displayed

**Given** more than 12 queries exist
**When** the tree view renders
**Then** it becomes scrollable (max-height ~400px)

**Given** no queries are saved
**When** the tree view renders
**Then** it shows empty state: "No queries saved yet" with capture hint

**Given** the tree view
**When** any item is hovered
**Then** it shows a light blue background highlight

---

### Story 3.2: Implement Tree Item Component (Query Variant)

**As a** user,
**I want** to see each query as a clickable item in the tree,
**So that** I can select and interact with queries.

**Acceptance Criteria:**

**Given** a query tree item
**When** rendered
**Then** it displays at 32px height with query name and icon

**Given** a query tree item
**When** I click on it
**Then** it becomes selected (blue left border, light blue background)

**Given** a query tree item
**When** selected
**Then** only one item can be selected at a time

**Given** keyboard navigation
**When** I press Up/Down arrows
**Then** selection moves between tree items

---

### Story 3.3: Implement Query Preview Panel

**As a** user,
**I want** to preview a query's SQL before pasting,
**So that** I can confirm it's the right query. (FR8)

**Acceptance Criteria:**

**Given** I select a query in the tree view
**When** the selection changes
**Then** a preview panel appears at the bottom showing the SQL content

**Given** the preview panel
**When** displayed
**Then** it shows SQL in monospace font (12px) with max-height 80px

**Given** a long SQL query
**When** displayed in preview
**Then** it is scrollable within the panel

**Given** no query is selected
**When** I view the popup
**Then** the preview panel is hidden (collapsed)

---

### Story 3.4: Implement One-Click Paste

**As a** user,
**I want** to paste a query into the SMP textarea with one click,
**So that** I can quickly use my saved queries. (FR7, FR9)

**Acceptance Criteria:**

**Given** I'm on an SMP page with textarea detected (FR9)
**When** I click on a query in the tree view
**Then** the query SQL is pasted into the SMP textarea (FR7)

**Given** the paste operation
**When** it completes
**Then** it takes less than 100ms (NFR2)

**Given** a successful paste
**When** the operation completes
**Then** a success toast briefly confirms "Query pasted"

**Given** I'm NOT on an SMP page
**When** I click a query
**Then** a message indicates paste is unavailable on this page

---

### Story 3.5: Implement Context Menu (Rename & Delete)

**As a** user,
**I want** to right-click a query for additional actions,
**So that** I can rename or delete queries. (FR26, FR27)

**Acceptance Criteria:**

**Given** I right-click on a query tree item
**When** the context menu appears
**Then** it shows options: "Rename", "Delete"

**Given** I select "Rename" from context menu
**When** the rename dialog appears
**Then** I can edit the query name and save changes (FR26)

**Given** I select "Delete" from context menu
**When** I confirm the deletion
**Then** the query is removed from storage (FR27)

**Given** I click outside the context menu
**When** focus is lost
**Then** the menu closes

**Given** keyboard navigation
**When** context menu is open
**Then** I can navigate with arrow keys and select with Enter

---

### Story 3.6: Display Query Metadata

**As a** user,
**I want** to see when a query was created and last modified,
**So that** I can track query history. (FR28)

**Acceptance Criteria:**

**Given** a query is selected
**When** viewing the preview panel or context menu
**Then** created and updated dates are displayed (FR28)

**Given** date display
**When** rendering timestamps
**Then** they use localized format via `toLocaleDateString()`

**Given** a query was just created
**When** viewing metadata
**Then** createdAt and updatedAt show the same timestamp

---

## Epic 4: Folder Organization

### Story 4.1: Implement Tree Item Component (Folder Variant)

**As a** user,
**I want** to see folders in the tree view with expand/collapse functionality,
**So that** I can navigate my organized query library.

**Acceptance Criteria:**

**Given** folders exist in storage
**When** the tree view renders
**Then** folders appear with folder icon and expand/collapse chevron

**Given** a collapsed folder
**When** I click the chevron or folder row
**Then** it expands to show children (queries and subfolders)

**Given** an expanded folder
**When** I click the chevron or folder row
**Then** it collapses and hides children

**Given** folder tree items
**When** rendered at nesting levels
**Then** they indent 16px per level

---

### Story 4.2: Implement Create Folder Functionality

**As a** user,
**I want** to create folders to organize my queries,
**So that** I can group related queries together. (FR10)

**Acceptance Criteria:**

**Given** the popup header or context menu
**When** I click "New Folder"
**Then** a dialog prompts for folder name

**Given** I enter a folder name and confirm
**When** the folder is created
**Then** it appears in the tree view at root level (FR10)

**Given** I right-click on an existing folder
**When** I select "New Subfolder"
**Then** a new folder is created inside that folder (FR11)

**Given** folder creation
**When** a folder is saved
**Then** it has a unique ID and parentId (null for root, parent's ID for nested)

---

### Story 4.3: Implement Folder Rename & Delete

**As a** user,
**I want** to rename and delete folders,
**So that** I can maintain my organization structure. (FR12, FR13)

**Acceptance Criteria:**

**Given** I right-click on a folder
**When** I select "Rename"
**Then** I can edit the folder name and save changes (FR12)

**Given** I right-click on an empty folder
**When** I select "Delete"
**Then** the folder is removed after confirmation (FR13)

**Given** I try to delete a folder with queries inside
**When** I select "Delete"
**Then** a message indicates the folder must be empty first

**Given** I try to delete a folder with subfolders
**When** I select "Delete"
**Then** a message indicates nested folders must be removed first

---

### Story 4.4: Implement Drag-Drop for Queries

**As a** user,
**I want** to drag queries between folders,
**So that** I can reorganize my library easily. (FR14)

**Acceptance Criteria:**

**Given** I start dragging a query
**When** I drag over a folder
**Then** the folder shows a drop target indicator

**Given** I drop a query on a folder
**When** the drop completes
**Then** the query's folderId updates and it moves to that folder (FR14)

**Given** I drop a query on the root area
**When** the drop completes
**Then** the query's folderId becomes null (moved to root)

**Given** drag operation
**When** I drag outside valid drop targets
**Then** the drag is cancelled with visual feedback

---

### Story 4.5: Implement Drag-Drop for Folders

**As a** user,
**I want** to drag folders to reorganize the hierarchy,
**So that** I can restructure my organization. (FR15)

**Acceptance Criteria:**

**Given** I start dragging a folder
**When** I drag over another folder
**Then** it shows a drop target indicator for nesting

**Given** I drop a folder on another folder
**When** the drop completes
**Then** the dragged folder becomes a subfolder (parentId updated) (FR15)

**Given** I try to drop a folder into its own descendant
**When** the drop is attempted
**Then** the operation is prevented (circular reference protection)

**Given** I drop a folder on the root area
**When** the drop completes
**Then** the folder becomes a root folder (parentId = null)

---

## Epic 5: Import/Export & Team Sharing

### Story 5.1: Implement Export All Functionality

**As a** user,
**I want** to export all my queries and folders to a JSON file,
**So that** I can backup my library or share it with colleagues. (FR16)

**Acceptance Criteria:**

**Given** I click Export in the menu
**When** I select "Export All"
**Then** a JSON file downloads containing all queries and folders (FR16)

**Given** the export operation
**When** it completes
**Then** it takes less than 1 second (NFR5)

**Given** the exported JSON
**When** I open the file
**Then** it's human-readable (pretty-printed) with folders[] and queries[] arrays

**Given** the export file
**When** downloaded
**Then** filename includes "query-manager-export" and current date

---

### Story 5.2: Implement Export Selected Folder

**As a** user,
**I want** to export a specific folder and its contents,
**So that** I can share curated query packs. (FR17)

**Acceptance Criteria:**

**Given** I right-click on a folder
**When** I select "Export"
**Then** a JSON file downloads containing that folder and its queries (FR17)

**Given** a folder with nested subfolders
**When** I export it
**Then** all descendants (subfolders and their queries) are included

**Given** the export file
**When** downloaded
**Then** filename includes the folder name

---

### Story 5.3: Implement Import File Selection & Validation

**As a** user,
**I want** to import queries from a JSON file,
**So that** I can restore backups or receive team query packs. (FR18, FR21)

**Acceptance Criteria:**

**Given** I click Import in the menu
**When** the file picker opens
**Then** I can select a JSON file from my system (FR18)

**Given** I select a valid JSON file
**When** validation runs
**Then** it verifies the file has valid folders[] and queries[] structure (FR21)

**Given** an invalid file format
**When** validation fails
**Then** a clear error message describes the problem (NFR9)

**Given** a valid import file
**When** validation passes
**Then** a preview shows folder structure and query count

---

### Story 5.4: Implement Import Merge Option

**As a** user,
**I want** to merge imported queries with my existing library,
**So that** I can add new queries without losing my current ones. (FR19)

**Acceptance Criteria:**

**Given** import preview is showing
**When** I select "Merge with existing"
**Then** imported queries and folders are added to my library (FR19)

**Given** an imported query has the same name as existing
**When** merge completes
**Then** both queries are kept (imported one may get "(imported)" suffix)

**Given** an imported folder has the same name as existing
**When** merge completes
**Then** contents are merged into the existing folder

**Given** the import operation
**When** processing 100 queries
**Then** it completes in less than 2 seconds (NFR4)

---

### Story 5.5: Implement Import Replace Option

**As a** user,
**I want** to replace my library with imported queries,
**So that** I can start fresh with a new query set. (FR20)

**Acceptance Criteria:**

**Given** import preview is showing
**When** I select "Replace existing"
**Then** a warning confirms this will delete current library

**Given** I confirm replacement
**When** the import completes
**Then** my library contains only the imported queries and folders (FR20)

**Given** replacement operation
**When** it completes
**Then** a success toast confirms "Library replaced with X queries"

---

## Epic 6: Safety & Destructive Query Warnings

### Story 6.1: Implement SQL Detection Service

**As a** developer,
**I want** a service that detects destructive SQL keywords,
**So that** the system can identify dangerous queries. (FR22)

**Acceptance Criteria:**

**Given** the SQL detection service
**When** I pass a query containing DELETE
**Then** it returns `{ isDestructive: true, keywords: ['DELETE'] }` (FR22)

**Given** destructive keyword detection
**When** checking for keywords
**Then** it detects: DELETE, DROP, TRUNCATE, UPDATE, ALTER, INSERT

**Given** keyword matching
**When** checking case variations
**Then** detection is case-insensitive (`delete`, `DELETE`, `Delete` all match)

**Given** keyword matching
**When** checking for false positives
**Then** it uses word boundaries (e.g., "DELETED_FLAG" doesn't match DELETE)

**Given** unit tests for SQL detection
**When** I run `npm run test`
**Then** all detection patterns are verified with positive and negative cases

---

### Story 6.2: Implement Warning Badge Component

**As a** user,
**I want** to see a visual indicator on destructive queries in my library,
**So that** I know which queries require extra caution.

**Acceptance Criteria:**

**Given** a query containing DELETE, DROP, or TRUNCATE
**When** displayed in tree view
**Then** it shows a red "DELETE" or "DROP" badge on the right side

**Given** a query containing UPDATE or ALTER
**When** displayed in tree view
**Then** it shows an amber "UPDATE" or "ALTER" badge

**Given** a safe SELECT query
**When** displayed in tree view
**Then** no warning badge appears

**Given** the warning badge
**When** rendered
**Then** it uses semantic colors from design tokens (red for danger, amber for caution)

---

### Story 6.3: Implement Warning Modal Component

**As a** user,
**I want** to see a warning before pasting destructive queries,
**So that** I can review and confirm the action. (FR23, FR24)

**Acceptance Criteria:**

**Given** I click a query containing destructive keywords
**When** paste is initiated
**Then** a warning modal appears BEFORE pasting (FR23)

**Given** the warning modal
**When** displayed for DELETE/DROP/TRUNCATE
**Then** it shows red header: "Destructive Query Warning"

**Given** the warning modal
**When** displayed for UPDATE/ALTER
**Then** it shows amber header: "Caution: Data Modification"

**Given** the warning modal content
**When** displayed
**Then** it shows the query SQL preview (first few lines) (FR24)

**Given** the modal
**When** displayed
**Then** focus is trapped within the modal and Esc dismisses it

---

### Story 6.4: Implement Warning Modal Actions

**As a** user,
**I want** to confirm or cancel pasting from the warning modal,
**So that** I can proceed safely or abort. (FR25)

**Acceptance Criteria:**

**Given** the warning modal is displayed
**When** I click "Cancel"
**Then** the modal closes and no paste occurs (FR25)

**Given** the warning modal is displayed
**When** I click "Paste Anyway"
**Then** the query is pasted to SMP and modal closes (FR25)

**Given** keyboard interaction
**When** I press Escape
**Then** it acts as Cancel (modal closes, no paste)

**Given** the modal buttons
**When** displayed
**Then** "Cancel" is primary (left) and "Paste Anyway" is secondary (right)

---

## Summary

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Project Foundation & SMP Detection | 4 | FR29, FR30, FR31 |
| Epic 2: Query Capture & Storage | 5 | FR1, FR2, FR3, FR4, FR5 |
| Epic 3: Query Library & Retrieval | 6 | FR6, FR7, FR8, FR9, FR26, FR27, FR28 |
| Epic 4: Folder Organization | 5 | FR10, FR11, FR12, FR13, FR14, FR15 |
| Epic 5: Import/Export & Team Sharing | 5 | FR16, FR17, FR18, FR19, FR20, FR21 |
| Epic 6: Safety & Destructive Query Warnings | 4 | FR22, FR23, FR24, FR25 |
| **Total** | **29 stories** | **31 FRs (100% coverage)** |
