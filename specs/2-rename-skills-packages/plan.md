# Implementation Plan: Full Rename — Skills → Specialties, Packages → Teams

**Branch**: `2-rename-skills-packages` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/2-rename-skills-packages/spec.md`

## Summary

Rename all references to "Skills" → "Specialties" and workforce "Packages" → "Teams" across the entire Agent Creator codebase. This is a mechanical, full-scope rename touching TypeScript types, interfaces, functions, variables, file names, directory names, API endpoints, CLI commands, dashboard routes, JSON manifest fields, and documentation. Clean break with no backward-compatible aliases.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Commander.js (CLI), Express (dashboard API), React + Vite (dashboard UI)
**Storage**: JSON files (manifests, version stamps) — no database
**Testing**: No test suite present (verification via `tsc --noEmit` and `vite build`)
**Target Platform**: CLI tool + local web dashboard (Node.js)
**Project Type**: Monorepo — `deployer/` (CLI + API) and `dashboard/` (React SPA)
**Performance Goals**: N/A (rename only)
**Constraints**: `.claude/skills/` deployment target path must NOT be renamed (Claude Code convention)
**Scale/Scope**: 54 tasks, 31+ source files, 8 JSON manifests, 21 SPECIALTY.md content files, 7 source file renames, 2 directory renames

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| I. CRM-First Architecture | N/A | Agent Creator is not a CRM |
| II. Plugin Ecosystem | N/A | No plugin changes |
| III. API-First Development | N/A | Endpoints renamed, not added |
| IV. Client Isolation | N/A | No multi-tenancy |
| V. SOC 2 Compliance | N/A | No audit logging changes |
| VI. Cost Tracking | N/A | No cost model changes |
| VII. Deviation Prevention | PASS | Rename reduces terminology confusion with Claude Code's native skill system |
| VIII. Integration-Centric | N/A | No external integrations |
| IX. Sequence-Driven | N/A | No workflow changes |
| X. Enrichment | N/A | No data enrichment |
| XI. Context-First | PASS | Double codebase audit completed before spec creation |
| XII. Holistic System Awareness | PASS | All 31+ files mapped across deployer + dashboard; cross-file impact analyzed |
| XIII. Confirmation-Required | PASS | User confirmed full rename scope and clean-break migration strategy |
| XIV. UI/UX First | N/A | Text label changes only, no UX flow changes |
| XV. AWS-Only | N/A | Not the Slack List Processor |
| XVI–XVIII. Navigation/Research | N/A | No new routes or technologies |
| XIX. GitHub Account | PASS | Will use `developerlabsai` account |

**Quality Gates**:
- [x] Feature spec exists with prioritized user stories
- [x] API contracts defined (rename mapping in spec, no new endpoints)
- [x] Data model documents all entities and relationships (rename tables)
- [x] Deviation check against constitution completed (this section)
- [ ] ~~Plugin interface~~ — N/A
- [ ] ~~Cost tracking requirements~~ — N/A
- [ ] ~~Audit logging requirements~~ — N/A
- [ ] ~~UI/UX review~~ — N/A (text changes only)

**Gate result**: PASS — no violations, no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/2-rename-skills-packages/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal — no unknowns)
├── data-model.md        # Phase 1 output (rename mapping)
├── quickstart.md        # Phase 1 output (verification steps)
├── contracts/           # Phase 1 output (endpoint rename mapping)
│   └── api-renames.md
└── tasks.md             # Task list (complete — 54 tasks, 9 phases)
```

### Source Code (repository root)

```text
deployer/                    # CLI tool + Express dashboard API
├── bin/speckit.ts           # CLI entry point
├── src/
│   ├── types.ts             # Central type definitions (7 renames)
│   ├── deployers/
│   │   └── specialty-deployer.ts  # (renamed from skill-deployer.ts)
│   ├── registry/
│   │   ├── asset-registry.ts
│   │   └── team-registry.ts      # (renamed from package-registry.ts)
│   ├── wizards/
│   │   ├── agent-wizard.ts
│   │   ├── specialty-wizard.ts    # (renamed from skill-wizard.ts)
│   │   └── team-wizard.ts        # (renamed from package-wizard.ts)
│   ├── commands/
│   │   ├── deploy.ts
│   │   ├── list.ts
│   │   ├── bundle.ts
│   │   ├── dashboard.ts
│   │   └── analyze.ts
│   ├── analyzers/
│   │   └── project-analyzer.ts
│   ├── generators/
│   │   └── agent-context.ts
│   └── utils/
│       └── version.ts

dashboard/                   # React SPA (Vite)
├── src/
│   ├── main.tsx             # Route definitions
│   ├── services/api.ts      # API client types + methods
│   ├── components/
│   │   └── Layout.tsx       # Navigation sidebar
│   └── pages/
│       ├── Assets.tsx
│       ├── CreateSpecialty.tsx  # (renamed from CreateSkill.tsx)
│       ├── CreateTeam.tsx      # (renamed from CreatePackage.tsx)
│       ├── CreateAgent.tsx
│       ├── Teams.tsx           # (renamed from Packages.tsx)
│       ├── Dashboard.tsx
│       ├── Deploy.tsx
│       └── Projects.tsx

Specialties/                 # (renamed from Skills/)
├── Account Research/SPECIALTY.md
├── ... (21 total)

Teams/                       # (renamed from Packages/)
├── bdr-team/package.json
├── executive-ops/package.json
└── engineering-team/package.json

Agents/
├── executive-assistant/manifest.json
├── chief-of-staff/manifest.json
├── chief-financial-officer/manifest.json
└── head-of-marketing/manifest.json
```

**Structure Decision**: Existing monorepo structure preserved. No new directories or architectural changes. Only renames within existing structure.

## Complexity Tracking

No constitution violations — table not needed.

## Implementation Strategy

### Execution Order (9 phases, dependency-ordered)

1. **Phase 1: Directory & File Renames** — `mv Skills/ Specialties/`, `mv Packages/ Teams/`, rename `SKILL.md` → `SPECIALTY.md` (4 tasks)
2. **Phase 2: Deployer Source File Renames** — Rename 4 `.ts` files (4 tasks)
3. **Phase 3: Core Type Definitions** — Update `types.ts` central hub (1 task, 7 changes)
4. **Phase 4: Deployer Module Updates** — Update all 15 deployer source files (15 tasks, parallelizable)
5. **Phase 5: Dashboard File Renames** — Rename 3 `.tsx` files (3 tasks)
6. **Phase 6: Dashboard Code Updates** — Update all 10 dashboard files (11 tasks, parallelizable)
7. **Phase 7: JSON Manifest Updates** — Update 8 JSON files (3 tasks)
8. **Phase 8: Documentation Updates** — Update 5 markdown files (5 tasks)
9. **Phase 9: Verification** — tsc, vite build, grep checks (8 tasks)

### Risk Mitigation

- **Types-first approach**: Phase 3 updates `types.ts` before any consumers, so TypeScript will flag any missed references during Phase 4–6
- **Checkpoint builds**: `tsc --noEmit` after Phase 4, `vite build` after Phase 6 — catches errors before proceeding
- **Final grep scan**: T050–T051 scan for any remaining old-terminology references
- **Git safety**: All changes on feature branch, easily revertible with `git checkout main`

### Post-Phase 1 Re-evaluation

Constitution check re-evaluated after design phase: **Still PASS**. No new technologies, patterns, or architectural decisions introduced. Pure mechanical rename.
