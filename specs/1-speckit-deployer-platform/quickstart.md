# Quickstart: TheLibrary SpecKit Deployer Platform

**Branch**: `1-speckit-deployer-platform`
**Date**: 2026-03-19

## Prerequisites

- Node.js 18+
- macOS or Linux
- Git (optional, for branch-based features)

## Verification Steps

### 1. CLI Startup

```bash
cd deployer && npx tsx bin/speckit.ts --help
```

**Expected**: 14 commands listed (analyze, deploy, scaffold, bundle, list, deploy-skill, deploy-agent, deploy-mcp, create-agent, create-skill, create-mcp, create-feature, create-package, dashboard)

### 2. Asset Registry

```bash
cd deployer && npx tsx bin/speckit.ts list all
```

**Expected**: 4 agents, 21 skills, 10 templates, 3 packages, 6 profiles listed

### 3. Project Analysis

```bash
cd deployer && npx tsx bin/speckit.ts analyze /path/to/any/project
```

**Expected**: Language, framework, existing config detection. Suggested profile.

### 4. Deploy Into Blank Directory

```bash
mkdir /tmp/test-deploy
cd deployer && npx tsx bin/speckit.ts deploy /tmp/test-deploy --profile web-app-typescript --security
```

**Expected**:
- `.specify/` with 9 scripts, 5 templates, constitution.md, agent-context-claude.md
- `.beads/` with task-mapping.json
- `.claude/settings.local.json` with SpecKit permissions
- `.specify/security/` with 3 security docs
- `specs/` directory created
- `speckit-version.json` stamped

### 5. Deploy Into Existing Project (Merge Safety)

```bash
cd deployer && npx tsx bin/speckit.ts deploy /path/to/existing/project --profile minimal
```

**Expected**:
- Existing `.claude/settings.local.json` permissions preserved (additive merge)
- Existing constitution.md NOT overwritten
- Existing `.beads/` skipped
- Only missing files created

### 6. Wizard - Create Agent

```bash
cd deployer && npx tsx bin/speckit.ts create-agent
```

**Expected**: Interactive prompts for name, purpose, responsibilities, etc. Files generated in `Agents/{name}/`

### 7. Wizard - Create MCP Server

```bash
cd deployer && npx tsx bin/speckit.ts create-mcp
```

**Expected**: Interactive prompts for API config, endpoints, etc. Complete TypeScript MCP server project generated in `MCP-Servers/{name}/`

### 8. Bundle Deploy

```bash
cd deployer && npx tsx bin/speckit.ts bundle /tmp/test-deploy bdr-team
```

**Expected**: 2 agents, 10 skills, 3 templates deployed. Clear reporting of deployed vs skipped.

### 9. Dashboard Launch

```bash
cd deployer && npx tsx bin/speckit.ts dashboard
```

**Expected**: Express server starts on http://localhost:3847. Dashboard loads with sidebar, 10 pages navigable.

### 10. Dashboard API

```bash
curl http://localhost:3847/api/stats
```

**Expected**: `{"agents":4,"skills":21,"templates":10,"packages":3,"profiles":6}`

### 11. Type Safety

```bash
cd deployer && npx tsc --noEmit
cd ../dashboard && npx tsc --noEmit
```

**Expected**: Both compile with zero errors.

### 12. Dashboard Build

```bash
cd dashboard && npx vite build
```

**Expected**: Production build completes. 52 modules transformed.

## Cleanup

```bash
rm -rf /tmp/test-deploy
```
