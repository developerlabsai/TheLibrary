# Tasks: License-Gated Registry & CLI Distribution Platform

**Input**: Design documents from `/specs/2-license-gated-registry/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested in the feature spec. Test tasks are excluded. Tests can be added via a separate pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the license-server project and prepare the deployer for new modules

- [x] T001 Create `license-server/` project directory with `package.json` (express, @supabase/supabase-js, cors, dotenv, typescript, vitest as devDep) and `tsconfig.json` matching deployer config (ES2022, ESNext modules, strict)
- [x] T002 Create `license-server/.env.example` with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, PORT=3848, NODE_ENV
- [x] T003 [P] Create `license-server/src/types.ts` with shared types: Tier enum (free/pro/enterprise), BillingStatus enum, AssetType enum, Organization interface, LicenseKey interface, AdminAccount interface, Asset interface, AssetVersion interface, AuditLogEntry interface — per data-model.md
- [x] T004 [P] Create `deployer/src/license/` directory and add shared license types to `deployer/src/types.ts`: LicenseStatus, CredentialFile, LicenseTier, EntitlementCheckResult interfaces. Note: the existing codebase uses "specialties" (SpecialtyInfo, getAllSpecialties) for what the spec calls "skills" — preserve existing terminology in deployer code, map "skills" to "specialties" in registry/asset-registry integration (T040)
- [x] T005 [P] Create `deployer/src/stubs/` directory structure for stub-related modules
- [x] T006 Install dependencies in `license-server/`: run `npm install` after package.json is created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, server skeleton, and CLI credential infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create Supabase migration `license-server/supabase/migrations/001_organizations.sql` — organizations table with id (uuid PK), name (varchar UNIQUE), contact_email, billing_status (enum), tier (enum), created_at, updated_at per data-model.md
- [x] T008 Create Supabase migration `license-server/supabase/migrations/002_admin_accounts.sql` — admin_accounts table with id (uuid PK), auth_user_id (uuid FK to auth.users UNIQUE), username (varchar UNIQUE), role (enum: admin/super_admin), created_at, last_login_at
- [x] T009 Create Supabase migration `license-server/supabase/migrations/003_license_keys.sql` — license_keys table with all fields from data-model.md including key_value (UNIQUE indexed), org_id FK, tier, entitled_assets (text[]), expires_at, revoked_at, revoked_by FK, last_used_at, deploy_count, created_at, created_by FK
- [x] T010 Create Supabase migration `license-server/supabase/migrations/004_assets.sql` — assets table (id, name UNIQUE indexed, type enum, tier enum, description, current_version, created_at, updated_at) and asset_versions table (id, asset_id FK, version, storage_path, checksum, file_manifest jsonb, published_at, published_by FK) with UNIQUE(asset_id, version) constraint
- [x] T011 Create Supabase migration `license-server/supabase/migrations/005_admin_audit_log.sql` — admin_audit_log table (id, admin_id FK, action varchar indexed, target_type, target_id, details jsonb, ip_address inet, created_at indexed) with INSERT-only policy (no UPDATE/DELETE)
- [x] T011b Create Supabase Storage bucket `asset-content` for storing asset version archives — configure in Supabase project settings or via migration script in `license-server/supabase/migrations/006_storage_bucket.sql` with private access policy (service-role only)
- [x] T012 Create `license-server/src/index.ts` — Express server entry point with CORS, JSON body parser, error handling middleware, port from env (default 3848). Health check will be mounted via dedicated route file (see T025).
- [x] T013 [P] Create `license-server/src/middleware/admin-auth.ts` — Express middleware that extracts Bearer token from Authorization header, validates via Supabase Auth `supabase.auth.getUser(token)`, attaches admin record to `req.admin`, rejects with 401 if invalid
- [x] T014 [P] Create `license-server/src/middleware/license-auth.ts` — Express middleware that extracts license key from `X-License-Key` header, looks up in license_keys table, checks valid (not revoked, not expired), attaches key record to `req.licenseKey`, rejects with appropriate 401 error code (auth_required, invalid_key, key_expired, key_revoked) per registry-api.yaml error examples
- [x] T015 [P] Create `license-server/src/services/audit-service.ts` — `logAction(adminId, action, targetType, targetId, details, ipAddress)` function that inserts into admin_audit_log table
- [x] T016 [P] Create `deployer/src/license/credential-store.ts` — functions: `getCredentials()` reads `~/.speckit/credentials` JSON (includes key and registry_url), `saveCredentials(key, registryUrl)` writes JSON with 0600 permissions (registryUrl defaults to `https://registry.speckit.dev/api/v1` if not provided), `deleteCredentials()` removes the file, `getConfigDir()` returns `~/.speckit/` (creates if missing). Default registry URL is also overridable via `SPECKIT_REGISTRY_URL` env var.
- [x] T017 [P] Create `deployer/src/license/license-client.ts` — HTTP client class with methods: `validate(key): Promise<LicenseStatus>` calls POST `/api/v1/validate`, handles 200 (valid) and 401 (invalid/expired/revoked) responses, configurable registry URL from credential store
- [x] T018 Create `license-server/src/scripts/create-admin.ts` — CLI script to create the first super_admin account: accepts --email and --role flags, creates Supabase Auth user, inserts admin_accounts record, outputs success message

**Checkpoint**: Foundation ready — database schema deployed, server running, auth middleware in place, CLI credential store working

---

## Phase 3: User Story 1 — Developer Installs SpecKit CLI Globally (Priority: P1) MVP

**Goal**: Developers can install the CLI globally via npm and use all existing free features without any authentication

**Independent Test**: Run `npm install -g @devlabs/speckit-deployer` (or `npm link` for dev), verify `speckit --version` works, verify `speckit list` shows free assets, verify `speckit deploy` works for free agents

### Implementation for User Story 1

- [x] T019 [US1] Update `deployer/package.json`: set name to `@devlabs/speckit-deployer`, add `files` field (dist/, library/, Agents/, Skills/, Templates/, Packages/, dashboard/dist/), add `prepublishOnly` script that runs `cd ../dashboard && npm run build && cd ../deployer && tsc && node scripts/add-shebang.js` to ensure dashboard assets are bundled for `speckit dashboard` (FR-003)
- [x] T020 [US1] Create `deployer/scripts/add-shebang.js` — Node script that prepends `#!/usr/bin/env node\n` to `dist/bin/speckit.js` if not already present
- [x] T021 [US1] Create `deployer/.npmrc` with GitHub Packages registry scope: `@devlabs:registry=https://npm.pkg.github.com`
- [x] T022 [US1] Update `deployer/tsconfig.json` — ensure `outDir` is `./dist`, add `"declaration": true` if missing, verify `bin/**/*.ts` and `src/**/*.ts` are in include
- [x] T023 [US1] Verify existing `speckit list` and `speckit deploy` commands work for free assets after build: run `cd deployer && npm run build && npm link` and test `speckit --version`, `speckit list`, `speckit deploy /tmp/test-project --agents research-agent --dry-run`

**Checkpoint**: CLI installable globally, free assets deploy without authentication

---

## Phase 4: User Story 2 — Developer Authenticates with License Key (Priority: P1)

**Goal**: Developers can log in with a license key, check their license status, and log out

**Independent Test**: Run `speckit login`, enter a valid key, verify it stores in `~/.speckit/credentials`. Run `speckit license status` to see org/tier/entitlements. Run `speckit logout` to clear.

### Implementation for User Story 2

- [x] T024 [US4] Create `license-server/src/routes/auth.ts` — Express router with POST `/admin/login` (email/password via Supabase Auth signInWithPassword, returns session token + admin record), POST `/admin/logout` (invalidates session) per license-server.yaml. Placed in Phase 4 for route setup convenience but primarily serves US4 (admin key management).
- [x] T025 [US2] Create `license-server/src/routes/health.ts` — GET `/api/v1/health` returns `{ status: "ok", version: "1.0.0" }`. This is the canonical health endpoint (T012 defers to this route file).
- [x] T026 [US2] Create `license-server/src/services/key-service.ts` — `validateKey(keyValue): Promise<LicenseStatus | null>` looks up key in license_keys table, joins organizations for org name, returns null if not found, checks revoked_at and expires_at, returns LicenseStatus with valid flag, org_name, tier, entitled_assets, expires_at. Also updates last_used_at timestamp.
- [x] T027 [US2] Create `license-server/src/routes/validate.ts` — Express router with POST `/api/v1/validate` accepting `{ key: string }` body, calls key-service.validateKey, returns 200 with LicenseStatus if valid, 401 with appropriate error code (invalid_key, key_expired, key_revoked) if invalid per license-server.yaml
- [x] T028 [US2] Register auth, health, and validate routes in `license-server/src/index.ts` — mount at `/api/v1/admin`, `/api/v1`, and `/api/v1` respectively
- [x] T029 [US2] Create `deployer/src/commands/login.ts` — `executeLogin()` function: prompts user for license key (or accepts --key flag), calls license-client.validate(), if valid saves via credential-store.saveCredentials(), displays success with org name and tier, if invalid displays error message from server
- [x] T030 [US2] Create `deployer/src/commands/logout.ts` — `executeLogout()` function: calls credential-store.deleteCredentials(), displays confirmation message
- [x] T031 [US2] Create `deployer/src/commands/license-status.ts` — `executeLicenseStatus()` function: reads key from credential-store, calls license-client.validate() to get fresh status, displays org name, tier, expiration date, entitled assets list in formatted output using chalk
- [x] T032 [US2] Register login, logout, and license-status commands in `deployer/bin/speckit.ts` — add `speckit login` (--key option), `speckit logout`, `speckit license status` subcommands with dynamic imports

**Checkpoint**: Full authentication flow works: login validates key, stores locally, status shows entitlements, logout clears credentials

---

## Phase 5: User Story 3 — Developer Deploys Licensed Assets (Priority: P2)

**Goal**: Authenticated developers can deploy premium assets from the registry using the same `speckit deploy` workflow as free assets

**Independent Test**: Authenticate with Pro key, run `speckit deploy ./project --skills premium-skill`, verify skill files are written. Try without auth — verify "license required" message.

### Implementation for User Story 3

- [x] T033 [P] [US3] Create `license-server/src/services/asset-service.ts` — functions: `getAsset(name)` returns asset metadata, `getAssetVersion(name, version?)` returns specific or latest version, `getAssetContent(name, version?)` returns content archive from Supabase Storage, `listAssets(type?, tier?)` returns filtered asset list
- [x] T035 [US3] Create `license-server/src/routes/registry.ts` — Express router implementing registry-api.yaml: GET `/api/v1/registry/assets/:assetName` (serves content archive with X-Asset-Version, X-Asset-Checksum, X-Asset-Tier headers, increments deploy_count on the license key per FR-011), GET `/api/v1/registry/assets/:assetName/metadata` (returns asset metadata), GET `/api/v1/registry/catalog` (returns accessible assets filtered by key entitlements). Uses license-auth middleware. Implements entitlement check: tier >= asset tier AND asset name in entitled_assets array. Returns 403 with tier_insufficient or not_entitled error codes.
- [x] T036 [US3] Register registry routes in `license-server/src/index.ts` — mount at `/api/v1` with license-auth middleware
- [x] T037 [US3] Create `deployer/src/license/entitlement-checker.ts` — `checkEntitlement(assetName, assetTier): Promise<EntitlementCheckResult>` reads credential store, calls registry metadata endpoint, determines if deploy is allowed, returns result with allow/deny and user-facing message
- [x] T038 [US3] Create `deployer/src/registry/registry-client.ts` — HTTP client: `fetchAsset(name, version?): Promise<Buffer>` calls GET registry/assets/:name with X-License-Key header, returns content archive buffer. `fetchCatalog(type?): Promise<CatalogEntry[]>` calls GET registry/catalog. `fetchMetadata(name): Promise<AssetMetadata>`. Handles all error codes from registry-api.yaml with user-friendly chalk-formatted messages.
- [x] T039 [US3] Modify `deployer/src/commands/deploy.ts` — before deploying each asset, check if it exists in local library (free) or requires registry fetch. If registry: call entitlement-checker, if denied display appropriate message (login prompt, upgrade prompt, or add-to-subscription prompt per US3 acceptance scenarios 2-5), if allowed fetch via registry-client and deploy using same file structure. Mid-deployment revocation handling: if a key is revoked between asset fetches in the same deploy operation, fail gracefully with revocation notice for remaining assets while keeping already-fetched assets deployed (per edge case spec). Asset precedence: when an asset exists both locally (free) and in the registry (premium), use the registry version for authenticated users with entitlement, fall back to local for unauthenticated users.
- [x] T040 [US3] Modify `deployer/src/registry/asset-registry.ts` — extend `getAllAgents()`, `getAllSpecialties()`, `getAllTemplates()` to also query registry catalog when credentials are present, merge remote assets with local assets, mark remote assets with source indicator
- [x] T041 [US3] Modify `deployer/src/commands/list.ts` — when credentials are present, include licensed assets from registry catalog in the list output, indicate tier and entitlement status per asset
- [x] T042 [US3] Add `--version` option to deploy commands in `deployer/bin/speckit.ts` — pass version to registry-client for version-pinned deploys (FR-026)

**Checkpoint**: Full gated distribution works — free assets deploy locally, licensed assets fetched from registry with entitlement checks, clear error messages for all denial cases

---

## Phase 6: User Story 4 — Admin Issues and Revokes License Keys (Priority: P2)

**Goal**: Admins can create organizations, issue license keys with per-asset entitlements, revoke keys, and view audit logs

**Independent Test**: Login as admin, create an org, issue a key with entitled_assets, verify a developer can use that key, revoke it, verify developer is denied.

### Implementation for User Story 4

- [x] T034 [P] [US4] Create `license-server/src/services/org-service.ts` — functions: `getOrganization(id)`, `createOrganization(data)`, `updateOrganization(id, data)`, `listOrganizations(filters)`
- [x] T043 [P] [US4] Create `license-server/src/routes/organizations.ts` — Express router implementing license-server.yaml: GET `/organizations` (list with tier/status filters), POST `/organizations` (create), GET `/organizations/:orgId` (detail with keys summary), PATCH `/organizations/:orgId` (update). All require admin-auth middleware. All mutations log via audit-service.
- [x] T044 [P] [US4] Create `license-server/src/services/key-service.ts` additions — functions: `createKey(orgId, tier, entitledAssets, expiresAt, createdBy): Promise<LicenseKeyFull>` generates sk_live_ + 32 hex chars, inserts into license_keys, logs key.create via audit-service, returns full key value (only time shown). `revokeKey(keyId, adminId, reason)` sets revoked_at and revoked_by, logs key.revoke. `updateEntitlements(keyId, entitledAssets, adminId)` updates entitled_assets array, logs via audit-service. `listKeys(filters)` returns keys with computed status.
- [x] T045 [US4] Create `license-server/src/routes/keys.ts` — Express router implementing license-server.yaml: GET `/keys` (list with org_id/status filters), POST `/keys` (issue key), GET `/keys/:keyId` (detail), POST `/keys/:keyId/revoke` (revoke with optional reason), PUT `/keys/:keyId/entitlements` (update entitled assets). All require admin-auth middleware.
- [x] T046 [US4] Create `license-server/src/routes/audit.ts` — Express router: GET `/api/v1/audit-log` with query params (admin_id, action, since, limit max 200) per license-server.yaml. Requires admin-auth middleware.
- [x] T047 [US4] Register organizations, keys, and audit routes in `license-server/src/index.ts` — mount at `/api/v1` with admin-auth middleware
- [x] T048 [US4] Create `license-server/src/routes/assets-admin.ts` — Express router for admin asset management: GET `/assets` (list with type/tier filters), POST `/assets` (register new asset), POST `/assets/:assetName/versions` (publish new version via multipart upload to Supabase Storage). All require admin-auth middleware, log via audit-service.
- [x] T049 [US4] Register assets-admin routes in `license-server/src/index.ts`

**Checkpoint**: Full admin key management works — orgs created, keys issued with entitlements, keys revoked with audit trail, asset versions published

---

## Phase 7: User Story 5 — Enterprise Stub-Based Premium Assets (Priority: P3)

**Goal**: Enterprise assets deploy as thin stubs that resolve content from the registry at runtime with caching and TTL-based expiry

**Independent Test**: Deploy a stub-based skill, verify content resolves from registry, verify cache works offline within TTL, revoke key and verify stub stops resolving after TTL expires.

### Implementation for User Story 5

- [x] T050 [P] [US5] Create `deployer/src/stubs/stub-cache.ts` — functions: `getCachedContent(assetName, version): Promise<CacheResult | null>` reads from `~/.speckit/cache/{asset_name}/{version}/`, checks `.cache-meta.json` for expiry, returns content if valid or null. `writeCacheContent(assetName, version, content, ttl)` writes files + meta to cache dir. `clearCache(assetName?)` removes cache entries. CacheResult includes files and metadata.
- [x] T051 [P] [US5] Create `deployer/src/stubs/stub-resolver.ts` — `resolveStub(stubPath): Promise<ResolvedContent>` reads stub JSON from project, checks stub-cache for valid cached content, if cache miss or expired: reads key from credential-store, fetches from registry-client, writes to stub-cache, returns content. If key invalid/revoked and cache expired: returns error with "license no longer active" message. If offline and cache valid: serves from cache. If offline and cache expired: returns connectivity error.
- [x] T052 [US5] Create `deployer/src/stubs/stub-deployer.ts` — `deployStub(assetName, version, targetPath, registryUrl, ttl): Promise<void>` writes a stub JSON file to the target project: `{ speckit_stub: true, asset: assetName, version: version || "latest", registry: registryUrl, ttl: ttl || 86400, deployed_at: ISO timestamp }`. File placed at same path where full asset would go but with `.speckit-stub.json` extension.
- [x] T053 [US5] Modify `deployer/src/commands/deploy.ts` — for enterprise-tier assets when key is enterprise: use stub-deployer instead of full content deploy. Add `--stub` flag to force stub deployment. Add `--ttl` flag to override default 24h TTL.
- [x] T054 [US5] Add `speckit resolve <stub-path>` command in `deployer/bin/speckit.ts` — calls stub-resolver.resolveStub, outputs resolved content location or error message. Used by developers or tooling to manually resolve stubs.

**Checkpoint**: Stub deployment and resolution works — stubs deploy as lightweight JSON, resolve from registry with caching, honor TTL, handle revocation and offline scenarios

---

## Phase 8: User Story 6 — Developer Audits Licensed Assets in a Project (Priority: P3)

**Goal**: Developers can scan a project and see a report of all deployed SpecKit assets with their license tier and status

**Independent Test**: Deploy a mix of free and licensed assets into a project, run `speckit audit`, verify report shows correct names, types, tiers, and statuses.

### Implementation for User Story 6

- [x] T055 [P] [US6] Create `deployer/src/commands/audit.ts` — `executeAudit(targetPath)` function: scans target project for deployed SpecKit assets by checking speckit-version.json, .claude/ directory, Skills/ directory, Agents/ directory, and any .speckit-stub.json files. For each found asset: determines type, checks if it's a stub or full deploy, reads deployment metadata.
- [x] T056 [US6] Extend `deployer/src/commands/audit.ts` — for licensed assets: reads credential-store, calls registry-client.fetchMetadata to check current license status (active/expired/revoked) for each licensed asset. For stubs: reads stub JSON to determine asset name and checks status. Formats output as table using chalk: Name | Type | Tier | Status (with yellow/red warnings for expired/revoked). Handles offline gracefully (shows "status unknown — offline").
- [x] T057 [US6] Register audit command in `deployer/bin/speckit.ts` — add `speckit audit [target-path]` command (defaults to current directory), with `--json` option for machine-readable output

**Checkpoint**: Audit command works — scans project, reports all assets with license status, flags expired/revoked with warnings

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, error handling hardening, and distribution preparation

- [x] T058 [P] Add comprehensive error handling to all license-server routes — ensure every route returns structured ErrorResponse JSON per contracts, no stack traces leak to clients
- [x] T059 [P] Add request logging middleware to `license-server/src/index.ts` — log method, path, status code, response time for all requests
- [x] T060 [P] Update `deployer/src/commands/deploy.ts` — ensure free assets continue to deploy from local library when offline (no regression per SC-007), add graceful handling for registry unavailable
- [x] T061 Verify all CLI commands display chalk-formatted user-friendly messages per SC-008 — review login, logout, license-status, deploy, audit, resolve commands for consistent error message formatting
- [x] T062 Create `license-server/README.md` with setup instructions matching quickstart.md (Supabase project setup, env vars, migration, first admin creation, deployment)
- [x] T063 Run full quickstart.md verification checklist — execute all verification items from quickstart.md across CLI distribution, authentication, license server API, gated distribution, registry API, key revocation, stub-based deployment, and audit sections

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — CLI distribution is independent of server features
- **US2 (Phase 4)**: Depends on Phase 2 — needs credential-store and license-client from foundation
- **US3 (Phase 5)**: Depends on Phase 2 + Phase 4 (needs authentication flow working)
- **US4 (Phase 6)**: Depends on Phase 2 — admin routes can be built independently of CLI auth
- **US5 (Phase 7)**: Depends on Phase 5 (needs registry-client and entitlement-checker)
- **US6 (Phase 8)**: Depends on Phase 5 (needs registry-client for status checks)
- **Polish (Phase 9)**: Depends on all user story phases being complete

### User Story Dependencies

```text
Phase 1: Setup
    │
Phase 2: Foundational
    │
    ├── Phase 3: US1 (CLI Distribution)     ── independent
    ├── Phase 4: US2 (Authentication)        ── independent
    ├── Phase 6: US4 (Admin Key Mgmt)        ── independent
    │       │
    │   Phase 5: US3 (Gated Distribution)    ── needs US2 (auth) + US4 (keys exist)
    │       │
    │       ├── Phase 7: US5 (Stubs)         ── needs US3 (registry client)
    │       └── Phase 8: US6 (Audit)         ── needs US3 (registry client)
    │
Phase 9: Polish
```

### Within Each User Story

- Types/interfaces before implementations
- Services before routes/commands
- Server-side before client-side
- Core implementation before integration touches

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 can all run in parallel (different directories/files)
- **Phase 2**: T007-T011 (migrations) are sequential; T013, T014, T015, T016, T017 can all run in parallel
- **After Phase 2**: US1 (Phase 3), US2 (Phase 4), and US4 (Phase 6) can all start in parallel
- **Phase 5**: T033, T034 can run in parallel (different service files)
- **Phase 6**: T043, T044 can run in parallel (different files)
- **Phase 7**: T050, T051 can run in parallel (different files)
- **Phase 9**: T058, T059, T060 can all run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (CLI Distribution)
4. Complete Phase 4: User Story 2 (Authentication)
5. **STOP and VALIDATE**: Developers can install CLI globally, login with key, check status, logout
6. Deploy/demo if ready — this alone delivers value for internal team use

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (CLI Distribution) + US2 (Authentication) → **MVP: Team can install and authenticate**
3. US4 (Admin Key Management) → **Admins can issue and revoke keys**
4. US3 (Gated Distribution) → **Licensing model is live: premium deploys gated**
5. US5 (Stubs) → **Enterprise tier with instant revocation**
6. US6 (Audit) → **Compliance and troubleshooting**
7. Polish → **Production-ready**

Each increment adds value without breaking previous stories.
