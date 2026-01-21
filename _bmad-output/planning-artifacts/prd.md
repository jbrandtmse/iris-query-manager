---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation-skipped, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-querymanager-2026-01-20.md"
  - "_bmad-output/analysis/brainstorming-session-2026-01-20.md"
  - "docs/context.md"
  - "docs/tech-details.md"
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 2
classification:
  projectType: developer_tool
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - IRIS Query Manager

**Author:** Developer
**Date:** 2026-01-20

## Executive Summary

**IRIS Query Manager** is a Chrome extension that helps InterSystems IRIS developers save, organize, and retrieve SQL queries used in the System Management Portal (SMP).

**Core Value:** Eliminate the frustration of hunting for or rewriting queries by providing one-click capture and paste with hierarchical organization.

**Target Users:** IRIS developers, DBAs, support staff, and team leads who regularly work with SQL in the SMP.

**MVP Scope:** 6 features (Auto-Detection, Capture, Paste, Folders, Import/Export, Safety Warnings) validated by creator daily use for 2+ weeks.

**Key Differentiator:** Unlike text files or spreadsheets, Query Manager integrates directly with the SMP, detects destructive queries, and enables team knowledge sharing through import/export.

## Success Criteria

### User Success

| Criteria | Measurement | Target |
|----------|-------------|--------|
| **Habit Formation** | Daily extension use after initial adoption | Within 7 days of first use |
| **Library Building** | Queries saved in first week | 5-10 queries minimum |
| **Retrieval Behavior** | User pastes saved query instead of retyping | Observed behavior shift |
| **Organization Adoption** | User creates folder structure | At least 1 folder created |
| **Safety Engagement** | User sees and acknowledges destructive query warning | Warning displayed when applicable |

**"Worth It" Moment:** User successfully retrieves a query they would have otherwise had to hunt for or rewrite - the moment of relief that validates the product.

### Business Success

| Timeframe | Objective | Success Indicator |
|-----------|-----------|-------------------|
| **Week 2** | MVP Validation | Creator uses extension daily for 2 consecutive weeks |
| **Month 3** | Team Adoption | 2-3 colleagues actively using the extension |
| **Month 6** | Public Ready | Confident to publish on Chrome Web Store |
| **Month 12** | Community Traction | External IRIS developers discovering and using |

**North Star Metric:** "Do I reach for Query Manager every time I'm in the SMP?"

### Technical Success

| Criteria | Target | Rationale |
|----------|--------|-----------|
| **Capture Speed** | Perceived instant (<100ms) | No friction in save workflow |
| **Paste Speed** | Perceived instant (<100ms) | No friction in retrieval workflow |
| **Reliability** | Perceived as "always works" | Zero data loss, no failed operations |
| **Browser Support** | Chrome and Chrome-compatible (Edge, Brave, etc.) | Manifest V3 compatible browsers |
| **Storage** | Local Chrome storage (sync optional) | No external dependencies for MVP |

### Measurable Outcomes

**MVP Validation Gate:** If creator uses MVP daily for 2+ weeks → proceed to v1.1
**Team Validation Gate:** If 2-3 colleagues adopt → validate beyond personal use case
**Public Release Gate:** If stable for 3+ months with no data loss → publish to Chrome Web Store

## Product Scope

### MVP - Minimum Viable Product

| # | Feature | Description | Acceptance Criteria |
|---|---------|-------------|---------------------|
| 1 | **Auto-Detection** | Detect SMP SQL page via URL pattern | Extension activates on SMP SQL page |
| 2 | **Capture Query** | One-click to save current query | Query saved to local storage with name |
| 3 | **Paste Query** | One-click to insert saved query | Query inserted into SMP textarea |
| 4 | **Tree Organization** | Hierarchical folder structure | Create, rename, delete folders; drag-drop queries |
| 5 | **Import/Export** | JSON file backup/restore | Export all or selected; Import merges or replaces |
| 6 | **Safety Warnings** | Detect destructive queries | Warning shown before pasting DELETE/UPDATE/INSERT/DDL |

### Growth Features (Post-MVP v1.1)

- Full-text search across query library
- Keyboard shortcuts for power users
- Query descriptions and notes
- Recent/Favorites smart folders
- Syntax highlighting in preview

### Vision (Future v2.0+)

- Parameterized queries with {{placeholders}}
- IRIS backend for team sharing
- Query execution from extension
- AI-powered categorization
- Cross-browser sync

## User Journeys

### Journey 1: Sam the Solo Developer - "Finally Found It"

**Persona:** Sam, mid-level IRIS developer, 3 years experience, works across multiple projects and namespaces daily.

**Opening Scene:**
Sam is debugging a production issue. He remembers writing a query last month that joins three tables to find orphaned records - but where is it? He checks his `queries.txt` file (200+ lines, no organization), searches Slack, looks through old emails. Frustration builds. He starts rewriting the query from memory.

**Rising Action:**
After installing IRIS Query Manager, Sam's workflow changes. He's on the SMP SQL page writing a complex diagnostic query. One click - captured. He creates a folder called "Diagnostics" and drops it in. Over the next week, he captures 8 more queries he knows he'll need again.

**Climax:**
Two weeks later, the same production issue resurfaces. Sam clicks the Query Manager icon, opens "Diagnostics", and there it is - the orphaned records query. One click to paste. The query he spent 20 minutes rewriting last time is now in the SMP textarea in under 3 seconds.

**Resolution:**
Sam feels relief instead of dread when he needs a past query. His library grows to 40+ queries over two months. Finding any query takes seconds, not minutes. The extension has become invisible infrastructure - he doesn't think about it, he just uses it.

**Capabilities Revealed:**
- Quick capture from SMP textarea
- Folder organization
- Fast retrieval and paste
- Persistent local storage

---

### Journey 2: Dana the Production DBA - "Crisis Averted"

**Persona:** Dana, senior DBA, 10 years experience, responsible for production IRIS instances. Cautious by nature - has seen too many accidental DELETEs.

**Opening Scene:**
Dana manages a healthcare system's production database. She has a collection of maintenance queries - some SELECT, some UPDATE, some DELETE. Currently they live in a password-protected Excel file with color coding for "dangerous" queries. It works, but it's clunky.

**Rising Action:**
Dana imports her queries into Query Manager and organizes them: "Safe Lookups", "Data Fixes", "DANGER - Destructive". She appreciates the folder structure but wonders about accidental pastes.

**Climax:**
During a late-night maintenance window, Dana is tired. She clicks to paste what she thinks is a SELECT query, but she accidentally selected a DELETE statement. A warning modal appears: "⚠️ This query contains DELETE. Are you sure you want to paste?" Dana pauses, reads the query preview, realizes her mistake. She cancels and selects the correct query.

**Resolution:**
Dana trusts the extension with her most dangerous queries because it has her back. The safety warning has caught two near-misses in the first month. She sleeps better knowing there's a guardrail between her tired brain and production data.

**Capabilities Revealed:**
- Import existing query collections
- Destructive query detection (DELETE, UPDATE, INSERT, DDL)
- Confirmation warning before paste
- Query preview in warning modal

---

### Journey 3: Jordan the Junior/Newcomer - "I Can Do This"

**Persona:** Jordan, junior developer, 6 months at the company, first job with IRIS. Eager but often unsure which query to use for common tasks.

**Opening Scene:**
Jordan joins the team and is immediately overwhelmed. The senior devs mention queries for checking locks, finding table sizes, viewing recent errors - but Jordan has no idea where these queries are or how to write them. Every question feels like an interruption.

**Rising Action:**
Taylor (team lead) sends Jordan a JSON file: "team-essentials.json" with instructions to import it into Query Manager. Jordan installs the extension, clicks Import, selects the file. Suddenly there are 25 organized queries with names like "Check Active Locks", "Table Row Counts", "Recent Error Log".

**Climax:**
A week later, Jordan needs to check if a table is locked. Instead of asking Taylor, Jordan opens Query Manager, finds "Check Active Locks" in the "Diagnostics" folder, pastes it, runs it. Problem solved independently.

**Resolution:**
Jordan's confidence grows. The team query pack is a learning tool - Jordan reads the queries to understand IRIS SQL patterns. Within a month, Jordan starts contributing queries back: "Hey Taylor, I wrote a query for checking index usage - want me to add it to the team pack?"

**Capabilities Revealed:**
- Import from JSON file
- Pre-organized folder structure from import
- Descriptive query names aid learning
- Low barrier to entry for new users

---

### Journey 4: Alex the Support Staff - "No More Bothering Dev"

**Persona:** Alex, L2 support technician, limited SQL knowledge, needs to run specific diagnostic queries during customer escalations.

**Opening Scene:**
Alex handles escalated support tickets that require database lookups. The process: message a developer, wait for them to be available, describe the issue, wait for them to run a query, get the result. Average turnaround: 30 minutes to 4 hours depending on developer availability.

**Rising Action:**
The dev team creates a support-focused query pack with 15 safe, parameterized-ready queries: "Lookup Customer by ID", "Check Transaction Status", "View Recent Orders". Taylor exports it and sends it to the support team with instructions.

**Climax:**
A VIP customer calls about a missing order. Alex imports the support pack, finds "Check Transaction Status", pastes it into SMP, substitutes the order ID, runs it. Within 2 minutes, Alex sees the transaction failed due to a timeout and can explain this to the customer.

**Resolution:**
Support ticket resolution time drops from hours to minutes for common lookups. Developers are interrupted less. Alex feels empowered rather than dependent. The support team requests additional queries as they identify common patterns.

**Capabilities Revealed:**
- Export selective queries for specific audiences
- Query names as self-documentation
- Non-developer users can operate independently
- Reduces cross-team dependencies

---

### Journey 5: Taylor the Team Lead - "Knowledge That Stays"

**Persona:** Taylor, team lead, 7 years IRIS experience, responsible for team productivity and knowledge sharing.

**Opening Scene:**
Taylor has watched three developers leave the company in two years, each time taking tribal knowledge with them. Queries that took hours to craft disappear when people leave. The "queries" Slack channel is a graveyard of context-free SQL snippets.

**Rising Action:**
Taylor starts building a canonical team query library in Query Manager. For each query, Taylor uses descriptive names and organizes by function: "Onboarding", "Diagnostics", "Maintenance", "Reports". Taylor exports the library weekly as backup.

**Climax:**
Senior developer Morgan gives two weeks notice. Taylor asks Morgan to export their personal query library and share anything useful. Morgan's export contains 12 queries Taylor didn't know existed - including a complex performance diagnostic that took Morgan a full day to write. Taylor merges these into the team library.

**Resolution:**
When new developers join, they get the team query pack on day one. When developers leave, their queries stay. Knowledge accumulates instead of evaporating. Taylor maintains the library like documentation - it's a living asset that grows more valuable over time.

**Capabilities Revealed:**
- Export full library for backup/sharing
- Import and merge query sets
- Folder organization for team standards
- Knowledge preservation across team changes

---

### Journey Requirements Summary

| Journey | Key Capabilities Required |
|---------|--------------------------|
| **Sam (Solo Dev)** | Capture, folders, retrieve, paste, persistent storage |
| **Dana (DBA)** | Import, destructive query detection, warning modal, preview |
| **Jordan (Newcomer)** | Import JSON, browse organized library, paste |
| **Alex (Support)** | Import curated pack, find by name, paste, run |
| **Taylor (Team Lead)** | Export selective/all, organize folders, import/merge |

**Cross-Journey Requirements:**
- All users need: Quick capture, organized storage, fast retrieval, reliable paste
- Safety users need: Destructive query detection with confirmation
- Team users need: Import/export with merge capability

## Chrome Extension Technical Requirements

### Extension Architecture

**Manifest Version:** V3 (current Chrome standard, required for new extensions)

**Extension Components:**

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Popup** | Main UI for browsing/managing queries | HTML/CSS/JS popup window |
| **Content Script** | Interact with SMP page DOM | Injected into matching pages |
| **Service Worker** | Background processing, storage operations | Manifest V3 background script |

### SMP Integration

**URL Pattern Matching:**
```
*://*/%25CSP.UI.Portal.SQL.Home.zen*
```

**DOM Interaction:**
- **Target Container:** `div#QueryText`
- **Target Element:** `textarea` child element (ID may vary per SMP version)
- **Detection Strategy:** Find textarea within `#QueryText` div rather than relying on specific ID

**Content Script Injection:**
- Inject only on matching SMP SQL pages
- Detect textarea dynamically within QueryText container
- Handle potential DOM variations across IRIS versions

### Storage Strategy

**Storage Type:** Chrome Local Storage (`chrome.storage.local`)

| Aspect | Specification |
|--------|---------------|
| **Storage API** | `chrome.storage.local` |
| **Expected Size** | 100KB - 2MB typical usage |
| **Chrome Limit** | 5MB for local storage (sufficient) |
| **Data Format** | JSON structure for queries and folders |
| **Sync (Future)** | `chrome.storage.sync` for v1.1+ cross-device |

**Data Structure:**
```json
{
  "folders": [
    { "id": "uuid", "name": "Diagnostics", "parentId": null }
  ],
  "queries": [
    {
      "id": "uuid",
      "name": "Check Locks",
      "sql": "SELECT...",
      "folderId": "uuid",
      "createdAt": "ISO-date",
      "updatedAt": "ISO-date"
    }
  ]
}
```

### Extension Permissions

**Required Permissions:**

| Permission | Purpose |
|------------|---------|
| `storage` | Save queries to Chrome local storage |
| `activeTab` | Access current tab when user clicks extension |

**Host Permissions:**
```json
"host_permissions": [
  "*://*/%25CSP.UI.Portal.SQL.Home.zen*"
]
```

**Optional Permissions (Future):**
- `clipboardWrite` - For copy-to-clipboard features
- `contextMenus` - For right-click capture options

### Browser Compatibility

**Primary Target:** Google Chrome (Manifest V3)

**Compatible Browsers:**
- Google Chrome 88+
- Microsoft Edge 88+ (Chromium-based)
- Brave Browser
- Other Chromium-based browsers

**Not Supported (MVP):**
- Firefox (different extension API)
- Safari (different extension API)

### Distribution Strategy

| Phase | Distribution Method |
|-------|---------------------|
| **Development** | Unpacked extension (developer mode) |
| **Team Testing** | Unpacked or .crx file sharing |
| **Public Release** | Chrome Web Store (Month 6 goal) |

**Chrome Web Store Requirements:**
- Privacy policy (for storage permission)
- Extension description and screenshots
- Developer account ($5 one-time fee)

### Implementation Considerations

**Content Script Strategy:**
- Use `MutationObserver` if SMP loads textarea dynamically
- Graceful degradation if textarea not found
- Non-blocking injection to avoid SMP performance impact

**Error Handling:**
- Storage quota exceeded → warn user, suggest export
- DOM element not found → show "SMP page not detected" message
- Import file invalid → show validation error with details

**Security Considerations:**
- No external network requests (MVP is fully local)
- No sensitive data collection
- SQL content stays in local storage only

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP
- Focus on solving the core pain point: query retrieval and organization
- Ship the smallest feature set that delivers genuine daily value
- Validate with creator use before expanding scope

**Resource Requirements:** Solo developer with Chrome extension experience
- Estimated MVP: 1 developer, leveraging standard Chrome APIs
- No backend infrastructure required for MVP
- No external services or dependencies

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Sam (Solo Dev): Full capture → organize → retrieve workflow
- Dana (DBA): Import existing queries + safety warnings
- Jordan (Newcomer): Import team pack + browse + paste
- Alex (Support): Import curated pack + find + paste
- Taylor (Team Lead): Export/share + organize + import/merge

**Must-Have Capabilities:**

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | **Auto-Detection** | Without SMP detection, nothing works |
| 2 | **Capture Query** | Core value proposition - save queries |
| 3 | **Paste Query** | Core value proposition - retrieve queries |
| 4 | **Tree Organization** | Differentiator from flat file storage |
| 5 | **Import/Export** | Enables team sharing and backup |
| 6 | **Safety Warnings** | Critical for production DBA trust |

### Post-MVP Features

**Phase 2 (Growth - v1.1):**
- Full-text search across query library
- Keyboard shortcuts for power users
- Query descriptions and notes
- Recent/Favorites smart folders
- Syntax highlighting in preview

**Phase 3 (Expansion - v2.0+):**
- Parameterized queries with {{placeholders}}
- IRIS backend for team sharing
- Query execution from extension
- AI-powered categorization
- Cross-browser sync

### Risk Mitigation Strategy

**Technical Risks:**
| Risk | Mitigation |
|------|------------|
| SMP DOM changes across IRIS versions | Use container-based detection (`div#QueryText`) rather than specific element IDs |
| Chrome storage limits | Expected usage (1-2MB) well within 5MB limit; export feature as overflow valve |
| Manifest V3 restrictions | Design within V3 constraints from start; no remote code execution needed |

**Market Risks:**
| Risk | Mitigation |
|------|------------|
| Niche audience (IRIS developers only) | Creator validation first; even 100 active users is success |
| Users already have workarounds | Extension must be faster/better than text files - measure friction reduction |

**Resource Risks:**
| Risk | Mitigation |
|------|------------|
| Solo developer availability | MVP intentionally minimal; can ship core 6 features in focused sprint |
| Feature creep | Strict MVP boundary; growth features explicitly deferred to v1.1 |

## Functional Requirements

### Query Capture & Storage

- **FR1:** User can capture the current SQL query from the SMP textarea with one click
- **FR2:** User can assign a name to a captured query before saving
- **FR3:** User can save a query to a specific folder during capture
- **FR4:** System persists all queries in local browser storage across sessions
- **FR5:** System assigns unique identifiers to each stored query

### Query Retrieval & Paste

- **FR6:** User can browse all saved queries in a hierarchical tree view
- **FR7:** User can paste a selected query into the SMP textarea with one click
- **FR8:** User can preview a query's SQL content before pasting
- **FR9:** System detects when user is on an SMP SQL page and enables paste functionality

### Folder Organization

- **FR10:** User can create folders to organize queries
- **FR11:** User can create nested folders (subfolders within folders)
- **FR12:** User can rename folders
- **FR13:** User can delete empty folders
- **FR14:** User can move queries between folders via drag-and-drop
- **FR15:** User can move folders within the hierarchy

### Import & Export

- **FR16:** User can export all queries and folders to a JSON file
- **FR17:** User can export selected queries/folders to a JSON file
- **FR18:** User can import queries from a JSON file
- **FR19:** User can choose to merge imported queries with existing library
- **FR20:** User can choose to replace existing library with imported queries
- **FR21:** System validates import file format before processing

### Safety & Warnings

- **FR22:** System detects destructive SQL keywords (DELETE, UPDATE, INSERT, DROP, ALTER, TRUNCATE)
- **FR23:** System displays a warning modal when user attempts to paste a destructive query
- **FR24:** Warning modal shows the query content for user review
- **FR25:** User can confirm or cancel the paste action from the warning modal

### Query Management

- **FR26:** User can rename a saved query
- **FR27:** User can delete a saved query
- **FR28:** User can view query metadata (created date, last modified)

### SMP Integration

- **FR29:** Extension activates automatically when user navigates to SMP SQL page
- **FR30:** Extension icon indicates active/inactive state based on current page
- **FR31:** System gracefully handles cases where SMP textarea is not found

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR1:** Query capture completes | < 100ms (perceived instant) | No friction in save workflow |
| **NFR2:** Query paste completes | < 100ms (perceived instant) | No friction in retrieval workflow |
| **NFR3:** Popup opens and renders tree | < 300ms | Quick access to library |
| **NFR4:** Import file processing | < 2 seconds for 100 queries | Team packs load quickly |
| **NFR5:** Export file generation | < 1 second | Backup should feel instant |

### Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR6:** Data persistence | Zero data loss across browser sessions | Core trust requirement |
| **NFR7:** Storage operations | 100% success rate or clear error | Never silent failures |
| **NFR8:** SMP detection | Works across IRIS 2020.1+ versions | Handle DOM variations |
| **NFR9:** Import validation | Invalid files rejected with clear message | Prevent data corruption |
| **NFR10:** Graceful degradation | Extension functional when SMP not detected | Show helpful state indicator |

### Security

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR11:** Data locality | All data stays in Chrome local storage | No external transmission |
| **NFR12:** No network requests | MVP makes zero external HTTP calls | Fully offline capable |
| **NFR13:** Permission minimization | Only storage + activeTab permissions | Least privilege principle |

### Maintainability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR14:** Codebase simplicity | Single developer can understand entire codebase | Solo dev sustainability |
| **NFR15:** Standard patterns | Use standard Chrome extension patterns | Easy to debug and extend |
| **NFR16:** Clear separation | Popup, content script, service worker separation | Manifest V3 compliance |
