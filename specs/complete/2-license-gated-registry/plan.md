# Implementation Plan: License-Gated Registry & CLI Distribution Platform

**Branch**: `2-license-gated-registry` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/2-license-gated-registry/spec.md`

## Summary

Build a three-tier licensing system for TheLibrary's SpecKit deployer: (1) prepare the CLI for global npm distribution, (2) add a license server API with per-admin authentication for key management, (3) add a registry API for serving premium assets to authenticated clients, (4) integrate gated distribution and stub-based deployment into the existing CLI. The license model uses tier + per-asset entitlements, with latest-by-default versioning and optional pinning.

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 target, ESNext modules)
**Primary Dependencies**: Commander.js (CLI), Express (API server), fs-extra (file ops), chalk (output), Supabase (license server database + auth)
**Storage**: Supabase PostgreSQL (license keys, organizations, admin accounts, asset metadata); local filesystem (`~/.speckit/credentials` for CLI auth)
**Testing**: Vitest (unit + integration)
**Target Platform**: CLI (Node.js 18+), Server (Express on cloud, backed by Supabase)
**Project Type**: CLI tool (deployer) + API server (license-server)
**Performance Goals**: CLI login < 10s, asset deploy latency parity with local, registry API < 500ms p95
**Constraints**: Free assets must work fully offline from local library; licensed assets require network; stub cache TTL default 24h
**Scale/Scope**: Dozens of assets, hundreds of license keys, small admin team (< 10 admins)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                            | Status | Notes                                                                                    |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| VII. Deviation Prevention            | PASS   | Plan checked against spec; no scope drift                                                |
| XI. Context-First Decision Making    | PASS   | Full spec + clarifications reviewed before planning                                      |
| XII. Confirmation Points             | PASS   | User confirmed all 3 clarifications; plan requires approval before implementation        |
| III. API-First Development           | PASS   | License server and registry APIs designed contract-first (OpenAPI in contracts/)          |
| V. SOC 2 / Audit Logging            | PASS   | FR-025 requires admin action logging; FR-011 requires usage metadata tracking            |
| VIII. Token Conservation             | PASS   | Concise responses, structured tool usage                                                 |
| IX. Structured Tools                 | PASS   | Using Read/Edit/Write over bash file ops                                                 |
| X. Code Quality                      | PASS   | TypeScript strict mode, type annotations, test requirements                              |
| XVII. Research Phase                 | PASS   | Research conducted in research.md                                                        |
| XIX. Implementation Phase            | PASS   | Implementation follows plan artifacts                                                    |
| XX. Automation Patterns              | PASS   | Stub resolver uses Pattern 4 (Loop) with hard TTL exit; registry uses Pattern 2 (Filter-Fan) with tier/entitlement routing and reject catch-all |
| I. CRM-First Architecture            | N/A    | Not a CRM feature                                                                        |
| II. Plugin Ecosystem                 | N/A    | Not a plugin; core platform capability                                                   |
| IV. Client Isolation                 | PASS   | License keys are scoped per-organization; no cross-org data leakage                      |
| VI. Cost Tracking                    | N/A    | No billable external API calls in this feature                                           |
| XIV. UI/UX First Design             | N/A    | CLI-only; admin web UI deferred to later phase                                           |
| XV. AWS-Only Infrastructure          | N/A    | Not Slack List Processor                                                                 |
| XVI. MCP-First Research              | N/A    | No MCP research tools needed for this CLI/API feature                                    |

## Project Structure

### Documentation (this feature)

```text
specs/2-license-gated-registry/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   ├── license-server.yaml
│   └── registry-api.yaml
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
deployer/
├── bin/speckit.ts                    # CLI entry (add login, logout, license, audit commands)
├── src/
│   ├── commands/
│   │   ├── login.ts                  # NEW: speckit login
│   │   ├── logout.ts                 # NEW: speckit logout
│   │   ├── license-status.ts         # NEW: speckit license status
│   │   ├── audit.ts                  # NEW: speckit audit
│   │   ├── deploy.ts                 # MODIFY: add license check before premium deploys
│   │   └── ... (existing)
│   ├── license/
│   │   ├── license-client.ts         # NEW: HTTP client for license server API
│   │   ├── credential-store.ts       # NEW: read/write ~/.speckit/credentials
│   │   └── entitlement-checker.ts    # NEW: check tier + per-asset entitlements
│   ├── registry/
│   │   ├── registry-client.ts        # NEW: HTTP client for registry API (fetch assets)
│   │   ├── asset-registry.ts         # MODIFY: add remote asset resolution
│   │   └── package-registry.ts       # EXISTING
│   ├── stubs/
│   │   ├── stub-deployer.ts          # NEW: deploy thin stubs for enterprise assets
│   │   ├── stub-resolver.ts          # NEW: resolve stubs at runtime with cache + TTL
│   │   └── stub-cache.ts             # NEW: local cache with TTL management
│   ├── deployers/
│   │   └── ... (existing, modify to check entitlements)
│   └── types.ts                      # MODIFY: add license/registry types

license-server/
├── package.json
├── tsconfig.json
├── supabase/
│   └── migrations/
│       ├── 001_organizations.sql
│       ├── 002_admin_accounts.sql
│       ├── 003_license_keys.sql
│       ├── 004_assets.sql
│       └── 005_admin_audit_log.sql
├── src/
│   ├── index.ts                      # Express server entry
│   ├── routes/
│   │   ├── auth.ts                   # Admin login/session
│   │   ├── keys.ts                   # CRUD license keys
│   │   ├── organizations.ts          # CRUD organizations
│   │   ├── registry.ts               # Asset content serving
│   │   └── health.ts                 # Health check
│   ├── middleware/
│   │   ├── admin-auth.ts             # Per-admin session validation
│   │   └── license-auth.ts           # License key validation for registry
│   ├── services/
│   │   ├── key-service.ts            # Key issuance, revocation, validation
│   │   ├── org-service.ts            # Organization management
│   │   ├── asset-service.ts          # Asset content + versioning
│   │   └── audit-service.ts          # Admin action logging
│   └── types.ts                      # Server-side types
└── tests/
    ├── keys.test.ts
    ├── registry.test.ts
    └── entitlements.test.ts

dashboard/
├── src/
│   ├── pages/                        # MODIFY: add license status panel
│   └── ... (existing)
```

**Structure Decision**: Two-project structure. The deployer (CLI) remains in `deployer/`. A new `license-server/` project houses the license + registry API as a standalone Express server backed by Supabase. This keeps the CLI lightweight (no server dependencies bundled) and allows the license server to be deployed independently.

## Complexity Tracking

No constitution violations requiring justification. The two-project structure is the minimum needed: the CLI cannot host a persistent server, and the license server must be independently deployable.
