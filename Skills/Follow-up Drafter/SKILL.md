# Follow-up Drafter Skill

## Purpose
Generates professional post-meeting follow-up documents as standalone HTML files matching the Dev Labs design system. Produces structured follow-up emails, action item trackers, meeting summaries, and next-step plans based on meeting context.

## Invocation
```
/follow-up <meeting context or notes>
```

## What It Does
When invoked, this skill:
1. Asks clarifying questions about the meeting type, attendees, outcomes, and next steps
2. Generates a complete standalone HTML follow-up document with ready-to-send emails and action tracking
3. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks

## Reference Template
Located at: `./reference/Follow-up Template.html`

## Command File Location
`~/.claude/commands/follow-up.md` (user-level, available in all projects)
