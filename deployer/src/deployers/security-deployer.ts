/**
 * Security baseline deployer - deploys lightweight security documentation
 * and policies extracted from NemoClaw and PopeBot patterns.
 */

import path from 'path';
import { ensureDir, writeText, exists } from '../utils/file-ops.js';
import type { ProjectProfile, DeployOptions } from '../types.js';

export interface SecurityDeployResult {
  created: string[];
  skipped: string[];
}

/**
 * Deploys security baseline files into .specify/security/.
 */
export async function deploySecurity(
  profile: ProjectProfile,
  options: DeployOptions
): Promise<SecurityDeployResult> {
  const result: SecurityDeployResult = { created: [], skipped: [] };
  const securityDir = path.join(options.targetPath, '.specify', 'security');

  if (options.dryRun) {
    result.created.push(
      '.specify/security/secret-policy.md',
      '.specify/security/permission-boundaries.md',
      '.specify/security/security-baseline.md'
    );
    return result;
  }

  await ensureDir(securityDir);

  // Deploy secret policy (from PopeBot dual-secret pattern)
  const secretPolicyPath = path.join(securityDir, 'secret-policy.md');
  if (!(await exists(secretPolicyPath))) {
    await writeText(secretPolicyPath, generateSecretPolicy());
    result.created.push('.specify/security/secret-policy.md');
  } else {
    result.skipped.push('.specify/security/secret-policy.md');
  }

  // Deploy permission boundaries (from NemoClaw pattern)
  const permBoundariesPath = path.join(securityDir, 'permission-boundaries.md');
  if (!(await exists(permBoundariesPath))) {
    await writeText(permBoundariesPath, generatePermissionBoundaries());
    result.created.push('.specify/security/permission-boundaries.md');
  } else {
    result.skipped.push('.specify/security/permission-boundaries.md');
  }

  // Deploy security baseline
  const baselinePath = path.join(securityDir, 'security-baseline.md');
  if (!(await exists(baselinePath))) {
    await writeText(baselinePath, generateSecurityBaseline());
    result.created.push('.specify/security/security-baseline.md');
  } else {
    result.skipped.push('.specify/security/security-baseline.md');
  }

  return result;
}

function generateSecretPolicy(): string {
  return `# Secret Policy

## Dual-Secret Naming Convention

Based on PopeBot's proven pattern for credential compartmentalization.

### Tier 1: Protected Secrets (\`AGENT_*\`)
Environment variables prefixed with \`AGENT_\` are **protected from LLM tool-calls**.
These secrets are available in the runtime environment but NEVER passed to the LLM.

Examples:
- \`AGENT_DB_PASSWORD\` - Database credentials
- \`AGENT_API_MASTER_KEY\` - Master API keys
- \`AGENT_ENCRYPTION_KEY\` - Encryption keys
- \`AGENT_WEBHOOK_SECRET\` - Webhook validation secrets

### Tier 2: LLM-Accessible Secrets (\`AGENT_LLM_*\`)
Environment variables prefixed with \`AGENT_LLM_\` are **deliberately passed to LLM tools**.
These are secrets the agent needs to perform its work.

Examples:
- \`AGENT_LLM_OPENAI_KEY\` - API keys for LLM-driven API calls
- \`AGENT_LLM_SEARCH_KEY\` - Search API keys the agent uses directly
- \`AGENT_LLM_CRM_TOKEN\` - CRM tokens for agent-driven lookups

### Rules
1. NEVER store secrets without the \`AGENT_\` or \`AGENT_LLM_\` prefix
2. Default to \`AGENT_\` (protected) unless the LLM explicitly needs the secret
3. Review all \`AGENT_LLM_\` secrets quarterly - minimize LLM exposure
4. Never commit secrets to git - use .env files and secrets managers
5. Document why each \`AGENT_LLM_\` secret needs LLM access
`;
}

function generatePermissionBoundaries(): string {
  return `# Permission Boundaries

## Agent Access Control

Based on NemoClaw's four-layer security model, adapted for lightweight deployment.

### Filesystem Boundaries
Define which paths agents can read/write:

| Path | Access | Justification |
|------|--------|---------------|
| \`src/\` | Read + Write | Core application code |
| \`specs/\` | Read + Write | Feature specifications |
| \`.specify/\` | Read only | SpecKit configuration (managed by deployer) |
| \`.env\` | No access | Contains secrets |
| \`node_modules/\` | Read only | Dependencies |
| \`.git/\` | Read only | Git internals (use git CLI instead) |

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
`;
}

function generateSecurityBaseline(): string {
  return `# Security Baseline

## Overview
This document establishes the minimum security requirements for all agent operations
in this project. It synthesizes patterns from NemoClaw (NVIDIA) and PopeBot.

## Mandatory Requirements

### 1. Secret Management
- Follow the dual-secret naming convention in \`secret-policy.md\`
- Never hardcode secrets in source files
- Use environment variables or secrets managers
- Rotate secrets on a defined schedule

### 2. Permission Enforcement
- Follow the boundaries defined in \`permission-boundaries.md\`
- All destructive operations require human confirmation
- All external API calls must go through MCP infrastructure (rate limiting, caching)

### 3. Audit Trail
- All agent actions are logged
- All API calls are logged with cost tracking
- All file modifications are tracked via git
- All deployments are version-stamped

### 4. Input Validation
- Validate all user inputs at system boundaries
- Sanitize file paths to prevent traversal attacks
- Validate API responses before processing

### 5. Error Handling
- Never expose internal errors to external systems
- Use normalized error formats (see MCP infrastructure)
- Implement circuit breakers for external service calls
- Use exponential backoff for retries

## Review Schedule
- Monthly: Review AGENT_LLM_* secrets for necessity
- Quarterly: Review permission boundaries for accuracy
- Per-deployment: Verify security baseline is present and current
`;
}
