# SpecKit License Server

Express API for managing license keys, organizations, and asset distribution for the SpecKit deployer.

## Prerequisites

- Node.js 18+
- Supabase project (PostgreSQL + Auth + Storage)

## Setup

1. **Create Supabase project** at [supabase.com](https://supabase.com)

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials:
   # SUPABASE_URL=https://your-project.supabase.co
   # SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   # SUPABASE_ANON_KEY=your-anon-key
   # PORT=3848
   ```

3. **Run database migrations** via Supabase Dashboard SQL Editor or CLI:
   ```bash
   # Apply migrations in order:
   # supabase/migrations/001_organizations.sql
   # supabase/migrations/002_admin_accounts.sql
   # supabase/migrations/003_license_keys.sql
   # supabase/migrations/004_assets.sql
   # supabase/migrations/005_admin_audit_log.sql
   # supabase/migrations/006_storage_bucket.sql
   ```

4. **Create first admin account**:
   ```bash
   npx tsx src/scripts/create-admin.ts --email admin@example.com --role super_admin
   ```

5. **Install dependencies and start**:
   ```bash
   npm install
   npm run dev
   ```

## API Overview

### Admin API (requires Bearer token)
- `POST /api/v1/admin/login` — Admin login
- `POST /api/v1/admin/logout` — Admin logout
- `GET/POST /api/v1/organizations` — List/create organizations
- `GET/PATCH /api/v1/organizations/:orgId` — Get/update organization
- `GET/POST /api/v1/keys` — List/issue license keys
- `GET /api/v1/keys/:keyId` — Get key details
- `POST /api/v1/keys/:keyId/revoke` — Revoke a key
- `PUT /api/v1/keys/:keyId/entitlements` — Update entitled assets
- `GET /api/v1/audit-log` — Query audit log
- `GET/POST /api/v1/assets` — List/register assets
- `POST /api/v1/assets/:name/versions` — Publish asset version

### CLI-Facing API
- `POST /api/v1/validate` — Validate a license key
- `GET /api/v1/registry/assets/:name` — Download asset content
- `GET /api/v1/registry/assets/:name/metadata` — Asset metadata
- `GET /api/v1/registry/catalog` — Browse accessible assets
- `GET /api/v1/health` — Health check

## License Tiers

| Tier | Access |
|------|--------|
| Free | Community assets, no key required |
| Pro | Gated distribution, full content deploy |
| Enterprise | Thin stubs with runtime resolution, instant revocation |
