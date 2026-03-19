# Proposal Writer Skill

## Purpose
Generates professional, standalone HTML business proposal documents that match the Dev Labs design system exactly. Every proposal produced by this skill uses the same layout, typography, color palette, and component library as the playbook reference template, adapted for client-facing business proposals.

## Invocation
```
/proposal <client or project description>
```

## What It Does
When invoked, this skill:
1. Asks 2-3 clarifying questions about the client, project type, budget range, and timeline
2. Generates a complete standalone HTML file with:
   - Fixed sidebar navigation with numbered sections
   - Sticky topbar with document metadata and "PROPOSAL" badge
   - Cover page with title, subtitle, "Business Proposal" label, and metadata
   - 10-14 numbered content sections tailored for business proposals
   - All content using the standardized component library
3. Saves the HTML file to the current working directory

## Proposal Sections
A typical proposal includes the following sections:
- Executive Summary
- Client Challenges
- Proposed Solution
- Scope of Work
- Deliverables
- Timeline & Milestones
- Team & Resources
- Investment & Pricing
- Case Studies / Social Proof
- Terms & Conditions
- Next Steps
- Appendix

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `PR-[2-3 LETTER CODE]-[YEAR]` (e.g., PR-WD-2026 for Web Development)
- **Classification**: Confidential
- **Cover Label**: "Business Proposal"
- **Topbar Badge**: "PROPOSAL"

## Reference Template
Located at: `./reference/Proposal Template.html`

## Command File Location
`~/.claude/commands/proposal.md` (user-level, available in all projects)
