"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockExpenses, mockVendors, mockAccounts } from "@/lib/mockData";
import { format } from "date-fns";
import { Expense, ExpenseStatus } from "@/types";

const statusColors: Record<ExpenseStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-700",
  reconciled: "bg-blue-100 text-blue-700",
};

interface ExpenseTableProps {
  initialData?: any[];
}

export function ExpenseTable({ initialData }: ExpenseTableProps) {
  // Use real data if available, otherwise fallback to mock for the demo
  const displayData = initialData && initialData.length > 0 ? initialData : mockExpenses;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((expense) => {
            // Support both mock structure and Supabase joined structure
            const vendorName = expense.entities?.name || mockVendors.find(v => v.id === expense.vendor_id)?.name || "N/A";
            const accountName = expense.chart_of_accounts?.name || mockAccounts.find(a => a.id === expense.account_id)?.name || "N/A";
            
            return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {format(new Date(expense.expense_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{vendorName}</TableCell>
                <TableCell>{accountName}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.description}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${Number(expense.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[expense.status as ExpenseStatus] || statusColors.draft} variant="secondary">
                    {expense.status.toUpperCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
