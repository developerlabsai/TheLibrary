# Feature Specification: TheLibrary SpecKit Deployer Platform

**Feature Branch**: `1-speckit-deployer-platform`
**Created**: 2026-03-19
**Status**: Draft
**Input**: TheLibrary SpecKit Deployer Platform - A deployment platform that uniformly installs SpecKit, Beads, Agents, Skills, MCP Servers, Templates, and Workforce Packages into any target project with CLI, Dashboard, and Creation Wizards.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Deploy SpecKit Into a New Project (Priority: P1)

A developer wants to set up a new project with the same governance structure, scripts, templates, and workflows that every other project in the organization uses. They point the deployer at their project directory and the system analyzes it, adapts a constitution to the project type, and deploys the full SpecKit + Beads structure uniformly.

**Why this priority**: This is the core value proposition. Without uniform deployment, every project diverges and there is no standard. This must work before anything else matters.

**Independent Test**: Can be fully tested by running the deploy command against an empty directory and verifying the output structure matches the reference project (SLACK - Create Lists).

**Acceptance Scenarios**:

1. **Given** a new project directory with no SpecKit installed, **When** the user runs `speckit deploy /path/to/project`, **Then** the system creates `.specify/`, `.beads/`, `.claude/`, and `specs/` directories with all scripts, templates, constitution, and agent context.
2. **Given** a TypeScript/Node.js project, **When** the analyzer runs, **Then** it detects the language, framework, and suggests the `web-app-typescript` constitution profile.
3. **Given** a project with an existing `.claude/settings.local.json`, **When** deploying, **Then** the system merges new SpecKit permissions into the existing file without removing any existing permissions.
4. **Given** a project with SpecKit already installed, **When** the user runs deploy, **Then** the system detects the existing installation and skips files that already exist, offering updates only for newer versions.

---

### User Story 2 - Create Agents, Skills, and MCP Servers via Wizards (Priority: P1)

A platform operator needs to create new agents, skills, or MCP server definitions to add to the library. They launch a creation wizard (via CLI or dashboard) that walks them through defining the asset step by step, then generates all the necessary files in the correct library location.

**Why this priority**: The library must grow. Without creation tools, every new agent, skill, or MCP server requires manual file authoring and format knowledge. Wizards make the platform self-service.

**Independent Test**: Can be tested by running each wizard (create-agent, create-skill, create-mcp, create-feature, create-package) and verifying the generated files match the expected format and directory structure.

**Acceptance Scenarios**:

1. **Given** the CLI is available, **When** the user runs `speckit create-agent`, **Then** the system walks through name, purpose, responsibilities, principles, tone, skills, tags, and generates `Agents.md`, `CLAUDE.md`, `MEMORY.md`, and `manifest.json` in the correct Agents directory.
2. **Given** the CLI is available, **When** the user runs `speckit create-mcp`, **Then** the system collects API configuration, auth type, rate limits, pagination, cache TTL, retry config, transport type, and endpoints, then generates a complete MCP server project with built-in rate limiting, exponential backoff, caching, circuit breaker, and request queue infrastructure.
3. **Given** the dashboard is running, **When** the user fills out the Agent Creation form and submits, **Then** the same files are generated as the CLI wizard and the dashboard shows a success message with the output directory.
4. **Given** the user creates an MCP server, **When** the generated server is deployed into a project, **Then** it shares the common `.mcp-infra/` infrastructure layer with any other MCP servers in that project.

---

### User Story 3 - Deploy Workforce Packages (Priority: P2)

A team lead wants to deploy a pre-configured bundle of agents, skills, and templates into a project for a specific use case (e.g., sales BDR team, executive operations, engineering team). They select a workforce package and the deployer installs everything the team needs in one command.

**Why this priority**: Packages enable one-command team provisioning. This builds on top of individual asset deployment (P1) and is the key scaling mechanism for organizational adoption.

**Independent Test**: Can be tested by running `speckit bundle /path/to/project bdr-team` and verifying all agents, skills, and templates from the package definition are deployed.

**Acceptance Scenarios**:

1. **Given** a workforce package `bdr-team` exists with 2 agents, 10 skills, and 3 templates, **When** the user runs `speckit bundle /path/to/project bdr-team`, **Then** all listed agents, skills, and templates are deployed into the target project.
2. **Given** a target project already has some skills from a package, **When** deploying the package, **Then** existing skills are skipped and only missing assets are installed.
3. **Given** the user runs `speckit create-package`, **When** they select agents, skills, and templates through the wizard, **Then** a new package definition file is created in the Packages directory.

---

### User Story 4 - Browse and Manage via Web Dashboard (Priority: P2)

A platform administrator wants a visual interface to browse all available agents, skills, templates, and packages, deploy assets into projects, and create new assets through forms rather than CLI commands.

**Why this priority**: The dashboard makes the platform accessible to non-CLI users and provides a visual overview of the entire library. It complements the CLI but is not required for core functionality.

**Independent Test**: Can be tested by launching `speckit dashboard`, navigating to each of the 10 pages, and verifying data loads correctly and forms submit successfully.

**Acceptance Scenarios**:

1. **Given** the dashboard is launched on port 3847, **When** the user opens the browser, **Then** they see a sidebar with navigation to Dashboard, Assets, Deploy, Packages, Projects, and 5 wizard pages.
2. **Given** the Assets page is loaded, **When** the user searches or filters, **Then** they see cards for all agents, skills, and templates with details, tags, and version information.
3. **Given** the Deploy page, **When** the user enters a target path and clicks analyze, **Then** they see the project analysis results and can select assets to deploy with a single click.

---

### User Story 5 - Create Feature Specs for Target Projects (Priority: P3)

A product manager wants to define a feature specification (spec.md + plan.md) in TheLibrary that can later be deployed into a target project, where the full SpecKit workflow (clarify, plan, tasks, implement) runs locally.

**Why this priority**: Feature specs are the output artifacts that drive development in target projects. They depend on the SpecKit structure being deployed first (P1), making this a downstream workflow.

**Independent Test**: Can be tested by running `speckit create-feature`, filling in the wizard, and verifying spec.md and plan.md are created with proper structure in the Features directory.

**Acceptance Scenarios**:

1. **Given** the CLI is available, **When** the user runs `speckit create-feature`, **Then** the system collects feature name, number, description, user stories with acceptance criteria, requirements, edge cases, success criteria, and open questions.
2. **Given** the wizard is complete, **When** files are generated, **Then** spec.md follows the SpecKit spec template format and plan.md includes a constitution check placeholder and implementation phase stubs.
3. **Given** a feature spec exists in the Features directory, **When** deployed into a target project, **Then** the target project can run `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` against it.

---

### Edge Cases

- What happens when the target project has a constitution.md that has been heavily customized? The system must never overwrite it - instead offer a diff-based merge or skip.
- What happens when a skill in a workforce package doesn't exist in the library? The deployer must warn and skip the missing skill, not fail the entire package.
- What happens when the MCP wizard is given conflicting rate limit and burst limit values (burst > rate)? The system should validate and warn the user.
- What happens when two MCP servers are deployed into the same project? They must share the `.mcp-infra/` layer without duplication.
- What happens when deploying into a project with no git repository? The analyzer should still work but note that branch-based feature workflows won't be available.
- What happens when the dashboard API is called with invalid wizard input (missing required fields)? The API must return clear error messages, not crash.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST analyze any target project directory and detect language (TypeScript, Python, Go, Rust, Ruby, Java), framework, test framework, database, CI/CD, and existing SpecKit/Beads/Claude installations.
- **FR-002**: System MUST deploy the uniform `.specify/` structure with 9 bash scripts, 5 templates, references, memory directory with constitution and agent context, and a `.current-feature` file.
- **FR-003**: System MUST adapt a 20-principle constitution from a base template using one of 6 pre-built profiles (web-app-typescript, web-app-python, slack-bot, api-service, cli-tool, minimal).
- **FR-004**: System MUST deploy `.beads/` with task-mapping.json for task tracking integration.
- **FR-005**: System MUST merge `.claude/settings.local.json` permissions additively - adding new SpecKit permissions without removing any existing user permissions.
- **FR-006**: System MUST deploy skills from the library into `.claude/skills/` in the target project, skipping skills that already exist unless force mode is enabled.
- **FR-007**: System MUST deploy agents with all associated files (Agents.md, CLAUDE.md, MEMORY.md, manifest.json, Context directory).
- **FR-008**: System MUST generate complete MCP server projects with mandatory built-in infrastructure: rate limiter, retry handler with exponential backoff and jitter, response cache, circuit breaker, request queue, error normalizer, and request logger.
- **FR-009**: System MUST deploy a shared `.mcp-infra/` infrastructure layer when deploying MCP servers, checking if it already exists and offering updates if outdated.
- **FR-010**: System MUST provide 5 creation wizards (Agent, Skill, MCP Server, Feature Spec, Package) that each have dual entry points: interactive CLI and programmatic API for the dashboard.
- **FR-011**: System MUST provide a CLI with at minimum 14 commands: analyze, deploy, scaffold, bundle, list, deploy-skill, deploy-agent, deploy-mcp, create-agent, create-skill, create-mcp, create-feature, create-package, dashboard.
- **FR-012**: System MUST provide a web dashboard with pages for overview, asset browsing, deployment wizard, package browsing, project management, and all 5 creation wizard forms.
- **FR-013**: System MUST deploy security baseline documentation (dual-secret policy, permission boundaries, security baseline) when security mode is enabled.
- **FR-014**: System MUST bundle agents, skills, and templates into workforce packages that can be deployed in a single command.
- **FR-015**: System MUST stamp deployed projects with version information (speckit-version.json) tracking deployer version, profile, and deployed components.
- **FR-016**: System MUST never overwrite existing constitution.md, specs, or beads configurations. Existing content must be preserved.
- **FR-017**: System MUST provide a `scaffold` command that creates a new project directory with git initialization, a language-appropriate package manifest (package.json, requirements.txt, go.mod, Cargo.toml), a recommended source directory structure, and a pre-installed SpecKit deployment using the detected or user-specified constitution profile.
- **FR-018**: System MUST deploy a QA framework consisting of qa-areas.yml (functional area-to-spec mapping template), qa-parse-spec.sh and qa-run-tests.sh scripts (already included in the 9 bash scripts), enabling spec-driven test discovery and grouped test execution via `/qa.run --spec`, `/qa.run --area`, `/qa.run --all`, and `/qa.run --failed` modes.
- **FR-019**: System MUST generate technical documentation after every SpecKit workflow completion, producing both an HTML file (using Templates/template-technical-docs.html as the design reference) and a companion .md file with a table of contents including line number references, enabling Claude Code to locate and navigate documentation sections efficiently.

### Key Entities

- **Agent**: A named AI persona with purpose, responsibilities, operating principles, tone, required skills, and personalization fields. Stored as Agents.md + manifest.json.
- **Skill**: A named capability with invocation command, output format, workflow steps, MCP dependencies, and optional design system template. Stored as SKILL.md + reference/.
- **MCP Server**: An API integration server with endpoints, auth config, rate limits, caching, and retry infrastructure. Stored as a complete TypeScript project.
- **Workforce Package**: A named bundle referencing agents, skills, and templates by name, with a constitution profile and security toggle. Stored as package.json.
- **Feature Spec**: A feature definition with user stories, requirements, and success criteria. Stored as spec.md + plan.md in the Features directory.
- **Constitution Profile**: A configuration that adapts the 20-principle governance framework to a specific project type. 6 profiles available.
- **Project Profile**: The output of analyzing a target project - language, framework, existing configs, suggested constitution profile.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A developer can go from an empty project directory to a fully configured SpecKit + Beads installation in under 30 seconds using a single command.
- **SC-002**: The deployed structure in any target project matches the reference project (SLACK - Create Lists) exactly - same scripts, same templates, same directory layout.
- **SC-003**: Deploying into a project with existing Claude/SpecKit configuration preserves 100% of existing user content (no data loss, no permission removal).
- **SC-004**: All 5 creation wizards produce valid, well-formed output files that pass format validation and can be consumed by downstream tools.
- **SC-005**: The MCP Server wizard generates servers with all 7 infrastructure components (rate limiter, retry, cache, circuit breaker, queue, error normalizer, logger) without manual configuration.
- **SC-006**: Workforce packages successfully deploy all referenced assets in a single command, with clear reporting of what was deployed and what was skipped.
- **SC-007**: The web dashboard loads all 10 pages without errors and all API endpoints return valid responses within 2 seconds.
- **SC-008**: The system correctly identifies and classifies at least 6 programming languages and 10 frameworks during project analysis.

### Assumptions

- Target projects are on a local filesystem accessible to the deployer process.
- The deployer runs on macOS or Linux with Node.js 18+ available.
- Git is available for branch-based feature workflows but is not strictly required for core deployment.
- The SLACK - Create Lists project serves as the gold standard reference for the uniform structure.
- All bash scripts are copied verbatim from the reference project and are not adapted per target project.
- The constitution base template (v3.5.0) is the canonical version used for all adaptations.
