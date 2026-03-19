# Call Prep Skill

## Purpose
Generates professional meeting and call preparation documents as standalone HTML files matching the Dev Labs design system. Researches attendees and companies via web search, builds agendas, talking points, objection preparation, and follow-up action items.

## Invocation
```
/call-prep <meeting context, company name, or attendee names>
```

## What It Does
1. Asks clarifying questions about the meeting type, attendees, objectives, and your product/service
2. Conducts web research on attendees and their company
3. Generates a complete standalone HTML call prep document
4. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width

## Reference Template
Located at: `./reference/Call Prep Template.html`

## Command File Location
`~/.claude/commands/call-prep.md`
