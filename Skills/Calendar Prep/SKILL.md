# Calendar Prep Skill

## Purpose
Pulls calendar events via the Google Workspace MCP server, researches attendees and companies, and generates comprehensive daily or weekly preparation briefs as standalone HTML documents matching the Dev Labs design system. Each brief includes meeting agendas, attendee intelligence, contextual information from recent emails, talking points, action items, and scheduling conflict alerts.

## Invocation
```
/calendar-prep <today, this week, tomorrow, or specific date>
```

## MCP Dependency
This skill **requires** the Google Workspace MCP server to be configured and active. It uses the following MCP tools:

**Calendar (primary):**
- `list_calendar_events` - Pull scheduled events for the requested date range
- `get_calendar_event` - Retrieve detailed event information

**Cross-referencing (optional):**
- `search_gmail_messages` - Find recent email threads with meeting attendees
- `get_gmail_message` / `get_gmail_thread` - Read email context for meeting prep
- `list_contacts` / `get_contact` - Retrieve contact details and relationship notes

**External research (optional):**
- `WebSearch` - Research external attendees, companies, and topics

## What It Does
When invoked, this skill:
1. Asks 1-2 clarifying questions about the date range, meeting focus (all/external/internal), and level of attendee research
2. Uses `list_calendar_events` to pull actual calendar data for the requested period
3. Cross-references with `search_gmail_messages` for recent email context with attendees
4. Optionally uses `WebSearch` to research external attendees and companies
5. Generates a complete standalone HTML preparation brief
6. Saves the HTML file to the current working directory

## Calendar Prep Sections
A typical brief includes 10-12 sections:
- Day/Week Overview (metric cards)
- Schedule Timeline (chronological event view)
- Priority Meetings (loop cards for top meetings)
- Meeting-by-Meeting Prep (attendees, talking points, context)
- External Meeting Briefs (deeper research on external attendees)
- Attendee Intelligence (consolidated contact table)
- Preparation Checklist (numbered steps)
- Conflicts & Scheduling Notes (warning info-boxes)
- Follow-up Queue (pending items from past meetings)
- Open Action Items (items due today/this week)
- Key Topics & Talking Points by Meeting
- End-of-Day/Week Review Template

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `CAL-[DATE]-[YEAR]` (e.g., CAL-18MAR-2026)
- **Classification**: Personal - Internal
- **Cover Label**: "Calendar Preparation Brief"
- **Topbar Badge**: "CALENDAR"

## Command File Location
`~/.claude/commands/calendar-prep.md` (user-level, available in all projects)
