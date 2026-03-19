# Tasks: TheLibrary SpecKit Deployer Platform

**Input**: Design documents from `/specs/1-speckit-deployer-platform/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/dashboard-api.md, quickstart.md

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Deployer CLI**: `deployer/src/`, `deployer/bin/`
- **Dashboard**: `dashboard/src/`
- **Library**: `library/`
- **Assets**: `Agents/`, `Skills/`, `Templates/`, `Packages/`, `MCP-Servers/`, `Features/`
- **Technical Docs (HTML)**: `references/technical docs/` (per project, human-readable)
- **Knowledgebase (MD)**: `references/knowledgebase/` (per project, Claude Code navigable)

## Glossary

- **Workforce Package** (entity): A named bundle of agents, skills, and templates
- **bundle** (CLI command): The action of deploying a workforce package into a target project
- **create-package** (CLI command): The wizard that creates a new workforce package definition

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both projects and create shared type definitions

- [X] T001 Create deployer/ directory with package.json (commander, chalk, fs-extra, express, cors, tsx, typescript dependencies) and tsconfig.json (ES2022 target, ESNext modules) per deployer/package.json
- [X] T002 Create library/ directory structure with speckit/scripts/bash/, speckit/templates/, speckit/memory/, speckit/references/, constitutions/, and security/ per library/
- [X] T003 [P] Define core TypeScript types (ProjectProfile, Agent, Skill, McpServer, WorkforcePackage, FeatureSpec, ConstitutionProfile, DeployOptions, DeployResult) in deployer/src/types.ts
- [X] T004 [P] Implement safe file operations (writeFileSafe, mergeJsonFile, copyDirectorySafe, fileExists, ensureDir) in deployer/src/utils/file-ops.ts
- [X] T005 [P] Implement version stamping (readVersion, writeVersion, compareVersions) in deployer/src/utils/version.ts

**Checkpoint**: Project skeleton ready - both deployer and library have base structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract canonical source files from SLACK reference, build core infrastructure, all asset deployers, and QA framework that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Extract the 20-principle constitution (v3.5.0, 689 lines) from SLACK - Create Lists project into library/speckit/memory/constitution-base.md
- [X] T007 [P] Extract all 9 bash scripts (common.sh, create-new-feature.sh, setup-plan.sh, sync-beads.sh, check-prerequisites.sh, update-agent-context.sh, archive-completed-feature.sh, qa-parse-spec.sh, qa-run-tests.sh) from SLACK into library/speckit/scripts/bash/
- [X] T008 [P] Extract all 5 templates (spec-template.md, plan-template.md, tasks-template.md, checklist-template.md, ux-review-template.md) from SLACK into library/speckit/templates/
- [X] T009 [P] Extract UX reference files from SLACK into library/speckit/references/
- [X] T010 Create 6 constitution profile JSONs (web-app-typescript, web-app-python, slack-bot, api-service, cli-tool, minimal) with principle applicability overrides in library/constitutions/
- [X] T011 [P] Create 3 security baseline documents (dual-secret-policy.md, permission-boundaries.md, security-baseline.md) extracted from NemoClaw/PopeBot patterns in library/security/
- [X] T012 [P] Create qa-areas-template.yml in library/speckit/ with blank functional area structure (areas with description and empty specs arrays, priority_order list, usage instructions for /qa.run --spec, --area, --all, --failed) that gets deployed as .specify/qa-areas.yml in target projects
- [X] T013 Build project analyzer detecting language (TypeScript, Python, Go, Rust, Ruby, Java), framework (10+ frameworks including Next.js, Express, React, Django, FastAPI, Flask, Gin, Actix, Rails, Spring), test framework, database, CI/CD, and existing SpecKit/Beads/Claude installations in deployer/src/analyzers/project-analyzer.ts
- [X] T014 Build asset registry that scans Agents/, Skills/, Templates/, Packages/ directories and returns typed asset lists in deployer/src/registry/asset-registry.ts
- [X] T015 [P] Add manifest.json with name, displayName, version, description, requiredSkills, tags fields to each of the 4 agents (executive-assistant, chief-of-staff, head-of-marketing, chief-financial-officer) in Agents/
- [X] T016 Build interactive CLI prompt engine with ask(), confirm(), select(), multiSelect(), multiLine() functions wrapping readline in deployer/src/wizards/prompt-engine.ts
- [X] T017 [P] Build skill deployer that copies SKILL.md + reference/ + commands/ into target .claude/skills/{name}/, skipping existing skills unless --force in deployer/src/deployers/skill-deployer.ts
- [X] T018 [P] Build agent deployer that copies Agents.md, CLAUDE.md, MEMORY.md, manifest.json, Context/ into target Agents/{name}/, skipping existing agents in deployer/src/deployers/agent-deployer.ts
- [X] T019 [P] Build template deployer that copies HTML templates into target Templates/ directory in deployer/src/deployers/template-deployer.ts
- [X] T020 [P] Build MCP deployer that deploys MCP server project into target, first checking for shared .mcp-infra/ (install if missing, version-check if present) in deployer/src/deployers/mcp-deployer.ts

**Checkpoint**: Foundation ready - library extracted (incl. QA framework), analyzer works, registry scans assets, all asset deployers available, all user story implementation can begin

---

## Phase 3: User Story 1 - Deploy SpecKit Into a New Project (Priority: P1) MVP

**Goal**: A developer can deploy the full SpecKit + Beads governance structure into any project directory with a single command, with merge-safe handling for existing projects

**Independent Test**: Run `speckit deploy /tmp/test-deploy --profile web-app-typescript --security` and verify .specify/ (9 scripts, 5 templates, constitution, agent-context, qa-areas.yml), .beads/ (task-mapping.json), .claude/settings.local.json, .specify/security/ (3 docs), specs/, and speckit-version.json are all created correctly

### Implementation for User Story 1

- [X] T021 [US1] Build constitution adaptation engine that merges base constitution with profile overrides, marking principles as PASS/N/A per profile in deployer/src/generators/constitution.ts
- [X] T022 [P] [US1] Build agent-context generator that produces agent-context-claude.md from ProjectProfile analysis (tech stack, project structure, key files, development workflow) in deployer/src/generators/agent-context.ts
- [X] T023 [P] [US1] Build settings.local.json generator with additive merge strategy (add new SpecKit permissions, never remove existing user permissions) in deployer/src/generators/settings-generator.ts
- [X] T024 [US1] Build SpecKit deployer that creates .specify/ with scripts/bash/ (9 scripts), templates/ (5 templates), memory/constitution.md, memory/agent-context-claude.md, references/, .current-feature, and qa-areas.yml (from template) in deployer/src/deployers/speckit-deployer.ts
- [X] T025 [P] [US1] Build Beads deployer that creates .beads/task-mapping.json (skip if .beads/ already exists) in deployer/src/deployers/beads-deployer.ts
- [X] T026 [P] [US1] Build security deployer that copies 3 security docs into .specify/security/ when --security flag is set in deployer/src/deployers/security-deployer.ts
- [X] T027 [US1] Implement constitution merge-or-skip detection: when target project has existing constitution.md, skip overwrite and log a message suggesting manual diff review; never silently replace customized constitutions in deployer/src/deployers/speckit-deployer.ts
- [X] T028 [US1] Build deploy command orchestrator implementing 11-step flow (analyze, adapt constitution, deploy speckit incl. qa-areas.yml, deploy beads, merge settings, deploy skills via skill-deployer, deploy agents via agent-deployer, deploy templates via template-deployer, deploy security, stamp version, report) using asset deployers from Phase 2 in deployer/src/commands/deploy.ts
- [X] T029 [P] [US1] Build standalone analyze command that outputs ProjectProfile (language, framework, existing configs, suggested profile) in deployer/src/commands/analyze.ts
- [X] T030 [P] [US1] Build list command supporting `list all`, `list agents`, `list skills`, `list templates`, `list packages`, `list profiles` subcommands in deployer/src/commands/list.ts
- [X] T031 [US1] Wire CLI entry point with commander.js registering deploy, analyze, scaffold, list commands with options (--profile, --security, --dry-run, --force) in deployer/bin/speckit.ts

**Checkpoint**: Core deployment works end-to-end. `speckit deploy` installs full SpecKit + Beads + QA framework into any project using asset deployers from Phase 2. `speckit analyze` reports project profile. `speckit list` shows all assets.

---

## Phase 4: User Story 2 - Create Agents, Skills, and MCP Servers via Wizards (Priority: P1)

**Goal**: Platform operators can create new agents, skills, and MCP server definitions through interactive CLI wizards that generate all necessary files in the correct library locations

**Independent Test**: Run `speckit create-agent`, `speckit create-skill`, `speckit create-mcp` and verify generated files match expected format (Agents.md + manifest.json for agents, SKILL.md for skills, complete TypeScript project for MCP servers)

### Implementation for User Story 2

- [X] T032 [P] [US2] Build agent wizard with run*WizardCli() for interactive CLI and generateAgent() for API mode, collecting name, displayName, purpose, responsibilities, principles, tone, skills, tags, personalization, standing instructions; validate output: Agents.md, CLAUDE.md, MEMORY.md, manifest.json all present and well-formed in Agents/{name}/ via deployer/src/wizards/agent-wizard.ts
- [X] T033 [P] [US2] Build skill wizard with run*WizardCli() and generateSkill() collecting name, description, invocation command/args, output format, design system toggle, MCP dependencies, sections, steps; validate output: SKILL.md present with all required sections in Skills/{displayName}/ via deployer/src/wizards/skill-wizard.ts
- [X] T034 [US2] Create 7 MCP infrastructure modules (rate-limiter.ts, retry-handler.ts, cache-layer.ts, request-queue.ts, circuit-breaker.ts, error-normalizer.ts, request-logger.ts) plus index.ts in library/mcp-templates/infrastructure/
- [X] T035 [US2] Build MCP wizard with run*WizardCli() and generateMcp() collecting API config (name, URL, auth type, rate limits, pagination, cache TTL, retry config, transport) and endpoints; validate input: burstLimit must be <= requestsPerMinute (warn if violated); validate output: all 7 infrastructure components present in generated project in MCP-Servers/{name}/ via deployer/src/wizards/mcp-wizard.ts
- [X] T036 [P] [US2] Build feature wizard with run*WizardCli() and generateFeature() collecting feature name, number, description, user stories with acceptance criteria, requirements, edge cases, success criteria, open questions; validate output: spec.md matches .specify/templates/spec-template.md structure and plan.md includes constitution check placeholder in Features/{branchName}/ via deployer/src/wizards/feature-wizard.ts
- [X] T037 [P] [US2] Build package wizard with run*WizardCli() and generatePackage() collecting name, description, agent/skill/template selections from registry, constitution profile, security toggle; validate output: all referenced assets exist in library (warn on missing references) in Packages/{name}/ via deployer/src/wizards/package-wizard.ts
- [X] T038 [US2] Wire 5 wizard CLI commands (create-agent, create-skill, create-mcp, create-feature, create-package) into deployer/bin/speckit.ts

**Checkpoint**: All 5 creation wizards work via CLI. Each generates correct file structure with output format validation. MCP wizard validates input constraints. All wizards produce valid, well-formed output per SC-004.

---

## Phase 5: User Story 3 - Deploy Workforce Packages (Priority: P2)

**Goal**: Team leads can deploy pre-configured bundles of agents, skills, and templates into a project with a single command

**Independent Test**: Run `speckit bundle /tmp/test-deploy bdr-team` and verify 2 agents, 10 skills, 3 templates from the bdr-team package definition are deployed, with clear reporting of deployed vs skipped assets

### Implementation for User Story 3

- [X] T039 [P] [US3] Create bdr-team workforce package definition (2 agents: executive-assistant, chief-of-staff; 10 skills: account-research, call-prep, outbound-personalization, etc.; 3 templates) in Packages/bdr-team/package.json
- [X] T040 [P] [US3] Create executive-ops workforce package definition in Packages/executive-ops/package.json
- [X] T041 [P] [US3] Create engineering-team workforce package definition in Packages/engineering-team/package.json
- [X] T042 [US3] Build package registry that validates package definitions (all referenced agents/skills/templates exist in library, warn and skip missing assets rather than failing the entire package) in deployer/src/registry/package-registry.ts
- [X] T043 [US3] Build bundle command that reads package definition, resolves all asset references, calls individual deployers from Phase 2 (skill-deployer, agent-deployer, template-deployer), and reports deployed/skipped counts in deployer/src/commands/bundle.ts
- [X] T044 [US3] Wire deploy-skill, deploy-agent, deploy-mcp, bundle commands into deployer/bin/speckit.ts

**Checkpoint**: `speckit bundle /path bdr-team` deploys all package assets using deployers from Phase 2. Individual asset commands (deploy-skill, deploy-agent, deploy-mcp) also work standalone.

---

## Phase 6: User Story 4 - Browse and Manage via Web Dashboard (Priority: P2)

**Goal**: Platform administrators can visually browse all agents, skills, templates, and packages, deploy assets, and create new assets through a web interface

**Independent Test**: Launch `speckit dashboard`, navigate to all 10 pages, verify data loads correctly. Hit `curl http://localhost:3847/api/stats` and verify `{"agents":4,"skills":21,"templates":10,"packages":3,"profiles":6}`

### Implementation for User Story 4

- [X] T045 [US4] Initialize dashboard/ as Vite 6 + React 19 + TypeScript project with Tailwind CSS, react-router-dom in dashboard/package.json and dashboard/vite.config.ts
- [X] T046 [US4] Build Layout component with dark-themed sidebar navigation (Dashboard, Assets, Deploy, Packages, Projects sections + 5 wizard links) and main content area in dashboard/src/components/Layout.tsx
- [X] T047 [US4] Build API client service with typed methods for all 13 endpoints (getAgents, getSkills, getTemplates, getPackages, getProfiles, getStats, analyzeProject, deployProject, and 5 wizard endpoints) in dashboard/src/services/api.ts
- [X] T048 [US4] Build Dashboard page showing stats cards (agents, skills, templates, packages, profiles counts) from GET /api/stats in dashboard/src/pages/Dashboard.tsx
- [X] T049 [P] [US4] Build Assets page with tabbed browser for agents, skills, templates with search/filter, detail cards showing tags, version, description in dashboard/src/pages/Assets.tsx
- [X] T050 [P] [US4] Build Deploy page with 4-step wizard (enter target path, analyze project, select profile/assets, deploy) using POST /api/analyze and POST /api/deploy in dashboard/src/pages/Deploy.tsx
- [X] T051 [P] [US4] Build Packages page with package cards showing agent/skill/template counts and one-click deploy in dashboard/src/pages/Packages.tsx
- [X] T052 [P] [US4] Build Projects page with target path input, analyzer results display, and suggested profile in dashboard/src/pages/Projects.tsx
- [X] T053 [US4] Build 5 wizard form pages (CreateAgent, CreateSkill, CreateMcp, CreateFeature, CreatePackage) each posting to respective POST /api/wizards/* endpoint in dashboard/src/pages/Create*.tsx
- [X] T054 [US4] Build Express dashboard server on port 3847 with CORS, 6 GET asset endpoints, 2 POST operation endpoints, 5 POST wizard endpoints (importing wizard generate*() functions directly), error handling middleware that validates required fields on all POST requests and returns structured JSON errors `{"error": "message"}` with 400 status for invalid input, and static file serving in deployer/src/commands/dashboard.ts
- [X] T055 [US4] Configure React Router with 10 routes (/, /assets, /deploy, /packages, /projects, /create/agent, /create/skill, /create/mcp, /create/feature, /create/package) in dashboard/src/main.tsx

**Checkpoint**: Dashboard launches on port 3847. All 10 pages load. API returns correct data. Wizard forms submit successfully. Invalid input returns 400 with clear error messages.

---

## Phase 7: User Story 5 - Create Feature Specs for Target Projects (Priority: P3)

**Goal**: Product managers can define feature specifications (spec.md + plan.md) in TheLibrary that can later be deployed into target project specs/ directories for local SpecKit workflow execution

**Independent Test**: Run `speckit create-feature`, fill in the wizard, verify spec.md follows SpecKit spec template format and plan.md includes constitution check placeholder in Features/{branchName}/

### Implementation for User Story 5

- [X] T056 [US5] Validate feature wizard (T036) generates spec.md matching .specify/templates/spec-template.md structure (User Scenarios, Requirements, Success Criteria, Edge Cases sections) in deployer/src/wizards/feature-wizard.ts
- [X] T057 [US5] Validate feature wizard generates plan.md with Technical Context placeholder, Constitution Check table placeholder, and Phase stubs in deployer/src/wizards/feature-wizard.ts
- [X] T058 [US5] Implement feature spec deployment command that copies Features/{name}/spec.md and plan.md into target project specs/{name}/ directory via the deploy command's --features option in deployer/src/commands/deploy.ts

**Checkpoint**: Feature specs are created in Features/ and can be deployed into target projects where the full SpecKit workflow (clarify, plan, tasks, implement) runs locally.

---

## Phase 8: Technical Documentation Generation

**Purpose**: Generate comprehensive technical documentation after every SpecKit workflow completes, for both the deployer and target applications. HTML docs go to `references/technical docs/` for human consumption; .md docs go to `references/knowledgebase/` for Claude Code navigation.

- [X] T059 [P] Build technical documentation HTML generator that reads spec.md, plan.md, tasks.md, data-model.md, and contracts/ from a feature directory and produces a comprehensive HTML technical document using Templates/template-technical-docs.html as the design reference (Dev Labs design system, sidebar navigation, cover page, numbered sections), outputting to `references/technical docs/{feature-name}.html` in deployer/src/generators/technical-docs-generator.ts
- [X] T060 [P] Build companion .md knowledgebase generator that produces a markdown version of the same content with a table of contents at the top, each TOC entry linking to the section and including line number ranges (e.g., `## Architecture [L42-L89]`) so Claude Code can efficiently locate and navigate specific sections, outputting to `references/knowledgebase/{feature-name}.md` in deployer/src/generators/technical-docs-md-generator.ts
- [X] T061 Add `generate-docs` CLI command that runs both generators (HTML to `references/technical docs/` + .md to `references/knowledgebase/`) for the current feature; wire into deployer/bin/speckit.ts
- [X] T062 Integrate documentation generation as the final step of the SpecKit workflow: after /speckit.tasks completes (or after /speckit.implement completes), automatically trigger generate-docs to produce both HTML and .md documentation for the feature in deployer/src/commands/deploy.ts

**Checkpoint**: Running `speckit generate-docs` produces HTML (styled per Dev Labs design system) at `references/technical docs/` and .md (with line-number TOC) at `references/knowledgebase/`. The workflow auto-generates docs at completion.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, type safety, performance verification, and end-to-end validation

- [X] T063 Build scaffold command that creates a new project directory with git init, a language-appropriate package manifest (package.json for Node.js, requirements.txt for Python, go.mod for Go, Cargo.toml for Rust based on --language flag or detection), a recommended src/ directory structure, and a pre-installed SpecKit deployment using the specified or detected constitution profile in deployer/src/commands/scaffold.ts
- [X] T064 [P] Add --dry-run support to deploy command showing what would be created/modified without writing files in deployer/src/commands/deploy.ts
- [X] T065 Add colored terminal output with chalk (green=created, yellow=skipped, red=error, blue=info) across all CLI commands in deployer/src/utils/ and deployer/src/commands/
- [X] T066 Run deployer type-check `cd deployer && npx tsc --noEmit` - must produce zero errors
- [X] T067 Run dashboard type-check `cd dashboard && npx tsc --noEmit` - must produce zero errors
- [X] T068 Run dashboard production build `cd dashboard && npx vite build` - must complete successfully
- [X] T069 Execute all 12 quickstart.md verification steps end-to-end (CLI startup, asset registry, project analysis, deploy blank, deploy existing, wizard create-agent, wizard create-mcp, bundle deploy, dashboard launch, dashboard API, type safety, dashboard build)
- [X] T070 Performance verification: time `speckit deploy` against empty directory and verify completion under 30 seconds (SC-001); time `curl http://localhost:3847/api/stats` and verify response under 2 seconds (SC-007)
- [X] T071 Generate technical documentation for TheLibrary SpecKit Deployer Platform itself: run `speckit generate-docs` against specs/1-speckit-deployer-platform/ to produce HTML at references/technical docs/ and .md at references/knowledgebase/ for this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories. Includes all asset deployers and QA framework template.
- **US1 (Phase 3)**: Depends on Foundational (Phase 2). Uses asset deployers from Phase 2. Deploys qa-areas.yml. **This is the MVP.**
- **US2 (Phase 4)**: Depends on Foundational (Phase 2). Can run in parallel with US1.
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) for asset deployers and US1 for deploy infrastructure pattern.
- **US4 (Phase 6)**: Depends on US1 (API serves deploy logic) and US2 (API wraps wizard generate functions).
- **US5 (Phase 7)**: Depends on US2 (feature wizard built in Phase 4).
- **Tech Docs (Phase 8)**: Can start after Phase 2 (needs types and file-ops). Independent of user stories.
- **Polish (Phase 9)**: Depends on all desired user stories and tech docs being complete.

### User Story Dependencies

- **US1 - Deploy SpecKit (P1)**: Can start after Foundational (Phase 2). Uses deployers built in Phase 2. No dependencies on other stories.
- **US2 - Creation Wizards (P1)**: Can start after Foundational (Phase 2). Independent of US1 except prompt-engine (Phase 2).
- **US3 - Workforce Packages (P2)**: Uses asset deployers from Phase 2 directly. Depends on US1 for the deploy command pattern.
- **US4 - Web Dashboard (P2)**: Depends on US1 (Express API) and US2 (wizard generate* functions).
- **US5 - Feature Specs (P3)**: Depends on US2 (feature wizard). Lightweight validation and deployment glue.

### Within Each User Story

- Generators before deployers (constitution engine -> speckit deployer)
- Deployers before commands (speckit-deployer -> deploy command)
- Commands before CLI wiring (deploy command -> bin/speckit.ts)
- Infrastructure modules before wizard that uses them (mcp-templates/infrastructure -> mcp-wizard)
- Package definitions before bundle command (package.json -> bundle)
- API service before pages (api.ts -> Dashboard.tsx)
- Layout before pages (Layout.tsx -> page components)
- HTML generator before .md generator (shared content extraction logic)

### Parallel Opportunities

**Phase 1**: T003, T004, T005 can all run in parallel (independent files)
**Phase 2**: T007, T008, T009, T011, T012 (file extractions/QA template); T013, T014, T015, T016, T017, T018, T019, T020 (independent modules)
**Phase 3**: T022, T023 (generators); T025, T026 (deployers); T029, T030 (commands)
**Phase 4**: T032, T033, T036, T037 (independent wizards)
**Phase 5**: T039, T040, T041 (package definitions)
**Phase 6**: T049, T050, T051, T052 (independent pages)
**Phase 8**: T059, T060 (independent generators)
**Phase 9**: T063, T064 (independent polish tasks)

**Cross-story parallelism**: US1 and US2 can be developed simultaneously after Phase 2. US3 can start as soon as Phase 2 is complete. Phase 8 (Tech Docs) can be built in parallel with US3-US5.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T020) - CRITICAL, blocks all stories, includes asset deployers + QA framework
3. Complete Phase 3: User Story 1 (T021-T031)
4. **STOP and VALIDATE**: Run quickstart steps 1-5 (CLI startup, asset registry, project analysis, deploy blank, deploy existing)
5. Deploy/demo: `speckit deploy /tmp/test --profile web-app-typescript --security`

### Incremental Delivery

1. Setup + Foundational -> Foundation ready (all deployers + QA framework available)
2. Add US1 (Deploy SpecKit) -> **MVP!** Core deployment works end-to-end with QA framework
3. Add US2 (Creation Wizards) -> Platform is self-service for asset creation
4. Add US3 (Workforce Packages) -> One-command team provisioning
5. Add US4 (Web Dashboard) -> Visual interface for non-CLI users
6. Add US5 (Feature Specs) -> Full workflow support for target projects
7. Add Tech Docs (Phase 8) -> Automated documentation generation (HTML + knowledgebase)
8. Polish -> Type safety, builds, performance verification, self-documentation

### Task Summary

| Phase | Story | Tasks | Parallel |
|-------|-------|-------|----------|
| Phase 1: Setup | - | 5 | 3 |
| Phase 2: Foundational | - | 15 | 11 |
| Phase 3: US1 Deploy | P1 | 11 | 5 |
| Phase 4: US2 Wizards | P1 | 7 | 4 |
| Phase 5: US3 Packages | P2 | 6 | 3 |
| Phase 6: US4 Dashboard | P2 | 11 | 4 |
| Phase 7: US5 Features | P3 | 3 | 0 |
| Phase 8: Tech Docs | - | 4 | 2 |
| Phase 9: Polish | - | 9 | 2 |
| **Total** | | **71** | **34** |
