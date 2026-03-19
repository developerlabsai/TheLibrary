# Playbook Specialty

## Purpose
Generates professional, interactive HTML playbook documents that match the Dev Labs design system exactly. Every playbook produced by this specialty uses the same layout, typography, color palette, and component library as the reference template.

## Invocation
```
/playbook <topic or description>
```

## What It Does
When invoked, this specialty:
1. Asks clarifying questions about the playbook topic, audience, and key sections
2. Generates a complete standalone HTML file with:
   - Fixed sidebar navigation with numbered sections
   - Sticky topbar with document metadata
   - Cover page with title, subtitle, and metadata
   - 8-16 numbered content sections
   - All content using the standardized component library
3. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks

## Reference Template
Located at: `./reference/Playbook Template.html`

## Command File Location
`~/.claude/commands/playbook.md` (user-level, available in all projects)
