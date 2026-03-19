# Research: TheLibrary SpecKit Deployer Platform

**Branch**: `1-speckit-deployer-platform`
**Date**: 2026-03-19

## Technology Decisions

### Decision 1: CLI Framework

**Decision**: Commander.js
**Rationale**: Industry standard for Node.js CLIs. Supports subcommands, options, help generation, and version display out of the box. Zero configuration needed for our 14-command structure.
**Alternatives considered**:
- **yargs**: More feature-rich but heavier. Commander covers our needs with simpler API.
- **oclif**: Full CLI framework with plugin support. Overkill for a deployment tool that doesn't need plugins.
- **meow**: Too minimal. No subcommand support.

### Decision 2: Dashboard Stack

**Decision**: Vite + React 19 + Tailwind CSS
**Rationale**: Fast builds (1.3s production build), modern React with latest features, utility-first CSS matching the Dev Labs design system. Vite's proxy config simplifies local API development.
**Alternatives considered**:
- **Next.js**: Server-side rendering unnecessary for a local dashboard. Adds complexity without benefit.
- **Svelte**: Smaller bundle but team has React expertise. Consistency matters more than bundle size for a local tool.
- **Vue**: No team experience. React aligns with existing skill base.

### Decision 3: API Server

**Decision**: Express.js (embedded in deployer)
**Rationale**: The dashboard API runs alongside the CLI in the same process. Express is lightweight, well-known, and sufficient for serving static files + 15 REST endpoints. No need for a separate server process.
**Alternatives considered**:
- **Fastify**: Faster but Express's ecosystem and familiarity win for a simple API.
- **Hono**: Interesting but less mature. Express is the safe choice for a tool that needs to just work.
- **Separate process**: Would complicate deployment. Single `speckit dashboard` command serves both API and static files.

### Decision 4: File Operations Strategy

**Decision**: fs-extra with custom safe wrappers
**Rationale**: fs-extra adds `ensureDir`, `copy`, `readJson`, `writeJson` on top of Node.js fs. Custom wrappers add merge-safe logic (never overwrite, additive merge for JSON, skip-if-exists for directories).
**Alternatives considered**:
- **Native fs/promises**: Missing convenience methods. Would need to write our own `ensureDir`, `copy`, etc.
- **globby + fs**: More complex dependency chain for the same result.

### Decision 5: Constitution Adaptation

**Decision**: Base template + profile JSON overrides with gate table generation
**Rationale**: The 20-principle constitution from SLACK (v3.5.0, 30KB) serves as the canonical base. Profile JSONs define which principles are N/A for each project type. The gate table is generated automatically from the profile, showing status for each principle.
**Alternatives considered**:
- **Per-profile full constitutions**: 6 separate 30KB files would diverge over time. Single base + overrides ensures consistency.
- **Dynamic generation**: Too complex. Principles are stable; only applicability changes per project type.

### Decision 6: Wizard Dual-Mode Pattern

**Decision**: Each wizard exports two functions: `run*WizardCli()` for interactive CLI and `generate*()` for programmatic API
**Rationale**: The CLI needs readline-based prompts (prompt-engine.ts). The dashboard needs JSON-in/files-out. Sharing the generation logic but separating input collection keeps both modes testable and maintainable.
**Alternatives considered**:
- **Single function with mode flag**: Mixes concerns. Input collection and file generation should be separate.
- **Separate wizard classes**: Over-engineered for what are essentially two functions per wizard.

### Decision 7: MCP Infrastructure Pattern

**Decision**: Shared `.mcp-infra/` directory deployed once per project, imported by all MCP servers
**Rationale**: Every MCP server needs rate limiting, retry, caching, circuit breaker, queue, error normalization, and logging. Duplicating this in every server is wasteful and makes updates painful. A shared infrastructure layer means updating one directory updates all servers.
**Alternatives considered**:
- **Per-server infrastructure**: Simpler initially but creates N copies of the same code. Updates require touching every server.
- **npm package**: Would require publishing and version management. Local shared directory is simpler for a deployment tool.

### Decision 8: Security Baseline Approach

**Decision**: Documentation-only deployment (secret-policy.md, permission-boundaries.md, security-baseline.md)
**Rationale**: NemoClaw (4-layer sandbox) and PopeBot (Docker agent tier) are too heavy for a lightweight deployer. Extracting their patterns as documentation (dual-secret naming, permission boundaries, escalation rules) gives 80% of the security value with zero infrastructure overhead.
**Alternatives considered**:
- **Merge NemoClaw**: Requires Docker, GPU support, NVIDIA infra. Overkill for a deployer.
- **Merge PopeBot**: Requires Docker Compose, self-hosted runner. Too heavy.
- **No security**: Missed opportunity. Lightweight docs are zero-cost and high-value.

## Best Practices Applied

### File-System Safety
- Never overwrite files that may contain user customizations (constitution, CLAUDE.md, specs)
- Additive-only merge for JSON files (settings.local.json)
- Skip-if-exists for directories and assets
- Dry-run mode for previewing changes

### MCP Server Gold Standard
- Exponential backoff with jitter (prevents thundering herd)
- Token-bucket rate limiter (configurable per API)
- TTL-based response cache (default 5min for reads)
- Circuit breaker (fail-fast after N consecutive errors)
- Request queue (burst protection)
- Structured request/response logging (cost tracking ready)
- Consistent error normalization (regardless of upstream API format)

### Constitution Governance
- 20 principles covering architecture, security, UX, automation
- Profile-based adaptation (6 profiles for different project types)
- Gate table in every plan.md for compliance tracking
- Never overwrite customized constitutions
