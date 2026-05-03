-- Fix RLS policy for organizations to allow the creator to see the record during setup
-- The previous policy required membership, which created a chicken-and-egg problem during registration

DROP POLICY IF EXISTS "Users can view orgs they belong to" ON organizations;

CREATE POLICY "Users can view organizations"
  ON organizations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Ensure authenticated users can also insert organizations (already exists, but reinforcing)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
