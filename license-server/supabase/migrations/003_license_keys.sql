-- Migration 003: License keys table
-- Credentials issued to organizations for accessing premium assets.

CREATE TABLE license_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value       varchar(64) NOT NULL UNIQUE,
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  tier            tier        NOT NULL,
  entitled_assets text[]      NOT NULL DEFAULT '{}',
  expires_at      timestamptz,
  revoked_at      timestamptz,
  revoked_by      uuid        REFERENCES admin_accounts(id),
  last_used_at    timestamptz,
  deploy_count    integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        NOT NULL REFERENCES admin_accounts(id)
);

-- Index for fast key lookup on every CLI request
CREATE UNIQUE INDEX idx_license_keys_key_value ON license_keys(key_value);

-- Index for listing keys by organization
CREATE INDEX idx_license_keys_org_id ON license_keys(org_id);
