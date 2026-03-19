# Dual-Secret Naming Convention

## Overview

Based on PopeBot's proven pattern for credential compartmentalization. This policy ensures that AI agents can only access secrets they explicitly need, while protecting sensitive credentials from accidental LLM exposure.

## Tier 1: Protected Secrets (`AGENT_*`)

Environment variables prefixed with `AGENT_` are **protected from LLM tool-calls**. These secrets are available in the runtime environment but NEVER passed to the LLM.

### Examples
- `AGENT_DB_PASSWORD` - Database credentials
- `AGENT_API_MASTER_KEY` - Master API keys
- `AGENT_ENCRYPTION_KEY` - Encryption keys
- `AGENT_WEBHOOK_SECRET` - Webhook validation secrets
- `AGENT_AWS_SECRET_KEY` - Cloud provider credentials
- `AGENT_STRIPE_SECRET` - Payment processing secrets

## Tier 2: LLM-Accessible Secrets (`AGENT_LLM_*`)

Environment variables prefixed with `AGENT_LLM_` are **deliberately passed to LLM tools**. These are secrets the agent needs to perform its work through MCP servers or tool calls.

### Examples
- `AGENT_LLM_OPENAI_KEY` - API keys for LLM-driven API calls
- `AGENT_LLM_SEARCH_KEY` - Search API keys the agent uses directly
- `AGENT_LLM_CRM_TOKEN` - CRM tokens for agent-driven lookups
- `AGENT_LLM_GITHUB_TOKEN` - GitHub tokens for code operations

## Rules

1. **NEVER** store secrets without the `AGENT_` or `AGENT_LLM_` prefix
2. **Default** to `AGENT_` (protected) unless the LLM explicitly needs the secret
3. **Review** all `AGENT_LLM_` secrets quarterly - minimize LLM exposure
4. **Never** commit secrets to git - use .env files and secrets managers
5. **Document** why each `AGENT_LLM_` secret needs LLM access
6. **Rotate** all secrets on a defined schedule (minimum quarterly)

## Implementation Checklist

- [ ] All secrets follow the naming convention
- [ ] No secrets appear in source code or git history
- [ ] Each `AGENT_LLM_*` secret has documented justification
- [ ] Secret rotation schedule is defined and tracked
- [ ] `.env` files are in `.gitignore`
