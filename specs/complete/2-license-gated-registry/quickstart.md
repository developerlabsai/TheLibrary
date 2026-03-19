# Quickstart: License-Gated Registry & CLI Distribution Platform

**Feature Branch**: `2-license-gated-registry`
**Date**: 2026-03-19

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Git configured with `developerlabsai` account
- [ ] Supabase project created for license server
- [ ] Supabase project URL and service role key available

## Setup Steps

### 1. License Server Setup

```bash
# From repository root
cd license-server
npm install

# Configure environment
cp .env.example .env
# Edit .env with Supabase credentials:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   PORT=3848

# Run database migrations
npx supabase db push

# Create the first super_admin account
npx tsx src/scripts/create-admin.ts --email admin@devlabs.ai --role super_admin

# Start the server
npm run dev
# Server running at http://localhost:3848
```

### 2. CLI Build and Link

```bash
# From repository root
cd deployer
npm install
npm run build

# Link globally for local development
npm link
# Now `speckit` command is available globally
```

### 3. Dashboard Build

```bash
cd dashboard
npm install
npm run build
# Dashboard assets are now in dashboard/dist/
```

## Verification Checklist

### CLI Distribution

- [ ] `speckit --version` returns correct version after `npm link`
- [ ] `speckit list` shows all free/community assets
- [ ] `speckit deploy ./test-project --agents research-agent` deploys free agent successfully
- [ ] Free assets deploy with zero authentication (no license key needed)

### Authentication

- [ ] `speckit login` prompts for license key
- [ ] Valid key is accepted and stored in `~/.speckit/credentials`
- [ ] Invalid key is rejected with clear error message
- [ ] `speckit license status` shows org name, tier, expiration, entitled assets
- [ ] `speckit logout` removes stored credentials

### License Server API

- [ ] `POST /api/v1/admin/login` returns session token for valid admin
- [ ] `POST /api/v1/organizations` creates an organization
- [ ] `POST /api/v1/keys` issues a license key for an organization
- [ ] `POST /api/v1/validate` accepts a valid key and returns license status
- [ ] `POST /api/v1/validate` rejects an expired key with `key_expired` error
- [ ] `POST /api/v1/validate` rejects a revoked key with `key_revoked` error

### Gated Distribution

- [ ] Authenticated Pro user can deploy a pro-tier asset
- [ ] Unauthenticated user gets "license required" message for pro assets
- [ ] Expired key gets "license expired" message
- [ ] Pro key cannot access enterprise-only assets (tier check)
- [ ] Key without specific asset entitlement gets "not in subscription" message
- [ ] Version pinning works: `speckit deploy ./project --skills premium-skill --version 1.2.0`

### Registry API

- [ ] `GET /api/v1/registry/catalog` returns accessible assets for authenticated key
- [ ] `GET /api/v1/registry/assets/:name` returns content archive with valid key
- [ ] Version header `X-Asset-Version` is present in response
- [ ] Checksum header `X-Asset-Checksum` matches downloaded content
- [ ] 401 returned for missing/invalid/expired/revoked keys
- [ ] 403 returned for insufficient tier or missing entitlement

### Key Revocation

- [ ] Admin can revoke a key via `POST /api/v1/keys/:id/revoke`
- [ ] Revoked key is rejected on next CLI command (within 60s)
- [ ] Revocation is permanent (cannot be undone)
- [ ] Audit log records the revocation with admin ID and reason

### Stub-Based Deployment (Enterprise)

- [ ] Enterprise asset deploys as thin stub JSON file in target project
- [ ] Stub resolver fetches full content from registry on first access
- [ ] Content is cached in `~/.speckit/cache/` with TTL metadata
- [ ] Cached content is served within TTL window without network call
- [ ] Expired cache triggers re-fetch from registry
- [ ] Revoked key + expired cache returns "license no longer active" message
- [ ] Offline + valid cache serves cached content

### Audit Command

- [ ] `speckit audit` lists all deployed assets in a project
- [ ] Report shows asset name, type, tier, and license status
- [ ] Expired/revoked assets are flagged with warnings
- [ ] Empty project shows "no SpecKit assets deployed" message

### Admin Audit Trail

- [ ] Key creation logged with admin ID
- [ ] Key revocation logged with admin ID and reason
- [ ] Organization changes logged with admin ID
- [ ] `GET /api/v1/audit-log` returns filterable audit entries

## Development Commands

```bash
# Deployer CLI (development mode)
cd deployer && npx tsx bin/speckit.ts <command>

# License server (development mode)
cd license-server && npm run dev

# Type checking
cd deployer && npx tsc --noEmit
cd license-server && npx tsc --noEmit

# Run tests
cd deployer && npx vitest run
cd license-server && npx vitest run

# Build for distribution
cd deployer && npm run build
cd dashboard && npm run build

# Publish CLI to GitHub Packages
cd deployer && npm publish
```

## Error Code Reference

| Code               | HTTP | Meaning                                        |
| ------------------ | ---- | ---------------------------------------------- |
| auth_required      | 401  | No license key provided                        |
| invalid_key        | 401  | Key does not exist                             |
| key_expired        | 401  | Key past expiration date                       |
| key_revoked        | 401  | Key has been permanently revoked               |
| tier_insufficient  | 403  | Key tier is below asset requirement            |
| not_entitled       | 403  | Asset not in key's entitled list               |
| asset_not_found    | 404  | Asset does not exist in registry               |
| version_not_found  | 404  | Requested version does not exist               |
