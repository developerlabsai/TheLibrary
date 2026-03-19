# Permission Boundaries

## Agent Access Control

Based on NemoClaw's four-layer security model, adapted for lightweight deployment.

### Filesystem Boundaries
Define which paths agents can read/write:

| Path | Access | Justification |
|------|--------|---------------|
| `src/` | Read + Write | Core application code |
| `specs/` | Read + Write | Feature specifications |
| `.specify/` | Read only | SpecKit configuration (managed by deployer) |
| `.env` | No access | Contains secrets |
| `node_modules/` | Read only | Dependencies |
| `.git/` | Read only | Git internals (use git CLI instead) |

### Network Boundaries
Define which external services agents can access:

| Service | Access | Justification |
|---------|--------|---------------|
| npm registry | Allowed | Package installation |
| GitHub API | Allowed | PR, issues, code review |
| Project APIs | Allowed | Per MCP server configuration |
| Unknown URLs | Blocked | Require explicit approval |

### Process Boundaries
| Action | Policy |
|--------|--------|
| Install packages | Allowed with confirmation |
| Delete files | Requires confirmation |
| Push to remote | Requires confirmation |
| Modify CI/CD | Requires confirmation |
| Access secrets | Follow dual-secret policy |

### Escalation Rules
When an agent encounters an action outside its boundaries:
1. Log the attempted action
2. Present the action to the operator for approval
3. Never proceed without explicit authorization
4. Document approved exceptions for future reference
