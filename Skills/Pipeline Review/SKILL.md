# Pipeline Review Skill

## Purpose
Pulls deal pipeline data from HubSpot using the HubSpot MCP server and generates comprehensive weekly or monthly pipeline review documents as standalone HTML files matching the Dev Labs design system. Produces data-driven pipeline reviews with deal analysis, stage-by-stage breakdowns, forecasting, risk assessment, rep performance metrics, and coaching notes -- all sourced from live CRM data.

## Invocation
```
/pipeline-review <pipeline name, time period, or rep name>
```

Examples:
- `/pipeline-review weekly review`
- `/pipeline-review monthly forecast Q1`
- `/pipeline-review Enterprise Pipeline`
- `/pipeline-review Sarah Chen performance`

## What It Does
When invoked, this skill:
1. Asks 2-3 clarifying questions about the pipeline scope (which pipeline, time period, focus area, revenue targets)
2. Uses HubSpot MCP server tools to pull actual deal data, associated companies, contacts, owners, and pipeline stage history
3. Analyzes deal progression, stalled opportunities, risk factors, and win/loss patterns
4. Generates a complete standalone HTML pipeline review document with 12-14 sections
5. Saves the HTML file to the current working directory

## MCP Dependency
This skill **requires** the HubSpot MCP server to be configured and running. The HubSpot MCP server provides read-only access to:
- Contacts, Companies, Deals, Tickets
- Invoices, Products, Line Items, Quotes
- Users (deal owners / sales reps)
- Object associations between all record types

The server endpoint is configured via HubSpot CLI or OAuth 2.0. If the MCP tools are not available, the skill will inform the user to configure the HubSpot MCP server first.

## Pipeline Review Sections
A typical Pipeline Review includes the following sections (12-14):
1. Pipeline Snapshot (metric cards: total pipeline value, weighted forecast, deal count, avg deal size, win rate, avg sales cycle)
2. Pipeline Funnel (funnel diagram: stage-by-stage with deal count and total value per stage)
3. Forecast Summary (metric cards: committed, best case, pipeline, target, gap to target)
4. Stage-by-Stage Analysis (sop-table per stage: deal name, company, amount, days in stage, owner, next step, probability)
5. Deals Moving Forward (success info-boxes: deals that advanced stages this period)
6. Stalled Deals (warning info-boxes: deals with no activity >14 days, risk assessment)
7. At-Risk Deals (danger info-boxes: deals past close date, declining engagement, competitor threats)
8. New Deals Added (sop-table: new opportunities this period with source, value, owner)
9. Deals Won/Lost This Period (sop-table with win/loss reasons and amounts)
10. Rep Performance (sop-table: rep name, pipeline value, deals, weighted forecast, quota attainment %, activities)
11. Coaching Notes & Recommendations (loop-cards: per-rep coaching suggestions based on data)
12. Pipeline Coverage Analysis (metric cards: coverage ratio by rep, required pipeline generation)
13. Next Steps & Action Items (numbered steps: deals to focus on, calls to make, proposals to send)
14. Weekly/Monthly Comparison (sop-table: this period vs last period for key metrics)

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `PL-[PIPELINE]-[YEAR]` (e.g., PL-ENTERPRISE-2026)
- **Classification**: Sales - Confidential
- **Cover Label**: "Pipeline Review"
- **Topbar Badge**: "PIPELINE"

## Command File Location
`~/.claude/commands/pipeline-review.md` (user-level, available in all projects)
