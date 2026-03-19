# Outbound Personalization Skill

## Purpose
Generates personalized outbound sales sequences as standalone HTML documents matching the Dev Labs design system. Researches prospects and their companies via web search, then produces tailored multi-touch email sequences, LinkedIn messages, and cold call scripts.

## Invocation
```
/outbound <prospect name, company, or target description>
```

## What It Does
When invoked, this skill:
1. Asks clarifying questions about the prospect, your product/service, and campaign goals
2. Conducts web research on the prospect and their company using WebSearch
3. Generates a complete standalone HTML outreach document with personalized sequences
4. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks

## Reference Template
Located at: `./reference/Outbound Template.html`

## Command File Location
`~/.claude/commands/outbound.md` (user-level, available in all projects)
