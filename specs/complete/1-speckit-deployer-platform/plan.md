# Implementation Plan: TheLibrary SpecKit Deployer Platform

**Branch**: `1-speckit-deployer-platform` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/1-speckit-deployer-platform/spec.md`

## Summary

Build a deployment platform (CLI + Web Dashboard) that uniformly installs SpecKit governance structures, Beads task tracking, Agents, Skills, MCP Servers, Templates, and Workforce Packages into any target project. The platform analyzes target projects, adapts a 20-principle constitution, deploys the standard structure matching the SLACK reference project, and provides 5 creation wizards with dual CLI/API entry points.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 target, ESNext modules)
**Primary Dependencies**: Commander.js (CLI), Express (API), React 19 (Dashboard), Vite 6 (build), Tailwind CSS (styling), fs-extra (file ops), chalk (terminal), cors (API)
**Storage**: File-system only. No database. All state lives in directory structure.
**Testing**: Manual integration testing (deploy into blank project, deploy into existing project)
**Target Platform**: macOS / Linux CLI + Web browser (dashboard)
**Project Type**: CLI tool + companion web application (monorepo with deployer/ and dashboard/)
**Performance Goals**: Deploy completes in under 30 seconds. Dashboard API responds in under 2 seconds. CLI commands start in under 1 second.
**Constraints**: Zero external service dependencies. Must work offline. Must never destroy existing user content in target projects.
**Scale/Scope**: 4 agents, 21 skills, 10 templates, 3 packages, 6 constitution profiles. 14 CLI commands. 10 dashboard pages. 5 creation wizards.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| # | Principle | Status | Rationale |
|---|-----------|--------|-----------|
| I | CRM-First Architecture | N/A | TheLibrary is a deployment tool, not a CRM. This principle applies to target projects only. |
| II | Plugin Ecosystem | N/A | TheLibrary is a monolithic CLI + dashboard. Plugins are a target project concern. |
| III | API-First Development | PASS | Dashboard API follows REST patterns. All wizard operations exposed as POST endpoints. |
| IV | Client Isolation (Multi-Tenancy) | N/A | Single-user local tool. No multi-tenancy required. |
| V | SOC 2 Compliance & Audit Logging | N/A | Local file-system tool. No user data, no audit requirements. Security baseline docs are deployed into target projects. |
| VI | Cost Tracking & Financial Model | N/A | No API costs in the deployer itself. MCP servers deployed by the tool include cost tracking infrastructure. |
| VII | Deviation Prevention | PASS | Uniform structure enforced. Same scripts, templates, and directory layout for every project. Constitution adaptation is profile-based, not ad-hoc. |
| VIII | Integration-Centric Design | PASS | MCP server creator generates integration-ready servers with full infrastructure stack. |
| IX | Sequence-Driven Workflows | N/A | No campaign sequences. Deployment tool. |
| X | Enrichment as Foundation | N/A | No data enrichment. Deployment tool. |
| XI | Context-First Decision Making | PASS | Project analyzer gathers full context (language, framework, existing configs) before suggesting a profile or deploying. |
| XII | Holistic System Awareness | PASS | Agent context generator captures the full technology stack and working patterns of each deployed project. |
| XIII | Confirmation-Required Workflow | PASS | Merge strategy never overwrites. Existing content preserved. Deploy shows what was created/skipped. Dry-run mode available. |
| XIV | UI/UX First Design | PASS | Dashboard follows Dev Labs design system. Dark theme, sidebar navigation, consistent component patterns. |
| XV | AWS-Only Infrastructure | N/A | TheLibrary runs locally. No cloud infrastructure. |
| XVI | Developer Navigation Index | PASS | Agent context includes Key Directories section. CLAUDE.md provides project rules. |
| XVII | MCP-First Research Workflow | PASS | MCP server wizard performs API research (rate limits, auth, pagination) before generating server code. |
| XVIII | Developer Navigation Index (cont.) | PASS | Same as XVI. |
| XIX | GitHub Account Policy | N/A | No GitHub operations in the deployer itself. |
| XX | Bullet-Proof Automation Patterns | PASS | MCP infrastructure includes exponential backoff with jitter, circuit breaker, rate limiter, request queue. |

**Gate Result**: PASS. 10 principles N/A (not applicable to a local deployment tool), 10 principles PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/1-speckit-deployer-platform/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Deployment verification guide
├── contracts/           # Phase 1: API contracts
│   └── dashboard-api.md # Dashboard REST API contract
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
deployer/                              # CLI + API backend
├── bin/speckit.ts                     # CLI entry point (14 commands)
├── src/
│   ├── commands/                      # Command handlers
│   │   ├── deploy.ts                  # Main deploy orchestrator (11 steps)
│   │   ├── analyze.ts                 # Standalone analysis
│   │   ├── list.ts                    # Asset listing
│   │   ├── bundle.ts                  # Package deployment
│   │   └── dashboard.ts              # Express API + wizard routes
│   ├── analyzers/
│   │   └── project-analyzer.ts        # Language/framework/config detection
│   ├── generators/
│   │   ├── constitution.ts            # Constitution adaptation engine
│   │   ├── agent-context.ts           # Agent context generator
│   │   └── settings-generator.ts      # Settings merge logic
│   ├── deployers/
│   │   ├── speckit-deployer.ts        # .specify/ structure
│   │   ├── beads-deployer.ts          # .beads/ structure
│   │   ├── skill-deployer.ts          # Skill files to .claude/skills/
│   │   ├── agent-deployer.ts          # Agent files
│   │   ├── template-deployer.ts       # HTML templates
│   │   ├── mcp-deployer.ts            # .mcp-infra/ shared layer
│   │   └── security-deployer.ts       # Security baseline docs
│   ├── wizards/
│   │   ├── prompt-engine.ts           # Interactive CLI prompts
│   │   ├── agent-wizard.ts            # Agent creation (CLI + API)
│   │   ├── skill-wizard.ts            # Skill creation (CLI + API)
│   │   ├── mcp-wizard.ts              # MCP server creation (CLI + API)
│   │   ├── feature-wizard.ts          # Feature spec creation (CLI + API)
│   │   └── package-wizard.ts          # Package creation (CLI + API)
│   ├── registry/
│   │   ├── asset-registry.ts          # Scan library for all assets
│   │   └── package-registry.ts        # Package validation
│   ├── types.ts                       # Core type definitions
│   └── utils/
│       ├── file-ops.ts                # Safe file operations
│       └── version.ts                 # Version management
├── package.json
└── tsconfig.json

dashboard/                             # Web frontend
├── src/
│   ├── main.tsx                       # React Router (10 routes)
│   ├── components/Layout.tsx          # Sidebar + main content
│   ├── services/api.ts               # API client + wizard types
│   └── pages/
│       ├── Dashboard.tsx              # Stats overview
│       ├── Assets.tsx                 # Agents/skills/templates browser
│       ├── Deploy.tsx                 # 4-step deploy wizard
│       ├── Packages.tsx               # Package browser
│       ├── Projects.tsx               # Project analyzer
│       ├── CreateAgent.tsx            # Agent wizard form
│       ├── CreateSkill.tsx            # Skill wizard form
│       ├── CreateMcp.tsx              # MCP server wizard form
│       ├── CreateFeature.tsx          # Feature spec wizard form
│       └── CreatePackage.tsx          # Package wizard form
├── package.json
└── vite.config.ts

library/                               # Canonical source files
├── speckit/
│   ├── scripts/bash/                  # 9 bash scripts (incl. qa-parse-spec.sh, qa-run-tests.sh)
│   ├── templates/                     # 5 markdown templates
│   ├── memory/constitution-base.md    # 20-principle constitution (v3.5.0)
│   ├── qa-areas-template.yml          # QA functional area-to-spec mapping template
│   └── references/                    # UX reference
├── constitutions/                     # 6 profile JSONs
└── security/                          # Security baseline docs

Agents/                                # 4 agent definitions (manifest.json each)
Skills/                                # 21 skill definitions (SKILL.md + reference/)
Templates/                             # 10 HTML templates (Dev Labs design system)
Packages/                              # 3 workforce packages (package.json each)
MCP-Servers/                           # Wizard-created MCP servers
Features/                              # Wizard-created feature specs
references/
├── technical docs/                    # HTML technical docs (per feature, Dev Labs design system)
└── knowledgebase/                     # .md docs with line-number TOC (for Claude Code navigation)
```

**Structure Decision**: Web application pattern (deployer/ backend + dashboard/ frontend) with a shared library/ directory. The CLI and API share the same source modules in deployer/src/ - the dashboard API (Express) imports the same generators and deployers that the CLI commands use.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
