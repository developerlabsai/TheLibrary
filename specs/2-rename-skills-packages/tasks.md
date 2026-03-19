# Tasks: Full Rename — Skills → Specialties, Packages → Teams

**Input**: Design documents from `/specs/2-rename-skills-packages/`
**Prerequisites**: spec.md (required)

**Organization**: Tasks are dependency-ordered. Phases must complete in order. Tasks within a phase marked [P] can run in parallel.

## Format: `[ID] [P?] Description`

---

## Phase 1: Directory & File Renames (Filesystem)

**Purpose**: Rename directories and files before updating code references

- [x] T001 Rename `Skills/` directory to `Specialties/`
- [x] T002 Rename `Packages/` directory to `Teams/`
- [x] T003 [P] Rename all 21 `SKILL.md` files to `SPECIALTY.md` inside `Specialties/*/`
- [x] T004 [P] Update headings inside each `SPECIALTY.md`: `# X Skill` → `# X Specialty`, "this skill" → "this specialty", "When invoked, this skill:" → "When invoked, this specialty:"

**Checkpoint**: Directories renamed, SPECIALTY.md files in place

---

## Phase 2: Deployer Source File Renames

**Purpose**: Rename TypeScript source files (creates new files, removes old)

- [x] T005 [P] Rename `deployer/src/deployers/skill-deployer.ts` → `specialty-deployer.ts`
- [x] T006 [P] Rename `deployer/src/wizards/skill-wizard.ts` → `specialty-wizard.ts`
- [x] T007 [P] Rename `deployer/src/wizards/package-wizard.ts` → `team-wizard.ts`
- [x] T008 [P] Rename `deployer/src/registry/package-registry.ts` → `team-registry.ts`

**Checkpoint**: All deployer source files renamed

---

## Phase 3: Core Type Definitions

**Purpose**: Update the central type file — all other code depends on this

- [x] T009 Update `deployer/src/types.ts`:
  - `existingSkills: string[]` → `existingSpecialties: string[]` (ProjectProfile, line 28)
  - `requiredSkills: string[]` → `requiredSpecialties: string[]` (AgentManifest, line 94)
  - `interface SkillInfo` → `interface SpecialtyInfo` (line 103)
  - `interface WorkforcePackage` → `interface WorkforceTeam` (line 114)
  - `skills: string[]` → `specialties: string[]` (WorkforceTeam, line 119)
  - `skills: Record<string, string>` → `specialties: Record<string, string>` (VersionStamp, line 137)
  - `skills?: string[]` → `specialties?: string[]` (DeployOptions, line 147)

**Checkpoint**: Core types renamed — `npx tsc --noEmit` will fail until consumers updated

---

## Phase 4: Deployer Module Updates

**Purpose**: Update all deployer modules to use new types, paths, and identifiers

### Deployers
- [x] T010 Update `deployer/src/deployers/specialty-deployer.ts`: rename `SkillDeployResult` → `SpecialtyDeployResult`, `deploySkills` → `deploySpecialties`, `skillNames` → `specialtyNames`, `skillsLibrary` → `specialtiesLibrary`, `targetSkillsDir` → `targetSpecialtiesDir`, `normalizeSkillName` → `normalizeSpecialtyName`, `listAvailableSkills` → `listAvailableSpecialties`, `getAvailableSkillDirs` → `getAvailableSpecialtyDirs`, path `'Skills'` → `'Specialties'`, all string literals

### Registry
- [x] T011 [P] Update `deployer/src/registry/asset-registry.ts`: rename `getAllSkills` → `getAllSpecialties`, `skillsDir` → `specialtiesDir`, `skills: SkillInfo[]` → `specialties: SpecialtyInfo[]`, `skillMdPath` → `specialtyMdPath`, `hasSkillMd` → `hasSpecialtyMd`, `extractSkillDescription` → `extractSpecialtyDescription`, `getAllPackages` → `getAllTeams`, `packagesDir` → `teamsDir`, `packages: WorkforcePackage[]` → `teams: WorkforceTeam[]`, path `'Skills'` → `'Specialties'`, `'SKILL.md'` → `'SPECIALTY.md'`, `'Packages'` → `'Teams'`, update import

- [x] T012 [P] Update `deployer/src/registry/team-registry.ts`: rename `getPackage` → `getTeam`, `validatePackage` → `validateTeam`, `findSkillDir` → `findSpecialtyDir`, `WorkforcePackage` → `WorkforceTeam`, path `'Packages'` → `'Teams'`, `'Skills'` → `'Specialties'`, all "package"/"Package" strings → "team"/"Team", "Skill" strings → "Specialty"

### Wizards
- [x] T013 [P] Update `deployer/src/wizards/specialty-wizard.ts`: rename `SkillWizardInput` → `SpecialtyWizardInput`, `runSkillWizardCli` → `runSpecialtyWizardCli`, `generateSkill` → `generateSpecialty`, `generateSkillMd` → `generateSpecialtyMd`, `skillDir` → `specialtyDir`, path `'Skills'` → `'Specialties'`, `'SKILL.md'` → `'SPECIALTY.md'`, all "Skill"/"skill" strings → "Specialty"/"specialty"

- [x] T014 [P] Update `deployer/src/wizards/team-wizard.ts`: rename `PackageWizardInput` → `TeamWizardInput`, `runPackageWizardCli` → `runTeamWizardCli`, `generatePackage` → `generateTeam`, `selectedSkills` → `selectedSpecialties`, `skills: string[]` → `specialties: string[]`, `allSkills` → `allSpecialties`, import `getAllSkills` → `getAllSpecialties`, path `'Packages'` → `'Teams'`, all "Package"/"package" → "Team"/"team", "Skill"/"skill" → "Specialty"/"specialty"

- [x] T015 [P] Update `deployer/src/wizards/agent-wizard.ts`: import `getAllSkills` → `getAllSpecialties`, `requiredSkills` → `requiredSpecialties` (field + variable), `availableSkills` → `availableSpecialties`, `skillNames` → `specialtyNames`, `selectedSkillsRaw` → `selectedSpecialtiesRaw`, string `"Required Skills"` → `"Required Specialties"`, `"Select required skills"` → `"Select required specialties"`, `"Skill numbers"` → `"Specialty numbers"`

### Commands
- [x] T016 [P] Update `deployer/src/commands/deploy.ts`: import `deploySkills` → `deploySpecialties` from `specialty-deployer`, `options.skills` → `options.specialties`, `skillsResult` → `specialtiesResult`, string `'Deploying skills...'` → `'Deploying specialties...'`, `'Skills'` label → `'Specialties'`

- [x] T017 [P] Update `deployer/src/commands/list.ts`: import `getAllSkills` → `getAllSpecialties`, `getAllPackages` → `getAllTeams`, `AssetType` union: `'skills'` → `'specialties'`, `'packages'` → `'teams'`, `listSkills` → `listSpecialties`, `listPackages` → `listTeams`, `agent.requiredSkills` → `agent.requiredSpecialties`, all display strings

- [x] T018 [P] Update `deployer/src/commands/bundle.ts`: import `getPackage` → `getTeam`, `validatePackage` → `validateTeam` from `team-registry`, `packageName` → `teamName`, `pkg.skills` → `pkg.specialties`, `options.skills` → `options.specialties`, all "Package"/"package" strings → "Team"/"team", "Skills" → "Specialties"

- [x] T019 [P] Update `deployer/src/commands/dashboard.ts`: import `getAllSkills` → `getAllSpecialties`, `getAllPackages` → `getAllTeams`, rename endpoints `/api/skills` → `/api/specialties`, `/api/packages` → `/api/teams`, `/api/wizards/skill` → `/api/wizards/specialty`, `/api/wizards/package` → `/api/wizards/team`, import `generateSkill` → `generateSpecialty`, `generatePackage` → `generateTeam`, all variable names

### Analyzers & Generators
- [x] T020 [P] Update `deployer/src/analyzers/project-analyzer.ts`: `existingSkills` → `existingSpecialties`, `detectExistingSkills` → `detectExistingSpecialties`, `skillsDir` → `specialtiesDir` (note: `.claude/skills/` target path stays as-is)

- [x] T021 [P] Update `deployer/src/generators/agent-context.ts`: `profile.existingSkills` → `profile.existingSpecialties`, heading `"Existing Skills"` → `"Existing Specialties"`, variable `skill` → `specialty`, path comment `.claude/skills/` stays

- [x] T022 [P] Update `deployer/src/commands/analyze.ts`: `profile.existingSkills` → `profile.existingSpecialties`, string `'Existing skills:'` → `'Existing specialties:'`

### Utils
- [x] T023 [P] Update `deployer/src/utils/version.ts`: `skills` parameter → `specialties` (lines 20, 35)

### CLI Entry Point
- [x] T024 Update `deployer/bin/speckit.ts`: `--skills` → `--specialties`, `opts.skills` → `opts.specialties`, `deploy-skill` → `deploy-specialty`, `create-skill` → `create-specialty`, `bundle <target-path> <package-name>` → `bundle <target-path> <team-name>`, `create-package` → `create-team`, import paths from `skill-deployer` → `specialty-deployer`, `skill-wizard` → `specialty-wizard`, `package-wizard` → `team-wizard`, all description strings

**Checkpoint**: `cd deployer && npx tsc --noEmit` should PASS

---

## Phase 5: Dashboard File Renames

**Purpose**: Rename dashboard page files

- [x] T025 [P] Rename `dashboard/src/pages/CreateSkill.tsx` → `CreateSpecialty.tsx`
- [x] T026 [P] Rename `dashboard/src/pages/CreatePackage.tsx` → `CreateTeam.tsx`
- [x] T027 [P] Rename `dashboard/src/pages/Packages.tsx` → `Teams.tsx`

**Checkpoint**: Dashboard files renamed

---

## Phase 6: Dashboard Code Updates

**Purpose**: Update all dashboard code to use new terminology

- [x] T028 Update `dashboard/src/services/api.ts`: `requiredSkills` → `requiredSpecialties` (Agent), `interface Skill` → `interface Specialty`, `interface WorkforcePackage` → `interface WorkforceTeam`, `skills: string[]` → `specialties: string[]` (WorkforceTeam), `skills: number` → `specialties: number` (Stats), `packages: number` → `teams: number` (Stats), `existingSkills` → `existingSpecialties` (ProjectProfile), `interface SkillWizardInput` → `interface SpecialtyWizardInput`, `interface PackageWizardInput` → `interface TeamWizardInput`, `skills: string[]` → `specialties: string[]` (TeamWizardInput), `getSkills` → `getSpecialties` (endpoint `/specialties`), `getPackages` → `getTeams` (endpoint `/teams`), `createSkill` → `createSpecialty` (endpoint `/wizards/specialty`), `createPackage` → `createTeam` (endpoint `/wizards/team`), deploy options `skills` → `specialties`

- [x] T029 [P] Update `dashboard/src/pages/Assets.tsx`: `type Tab` replace `'skills'` → `'specialties'`, `Skill` import → `Specialty`, `skills` state → `specialties`, `api.getSkills()` → `api.getSpecialties()`, `filteredSkills` → `filteredSpecialties`, `agent.requiredSkills` → `agent.requiredSpecialties`, all UI text, tab labels

- [x] T030 [P] Update `dashboard/src/pages/CreateSpecialty.tsx`: component `CreateSkill` → `CreateSpecialty`, `SkillWizardInput` → `SpecialtyWizardInput`, `api.createSkill` → `api.createSpecialty`, all "Skill"/"skill" UI strings → "Specialty"/"specialty"

- [x] T031 [P] Update `dashboard/src/pages/CreateTeam.tsx`: component `CreatePackage` → `CreateTeam`, `PackageWizardInput` → `TeamWizardInput`, `Skill` type → `Specialty`, `api.createPackage` → `api.createTeam`, `skills`/`selectedSkills` → `specialties`/`selectedSpecialties`, `api.getSkills` → `api.getSpecialties`, all "Package"/"Skills" UI strings → "Team"/"Specialties"

- [x] T032 [P] Update `dashboard/src/pages/Teams.tsx`: component `Packages` → `Teams`, `WorkforcePackage` → `WorkforceTeam`, `api.getPackages` → `api.getTeams`, `packages` state → `teams`, `pkg.skills.length` → `pkg.specialties.length`, all "Packages"/"skills" UI strings → "Teams"/"specialties"

- [x] T033 [P] Update `dashboard/src/pages/CreateAgent.tsx`: `requiredSkills` → `requiredSpecialties` (form field + defaults), label `"Required Skills"` → `"Required Specialties"`, placeholder updates

- [x] T034 [P] Update `dashboard/src/pages/Dashboard.tsx`: StatCard `"Skills"` → `"Specialties"`, `stats?.skills` → `stats?.specialties`, StatCard `"Packages"` → `"Teams"`, `stats?.packages` → `stats?.teams`, action card "Deploy Package" → "Deploy Team", href `/packages` → `/teams`, CLI example `--skills` → `--specialties`

- [x] T035 [P] Update `dashboard/src/pages/Deploy.tsx`: `Skill` import → `Specialty`, `skills`/`setSkills` → `specialties`/`setSpecialties`, `selectedSkills`/`setSelectedSkills` → `selectedSpecialties`/`setSelectedSpecialties`, `api.getSkills()` → `api.getSpecialties()`, `toggleSkill` → `toggleSpecialty`, `skills: selectedSkills` → `specialties: selectedSpecialties`, UI label "Skills" → "Specialties"

- [x] T036 [P] Update `dashboard/src/pages/Projects.tsx`: `profile.existingSkills` → `profile.existingSpecialties`, heading "Existing Skills" → "Existing Specialties"

- [x] T037 Update `dashboard/src/components/Layout.tsx`: nav `'/packages'` label `'Packages'` → `'/teams'` label `'Teams'`, wizard `'/create/skill'` label `'Skill'` → `'/create/specialty'` label `'Specialty'`, wizard `'/create/package'` label `'Package'` → `'/create/team'` label `'Team'`

- [x] T038 Update `dashboard/src/main.tsx`: import `Packages` → `Teams` from `./pages/Teams`, import `CreateSkill` → `CreateSpecialty` from `./pages/CreateSpecialty`, import `CreatePackage` → `CreateTeam` from `./pages/CreateTeam`, route `/packages` → `/teams`, route `/create/skill` → `/create/specialty`, route `/create/package` → `/create/team`

**Checkpoint**: `cd dashboard && npx vite build` should PASS

---

## Phase 7: JSON Manifest & Config Updates

**Purpose**: Update all JSON configuration files

- [x] T039 [P] Update 4 agent manifest.json files: `"requiredSkills"` → `"requiredSpecialties"` in executive-assistant, chief-of-staff, chief-financial-officer, head-of-marketing
- [x] T040 [P] Update 3 team package.json files: `"skills": [...]` → `"specialties": [...]` in Teams/bdr-team, Teams/executive-ops, Teams/engineering-team
- [x] T041 [P] Update `speckit-version.json`: `"skills": {}` → `"specialties": {}`

**Checkpoint**: All JSON manifests use new terminology

---

## Phase 8: Documentation & Workspace Files

**Purpose**: Update all documentation and agent workspace markdown files

- [x] T042 [P] Update `CLAUDE.md`: "Skills, MCP Servers, and Templates" → "Specialties, MCP Servers, and Templates", "`Skills/`, `Packages/`" → "`Specialties/`, `Teams/`", "skills, agents, beads" → "specialties, agents, beads"
- [x] T043 [P] Update `deployer/package.json` description: "Skills" → "Specialties"
- [x] T044 [P] Update `Agents/executive-assistant/TOOLS.md`: "Required Skills" → "Required Specialties"
- [x] T045 [P] Update `Agents/executive-assistant/BOOT.md`: "required skills" → "required specialties"
- [x] T046 [P] Update `Agents/chief-of-staff/TOOLS.md`: "Required Skills" → "Required Specialties"

**Checkpoint**: All documentation updated

---

## Phase 9: Verification

- [x] T047 Run `cd deployer && npx tsc --noEmit` — must pass with zero errors
- [x] T048 Run `cd dashboard && npx vite build` — must succeed
- [x] T049 Run `cd deployer && npx tsx bin/speckit.ts list` — verify output shows "Specialties" and "Teams"
- [x] T050 Grep entire codebase for remaining "skill"/"Skill"/"SKILL" references (excluding `.claude/skills/` target path and node_modules) — must find zero unexpected matches
- [x] T051 Grep entire codebase for remaining workforce "package"/"Package" references (excluding npm package.json filenames and node_modules) — must find zero unexpected matches
- [x] T052 Verify all 21 `SPECIALTY.md` files exist in `Specialties/*/`
- [x] T053 Verify all 3 team manifests have `specialties` field
- [x] T054 Verify all 4 agent manifests have `requiredSpecialties` field

**Checkpoint**: Full verification complete — rename is done
