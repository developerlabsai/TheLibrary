# Research: License-Gated Registry & CLI Distribution Platform

**Feature Branch**: `2-license-gated-registry`
**Date**: 2026-03-19

## R1: npm Global CLI Distribution

**Decision**: Publish `@devlabs/speckit-deployer` to GitHub Packages (npm registry) with a `bin` field pointing to compiled JS with `#!/usr/bin/env node` shebang.

**Rationale**: GitHub Packages is free for the organization, integrates with existing GitHub auth, supports private packages, and uses the standard npm install workflow. The existing `deployer/package.json` already has the `bin` field configured correctly.

**Alternatives considered**:
- **Public npm**: Rejected -- assets are proprietary and the package should be private initially.
- **npx from GitHub**: Rejected -- slower cold start, no version pinning, poor offline experience.
- **npm link only**: Rejected -- doesn't scale beyond a handful of developers; no versioning.

**Implementation notes**:
- Add `prepublishOnly` script that runs `tsc` build and copies dashboard dist into package
- Add `.npmrc` with GitHub Packages registry scope for `@devlabs`
- Ensure `#!/usr/bin/env node` is prepended to `dist/bin/speckit.js` after TypeScript compilation
- Add `files` field to package.json to include only `dist/`, `library/`, and dashboard assets

## R2: License Server Hosting

**Decision**: Supabase project for database (PostgreSQL) + Supabase Auth for admin accounts + Express server deployed to a lightweight cloud host (Railway, Render, or Fly.io).

**Rationale**: Supabase provides managed PostgreSQL with Row Level Security, built-in auth for admin accounts, and a generous free tier. Express is already a dependency of the deployer and the team has experience with it. A separate lightweight host avoids over-engineering with AWS/ECS for a small API.

**Alternatives considered**:
- **Supabase Edge Functions only**: Rejected -- limited runtime, harder to debug, less flexibility for Express middleware patterns.
- **AWS Lambda + API Gateway**: Rejected -- over-engineered for the initial scale; adds deployment complexity.
- **Self-hosted on existing infrastructure**: Rejected -- no existing server infrastructure for this project.
- **SQLite + file storage**: Rejected -- no cloud persistence, doesn't support concurrent admin access.

**Implementation notes**:
- Supabase project provides PostgreSQL + Auth (for admin accounts)
- Express server connects to Supabase via `@supabase/supabase-js` client
- Admin authentication uses Supabase Auth with email/password (per-admin accounts as clarified)
- License key validation is a direct database lookup (no JWT, no caching beyond 60s window per SC-004)

## R3: License Key Format and Storage

**Decision**: License keys are 32-character hex strings prefixed with `sk_live_` (production) or `sk_test_` (development). Stored locally in `~/.speckit/credentials` as a JSON file with `0600` permissions.

**Rationale**: Prefixed tokens are self-documenting (developers can tell production from test keys at a glance). The `~/.speckit/` directory follows conventions used by `gh`, `npm`, `aws`, and other CLI tools. JSON format allows future extension (e.g., storing registry URL). File permissions `0600` prevent other users on the same machine from reading the key.

**Alternatives considered**:
- **OS keychain (macOS Keychain, Windows Credential Manager)**: Rejected for initial version -- adds native dependencies and cross-platform complexity. Can be added as an optional enhancement later.
- **Environment variable only**: Rejected -- poor developer experience, easily leaked in shell history.
- **JWT tokens**: Rejected per spec assumption -- long-lived API tokens with server-side revocation are simpler and sufficient.

**Implementation notes**:
- Credential file format: `{ "key": "sk_live_abc123...", "registry": "https://registry.speckit.dev" }`
- CLI reads this file on every command that requires authentication
- `speckit login` validates key against server before storing
- `speckit logout` deletes the file

## R4: Asset Registry and Versioning

**Decision**: Assets stored in the license server's PostgreSQL database with metadata (name, type, tier, version). Asset content (files) stored in Supabase Storage (S3-compatible bucket). Multiple versions retained; registry serves latest by default, supports `?version=1.2.0` query parameter.

**Rationale**: Supabase Storage provides S3-compatible file storage with direct integration to the database. Storing asset content as files (not in DB rows) keeps the database lean and supports multi-file assets (agents have multiple files). Version pinning uses a simple query parameter on the registry API.

**Alternatives considered**:
- **Git-based registry (like npm)**: Rejected -- over-engineered for the initial scale of dozens of assets.
- **Database BLOB storage**: Rejected -- poor performance for large files, complex to manage.
- **Filesystem on server**: Rejected -- not cloud-native, no CDN support.

**Implementation notes**:
- Asset metadata in `assets` table: id, name, type, tier, current_version, description, created_at
- Asset versions in `asset_versions` table: id, asset_id, version, storage_path, checksum, published_at
- Asset files in Supabase Storage bucket `asset-content/{asset_id}/{version}/`
- Registry API endpoint: `GET /api/v1/registry/assets/:name?version=x.y.z`

## R5: Entitlement Checking Logic

**Decision**: Two-pass authorization: (1) check key is valid + not expired/revoked, (2) check requested asset is in the key's entitled asset list AND the key's tier meets or exceeds the asset's required tier.

**Rationale**: Tier + per-asset entitlements (as clarified) requires both checks. The tier check acts as a coarse gate (Pro can't access Enterprise assets regardless of entitlement list). The entitlement list acts as a fine gate within the tier.

**Alternatives considered**:
- **Tier-only check**: Rejected -- user chose per-asset entitlements for commercial flexibility.
- **Entitlement-only check (no tiers)**: Rejected -- user wants tiers for pricing model clarity.

**Implementation notes**:
- License key record includes: `tier` (free/pro/enterprise) and `entitled_assets` (array of asset names)
- Authorization flow:
  1. Is key valid? (exists, not revoked, not expired) → if no, reject with specific reason
  2. Does key tier >= asset required tier? → if no, reject with upgrade message
  3. Is asset name in key's entitled_assets? → if no, reject with "not in your subscription" message
  4. If all pass → serve asset content

## R6: Stub-Based Deployment Architecture

**Decision**: Stubs are small JSON files placed in the target project that contain: asset reference ID, registry endpoint URL, license key placeholder (`$SPECKIT_KEY`), and cache TTL. A stub resolver CLI command or library function resolves stubs by fetching from the registry and caching to `~/.speckit/cache/{asset_id}/{version}/`.

**Rationale**: JSON stubs are language-agnostic and can be read by any tool. Caching to `~/.speckit/cache/` keeps the target project clean (no large cached files in git). The key placeholder means the stub itself doesn't contain the license key (security).

**Alternatives considered**:
- **Markdown stubs with `@fetch` directive**: Rejected -- requires custom parser in every consumer; JSON is universally parseable.
- **In-project cache**: Rejected -- would pollute git history and increase project size.
- **No caching**: Rejected -- too many network calls, poor offline experience within TTL window.

**Implementation notes**:
- Stub file format:
  ```json
  {
    "speckit_stub": true,
    "asset": "premium-research-agent",
    "version": "latest",
    "registry": "https://registry.speckit.dev",
    "ttl": 86400,
    "deployed_at": "2026-03-19T00:00:00Z"
  }
  ```
- Cache location: `~/.speckit/cache/{asset_name}/{version}/`
- Cache metadata: `~/.speckit/cache/{asset_name}/{version}/.cache-meta.json` (fetched_at, expires_at, checksum)
- Resolver checks: cache valid? → serve from cache. Cache expired? → fetch from registry (requires valid key) → update cache. Key revoked? → reject after TTL expiry.

## R7: Admin Authentication Pattern

**Decision**: Supabase Auth with email/password for per-admin accounts. Admin sessions use Supabase's built-in JWT tokens for API requests. Admin role stored in a custom `admin_accounts` table with foreign key to Supabase auth user.

**Rationale**: Supabase Auth provides battle-tested authentication (password hashing, session management, token refresh) without building from scratch. Each admin gets individual credentials (as clarified), and all actions are logged with the admin's user ID.

**Alternatives considered**:
- **Custom auth with bcrypt**: Rejected -- reinventing the wheel when Supabase Auth is already in the stack.
- **OAuth/SSO only**: Rejected -- adds complexity; email/password is sufficient for a small admin team.

**Implementation notes**:
- Admin signup is invite-only (no public registration)
- Admin login: `POST /api/v1/admin/login` → returns session token
- All admin endpoints require `Authorization: Bearer <session_token>` header
- Session validation via Supabase's `supabase.auth.getUser(token)` middleware
- Admin audit log records: admin_id, action, target_entity, target_id, timestamp, details

## R8: Automation Patterns Applied

**Decision**: Two automation patterns identified per Constitution Principle XX.

**Pattern 2: Filter-Fan (Conditional Routing)** — Registry API authorization:
- Single input (asset request) routes through tier check → entitlement check → serve or reject
- Catch-all: any unrecognized tier or malformed request returns 400 with descriptive error
- Safety: no request silently drops; all paths return explicit responses

**Pattern 4: Loop (Retry/TTL)** — Stub resolver cache cycle:
- Loop: check cache → if valid, serve → if expired, fetch → if fetch fails, reject
- Hard exit: TTL expiry is the hard stop; no infinite retries
- Maximum retry: 1 fetch attempt per resolution; if fetch fails, return error immediately (no retry loop)

**Rationale**: Both patterns have clear exit conditions and no silent failure paths.
