-- Create the receipts storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload receipts
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to read receipts
DROP POLICY IF EXISTS "Authenticated users can read receipts" ON storage.objects;
CREATE POLICY "Authenticated users can read receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete receipts
DROP POLICY IF EXISTS "Authenticated users can delete receipts" ON storage.objects;
CREATE POLICY "Authenticated users can delete receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
