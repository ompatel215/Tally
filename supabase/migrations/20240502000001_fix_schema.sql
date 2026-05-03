-- Fix expenses table: add missing columns the app relies on
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES entities(id),
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES chart_of_accounts(id);

-- Auto-create profile record when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- INSERT / UPDATE RLS policies (initial schema only had SELECT)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join organizations as themselves"
  ON organization_members FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert accounts for their orgs"
  ON chart_of_accounts FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Users can update accounts for their orgs"
  ON chart_of_accounts FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Users can insert vendors/customers for their orgs"
  ON entities FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Users can update vendors/customers for their orgs"
  ON entities FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Users can insert expenses for their orgs"
  ON expenses FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Users can update expenses for their orgs"
  ON expenses FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Users can insert receipts for their orgs"
  ON receipts FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Users can update receipts for their orgs"
  ON receipts FOR UPDATE USING (user_has_org_access(organization_id));
