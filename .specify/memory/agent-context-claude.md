# Agent Context: TheLibrary - SpecKit Deployer

**Last Updated**: 2026-03-19
**Project**: TheLibrary (Agent Creator)
**Tech Stack**: TypeScript 5.x, Node.js, Commander CLI, Express, React 19, Vite, Tailwind CSS

## Overview

This file provides context for AI agents working on TheLibrary. It contains architectural patterns, technology decisions, and implementation guidelines specific to this project.

TheLibrary is a deployment platform that uniformly installs SpecKit, Beads, Agents, Skills, MCP Servers, and Templates into any target project. It ensures every project gets the same governance structure, scripts, templates, and workflows.

## Technology Stack

### Deployer CLI (`deployer/`)

- **TypeScript 5.x** with ES2022 target, ESNext modules
- **Commander.js** - CLI framework (14 commands)
- **chalk** - Terminal styling
- **fs-extra** - Safe file operations
- **Express** - Dashboard API server
- **cors** - Cross-origin support for dashboard

### Dashboard (`dashboard/`)

- **React 19** with TypeScript
- **Vite 6** - Build tool
- **react-router-dom** - Client-side routing (10 pages)
- **Tailwind CSS** - Utility-first styling
- **Fetch API** - API client to deployer backend

### No Database

- File-system based. All state lives in the library directory structure.
- No ORM, no migrations, no external services.

## Project Structure

```
Agent Creator/
├── deployer/                          # SpecKit Deployer CLI
│   ├── bin/speckit.ts                 # CLI entry point (14 commands)
│   ├── src/
│   │   ├── commands/                  # deploy, analyze, list, bundle, dashboard
│   │   ├── analyzers/                 # project-analyzer (language, framework, config)
│   │   ├── generators/                # constitution, agent-context, settings
│   │   ├── deployers/                 # speckit, beads, skill, agent, mcp, template, security
│   │   ├── registry/                  # asset-registry, package-registry
│   │   ├── wizards/                   # 5 creation wizards + prompt-engine
│   │   │   ├── prompt-engine.ts       # Interactive CLI prompts (ask, confirm, select, multiLine)
│   │   │   ├── agent-wizard.ts        # Agent creation (CLI + API)
│   │   │   ├── skill-wizard.ts        # Skill creation (CLI + API)
│   │   │   ├── mcp-wizard.ts          # MCP server creation with gold-standard infra
│   │   │   ├── feature-wizard.ts      # Feature spec creation (spec.md + plan.md)
│   │   │   └── package-wizard.ts      # Workforce package creation
│   │   ├── types.ts                   # Core type definitions
│   │   └── utils/                     # file-ops, version
│   ├── package.json
│   └── tsconfig.json
├── dashboard/                         # Web Dashboard (Vite + React)
│   ├── src/
│   │   ├── pages/                     # 10 pages (Dashboard, Assets, Deploy, Packages,
│   │   │                              #   Projects, CreateAgent, CreateSkill, CreateMcp,
│   │   │                              #   CreateFeature, CreatePackage)
│   │   ├── components/Layout.tsx      # Sidebar nav + main content
│   │   └── services/api.ts            # API client + wizard input types
│   ├── package.json
│   └── vite.config.ts
├── library/                           # Canonical source files
│   ├── speckit/                       # Core .specify/ files
│   │   ├── scripts/bash/              # 9 bash scripts (from SLACK reference)
│   │   ├── templates/                 # 5 templates (spec, plan, tasks, checklist, ux-review)
│   │   ├── memory/constitution-base.md # Full 20-principle constitution (v3.5.0)
│   │   └── references/               # UX reference
│   ├── constitutions/                 # 6 profile JSONs
│   └── security/                      # Security baseline docs
├── Agents/                            # 4 agent definitions
│   ├── executive-assistant/
│   ├── chief-of-staff/
│   ├── head-of-marketing/
│   └── chief-financial-officer/
├── Skills/                            # 21 skill definitions (SKILL.md + reference/)
├── Templates/                         # 10 HTML templates (Dev Labs design system)
├── Packages/                          # 3 workforce bundles (bdr-team, executive-ops, engineering-team)
├── MCP-Servers/                       # MCP servers created by wizard
├── Features/                          # Feature specs created by wizard
├── .specify/                          # This project's SpecKit installation
├── .beads/                            # Task tracking
├── .claude/                           # Claude settings + skills
└── specs/                             # Feature specifications
```

## CLI Commands

```bash
# Core deployment
speckit analyze <target-path>           # Analyze without modifying
speckit deploy <target-path>            # Full deploy (SpecKit + Beads)
speckit scaffold <target-path>          # Scaffold fresh project
speckit bundle <target-path> <pkg>      # Deploy workforce package
speckit update <target-path>            # Check for updates
speckit list [type]                     # List available assets

# Asset deployment
speckit deploy-skill <target> <skill>   # Deploy single skill
speckit deploy-agent <target> <agent>   # Deploy single agent
speckit deploy-mcp <target> <mcp>       # Deploy MCP server + infra

# Creation wizards
speckit create-agent                    # Agent creation wizard
speckit create-skill                    # Skill creation wizard
speckit create-mcp                      # MCP server creation wizard
speckit create-feature                  # Feature spec wizard
speckit create-package                  # Workforce package wizard

# Dashboard
speckit dashboard [--port 3847]         # Launch web dashboard
```

## Architecture Patterns

### Wizard Pattern (CLI + API Dual Mode)

Every wizard has two entry points:
1. `run*WizardCli()` - Interactive CLI with prompt-engine
2. `generate*()` - Pure function from input to output (used by dashboard API)

The dashboard POST endpoints call the `generate*()` functions directly.

### Deployer Flow

1. **Analyze** target project (language, framework, existing configs)
2. **Adapt** constitution from base template + profile overrides
3. **Deploy** uniform structure (.specify/, .beads/, .claude/, specs/)
4. **Merge** settings (add permissions, never remove existing)
5. **Stamp** version (speckit-version.json)

### Merge Strategy (Critical)

| Existing File | Action |
|--------------|--------|
| `constitution.md` | NEVER overwrite. Offer diff-based merge. |
| `settings.local.json` | MERGE - add new permissions, never remove |
| `.claude/skills/<name>/` | Skip if exists |
| `CLAUDE.md` | Append, never overwrite |
| `.beads/` | Skip if exists |
| `specs/` | Never touch existing specs |

### MCP Infrastructure Pattern

All MCP servers share a `.mcp-infra/` layer:
- Rate limiter, retry handler, cache layer, circuit breaker
- Request queue, error normalizer, request logger
- Deployed once, shared by all MCP servers in a project

## Constitution Profiles

| Profile | Use Case |
|---------|----------|
| `web-app-typescript` | Next.js, Express, React apps |
| `web-app-python` | Django, FastAPI, Flask |
| `slack-bot` | Slack apps and bots |
| `api-service` | REST/GraphQL APIs |
| `cli-tool` | CLI utilities and tools |
| `minimal` | Lightweight, any project |

## Key Files

| File | Purpose |
|------|---------|
| `deployer/bin/speckit.ts` | CLI entry point (14 commands) |
| `deployer/src/commands/deploy.ts` | Main deploy orchestrator (11 steps) |
| `deployer/src/commands/dashboard.ts` | Express API server + wizard endpoints |
| `deployer/src/analyzers/project-analyzer.ts` | Language/framework/config detection |
| `deployer/src/generators/constitution.ts` | Constitution adaptation engine |
| `deployer/src/wizards/mcp-wizard.ts` | Most complex wizard (gold-standard API infra) |
| `library/speckit/memory/constitution-base.md` | 20-principle constitution (689 lines) |

## Development Workflow

### Running the CLI
```bash
cd deployer && npx tsx bin/speckit.ts <command>
```

### Building the Dashboard
```bash
cd dashboard && npx vite build
```

### Type Checking
```bash
cd deployer && npx tsc --noEmit
cd dashboard && npx tsc --noEmit
```

## Asset Counts

- **Agents**: 4 (executive-assistant, chief-of-staff, head-of-marketing, chief-financial-officer)
- **Skills**: 21 (account-research, crm-research, calendar-prep, call-prep, etc.)
- **Templates**: 10 (sales-bdr-playbook, proposal-sow, daily-action-*, meeting-recap, etc.)
- **Packages**: 3 (bdr-team, executive-ops, engineering-team)
- **Constitution Profiles**: 6
