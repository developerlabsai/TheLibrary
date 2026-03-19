# Campaign Content Skill

## Purpose
Generates comprehensive marketing campaign content packages as standalone HTML documents matching the Dev Labs design system. Researches target audiences and topics via web search, then produces multi-channel campaign content including emails, social posts, ad copy, blog outlines, and landing page copy.

## Invocation
```
/campaign <campaign topic, product launch, or marketing initiative>
```

## What It Does
When invoked, this skill:
1. Asks clarifying questions about the campaign goal, target audience, channels, and brand voice
2. Conducts web research on the topic, competitors, and audience trends
3. Generates a complete standalone HTML campaign content document with ready-to-use copy
4. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks

## Reference Template
Located at: `./reference/Campaign Template.html`

## Command File Location
`~/.claude/commands/campaign.md` (user-level, available in all projects)
