export type Organization = {
  id: string;
  name: string;
};

export type UserRole = 'owner' | 'admin' | 'accountant' | 'viewer';

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type ChartOfAccount = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  is_active: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  email: string | null;
};

export type ExpenseStatus = 'draft' | 'approved' | 'reconciled';

export type Expense = {
  id: string;
  organization_id: string;
  amount: number;
  expense_date: string;
  status: ExpenseStatus;
  description: string | null;
  vendor_id: string | null;
  account_id: string;
  receipt_id: string | null;
};

export type ReceiptStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Receipt = {
  id: string;
  file_path: string;
  original_filename: string;
  ocr_status: ReceiptStatus;
  extracted_amount: number | null;
  extracted_date: string | null;
  extracted_vendor: string | null;
};
