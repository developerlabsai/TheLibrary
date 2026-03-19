# Security Baseline

## Overview
This document establishes the minimum security requirements for all agent operations
in this project. It synthesizes patterns from NemoClaw (NVIDIA) and PopeBot.

## Mandatory Requirements

### 1. Secret Management
- Follow the dual-secret naming convention in `secret-policy.md`
- Never hardcode secrets in source files
- Use environment variables or secrets managers
- Rotate secrets on a defined schedule

### 2. Permission Enforcement
- Follow the boundaries defined in `permission-boundaries.md`
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
