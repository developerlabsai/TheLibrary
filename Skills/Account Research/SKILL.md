# Account Research Skill

## Purpose
Generates comprehensive account research briefs as standalone HTML documents matching the Dev Labs design system. Uses web search to research companies, key contacts, recent news, competitive landscape, and pain points to prepare sales and business development teams.

## Invocation
```
/account-research <company name or description>
```

## What It Does
1. Asks clarifying questions about the target company, your product/service, and research focus areas
2. Conducts web research using WebSearch to gather company intelligence
3. Generates a complete standalone HTML research brief
4. Saves the HTML file to the current working directory

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width

## Reference Template
Located at: `./reference/Account Research Template.html`

## Command File Location
`~/.claude/commands/account-research.md`
