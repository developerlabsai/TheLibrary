# Data Model: License-Gated Registry & CLI Distribution Platform

**Feature Branch**: `2-license-gated-registry`
**Date**: 2026-03-19

## Entities

### organizations

The top-level client entity. Each organization holds one or more license keys.

| Field            | Type         | Constraints                        | Description                         |
| ---------------- | ------------ | ---------------------------------- | ----------------------------------- |
| id               | uuid         | PK, auto-generated                 | Unique identifier                   |
| name             | varchar(255) | NOT NULL, UNIQUE                   | Organization display name           |
| contact_email    | varchar(255) | NOT NULL                           | Primary contact email               |
| billing_status   | enum         | NOT NULL, default 'active'         | active, suspended, cancelled        |
| tier             | enum         | NOT NULL, default 'free'           | free, pro, enterprise               |
| created_at       | timestamptz  | NOT NULL, default now()            | Record creation timestamp           |
| updated_at       | timestamptz  | NOT NULL, default now()            | Last modification timestamp         |

### license_keys

Credentials issued to organizations for accessing premium assets.

| Field            | Type         | Constraints                        | Description                         |
| ---------------- | ------------ | ---------------------------------- | ----------------------------------- |
| id               | uuid         | PK, auto-generated                 | Unique identifier                   |
| key_value        | varchar(64)  | NOT NULL, UNIQUE, indexed          | The actual key (sk_live_... or sk_test_...) |
| org_id           | uuid         | FK → organizations.id, NOT NULL    | Owning organization                 |
| tier             | enum         | NOT NULL                           | free, pro, enterprise               |
| entitled_assets  | text[]       | NOT NULL, default '{}'             | Array of asset names this key can access |
| expires_at       | timestamptz  | NULL (null = never expires)        | Expiration timestamp                |
| revoked_at       | timestamptz  | NULL (null = not revoked)          | When key was revoked                |
| revoked_by       | uuid         | FK → admin_accounts.id, NULL       | Admin who revoked the key           |
| last_used_at     | timestamptz  | NULL                               | Last CLI usage timestamp            |
| deploy_count     | integer      | NOT NULL, default 0                | Total deploy operations using this key |
| created_at       | timestamptz  | NOT NULL, default now()            | Key issuance timestamp              |
| created_by       | uuid         | FK → admin_accounts.id, NOT NULL   | Admin who created the key           |

**Validation rules**:
- `key_value` must match pattern `^sk_(live|test)_[a-f0-9]{32}$`
- `tier` must be one of: free, pro, enterprise
- A key is considered valid when: `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`
- `entitled_assets` contains asset names (not IDs) for human-readable entitlement checks

**State transitions**:
- `active` → `revoked` (via admin revocation; sets `revoked_at` and `revoked_by`)
- `active` → `expired` (when `expires_at` passes; no state change in DB, computed at query time)
- Revocation is permanent; a revoked key cannot be reactivated (issue a new key instead)

### admin_accounts

Individual administrator accounts for managing the license server.

| Field            | Type         | Constraints                        | Description                         |
| ---------------- | ------------ | ---------------------------------- | ----------------------------------- |
| id               | uuid         | PK, auto-generated                 | Unique identifier                   |
| auth_user_id     | uuid         | FK → auth.users.id, UNIQUE         | Supabase Auth user reference        |
| username         | varchar(100) | NOT NULL, UNIQUE                   | Display username                    |
| role             | enum         | NOT NULL, default 'admin'          | admin, super_admin                  |
| created_at       | timestamptz  | NOT NULL, default now()            | Account creation timestamp          |
| last_login_at    | timestamptz  | NULL                               | Last successful login               |

**Validation rules**:
- `role` must be one of: admin, super_admin
- `super_admin` can create/delete other admin accounts; `admin` can only manage keys and orgs
- `auth_user_id` links to Supabase Auth's internal user table for password management

### assets

Registry of all deployable assets with tier classification.

| Field            | Type         | Constraints                        | Description                         |
| ---------------- | ------------ | ---------------------------------- | ----------------------------------- |
| id               | uuid         | PK, auto-generated                 | Unique identifier                   |
| name             | varchar(100) | NOT NULL, UNIQUE, indexed          | Asset identifier (e.g., 'research-agent') |
| type             | enum         | NOT NULL                           | agent, skill, template, package     |
| tier             | enum         | NOT NULL, default 'free'           | Minimum tier required: free, pro, enterprise |
| description      | text         | NULL                               | Human-readable description          |
| current_version  | varchar(20)  | NOT NULL                           | Latest published version (semver)   |
| created_at       | timestamptz  | NOT NULL, default now()            | Asset registration timestamp        |
| updated_at       | timestamptz  | NOT NULL, default now()            | Last update timestamp               |

**Validation rules**:
- `name` must match pattern `^[a-z0-9][a-z0-9-]*[a-z0-9]$` (lowercase, hyphens, no leading/trailing hyphen)
- `type` must be one of: agent, skill, template, package
- `tier` must be one of: free, pro, enterprise
- `current_version` must follow semver format `^\\d+\\.\\d+\\.\\d+$`

### asset_versions

Version history for each asset. Multiple versions are retained for version pinning.

| Field            | Type         | Constraints                        | Description                         |
| ---------------- | ------------ | ---------------------------------- | ----------------------------------- |
| id               | uuid         | PK, auto-generated                 | Unique identifier                   |
| asset_id         | uuid         | FK → assets.id, NOT NULL           | Parent asset                        |
| version          | varchar(20)  | NOT NULL                           | Semver version string               |
| storage_path     | varchar(500) | NOT NULL                           | Path in Supabase Storage bucket     |
| checksum         | varchar(64)  | NOT NULL                           | SHA-256 hash of content archive     |
| file_manifest    | jsonb        | NOT NULL                           | List of files in this version       |
| published_at     | timestamptz  | NOT NULL, default now()            | Version publication timestamp       |
| published_by     | uuid         | FK → admin_accounts.id, NOT NULL   | Admin who published this version    |

**Constraints**:
- UNIQUE(asset_id, version) — no duplicate versions for the same asset
- `storage_path` points to a tar.gz archive in Supabase Storage: `asset-content/{asset_name}/{version}/content.tar.gz`

### admin_audit_log

Immutable log of all admin actions for compliance and troubleshooting.

| Field            | Type         | Constraints                        | Description                         |
| ---------------- | ------------ | ---------------------------------- | ----------------------------------- |
| id               | uuid         | PK, auto-generated                 | Unique identifier                   |
| admin_id         | uuid         | FK → admin_accounts.id, NOT NULL   | Admin who performed the action      |
| action           | varchar(50)  | NOT NULL, indexed                  | Action type (see enum below)        |
| target_type      | varchar(50)  | NOT NULL                           | Entity type affected                |
| target_id        | uuid         | NULL                               | ID of affected entity               |
| details          | jsonb        | NULL                               | Additional context (before/after)   |
| ip_address       | inet         | NULL                               | Request source IP                   |
| created_at       | timestamptz  | NOT NULL, default now(), indexed   | Action timestamp                    |

**Action types**: `key.create`, `key.revoke`, `org.create`, `org.update`, `org.suspend`, `asset.publish`, `asset.update`, `admin.create`, `admin.delete`

**Immutability**: This table has no UPDATE or DELETE operations. INSERT only.

## Relationships

```text
organizations 1──N license_keys       (org has many keys)
admin_accounts 1──N license_keys      (admin creates keys, via created_by)
admin_accounts 1──N license_keys      (admin revokes keys, via revoked_by)
admin_accounts 1──N admin_audit_log   (admin performs actions)
assets 1──N asset_versions            (asset has many versions)
admin_accounts 1──N asset_versions    (admin publishes versions)
```

## Indexes

- `license_keys.key_value` — UNIQUE index for fast key lookup on every CLI request
- `license_keys.org_id` — for listing keys by organization
- `assets.name` — UNIQUE index for fast asset lookup by name
- `asset_versions(asset_id, version)` — UNIQUE composite for version pinning queries
- `admin_audit_log.created_at` — for time-range queries on audit history
- `admin_audit_log.action` — for filtering by action type

## Local Data (CLI-side, not in database)

### ~/.speckit/credentials (JSON file)

```json
{
  "key": "sk_live_abc123def456...",
  "registry": "https://registry.speckit.dev"
}
```

Permissions: `0600` (owner read/write only).

### ~/.speckit/cache/{asset_name}/{version}/ (directory)

Contains cached asset files for stub resolution. Each version directory includes:
- The actual asset files (as deployed by the registry)
- `.cache-meta.json`:
  ```json
  {
    "fetched_at": "2026-03-19T12:00:00Z",
    "expires_at": "2026-03-20T12:00:00Z",
    "checksum": "sha256:abc123...",
    "asset": "premium-research-agent",
    "version": "1.2.0"
  }
  ```
