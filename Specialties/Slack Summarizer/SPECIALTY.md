# Slack Summarizer Specialty

## Purpose
Searches, analyzes, and summarizes Slack conversations using the Slack MCP server, then produces a comprehensive, standalone HTML intelligence brief that matches the Dev Labs design system exactly. Supports channel summaries, thread deep-dives, topic-based research, and meeting preparation from Slack context.

## Invocation
```
/slack-summary <channel, thread, topic, or "meeting prep for [meeting name]">
```

### Example Invocations
```
/slack-summary #engineering last 7 days
/slack-summary meeting prep for Q2 planning
/slack-summary topic: deployment issues in #ops and #engineering
/slack-summary decisions made in #product this week
```

## What It Does
When invoked, this specialty:
1. Asks 2-3 clarifying questions about channels, date range, topics/people of interest, and output type (summary, meeting prep, or decision log)
2. Uses Slack MCP server tools to gather real conversation data:
   - `search_messages` to find relevant messages by content, date, and user
   - `read_channel` to get complete channel history
   - `read_thread` to access full thread conversations
   - `search_users` and `read_user_profile` for participant context
   - `search_channels` to locate channels by name or description
3. Analyzes the gathered data for decisions, action items, themes, sentiment, and open questions
4. Generates a complete standalone HTML file with:
   - Fixed sidebar navigation with numbered sections
   - Sticky topbar with document metadata and "SLACK INTEL" badge
   - Cover page with title, subtitle, "Slack Intelligence Brief" label, and metadata
   - 10-12 numbered content sections with real Slack data
   - All content using the standardized Dev Labs component library
5. Saves the HTML file to the current working directory

## Summary Sections
A typical Slack Intelligence Brief includes the following sections:
- Summary Overview (metric cards: messages analyzed, channels searched, date range, participants)
- Key Decisions Made (success info-boxes with who/when/context)
- Action Items Extracted (table: item, assigned to, due date, source, status)
- Discussion Highlights by Topic (loop-cards grouping conversations by theme)
- Unresolved Questions & Open Threads (warning info-boxes)
- Important Announcements (info-box info)
- Participant Activity Summary (table: person, message count, key contributions)
- Thread Deep-Dives (top 3-5 most active/important threads)
- Sentiment & Tone Analysis (metric cards or funnel)
- Meeting Prep Notes (if meeting prep mode -- talking points, background, decisions needed)
- Recommended Follow-ups (numbered steps)
- Source References (table: message links, timestamps, channels)

## MCP Dependency
This specialty requires the Slack MCP server to be configured and available.

- **MCP Server Endpoint:** `https://mcp.slack.com/mcp`
- **Auth:** OAuth 2.0 with `client_id` and `client_secret`
- **Required Tools:** `search_messages`, `read_channel`, `read_thread`, `search_users`, `read_user_profile`, `search_channels`
- **Optional Tools:** `send_message`, `create_canvas`, `update_canvas`, `read_canvas`

If the Slack MCP tools are not available at runtime, the skill will inform the user and provide setup instructions rather than generating a document with fabricated data.

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `SL-[TOPIC CODE]-[YEAR]` (e.g., SL-ENG-2026 for Engineering channel summary)
- **Classification**: Internal
- **Cover Label**: "Slack Intelligence Brief"
- **Topbar Badge**: "SLACK INTEL"

## Command File Location
`~/.claude/commands/slack-summary.md` (user-level, available in all projects)
