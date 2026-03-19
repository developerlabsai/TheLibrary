# Runbook Creator Skill

## Purpose
Generates professional operational and incident runbook documents as standalone HTML files matching the Dev Labs design system. Produces clear decision trees, escalation paths, diagnostic steps, and command references for operations teams.

## Invocation
```
/runbook <system, service, or incident type>
```

## What It Does
When invoked, this skill:
1. Asks clarifying questions about the system/service, incident types, team structure, and tooling
2. Generates a complete standalone HTML runbook document
3. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width

## Reference Template
Located at: `./reference/Runbook Template.html`

## Command File Location
`~/.claude/commands/runbook.md`
