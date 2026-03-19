# CRM Research Specialty

## Purpose
Pulls CRM data from HubSpot using the HubSpot MCP server to generate comprehensive account intelligence, deal reviews, contact summaries, and pipeline overviews as standalone HTML documents matching the Dev Labs design system. Produces actionable CRM intelligence reports with real data from your HubSpot instance.

## Invocation
```
/crm-research <company name, contact name, deal name, or "pipeline review">
```

## What It Does
When invoked, this specialty:
1. Asks 2-3 clarifying questions about the research scope (single account, contact, deal, or pipeline overview), time period, and specific metrics or KPIs to highlight
2. Uses HubSpot MCP server tools to pull actual CRM data (contacts, companies, deals, tickets, associations, engagement history)
3. Generates a complete standalone HTML CRM intelligence report
4. Saves the HTML file to the current working directory

## MCP Dependency
This specialty **requires** the HubSpot MCP server to be configured and running. The HubSpot MCP server provides read-only access to:
- Contacts, Companies, Deals, Tickets
- Invoices, Products, Line Items, Quotes
- Subscriptions, Orders, Carts, Users
- Object associations between all record types

The server endpoint is configured via HubSpot CLI or OAuth 2.0. If the MCP tools are not available, the skill will inform the user to configure the HubSpot MCP server first.

## CRM Report Sections
A typical CRM Intelligence Report includes the following sections:
- Account Overview (metric cards)
- Company Profile
- Key Contacts
- Deal Pipeline (funnel diagram)
- Active Deals
- Deal History & Timeline
- Support Tickets
- Engagement History
- Revenue Analysis
- Risk Assessment
- Upsell & Cross-sell Opportunities
- Recommended Next Actions
- Associated Records
- Data Quality Notes

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `CRM-[ACCOUNT CODE]-[YEAR]` (e.g., CRM-ACME-2026)
- **Classification**: Sales - Confidential
- **Cover Label**: "CRM Intelligence Report"
- **Topbar Badge**: "CRM INTEL"

## Command File Location
`~/.claude/commands/crm-research.md` (user-level, available in all projects)
