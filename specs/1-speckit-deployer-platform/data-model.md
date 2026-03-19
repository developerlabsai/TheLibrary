# Data Model: TheLibrary SpecKit Deployer Platform

**Branch**: `1-speckit-deployer-platform`
**Date**: 2026-03-19

## Entities

### Agent

A named AI persona with defined role, behavior, and capabilities.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Machine-readable identifier (kebab-case) |
| displayName | string | Yes | Human-readable name |
| version | string | Yes | Semantic version |
| description | string | Yes | Purpose statement (1-2 sentences) |
| responsibilities | string[] | Yes | Core responsibilities the agent owns |
| operatingPrinciples | string[] | Yes | Behavioral guidelines |
| preferredOutputFormats | string[] | No | Output format templates |
| tone | string | Yes | Communication style descriptor |
| requiredSkills | string[] | No | Skill names this agent depends on |
| tags | string[] | No | Categorization tags |
| personalizationFields | string[] | No | Fields for per-user customization |
| standingInstructions | string[] | No | Persistent behavioral directives |

**Storage**: `Agents/{name}/manifest.json` + `Agents.md` + `CLAUDE.md` + `MEMORY.md` + `Context/`
**Relationships**: References Skills by name via `requiredSkills`

---

### Skill

A named capability with invocation pattern and output specification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Machine-readable identifier (kebab-case) |
| displayName | string | Yes | Human-readable name |
| description | string | Yes | What this skill produces |
| invocationCommand | string | Yes | CLI command (e.g., `/account-research`) |
| invocationArgs | string | Yes | Argument pattern (e.g., `<company-name>`) |
| outputFormat | string | Yes | Output type (HTML, Markdown, JSON, Plain text) |
| designSystem | boolean | Yes | Whether to include Dev Labs design system |
| mcpDependencies | string[] | No | Required MCP servers |
| sections | string[] | Yes | Required output sections |
| steps | string[] | Yes | Workflow steps to produce output |

**Storage**: `Skills/{displayName}/SKILL.md` + optional `reference/{name}-template.html`
**Relationships**: Referenced by Agents and Packages

---

### MCP Server

An API integration server with infrastructure components.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Machine-readable identifier |
| displayName | string | Yes | Human-readable name |
| apiBaseUrl | string | Yes | API base URL |
| authType | string | Yes | Authentication method (api-key, oauth2, bearer, basic, none) |
| authConfig | object | No | Auth-specific configuration |
| rateLimit | object | Yes | { requestsPerMinute, burstLimit } |
| paginationStrategy | string | Yes | Pagination method (cursor, offset, page, none) |
| cacheTtlSeconds | number | Yes | Default cache TTL for read operations |
| retryConfig | object | Yes | { maxRetries, baseDelayMs, respectRetryAfter } |
| transportType | string | Yes | MCP transport (stdio, http) |
| endpoints | Endpoint[] | Yes | API endpoint definitions |

**Endpoint sub-entity**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | MCP tool name |
| method | string | Yes | HTTP method |
| path | string | Yes | URL path |
| description | string | Yes | Tool description |
| parameters | Parameter[] | No | Input parameters |

**Storage**: `MCP-Servers/{name}/` as a complete TypeScript project
**Relationships**: Depends on shared `.mcp-infra/` when deployed into a target project

---

### Workforce Package

A named bundle of agents, skills, and templates.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Package identifier (kebab-case) |
| description | string | Yes | Package purpose |
| version | string | Yes | Semantic version |
| agents | string[] | No | Agent names to include |
| skills | string[] | No | Skill names to include |
| templates | string[] | No | Template filenames to include |
| mcpServers | string[] | No | MCP server names to include |
| constitutionProfile | string | Yes | Default constitution profile |
| security | boolean | Yes | Whether to include security baseline |

**Storage**: `Packages/{name}/package.json`
**Relationships**: References Agents, Skills, and Templates by name

---

### Feature Spec

A feature definition for deployment into target projects.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Feature name |
| featureNumber | number | Yes | Sequential feature number |
| branchName | string | Yes | Git branch name (auto-generated) |
| description | string | Yes | Feature description |
| userStories | UserStory[] | Yes | User stories with acceptance criteria |
| functionalRequirements | string[] | Yes | Testable requirements |
| edgeCases | string[] | No | Boundary conditions |
| successCriteria | string[] | Yes | Measurable outcomes |
| openQuestions | string[] | No | Items needing clarification |
| technicalApproach | string | No | High-level technical notes |

**Storage**: `Features/{branchName}/spec.md` + `plan.md`
**Relationships**: Standalone. Deployed into target project `specs/` directory.

---

### Constitution Profile

Adapts the 20-principle constitution to a project type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Profile identifier |
| description | string | Yes | Use case description |
| overrides | object | Yes | Principle applicability map (principle name -> status) |

**Available profiles**: web-app-typescript, web-app-python, slack-bot, api-service, cli-tool, minimal
**Storage**: `library/constitutions/{name}.json`

---

### Project Profile

Output of analyzing a target project.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| projectName | string | Yes | Directory name |
| projectPath | string | Yes | Absolute path |
| language | string | No | Detected language |
| framework | string | No | Detected framework |
| testFramework | string | No | Detected test framework |
| database | string | No | Detected database |
| ciCd | string | No | Detected CI/CD |
| hasGit | boolean | Yes | Git repository present |
| hasSpecKit | boolean | Yes | .specify/ present |
| hasBeads | boolean | Yes | .beads/ present |
| hasClaude | boolean | Yes | .claude/ present |
| hasMcpInfra | boolean | Yes | .mcp-infra/ present |
| suggestedProfile | string | Yes | Recommended constitution profile |
| existingSkills | string[] | Yes | Already-installed skill names |
| existingMcp | string[] | Yes | Already-installed MCP server names |

**Storage**: Not persisted. Returned as runtime object from analyzer.

## State Transitions

### Deployment State

```
NOT_INSTALLED -> ANALYZING -> DEPLOYING -> INSTALLED
                                        -> PARTIALLY_INSTALLED (if errors)
INSTALLED -> UPDATING -> INSTALLED (newer version)
```

### Wizard State

```
IDLE -> COLLECTING_INPUT -> GENERATING -> COMPLETE
                                       -> ERROR
```
