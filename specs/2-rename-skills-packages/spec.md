# Feature Specification: Full Rename — Skills → Specialties, Packages → Teams

**Feature Branch**: `2-rename-skills-packages`
**Created**: 2026-03-19
**Status**: Draft
**Input**: Rename all references across the Agent Creator codebase from "Skills" to "Specialties" and "Packages" (workforce) to "Teams" to reflect a team-based hierarchy: Teams > Agents > Specialties + Tools.

## Motivation

The current terminology ("Skills" and "Packages") creates confusion:
- "Skills" conflicts with Claude Code's native skill/command system
- "Packages" conflicts with npm package.json convention
- The user's mental model is: **Teams** hire **Agents** who have **Specialties** and use **Tools**

## Clarifications

### Session 2026-03-19

- Q: Should the CLI keep old command names as hidden aliases for backward compatibility? → A: Clean break — old commands stop working immediately. No aliases, no deprecation warnings.

---

## Scope

**FULL RENAME** — every reference in the codebase:
- TypeScript types, interfaces, functions, variables, parameters
- File names, directory names
- API endpoints, CLI commands
- Dashboard UI routes, components, text
- JSON manifest fields
- Documentation

**Migration strategy**: Clean break. Old CLI commands (`deploy-skill`, `create-skill`, `create-package`, `--skills`) are removed with no aliases or deprecation period. This is an internal platform tool with a single operator.

**Exceptions**:
- npm `package.json` files (the filename stays — it's npm convention)
- `.claude/skills/` deployment target path stays (Claude Code convention)
- The `deployer/package.json` file itself stays as package.json

---

## User Scenarios & Testing

### User Story 1 - Consistent Terminology Across CLI (Priority: P1)

A platform operator uses the CLI and sees "Specialties" and "Teams" everywhere — list output, deploy commands, wizard prompts, help text. No more "Skills" or "Packages."

**Acceptance Scenarios**:

1. **Given** the CLI is available, **When** the user runs `speckit list`, **Then** the output shows "Specialties (N):" and "Workforce Teams (N):" headings.
2. **Given** the CLI is available, **When** the user runs `speckit create-specialty`, **Then** the wizard says "Specialty Creation Wizard" and generates files in `Specialties/`.
3. **Given** the CLI is available, **When** the user runs `speckit create-team`, **Then** the wizard says "Workforce Team Creation Wizard" and generates files in `Teams/`.
4. **Given** the CLI is available, **When** the user runs `speckit deploy-specialty /path account-research`, **Then** the specialty deploys from `Specialties/` to `.claude/skills/` in the target.
5. **Given** the CLI is available, **When** the user runs `speckit bundle /path bdr-team`, **Then** it reads from `Teams/bdr-team/package.json` and deploys all specialties listed in the `specialties` field.

---

### User Story 2 - Consistent Terminology Across Dashboard (Priority: P1)

A platform operator browses the dashboard and sees "Specialties" and "Teams" in navigation, page titles, stat cards, asset browser tabs, and wizard forms.

**Acceptance Scenarios**:

1. **Given** the dashboard is running, **When** the user views the sidebar, **Then** they see "Teams" nav item (not "Packages") and "Specialty" wizard link (not "Skill").
2. **Given** the dashboard is running, **When** the user opens the Assets page, **Then** the tabs show "agents | specialties | templates" (not "skills").
3. **Given** the dashboard is running, **When** the user opens the Teams page, **Then** the title shows "Workforce Teams" and each team shows "N specialties" (not "skills").
4. **Given** the dashboard is running, **When** the user fills the Specialty Creation wizard, **Then** all labels say "Specialty" and it calls `/api/wizards/specialty`.

---

### User Story 3 - Type Safety After Rename (Priority: P1)

All TypeScript types, interfaces, and function signatures use the new terminology and the codebase compiles cleanly.

**Acceptance Scenarios**:

1. **Given** all renames are applied, **When** `npx tsc --noEmit` runs in the deployer, **Then** it passes with zero errors.
2. **Given** all renames are applied, **When** `npx vite build` runs in the dashboard, **Then** it completes successfully.
3. **Given** a new agent is created via wizard, **When** the manifest is generated, **Then** it has `requiredSpecialties` (not `requiredSkills`).

---

## Data Model Changes

### Renamed Types

| Old | New |
|-----|-----|
| `SkillInfo` | `SpecialtyInfo` |
| `WorkforcePackage` | `WorkforceTeam` |
| `SkillWizardInput` | `SpecialtyWizardInput` |
| `PackageWizardInput` | `TeamWizardInput` |
| `SkillDeployResult` | `SpecialtyDeployResult` |

### Renamed Fields

| Interface | Old Field | New Field |
|-----------|-----------|-----------|
| `ProjectProfile` | `existingSkills` | `existingSpecialties` |
| `AgentManifest` | `requiredSkills` | `requiredSpecialties` |
| `WorkforceTeam` | `skills` | `specialties` |
| `VersionStamp.components` | `skills` | `specialties` |
| `DeployOptions` | `skills` | `specialties` |
| `Stats` | `skills` / `packages` | `specialties` / `teams` |
| Agent (dashboard) | `requiredSkills` | `requiredSpecialties` |

### Renamed API Endpoints

| Old | New |
|-----|-----|
| `GET /api/skills` | `GET /api/specialties` |
| `GET /api/packages` | `GET /api/teams` |
| `POST /api/wizards/skill` | `POST /api/wizards/specialty` |
| `POST /api/wizards/package` | `POST /api/wizards/team` |

### Renamed CLI Commands

| Old | New |
|-----|-----|
| `deploy-skill` | `deploy-specialty` |
| `create-skill` | `create-specialty` |
| `create-package` | `create-team` |
| `--skills` flag | `--specialties` flag |
| `list` type `skills` | `list` type `specialties` |
| `list` type `packages` | `list` type `teams` |

### Renamed Dashboard Routes

| Old | New |
|-----|-----|
| `/packages` | `/teams` |
| `/create/skill` | `/create/specialty` |
| `/create/package` | `/create/team` |

---

## File Inventory (Complete Audit)

### Directories to Rename
- `Skills/` → `Specialties/`
- `Packages/` → `Teams/`

### Source Files to Rename
- `deployer/src/deployers/skill-deployer.ts` → `specialty-deployer.ts`
- `deployer/src/wizards/skill-wizard.ts` → `specialty-wizard.ts`
- `deployer/src/wizards/package-wizard.ts` → `team-wizard.ts`
- `deployer/src/registry/package-registry.ts` → `team-registry.ts`
- `dashboard/src/pages/CreateSkill.tsx` → `CreateSpecialty.tsx`
- `dashboard/src/pages/CreatePackage.tsx` → `CreateTeam.tsx`
- `dashboard/src/pages/Packages.tsx` → `Teams.tsx`

### Content Files to Rename (inside Specialties/)
- All 21 `SKILL.md` → `SPECIALTY.md` (with heading updates)

### Files Requiring Code Changes (31 files total)

**Deployer — Types & Core (3 files)**:
- `deployer/src/types.ts` — 7 field/type renames
- `deployer/src/utils/version.ts` — lines 20, 35
- `deployer/package.json` — description field

**Deployer — Deployers (1 file after rename)**:
- `deployer/src/deployers/specialty-deployer.ts` — full rewrite of identifiers

**Deployer — Registry (2 files)**:
- `deployer/src/registry/asset-registry.ts` — getAllSkills→getAllSpecialties, getAllPackages→getAllTeams, path strings
- `deployer/src/registry/team-registry.ts` — getPackage→getTeam, validatePackage→validateTeam, path strings

**Deployer — Wizards (3 files)**:
- `deployer/src/wizards/specialty-wizard.ts` — full rewrite of identifiers
- `deployer/src/wizards/team-wizard.ts` — full rewrite of identifiers
- `deployer/src/wizards/agent-wizard.ts` — import, requiredSkills field, UI strings

**Deployer — Commands (4 files)**:
- `deployer/src/commands/deploy.ts` — import path, options.skills, strings
- `deployer/src/commands/list.ts` — AssetType, function names, imports, strings
- `deployer/src/commands/bundle.ts` — imports, parameter name, strings
- `deployer/src/commands/dashboard.ts` — imports, endpoints, variable names

**Deployer — Analyzers & Generators (2 files)**:
- `deployer/src/analyzers/project-analyzer.ts` — existingSkills, detectExistingSkills
- `deployer/src/generators/agent-context.ts` — existingSkills, heading, path reference

**Deployer — CLI (1 file)**:
- `deployer/bin/speckit.ts` — flags, commands, imports, descriptions

**Dashboard — Services (1 file)**:
- `dashboard/src/services/api.ts` — all interfaces, api methods, types

**Dashboard — Pages (7 files)**:
- `dashboard/src/pages/Assets.tsx` — Tab type, state, imports, UI text
- `dashboard/src/pages/CreateSpecialty.tsx` — component name, imports, strings
- `dashboard/src/pages/CreateTeam.tsx` — component name, imports, strings
- `dashboard/src/pages/CreateAgent.tsx` — requiredSkills field, label
- `dashboard/src/pages/Teams.tsx` — component name, imports, state, strings
- `dashboard/src/pages/Dashboard.tsx` — stat cards, action cards, CLI example
- `dashboard/src/pages/Deploy.tsx` — type import, state, toggle function, strings
- `dashboard/src/pages/Projects.tsx` — existingSkills references

**Dashboard — Layout & Routing (2 files)**:
- `dashboard/src/components/Layout.tsx` — nav labels, route paths
- `dashboard/src/main.tsx` — imports, routes

**JSON Manifests (8 files)**:
- 4 agent manifest.json files — `requiredSkills` → `requiredSpecialties`
- 3 team package.json files — `skills` → `specialties`
- `speckit-version.json` — `skills` → `specialties`

**Agent Workspace Files (4+ files)**:
- `Agents/executive-assistant/TOOLS.md` — "Required Skills" heading
- `Agents/executive-assistant/BOOT.md` — "required skills" text
- `Agents/chief-of-staff/TOOLS.md` — "Required Skills" heading
- (CFO and Marketing agents once created)

**Documentation (2 files)**:
- `CLAUDE.md` — directory references, terminology
- `deployer/src/commands/analyze.ts` — existingSkills console output

---

## Success Criteria

1. `cd deployer && npx tsc --noEmit` passes with zero errors
2. `cd dashboard && npx vite build` succeeds
3. `speckit list` shows "Specialties" and "Teams" labels
4. No remaining "skill"/"Skill"/"SKILL" references except `.claude/skills/` target path
5. No remaining workforce "package"/"Package" references except npm package.json filenames
6. All 21 `SPECIALTY.md` files exist in `Specialties/`
7. All 3 team manifests have `specialties` field
8. All 4 agent manifests have `requiredSpecialties` field
