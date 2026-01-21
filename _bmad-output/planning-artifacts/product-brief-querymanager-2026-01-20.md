---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - "_bmad-output/analysis/brainstorming-session-2026-01-20.md"
  - "docs/.context.md"
  - "docs/tech-details.md"
date: 2026-01-20
author: Developer
---

# Product Brief: IRIS Query Manager

## Executive Summary

**IRIS Query Manager** is a Chrome extension that transforms how InterSystems IRIS developers manage SQL queries in the System Management Portal (SMP). By integrating directly into the SMP SQL interface, it eliminates the frustration of lost queries, scattered text files, and the stress of knowing you wrote something but can't find it.

The extension enables one-click capture, organized storage, instant retrieval, and safe insertion of queries - turning a daily pain point into a moment of relief. With no existing solutions specifically built for the IRIS ecosystem, IRIS Query Manager fills a critical gap for developers, DBAs, and teams who rely on the SMP daily.

---

## Core Vision

### Problem Statement

IRIS developers working in the System Management Portal have no native way to save, organize, or reuse SQL queries. They resort to storing queries in scattered text files, note applications, or code comments - leading to a frustrating experience when they need to find a query they know they wrote but cannot locate.

### Problem Impact

- **Wasted Time**: Developers spend valuable time hunting through files or recreating queries from scratch
- **Lost Work**: Complex queries that took significant effort to craft are effectively lost
- **Stress & Frustration**: The moment of knowing "I wrote this before but can't find it" creates real emotional burden
- **Reduced Productivity**: Context switching between SMP and external tools breaks developer flow
- **Team Inefficiency**: No easy way to share proven queries across team members

### Why Existing Solutions Fall Short

There is **no solution on the market specifically integrated with IRIS or the SMP**. Developers currently improvise with:

- General-purpose text editors and note apps (no organization, no integration)
- Code comments and documentation (hard to find when needed)
- Memory and rewriting (error-prone, time-consuming)
- Email/Slack sharing (queries get buried and lost)

None of these approaches integrate with the SMP workflow, requiring constant context switching and manual copy-paste operations.

### Proposed Solution

IRIS Query Manager is a Chrome extension that:

1. **Auto-detects** when the user is on the SMP SQL page
2. **Captures queries** with one click or hotkey directly from the SMP textarea
3. **Organizes queries** in a hierarchical folder structure
4. **Retrieves and inserts** saved queries back into SMP instantly
5. **Warns before inserting** destructive queries (DELETE, UPDATE, INSERT, DDL)
6. **Enables backup and sharing** through import/export functionality

### Key Differentiators

| Differentiator | Why It Matters |
|----------------|----------------|
| **SMP-Native Integration** | Lives where developers already work - no separate tool to open |
| **Zero Context Switching** | Capture and insert without leaving the page |
| **Safety-First Design** | Prevents accidental destructive query execution - unique in this space |
| **IRIS-Specific** | Built by an IRIS developer who knows the pain firsthand |
| **No Competition** | First-to-market in the IRIS query management space |

---

## Target Users

### Primary Users

#### The IRIS Developer

**Profile:** Software developers and engineers who work with InterSystems IRIS daily, using the System Management Portal for SQL queries as part of their regular workflow.

**Characteristics:**
- Comfortable with SQL and IRIS-specific syntax
- Uses SMP multiple times per day/week
- Has accumulated dozens to hundreds of queries over time
- Values speed and keyboard-driven workflows
- Often works across multiple namespaces and projects

**Pain Points:**
- Queries scattered across text files, notes, and memory
- The frustration of knowing "I wrote this before" but can't find it
- Time wasted recreating complex queries from scratch
- Context switching between SMP and external tools

**Success Looks Like:**
- Queries organized and findable in seconds
- One-click capture and insert without leaving SMP
- Relief instead of stress when needing a past query
- A personal query library that grows more valuable over time

**Variations within this segment:**

| Variation | Context | Specific Needs |
|-----------|---------|----------------|
| **Solo Developer** | Works independently, manages own queries | Speed, personal organization |
| **Team Developer** | Part of a team, shares knowledge | Import/export, standardization |
| **Production DBA** | Manages critical systems | Safety warnings, careful execution |
| **Junior/Newcomer** | Learning IRIS and SQL | Simplicity, starter packs from team |

### Secondary Users

#### Support Staff / Query Consumers

**Profile:** Technical support personnel, analysts, or other team members who need to run pre-built queries but don't create them.

**Characteristics:**
- May have limited SQL knowledge
- Need to run specific diagnostic or lookup queries
- Rely on developers to provide the right queries
- Value simplicity and clear instructions

**Pain Points:**
- Asking developers repeatedly for the same queries
- Queries shared via email/Slack get lost
- Uncertainty about which query to use for what situation
- Fear of running the wrong query in production

**Success Looks Like:**
- Import a curated set of queries from the development team
- Find and run the right query without bothering developers
- Clear descriptions help them understand what each query does
- Safety warnings prevent accidental damage

### User Journey

**Discovery → Onboarding → Daily Use → Value Realization**

| Stage | Developer Experience | Support Staff Experience |
|-------|---------------------|-------------------------|
| **Discovery** | Hears about extension from colleague or finds while searching for IRIS tools | Receives export file from developer with instructions |
| **Onboarding** | Installs extension, captures first query, creates initial folder structure | Imports team query pack, browses available queries |
| **First Value** | Successfully finds and inserts a query they would have had to rewrite | Runs a diagnostic query without asking developer for help |
| **Daily Use** | Capture becomes habit, library grows, queries at fingertips | Regularly uses curated query set for support tasks |
| **"Aha!" Moment** | Finds a complex query from 6 months ago in seconds | Resolves a customer issue independently using shared queries |
| **Long-term** | Query library becomes indispensable part of workflow | Self-sufficient for routine data lookups |

---

## Success Metrics

### User Success Metrics

Success is measured by whether IRIS Query Manager genuinely improves the developer workflow:

| Metric | What It Indicates | How We'd Know |
|--------|-------------------|---------------|
| **Daily Use** | Extension is valuable enough to become habit | Creator and team use it as default workflow |
| **Query Library Growth** | Users capture queries worth keeping | Personal libraries grow organically over time |
| **Retrieval over Rewriting** | Finding is faster than recreating | Users paste saved queries instead of retyping |
| **Organization Adoption** | Folder structure provides value | Users create meaningful folder hierarchies |
| **Safety Warning Engagement** | Protection feature is noticed and appreciated | Users acknowledge warnings before destructive ops |

**The "Worth It" Moment:** A user finds a complex query from months ago in seconds - the moment that validates the entire concept.

### Business Objectives

As an open source project, success follows a progressive adoption path:

| Timeframe | Objective | Success Indicator |
|-----------|-----------|-------------------|
| **3 Months** | Personal & team adoption | Creator and immediate team use it daily as primary workflow |
| **6 Months** | Stable for sharing | Confident enough in quality to publicly release |
| **12 Months** | Community adoption | External IRIS developers discover and use the extension |

### Key Performance Indicators

For an open source Chrome extension:

| KPI | Target | Notes |
|-----|--------|-------|
| **Personal Daily Use** | Yes/No | If the creator doesn't use it, something's wrong |
| **Chrome Web Store Installs** | Organic growth | No specific target - availability matters more |
| **GitHub Stars** | Nice to have | Community signal of interest and appreciation |
| **GitHub Issues/PRs** | Any engagement | Indicates community finding value worth contributing to |
| **Team Adoption** | 2-3 colleagues | Validation beyond personal use |

**North Star Metric:** "Do I reach for Query Manager every time I'm in the SMP?" - if yes, the product is succeeding.

---

## MVP Scope

### Core Features

The MVP delivers six essential capabilities that solve the core problem:

| Feature | Description | Why Essential |
|---------|-------------|---------------|
| **Auto-Detection** | Recognize when user is on SMP SQL page | Foundation for seamless integration |
| **Capture Query** | One-click/hotkey to save current query from textarea | Core value proposition |
| **Paste Query** | Insert saved query back into SMP textarea | Completes the capture-retrieve loop |
| **Tree Organization** | Hierarchical folder structure for queries | Makes queries findable as library grows |
| **Import/Export** | Backup and share query collections as files | Enables backup and basic team sharing |
| **Safety Warnings** | Alert before inserting destructive queries | Prevents accidents with DELETE/UPDATE/INSERT/DDL |

### Out of Scope for MVP

Explicitly deferred to maintain focus and ship quickly:

| Feature | Why Deferred | Target Version |
|---------|--------------|----------------|
| Query Execution | Adds complexity; SMP already executes queries | v2.0 |
| Syntax Highlighting | Nice-to-have; doesn't solve core problem | v1.1 |
| Search | Can browse tree structure initially | v1.1 |
| Query Templates/Variables | Advanced feature beyond core use case | v2.0 |
| Multi-Instance Sync | Requires backend infrastructure | v3.0+ |
| Team Sharing (real-time) | Import/export sufficient for MVP | v3.0+ |
| Query Versioning/History | Adds storage complexity | v2.0 |
| Keyboard Shortcuts | Enhancement once core flow works | v1.1 |

### MVP Success Criteria

The MVP is successful when:

1. **Daily Use** - Creator reaches for Query Manager instead of text files
2. **Complete Loop** - Capture → Organize → Retrieve works without friction
3. **Growing Library** - Queries accumulate organically over time
4. **Safety Validated** - Warnings appear correctly for destructive queries
5. **Backup Working** - Export/import successfully preserves query library

**Go/No-Go Decision:** If creator uses MVP daily for 2+ weeks, proceed to v1.1 enhancements.

### Future Vision

**Short-term (v1.1):** Quality of life improvements
- Search across query library
- Keyboard shortcuts for power users
- Query descriptions and tags
- Syntax highlighting in preview

**Medium-term (v2.0):** Enhanced capabilities
- Execute queries directly from extension
- Query templates with variable substitution
- Query formatting/beautification
- Version history for queries

**Long-term (v3.0+):** Team and ecosystem features
- Real-time team sharing and collaboration
- Multi-browser/multi-instance sync
- Public query repository integration
- API for external tool integration
