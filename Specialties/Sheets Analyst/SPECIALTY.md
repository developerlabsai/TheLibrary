# Sheets Analyst Specialty

## Purpose
Analyzes Google Sheets data using the Google Workspace MCP server and generates comprehensive, standalone HTML analysis documents matching the Dev Labs design system exactly. Produces data-driven insights, KPI reports, financial analyses, trend detection, anomaly identification, and forecasting projections -- all rendered with the same layout, typography, color palette, and component library as the playbook reference template.

## Invocation
```
/sheets-analyst <spreadsheet name or URL>
```

## MCP Dependency
This specialty **requires** the Google Workspace MCP server to be configured and running. It uses the following MCP tools:

| Tool | Purpose |
|------|---------|
| `get_spreadsheet` | View sheet structure, tabs, and metadata |
| `get_sheet_values` | Read cell ranges and extract raw data |
| `append_sheet_values` | Add rows (used when writing analysis results back) |
| `update_sheet_values` | Modify cells (used when annotating source data) |
| `clear_sheet_values` | Remove content from ranges |
| `create_spreadsheet` | Initialize new worksheets |
| `batch_update_spreadsheet` | Execute complex multi-step changes |

If MCP tools are not available, the skill will inform the user to configure Google Workspace MCP first.

## What It Does
When invoked, this specialty:
1. Asks 2-3 clarifying questions about the spreadsheet, analysis type, metrics of interest, and reporting period
2. Uses `get_spreadsheet` to understand the sheet structure (tabs, columns, data types)
3. Uses `get_sheet_values` to read all relevant data ranges
4. Analyzes the data programmatically -- calculating totals, averages, trends, percentages, and detecting anomalies
5. Generates a complete standalone HTML file with:
   - Fixed sidebar navigation with numbered sections
   - Sticky topbar with document metadata and "ANALYSIS" badge
   - Cover page with title, subtitle, "Spreadsheet Analysis Report" label, and metadata
   - 10-14 numbered content sections tailored for data analysis
   - All content using the standardized component library
6. Saves the HTML file to the current working directory

## Analysis Sections
A typical analysis includes the following sections:
- Data Overview
- Executive Summary
- Key Metrics Dashboard
- Trend Analysis
- Top/Bottom Performers
- Distribution Analysis
- Anomaly Detection
- Comparative Analysis
- Forecasting & Projections
- Data Quality Assessment
- Recommendations
- Detailed Data Tables
- Methodology Notes
- Appendix - Full Data Summary

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `SA-[REPORT CODE]-[YEAR]` (e.g., SA-REV-2026 for Revenue Analysis)
- **Classification**: Internal
- **Cover Label**: "Spreadsheet Analysis Report"
- **Topbar Badge**: "ANALYSIS"

## Command File Location
`~/.claude/commands/sheets-analyst.md` (user-level, available in all projects)
