# SOP Generator Skill

## Purpose
Generates professional, structured Standard Operating Procedure (SOP) documents as standalone HTML files matching the Dev Labs design system. Produces clear, step-by-step operational procedures with roles, checklists, decision trees, and compliance notes.

## Invocation
```
/sop <process or procedure description>
```

## What It Does
When invoked, this skill:
1. Asks clarifying questions about the process, department, compliance requirements, and audience
2. Generates a complete standalone HTML SOP document
3. Saves the HTML file to the current working directory

## SOP Sections
A typical SOP includes the following sections:
- Document Control
- Purpose & Scope
- Roles & Responsibilities
- Prerequisites & Requirements
- Procedure Steps
- Decision Points
- Quality Checks & Verification
- Exception Handling
- Escalation Procedures
- Related Documents & References
- Revision History
- Appendix - Forms & Templates

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `SOP-[DEPT CODE]-[YEAR]` (e.g., SOP-ENG-2026 for Engineering)
- **Classification**: Internal - Controlled
- **Cover Label**: "Standard Operating Procedure"
- **Topbar Badge**: "SOP"

## Reference Template
Located at: `./reference/SOP Template.html`

## Command File Location
`~/.claude/commands/sop.md` (user-level, available in all projects)
