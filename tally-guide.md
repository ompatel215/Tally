# Tally - Financial Management Application

## 🌟 What Tally Can Do

Tally is a comprehensive financial dashboard application built with Next.js and Supabase. It enables organizations to manage their accounts, expenses, deposits, and vendor relationships in a unified interface. 

**Key Features:**
- **Automated Receipt Processing:** Upload receipts and automatically extract the amount, date, and vendor using integrated OCR processing.
- **Expense Tracking:** Manage business expenses through customizable approval workflows (`draft`, `approved`, `reconciled`).
- **Chart of Accounts:** Organize finances with standard account types (assets, liabilities, equity, revenue, and expenses).
- **Vendor Management:** Maintain a directory of your vendors and link them directly to expenses.
- **Role-Based Access Control:** Manage access for different users within an organization (`owner`, `admin`, `accountant`, `viewer`).

## 🚀 How to Use Tally

### 1. Getting Started
- **Start the Application:** Run `npm run dev` in your terminal to launch the development server.
- **Access the App:** Open your browser and navigate to `http://localhost:3000`.
- **Authentication:** You will be greeted by the login or register screen. Sign up or log in to access the main dashboard.

### 2. Navigating the Dashboard
Once logged in, the sidebar provides access to all core modules:
- **Dashboard:** A high-level overview of your cash flow and recent financial activities.
- **Expenses:** Create new expenses, link them to vendors, assign them to accounts, and track their status from draft to reconciled.
- **Receipts:** Upload receipts here. The built-in OCR feature will attempt to extract the key details for you to convert them directly into expenses.
- **Deposits:** Record incoming funds and link them to your revenue accounts.
- **Accounts:** Define and manage your custom Chart of Accounts.
- **Vendors:** Keep track of the people and companies you do business with.
- **Reports:** Generate and view financial reports and cash flow charts.
- **Settings:** Manage your organization's details, team member roles, and individual user profiles.

### 3. Typical Workflow
1. Start by navigating to **Accounts** and **Vendors** to set up your basic financial structure and contacts.
2. Go to **Receipts** to upload invoices or receipts. The system will automatically process the image using OCR.
3. Once processed, use the extracted data to quickly generate **Expenses**, linking the vendor and the appropriate expense account.
4. Review the **Dashboard** and **Reports** regularly to monitor cash flow and organizational spending.
