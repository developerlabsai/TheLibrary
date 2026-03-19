# Migration Planner Skill

## Purpose
Generates comprehensive code and system migration plans as standalone HTML documents matching the Dev Labs design system. Analyzes codebases, identifies dependencies, assesses risks, and produces phased migration roadmaps with rollback strategies.

## Invocation
```
/migration-plan <migration description: from X to Y>
```

## What It Does
When invoked, this skill:
1. Asks clarifying questions about the migration scope, source/target systems, timeline constraints, and risk tolerance
2. Analyzes the current codebase to understand dependencies and complexity
3. Generates a complete standalone HTML migration plan document
4. Saves the HTML file to the current working directory

## Migration Plan Sections
A typical migration plan includes the following sections:
- Migration Overview
- Current State Assessment
- Target State Architecture
- Dependency Analysis
- Risk Assessment Matrix
- Phase 1 - Preparation
- Phase 2 - Foundation
- Phase 3 - Incremental Migration
- Phase 4 - Integration Testing
- Phase 5 - Cutover & Go-Live
- Rollback Strategy
- Testing Strategy
- Team Assignments & Responsibilities
- Success Metrics & Validation
- Communication Plan
- Post-Migration Cleanup

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `MP-[PROJECT CODE]-[YEAR]` (e.g., MP-ENG-2026 for Engineering)
- **Classification**: Engineering - Internal
- **Cover Label**: "Migration Plan"
- **Topbar Badge**: "MIGRATION"

## Reference Template
Located at: `./reference/Migration Plan Template.html`

## Command File Location
`~/.claude/commands/migration-plan.md` (user-level, available in all projects)
