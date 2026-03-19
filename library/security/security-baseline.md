# Security Baseline

## Overview

This document establishes the minimum security requirements for all agent operations in this project. It synthesizes patterns from NemoClaw (NVIDIA sandbox) and PopeBot (agent platform).

## Mandatory Requirements

### 1. Secret Management
- Follow the dual-secret naming convention in `dual-secret-policy.md`
- Never hardcode secrets in source files
- Use environment variables or secrets managers
- Rotate secrets on a defined schedule (minimum quarterly)
- All `.env` files must be in `.gitignore`

### 2. Permission Enforcement
- Follow the boundaries defined in `permission-boundaries.md`
- All destructive operations require human confirmation
- All external API calls must go through MCP infrastructure (rate limiting, caching)
- File path validation to prevent directory traversal

### 3. Audit Trail
- All agent actions are logged
- All API calls are logged with cost tracking (via MCP infrastructure)
- All file modifications are tracked via git
- All deployments are version-stamped (`speckit-version.json`)

### 4. Input Validation
- Validate all user inputs at system boundaries
- Sanitize file paths to prevent traversal attacks
- Validate API responses before processing
- Type-check all external data at ingestion points

### 5. Error Handling
- Never expose internal errors to external systems
- Use normalized error formats (see MCP infrastructure `error-normalizer.ts`)
- Implement circuit breakers for external service calls
- Use exponential backoff with jitter for retries
- Log all errors with sufficient context for debugging

### 6. Dependency Security
- Review new dependencies before installation
- Keep dependencies up to date (monthly audit)
- Use lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml)
- Never install packages from untrusted sources

## Review Schedule

| Review | Frequency | Owner |
|--------|-----------|-------|
| `AGENT_LLM_*` secret necessity | Monthly | Security lead |
| Permission boundaries accuracy | Quarterly | Project lead |
| Security baseline compliance | Per-deployment | Deployer (automated) |
| Dependency audit | Monthly | Engineering |
| Secret rotation | Quarterly | Security lead |

## Compliance

This baseline is designed to support:
- **SOC 2 Type II**: Audit logging, access controls, change management
- **OWASP Top 10**: Input validation, error handling, dependency management
- **GDPR/CCPA**: Data isolation, audit trail, access boundaries

Customize compliance requirements based on your project's regulatory environment.
