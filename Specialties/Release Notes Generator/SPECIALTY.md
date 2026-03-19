# Release Notes Generator Specialty

## Purpose
Generates professional release notes documents as standalone HTML files matching the Dev Labs design system. Pulls merged PRs and commit history via the gh CLI, categorizes changes, and produces clear, audience-appropriate release notes.

## Invocation
```
/release-notes <version, date range, or branch>
```

## What It Does
When invoked, this specialty:
1. Asks clarifying questions about the release version, date range, audience, and repository
2. Uses gh CLI to pull merged PRs, commits, and contributors
3. Categorizes changes into features, fixes, improvements, breaking changes
4. Generates a complete standalone HTML release notes document
5. Saves the HTML file to the current working directory

## Release Notes Sections
A typical release notes document includes the following sections:
- Release Overview
- Highlights & Key Changes
- New Features
- Improvements & Enhancements
- Bug Fixes
- Breaking Changes
- Deprecations
- Performance Improvements
- Security Updates
- Contributors
- Migration Guide
- Known Issues & Upcoming

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `RN-[VERSION]-[YEAR]` (e.g., RN-2.1.0-2026)
- **Classification**: Product
- **Cover Label**: "Release Notes"
- **Topbar Badge**: "RELEASE"

## Reference Template
Located at: `./reference/Release Notes Template.html`

## Command File Location
`~/.claude/commands/release-notes.md` (user-level, available in all projects)
