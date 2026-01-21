# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Research-First Approach

Use Perplexity MCP tools to research before implementing when:
- Unsure about ObjectScript syntax, patterns, or best practices
- Working with unfamiliar IRIS features or APIs
- Uncertain about the recommended approach for a task

Available Perplexity tools:
- `mcp__perplexity-mcp__search` - Quick lookups for straightforward questions
- `mcp__perplexity-mcp__reason` - Complex problem-solving and comparisons
- `mcp__perplexity-mcp__deep_research` - In-depth analysis of topics

Research first, then implement with confidence.

## Project Overview

QueryManager is an InterSystems IRIS ObjectScript project targeting the HSCUSTOM namespace on a local IRIS instance.

## Development Environment

- **Language:** ObjectScript
- **Platform:** InterSystems IRIS 2025.1
- **IDE:** VS Code with ObjectScript extension
- **Namespace:** HSCUSTOM (configured in `.vscode/settings.json`)

## IRIS MCP Tools

This project uses MCP (Model Context Protocol) tools for IRIS interaction. Key tools available:

- `execute_command` - Run ObjectScript commands directly
- `execute_classmethod` - Call class methods with parameter support
- `compile_objectscript_class` - Compile classes (requires `.cls` suffix)
- `compile_objectscript_package` - Compile entire packages
- `execute_unit_tests` - Run tests via ExecuteMCP.TestRunner
- `execute_sql` - Execute SQL queries
- `get_global` / `set_global` - Read/write globals

## Build & Compilation

ObjectScript classes are compiled in IRIS, not locally. To compile:

```
# Single class (note: .cls suffix required)
compile_objectscript_class("MyPackage.MyClass.cls")

# Entire package
compile_objectscript_package("MyPackage")
```

## Testing

Unit tests use the ExecuteMCP.TestRunner framework:

```
# Run all tests in a package
execute_unit_tests("MyPackage.Test")

# Run specific test class
execute_unit_tests("MyPackage.Test.MyTestClass")

# Run specific test method
execute_unit_tests("MyPackage.Test.MyTestClass:TestMethodName")
```

## Project Structure

```
querymanager/
├── .vscode/settings.json    # IRIS connection config
├── src/                     # ObjectScript source files
└── docs/                    # Documentation
```
