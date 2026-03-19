# Exa Research Skill

## Purpose
Deep web research assistant that uses the Exa AI MCP server for real-time web search, code search, company research, and LinkedIn lookup to generate comprehensive, standalone HTML research reports matching the Dev Labs design system. Produces thorough, source-attributed intelligence reports with data gathered across multiple Exa tools.

## Invocation
```
/exa-research <research topic, company, person, or technical question>
```

## What It Does
When invoked, this skill:
1. Asks 2-3 clarifying questions about research type (company intelligence, market research, technical deep-dive, competitive analysis, person research), depth (quick overview vs. comprehensive report), and specific questions to answer
2. Uses Exa MCP server tools strategically to conduct multi-source research:
   - `web_search_exa` for general web research, news, articles, and reports
   - `get_code_context_exa` for technical research, code examples, and library docs
   - `company_research` for company-specific intelligence (crawls their website)
   - `linkedin_search` for people and company profiles on LinkedIn
3. Performs at least 5-8 searches across different Exa tools for comprehensive coverage
4. Generates a complete standalone HTML research report
5. Saves the HTML file to the current working directory

## MCP Dependency
This skill **requires** the Exa MCP server to be configured and running. Install with:
```
claude mcp add --transport http exa "https://mcp.exa.ai/mcp?tools=web_search_exa,get_code_context_exa,company_research,linkedin_search"
```

The Exa MCP server provides access to:
- **web_search_exa** - Real-time web searches with optimized results and content extraction
- **get_code_context_exa** - Find real code snippets and docs from GitHub, StackOverflow, and technical docs
- **company_research** - Comprehensive company research that crawls company websites
- **linkedin_search** - Search LinkedIn for companies and people

If the MCP tools are not available, the skill will inform the user to configure the Exa MCP server first.

## Research Report Sections

### For Company/Market Research:
- Research Overview (metric cards)
- Executive Summary
- Company Profile (from company_research)
- Market Landscape
- Competitive Analysis
- Recent News & Developments (timeline)
- Key People (from linkedin_search)
- Technology Stack & Innovation
- Financial & Funding Data
- SWOT Analysis (loop cards)
- Industry Trends
- Strategic Recommendations
- Risk Factors
- Sources & Methodology

### For Technical Research:
- Research Overview
- Technology Summary
- Architecture & Patterns (code blocks)
- Implementation Examples
- Best Practices
- Common Issues & Solutions
- Performance Benchmarks
- Library/Tool Comparison
- Community & Ecosystem
- Recommendations

## Design System (Locked)
- **Fonts**: Inter (body), JetBrains Mono (monospace/labels)
- **Colors**: Navy (#1a1a2e), Accent Blue (#4361ee), Emerald (#10b981), plus semantic colors
- **Layout**: 280px fixed sidebar, 900px max content width
- **Components**: Section headers, sub-headers, bullet lists, numbered steps, SOP tables, info boxes (info/success/warning/danger), metric cards, timelines, loop cards, funnel diagrams, code blocks
- **Document ID Format**: `EX-[TOPIC CODE]-[YEAR]` (e.g., EX-AI-2026 for AI Research)
- **Classification**: Confidential
- **Cover Label**: "Research Report"
- **Topbar Badge**: "RESEARCH"

## Command File Location
`~/.claude/commands/exa-research.md` (user-level, available in all projects)
