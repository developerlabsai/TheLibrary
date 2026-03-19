-- Migration 002: Admin accounts table
-- Individual administrator accounts linked to Supabase Auth users.

CREATE TYPE admin_role AS ENUM ('admin', 'super_admin');

CREATE TABLE admin_accounts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username     varchar(100) NOT NULL UNIQUE,
  role         admin_role  NOT NULL DEFAULT 'admin',
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
