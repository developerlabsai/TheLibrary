-- Migration 004: Assets and asset_versions tables
-- Registry of all deployable assets with tier classification and version history.

CREATE TYPE asset_type AS ENUM ('agent', 'skill', 'template', 'package');

CREATE TABLE assets (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar(100) NOT NULL UNIQUE,
  type            asset_type   NOT NULL,
  tier            tier         NOT NULL DEFAULT 'free',
  description     text,
  current_version varchar(20)  NOT NULL,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

-- Index for fast asset lookup by name
CREATE UNIQUE INDEX idx_assets_name ON assets(name);

-- Auto-update updated_at
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE asset_versions (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      uuid         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  version       varchar(20)  NOT NULL,
  storage_path  varchar(500) NOT NULL,
  checksum      varchar(64)  NOT NULL,
  file_manifest jsonb        NOT NULL,
  published_at  timestamptz  NOT NULL DEFAULT now(),
  published_by  uuid         NOT NULL REFERENCES admin_accounts(id),
  UNIQUE(asset_id, version)
);
