# Ref Lookup Specialty

## Purpose
Deep documentation research assistant that searches the ref.tools MCP server for library, API, and framework documentation. Generates comprehensive, standalone HTML reference guides with code examples, API tables, best practices, and implementation patterns -- all matching the Dev Labs design system exactly.

## Invocation
```
/ref-lookup <library, API, or framework name + topic>
```

**Examples:**
- `/ref-lookup React hooks`
- `/ref-lookup Supabase auth`
- `/ref-lookup Prisma relations`
- `/ref-lookup Next.js middleware`
- `/ref-lookup Tailwind CSS grid layout`

## MCP Dependency
This specialty requires the **ref.tools MCP server** to be configured. It provides up-to-date documentation lookup for APIs, libraries, frameworks, and services, optimized for coding agents.

**Installation:**
```bash
claude mcp add --transport http Ref https://api.ref.tools/mcp --header "x-ref-api-key: YOUR_API_KEY"
```

## What It Does
When invoked, this specialty:
1. Asks 1-2 clarifying questions about specific use case, experience level, and framework version
2. Uses ref.tools MCP tools to search for and retrieve actual documentation pages
3. Performs multiple searches to build a comprehensive reference
4. Generates a complete standalone HTML reference guide document
5. Saves the HTML file to the current working directory

## Reference Guide Sections
A typical reference guide includes the following sections (10-12):
- Overview & Context (metric cards: version, last updated, GitHub stars, docs coverage)
- Core Concepts (fundamental concepts explained with body-text and bullet-lists)
- API Reference (sop-table: function/method, parameters, return type, description)
- Quick Start Guide (numbered steps with code-blocks for setup and basic usage)
- Common Patterns & Examples (loop-cards with code-block examples)
- Configuration Options (sop-table: option name, type, default, description)
- Advanced Usage (complex code-block examples with info-box tips)
- Common Pitfalls & Gotchas (warning/danger info-boxes with correct approaches)
- Integration Patterns (code-blocks showing integration with related libraries)
- Migration Notes (timeline of breaking changes across versions, if relevant)
- Performance Best Practices (success info-boxes with optimization tips)
- Related Resources & Further Reading (bullet-list of related docs, tutorials, repos)

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `REF-[LIB CODE]-[YEAR]` (e.g., REF-REACT-2026 for React)
- **Classification**: Engineering
- **Cover Label**: "Technical Reference Guide"
- **Sidebar Doc-Type**: "Technical Reference Guide"
- **Topbar Badge**: "REFERENCE"

## Command File Location
`~/.claude/commands/ref-lookup.md` (user-level, available in all projects)
