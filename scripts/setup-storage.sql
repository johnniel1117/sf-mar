-- This script creates the storage bucket for damage report photos
-- Run this in your Supabase dashboard or via the management API

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-report-photos', 'damage-report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'damage-report-photos');

CREATE POLICY "Allow authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'damage-report-photos');

CREATE POLICY "Allow authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'damage-report-photos')
  WITH CHECK (bucket_id = 'damage-report-photos');

CREATE POLICY "Allow authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'damage-report-photos');
