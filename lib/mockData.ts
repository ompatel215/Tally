import { Expense, ChartOfAccount, Vendor, Receipt, Organization } from "@/types";

export const mockOrganizations: Organization[] = [
  { id: "org-1", name: "Acme Corp" },
  { id: "org-2", name: "Global Logistics" },
];

export const mockAccounts: ChartOfAccount[] = [
  { id: "acc-1", code: "6000", name: "Advertising & Marketing", type: "expense", is_active: true },
  { id: "acc-2", code: "6100", name: "Office Supplies", type: "expense", is_active: true },
  { id: "acc-3", code: "6200", name: "Travel & Meals", type: "expense", is_active: true },
  { id: "acc-4", code: "6300", name: "Software & Subscriptions", type: "expense", is_active: true },
  { id: "acc-5", code: "1000", name: "Checking Account", type: "asset", is_active: true },
];

export const mockVendors: Vendor[] = [
  { id: "ven-1", name: "Amazon", email: "support@amazon.com" },
  { id: "ven-2", name: "Google Cloud", email: "billing@google.com" },
  { id: "ven-3", name: "Office Depot", email: "info@officedepot.com" },
  { id: "ven-4", name: "Starbucks", email: null },
];

export const mockExpenses: Expense[] = [
  {
    id: "exp-1",
    organization_id: "org-1",
    amount: 125.50,
    expense_date: "2024-05-01",
    status: "approved",
    description: "New office chairs",
    vendor_id: "ven-3",
    account_id: "acc-2",
    receipt_id: "rec-1",
  },
  {
    id: "exp-2",
    organization_id: "org-1",
    amount: 45.00,
    expense_date: "2024-05-02",
    status: "draft",
    description: "Client lunch",
    vendor_id: "ven-4",
    account_id: "acc-3",
    receipt_id: null,
  },
  {
    id: "exp-3",
    organization_id: "org-1",
    amount: 299.00,
    expense_date: "2024-04-28",
    status: "reconciled",
    description: "Cloud hosting",
    vendor_id: "ven-2",
    account_id: "acc-4",
    receipt_id: "rec-2",
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: "rec-1",
    file_path: "/receipts/rec1.jpg",
    original_filename: "office_depot_chair.jpg",
    ocr_status: "completed",
    extracted_amount: 125.50,
    extracted_date: "2024-05-01",
    extracted_vendor: "Office Depot",
  },
  {
    id: "rec-2",
    file_path: "/receipts/rec2.jpg",
    original_filename: "google_bill.jpg",
    ocr_status: "completed",
    extracted_amount: 299.00,
    extracted_date: "2024-04-28",
    extracted_vendor: "Google Cloud",
  },
  {
    id: "rec-3",
    file_path: "/receipts/rec3.jpg",
    original_filename: "amazon_supplies.jpg",
    ocr_status: "processing",
    extracted_amount: null,
    extracted_date: null,
    extracted_vendor: null,
  },
];
