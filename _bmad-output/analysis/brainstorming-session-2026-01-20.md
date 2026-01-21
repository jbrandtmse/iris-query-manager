---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'Feature ideation for IRIS Query Manager Chrome extension'
session_goals: 'Identify MVP features and catalog future enhancement ideas'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['SCAMPER Method', 'Role Playing', 'Resource Constraints']
ideas_generated: [105]
context_file: '_bmad/bmm/data/project-context-template.md'
---

# Brainstorming Session Results

**Facilitator:** Developer
**Date:** 2026-01-20
**Project:** IRIS Query Manager

## Session Overview

**Topic:** Feature ideation for IRIS Query Manager - a Chrome extension for managing SQL queries in the InterSystems IRIS System Management Portal (SMP)

**Goals:**
1. Identify core MVP features (minimum viable product)
2. Catalog future enhancement ideas beyond MVP

### Context Guidance

This brainstorming session focuses on software/product development with emphasis on:
- User problems and pain points for IRIS developers
- Feature ideas and capabilities for query management
- Technical approaches for Chrome extension + IRIS backend
- User experience for browser-based tooling
- Differentiation from manual query management methods

### Session Setup

**Approach Selected:** AI-Recommended Techniques
**Techniques Used:**
1. SCAMPER Method (structured) - Systematic feature generation through 7 creativity lenses
2. Role Playing (collaborative) - Multi-stakeholder perspective exploration
3. Resource Constraints (structured) - Forced MVP prioritization through limitation scenarios

---

## Technique Execution Results

### SCAMPER Method (90 ideas)

#### S - SUBSTITUTE
| ID | Idea | Description |
|----|------|-------------|
| S-1 | One-Click Capture | Replace manual copy-paste with hotkey/context menu instant capture |
| S-2 | One-Click Insert | Replace file hunting with popup showing query library |
| S-3 | Structured Folders/Tags | Replace flat text files with hierarchical organization |
| S-4 | Smart Search | Full-text search across all saved queries |
| S-5 | Recent Queries Panel | Always-visible recently used queries |
| S-6 | Auto-History (Query Journal) | Automatic capture of every executed query |
| S-7 | Fuzzy Search | Typo-tolerant, "I kinda remember..." search |
| S-8 | Context-Aware Suggestions | Extension detects namespace and surfaces relevant queries |
| S-9 | Query Auto-Complete | Suggest matching saved queries as you type |

#### C - COMBINE
| ID | Idea | Description |
|----|------|-------------|
| C-1 | Query + Notes/Documentation | Rich metadata with each saved query |
| C-2 | Query + Parameters (Templates) | {{placeholder}} variables with input prompts |
| C-3 | Personal + Team Library | Two tiers of query storage |
| C-4 | Parameterized Query + Input History | Remember last-used parameter values |
| C-5 | Team Sharing + Role-Based Access | Permission controls for team queries |
| C-6 | Notes + Usage Tracking | Documentation with automatic stats |
| C-7 | Query + Results Snapshot | Save sample output with the query |
| C-8 | Query Library + Version Control | Git-style history, diffs, rollback |
| C-9 | Parameterized Queries + Chained Execution | Query workflows/pipelines |
| C-10 | Team Library + Voting/Rating | Crowdsourced quality indicators |
| C-11 | Smart Parameter Types | Different UI for IDs, dates, ranges |
| C-12 | Parameter Presets | Save common parameter combinations |
| C-13 | Export/Import (File-Based) | JSON/YAML file sharing |
| C-14 | IRIS Backend - Centralized Team Library | REST API team storage |
| C-15 | Hybrid Mode (Local + Server) | Offline-first with optional sync |
| C-16 | Export + Selective Sharing | Choose exactly what to share |
| C-17 | IRIS Backend + Namespace Awareness | Team queries organized by namespace |
| C-18 | Parameter History + Team Insights | See what teammates use |

#### A - ADAPT
| ID | Idea | Description |
|----|------|-------------|
| A-1 | AI Auto-Categorization | AI suggests categories/tags on capture |
| A-2 | SQL Syntax Checking | IDE-style linting for SQL |
| A-3 | Query Optimizer Suggestions | AI performance recommendations |
| A-4 | AI Query Description Generator | Auto-generate documentation |
| A-5 | VS Code Command Palette Style | Ctrl+Shift+P quick search for all actions |
| A-6 | Notion/Obsidian Bi-Directional Links | Link queries to each other |
| A-7 | GitHub Gist Style Sharing | Generate shareable links for single queries |
| A-8 | Postman Collections Pattern | Group queries into runnable collections |
| A-9 | Music Playlist Pattern | Curated query sets for workflows |
| A-10 | Recipe App Pattern | Queries with ingredients/instructions/difficulty |
| A-11 | Clipboard Manager Pattern | Automatic capture history ring |
| A-12 | AI Query Builder | Natural language to SQL |
| A-13 | AI Duplicate Detection | Warn when saving similar queries |
| A-14 | AI Error Explanation | Plain English error messages with fixes |

#### M - MODIFY
| ID | Idea | Description |
|----|------|-------------|
| M-1 | Floating Quick-Access Panel | Always-visible query panel on SMP page |
| M-2 | Keyboard-First Design | Entirely keyboard-driven workflow |
| M-3 | Pinned Favorites Bar | One-click buttons for starred queries |
| M-4 | Instant Preview on Hover | See full SQL in tooltip |
| M-5 | Predictive Query Suggestions | Proactive suggestions based on patterns |
| M-6 | Quick Insert Shortcuts | Ctrl+1, Ctrl+2 for specific queries |
| M-7 | Type-Ahead Insert | Autocomplete entire queries from prefix |
| M-8 | Minimal Mode vs Power Mode | Two UI complexity levels |
| M-9 | Dark Mode / Theme Matching | Match SMP aesthetic |
| M-10 | Ambient Awareness | Subtle presence, unobtrusive until needed |
| M-11 | Query Snippets | Save fragments, not just complete queries |
| M-12 | Multi-Query Workspace | Work with multiple queries at once |
| M-13 | Usage Pattern Learning | Extension learns your habits |

#### P - PUT TO OTHER USES
| ID | Idea | Description |
|----|------|-------------|
| P-1 | Query → Report Generator | Format results as HTML/PDF/CSV reports |
| P-2 | Scheduled Report Runs | Run queries on schedule, email results |
| P-3 | Report Templates | Headers, footers, branding for reports |
| P-4 | Dashboard Builder | Combine queries into visual dashboards |
| P-5 | ObjectScript Snippet Manager | Expand to code snippets |
| P-6 | Documentation Bookmarks | Save links to SMP pages/docs |
| P-7 | Training/Onboarding Tool | Learning queries with progressive examples |
| P-8 | Audit/Compliance Queries | Pre-built queries for non-technical users |
| P-9 | Business Analyst Self-Service | BAs run parameterized queries without SQL |
| P-10 | Support Team Quick Lookups | Diagnostic queries for support staff |
| P-11 | Data Validation Tool | Queries that check data quality |
| P-12 | API Endpoint Generator | Turn query into REST endpoint |
| P-13 | Data Export Automation | Scheduled extracts to files/FTP |

#### E - ELIMINATE
| ID | Idea | Description |
|----|------|-------------|
| E-1 | Eliminate Manual Naming | Auto-generate names from query content |
| E-2 | Eliminate Separate Category Selection | Organize after saving, not during |
| E-3 | Eliminate Popup for Insert | In-page sidebar/overlay instead |
| E-4 | Eliminate Complex Export Options | One format, one button |
| E-5 | Eliminate Deep Nesting | Limit tree to 2-3 levels |
| E-6 | Eliminate Folders (Tags Only) | Flat list with tags instead |
| E-7 | Eliminate Mandatory Organization | Inbox for unsorted queries |
| E-8 | Eliminate Settings Page | Smart defaults for 90% |
| E-9 | Eliminate Multiple Views | One simple view |
| E-10 | Eliminate Edit Mode | Primary action is always insert |
| E-11 | Eliminate Extension Popup Entirely | Keyboard + in-page only |
| E-12 | Eliminate Cloud/Backend (MVP) | Local storage only for v1 |

#### R - REVERSE / REARRANGE
| ID | Idea | Description |
|----|------|-------------|
| R-1 | Template Tree First | Define structure before capturing |
| R-2 | Pre-Defined Categories | Ship with suggested folder templates |
| R-3 | Capture Prompt Shows Tree | Force destination selection on capture |
| R-4 | Queries Find You (Context Push) | Proactive suggestions based on location |
| R-5 | Usage-Based Reordering | Most-used queries float to top |
| R-6 | Start from Results, Work Backwards | Describe data, get query |
| R-7 | Insert First, Save After | Execute then prompt to save |
| R-8 | Query Preview First, Tree Second | Focus on SQL, not filing |
| R-9 | Search First, Browse Second | Search box as primary UI |
| R-10 | Reverse Chronological Default | Recently used as default view |
| R-11 | Extension Suggests Organization | AI recommends folder structure |
| R-12 | Consumer Before Producer | Import team library first |

---

### Role Playing (32 ideas)

#### Solo IRIS Developer Persona
| ID | Idea | Description |
|----|------|-------------|
| RP-1 | Bulk Organization Tools | Multi-select, batch operations |
| RP-2 | Smart Filters | Filter by recently used, table, namespace, date |
| RP-3 | Jump To Quick Search | Ctrl+K instant filter |
| RP-4 | Namespace-Based Views | Show queries for current namespace |
| RP-5 | Usage-Based Surfacing | Smart folders for frequent/recent |
| RP-6 | Archive vs Active | Hide old queries without deleting |
| RP-7 | Natural Language Search | Find by description, not just name |
| RP-8 | Fuzzy Matching | Typo-tolerant search |

#### Production DBA Persona
| ID | Idea | Description |
|----|------|-------------|
| RP-9 | Dangerous Query Detection | Visual flags for DELETE/UPDATE/INSERT |
| RP-10 | Confirmation for Destructive Queries | Type CONFIRM to proceed |
| RP-11 | Read-Only Mode | Hide all non-SELECT queries |
| RP-12 | Query Classification/Safety Labels | Tag as Safe/Modify/Destructive |
| RP-13 | Audit Log | Track who ran what when |
| RP-14 | Environment-Aware Warnings | Extra warnings for production namespaces |
| RP-15 | Query Approval Workflow | Require approval for critical queries |
| RP-16 | Selective Export/Import | Choose exactly what to share |
| RP-17 | Runtime Paste Warning | Warning modal before dangerous insert |
| RP-18 | DDL Detection | Also detect CREATE/ALTER/DROP |

#### Team Lead Persona
| ID | Idea | Description |
|----|------|-------------|
| RP-19 | Team Export Package | Curated starter packs for new hires |
| RP-20 | Shared Repository (IRIS Backend) | Central team library |
| RP-21 | Promote Personal → Team | Easy sharing button |
| RP-22 | Team Usage Analytics | See which queries are popular |
| RP-23 | Query Versioning with Team Sync | Notify when queries updated |
| RP-24 | Team Folders with Ownership | Designated maintainers |
| RP-25 | Commenting/Discussion on Queries | Team feedback captured |

#### IRIS Newcomer Persona
| ID | Idea | Description |
|----|------|-------------|
| RP-26 | First-Run Simplicity | Clean, uncluttered initial UI |
| RP-27 | Starter Pack Import | One-click team essentials |
| RP-28 | Guided Tour / Tooltips | Self-service onboarding |
| RP-29 | Query Descriptions as First-Class | Plain English visible before SQL |
| RP-30 | Recommended for Beginners Tag | Curated safe path |
| RP-31 | Example Results Preview | See expected output |
| RP-32 | Ask About This Query Link | Escape hatch to humans |

---

### Resource Constraints - MVP Definition

**Core User Problem:** IRIS developers store SQL queries in scattered text files with no organization, making queries hard to find and reuse.

**MVP Features (5):**

| # | Feature | Description | Rationale |
|---|---------|-------------|-----------|
| 1 | **Auto-Detection** | Detect SMP SQL page via URL pattern | Extension must know when to activate |
| 2 | **Capture Query** | One-click/hotkey to save current query | Core value - save queries |
| 3 | **Paste Query** | One-click to insert saved query into SMP | Core value - reuse queries |
| 4 | **Tree Organization** | Hierarchical folder structure | Must be able to find queries |
| 5 | **Import/Export** | JSON file, selective or all queries | Backup and basic sharing |
| 6 | **Safety Warnings** | Detect & confirm before destructive queries | Prevent accidents |

---

## Feature Roadmap

### MVP (v1.0)
- Auto-Detection of SMP SQL page
- Capture Query (one-click/hotkey)
- Paste Query (one-click)
- Tree Organization (folders)
- Import/Export (JSON file)
- Safety Warnings (DELETE/UPDATE/INSERT/DDL)

### v1.1 - Enhanced Core
- Full-text search
- Natural language / fuzzy search
- Query notes/descriptions
- Recent/Favorites smart folders
- Keyboard shortcuts
- Bulk operations

### v1.2 - Parameterization & Polish
- Parameterized queries ({{placeholders}})
- Parameter history
- Smart parameter types (date pickers, etc.)
- Dark mode / theming
- Namespace filtering
- Archive feature

### v2.0 - Team Collaboration
- IRIS Backend (REST API)
- Personal + Team libraries
- Promote to team
- Selective sync
- Usage analytics
- Query versioning
- Comments/discussion
- Audit log

### v3.0 - AI & Advanced
- AI auto-categorization
- AI query description generator
- Syntax checking
- Query optimizer suggestions
- Natural language → SQL
- Duplicate detection

### Future / Aspirational
- Report generator
- Scheduled queries
- Dashboard builder
- ObjectScript snippets
- API endpoint generator
- Query workflows
- Role-based access

---

## Creative Facilitation Narrative

This brainstorming session explored feature ideation for IRIS Query Manager through three complementary techniques. SCAMPER provided systematic breadth, generating 90 ideas across 7 creativity lenses. Role Playing validated ideas through 4 distinct personas (Solo Dev, DBA, Team Lead, Newcomer), surfacing 32 additional user-centered insights. Resource Constraints forced ruthless prioritization, crystallizing a focused 5-feature MVP.

**Key Breakthrough:** The user's articulation of wanting queries "at my fingertips" captured the core value proposition - zero friction between needing a query and having it.

**MVP Essence:** Capture → Organize → Find → Use (safely)

---

## Session Highlights

**Total Ideas Generated:** 105+

**User Creative Strengths:** Clear articulation of pain points, practical MVP instincts, safety-conscious thinking

**Breakthrough Moments:**
- "Finding the correct query, or worse, not finding it" - crystallized search importance
- "Natural language keyword search" - defined search UX
- "Safety for destructive queries" - added DBA-critical feature to MVP
- "Report generator would be cool" - opened future product expansion

**Energy Flow:** Steady, practical, focused on real-world utility
