-- Migration 005: Admin audit log
-- Immutable log of all admin actions for compliance and troubleshooting.
-- INSERT only — no UPDATE or DELETE operations permitted.

CREATE TABLE admin_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid        NOT NULL REFERENCES admin_accounts(id),
  action      varchar(50) NOT NULL,
  target_type varchar(50) NOT NULL,
  target_id   uuid,
  details     jsonb,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for time-range queries and action filtering
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);

-- Row Level Security: INSERT only, no UPDATE/DELETE
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Explicitly deny UPDATE and DELETE via no policy (RLS default deny)
