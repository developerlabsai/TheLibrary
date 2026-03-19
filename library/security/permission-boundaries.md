# Permission Boundaries

## Overview

Based on NemoClaw's four-layer security model, adapted for lightweight deployment. Defines what agents can and cannot access in this project.

## Filesystem Boundaries

| Path | Access | Justification |
|------|--------|---------------|
| `src/` | Read + Write | Core application code |
| `specs/` | Read + Write | Feature specifications |
| `.specify/` | Read only | SpecKit configuration (managed by deployer) |
| `.specify/memory/` | Read + Write | Agent context and constitution |
| `.env` | No access | Contains secrets |
| `.env.*` | No access | Contains secrets |
| `node_modules/` | Read only | Dependencies (never modify) |
| `.git/` | No direct access | Use git CLI commands instead |
| `dist/` / `build/` | Read only | Build output |

## Network Boundaries

| Service | Access | Justification |
|---------|--------|---------------|
| npm / PyPI registry | Allowed | Package installation |
| GitHub API | Allowed | PR, issues, code review |
| Project MCP servers | Allowed | Per MCP server configuration |
| External APIs | Allowed via MCP | Must go through rate-limited infrastructure |
| Unknown URLs | Blocked | Require explicit approval |

## Process Boundaries

| Action | Policy |
|--------|--------|
| Read files | Allowed within boundaries |
| Write files | Allowed within boundaries |
| Install packages | Allowed with confirmation |
| Delete files | Requires confirmation |
| Create branches | Allowed |
| Push to remote | Requires confirmation |
| Merge branches | Requires confirmation |
| Modify CI/CD | Requires confirmation |
| Access secrets | Follow dual-secret policy |
| Run tests | Allowed |
| Run builds | Allowed |
| Deploy to production | Requires confirmation |

## Escalation Rules

When an agent encounters an action outside its boundaries:

1. **Log** the attempted action with full context
2. **Present** the action to the operator for approval
3. **Never** proceed without explicit authorization
4. **Document** approved exceptions for future reference
5. **Review** exceptions quarterly for boundary adjustments

## Customization

This file should be customized per project. Add or remove boundaries based on:
- Project sensitivity level
- Team size and trust model
- Compliance requirements (SOC 2, HIPAA, etc.)
- External service integrations
