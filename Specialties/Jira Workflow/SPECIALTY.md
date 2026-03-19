# Jira Workflow Specialty

## Purpose
Searches Jira issues, generates sprint reports, creates and manages tickets, and produces comprehensive project status documents as standalone HTML files matching the Dev Labs design system. Pulls live data from Jira via the Atlassian MCP server to deliver actionable sprint reviews, backlog analyses, release readiness assessments, and team velocity reports.

## Invocation
```
/jira <project key, JQL query, or sprint name>
```

## MCP Dependency
This specialty **requires** the Atlassian MCP server to be configured and running.

- **Server endpoint**: `https://mcp.atlassian.com/v1/mcp`
- **Auth**: OAuth 2.1 or API token

### Atlassian MCP Tools Used

| Tool | Purpose |
|------|---------|
| Search issues via JQL | Query Jira issues by project, sprint, status, type, assignee, etc. |
| Create issues | Create new Jira tickets with type, summary, description, priority |
| Update issues | Modify existing ticket fields, status transitions, assignments |
| Bulk issue creation | Batch-create multiple issues at once |
| Confluence: Summarize pages | Pull related documentation context from Confluence |
| Confluence: Create pages | Generate Confluence pages from report data |
| Confluence: List spaces | Discover available Confluence spaces for cross-referencing |
| Compass: Create service components | Register service components in Compass |
| Compass: Query dependencies | Map cross-service dependencies |

If MCP tools are not available, the skill will inform the user to configure the Atlassian MCP server first.

## What It Does
When invoked, this specialty:
1. Asks 2-3 clarifying questions about the project key, report type, date range or sprint, and any epic or component focus
2. Uses Atlassian MCP tools to search issues via JQL and read issue details
3. Optionally pulls related documentation from Confluence
4. Analyzes the data to calculate velocities, burndown status, workload distribution, and risk indicators
5. Generates a complete standalone HTML file with:
   - Fixed sidebar navigation with numbered sections
   - Sticky topbar with document metadata and "JIRA" badge
   - Cover page with title, subtitle, "Jira Project Report" label, and metadata
   - 12-14 numbered content sections tailored to the report type
   - All content using the standardized component library
6. Saves the HTML file to the current working directory

## Report Types
- **Sprint Report** - Current/completed sprint analysis with velocity and burndown
- **Backlog Analysis** - Backlog health, prioritization, grooming status
- **Release Readiness** - Feature completion, blocker assessment, go/no-go indicators
- **Team Velocity** - Historical velocity trends, capacity planning, workload balance

## Report Sections
A typical Jira report includes the following sections:
- Sprint/Project Overview
- Sprint Goal Assessment
- Velocity & Burndown Summary
- Completed Work
- In Progress
- Blocked & At Risk
- Backlog Health
- Epic Progress
- Team Workload Distribution
- Bug & Defect Tracker
- Dependencies & Risks
- Upcoming Sprint Candidates
- Action Items & Decisions Needed
- Confluence References

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `JR-[PROJECT]-[YEAR]` (e.g., JR-PLAT-2026 for Platform project)
- **Classification**: Engineering - Internal
- **Cover Label**: "Jira Project Report"
- **Topbar Badge**: "JIRA"

## Command File Location
`~/.claude/commands/jira.md` (user-level, available in all projects)
