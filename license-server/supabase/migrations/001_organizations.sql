-- Migration 001: Organizations table
-- The top-level client entity. Each organization holds one or more license keys.

CREATE TYPE billing_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE tier AS ENUM ('free', 'pro', 'enterprise');

CREATE TABLE organizations (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(255) NOT NULL UNIQUE,
  contact_email varchar(255) NOT NULL,
  billing_status billing_status NOT NULL DEFAULT 'active',
  tier         tier         NOT NULL DEFAULT 'free',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
