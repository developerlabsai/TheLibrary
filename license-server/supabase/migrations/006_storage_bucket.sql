-- Migration 006: Create Supabase Storage bucket for asset content archives
-- Private access — only the service role key can read/write.

INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-content', 'asset-content', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Only service_role can manage objects in this bucket
CREATE POLICY asset_content_service_role_only ON storage.objects
  FOR ALL
  USING (bucket_id = 'asset-content' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'asset-content' AND auth.role() = 'service_role');
