-- Add phone column to entities
ALTER TABLE entities ADD COLUMN IF NOT EXISTS phone TEXT;

-- UPDATE policy for organizations (needed for settings)
DROP POLICY IF EXISTS "Users can update their orgs" ON organizations;
CREATE POLICY "Users can update their orgs"
  ON organizations FOR UPDATE USING (user_has_org_access(id));

-- DELETE policies
DROP POLICY IF EXISTS "Users can delete expenses for their orgs" ON expenses;
CREATE POLICY "Users can delete expenses for their orgs"
  ON expenses FOR DELETE USING (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can delete entities for their orgs" ON entities;
CREATE POLICY "Users can delete entities for their orgs"
  ON entities FOR DELETE USING (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can delete accounts for their orgs" ON chart_of_accounts;
CREATE POLICY "Users can delete accounts for their orgs"
  ON chart_of_accounts FOR DELETE USING (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can delete receipts for their orgs" ON receipts;
CREATE POLICY "Users can delete receipts for their orgs"
  ON receipts FOR DELETE USING (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can delete journal entries for their orgs" ON journal_entries;
CREATE POLICY "Users can delete journal entries for their orgs"
  ON journal_entries FOR DELETE USING (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can delete transactions for their orgs" ON transactions;
CREATE POLICY "Users can delete transactions for their orgs"
  ON transactions FOR DELETE USING (user_has_org_access(organization_id));

-- INSERT + UPDATE policies for journal_entries and transactions (needed for deposits)
DROP POLICY IF EXISTS "Users can insert journal entries for their orgs" ON journal_entries;
CREATE POLICY "Users can insert journal entries for their orgs"
  ON journal_entries FOR INSERT WITH CHECK (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can update journal entries for their orgs" ON journal_entries;
CREATE POLICY "Users can update journal entries for their orgs"
  ON journal_entries FOR UPDATE USING (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can insert transactions for their orgs" ON transactions;
CREATE POLICY "Users can insert transactions for their orgs"
  ON transactions FOR INSERT WITH CHECK (user_has_org_access(organization_id));

DROP POLICY IF EXISTS "Users can update transactions for their orgs" ON transactions;
CREATE POLICY "Users can update transactions for their orgs"
  ON transactions FOR UPDATE USING (user_has_org_access(organization_id));

-- RPC function to record a deposit atomically (balanced double-entry)
-- Debits the asset account (e.g. checking), credits the income account
CREATE OR REPLACE FUNCTION record_deposit(
  p_org_id UUID,
  p_date DATE,
  p_description TEXT,
  p_amount NUMERIC,
  p_debit_account_id UUID,
  p_credit_account_id UUID,
  p_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journal_entry_id UUID;
BEGIN
  INSERT INTO journal_entries (organization_id, date, description, created_by)
  VALUES (p_org_id, p_date, p_description, p_user_id)
  RETURNING id INTO v_journal_entry_id;

  INSERT INTO transactions (organization_id, journal_entry_id, account_id, debit, credit)
  VALUES
    (p_org_id, v_journal_entry_id, p_debit_account_id, p_amount, 0),
    (p_org_id, v_journal_entry_id, p_credit_account_id, 0, p_amount);

  RETURN v_journal_entry_id;
END;
$$;
