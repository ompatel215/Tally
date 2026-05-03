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
import { format } from "date-fns";
import { ExpenseStatus } from "@/types";

const statusColors: Record<ExpenseStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-700",
  reconciled: "bg-blue-100 text-blue-700",
};

interface ExpenseTableProps {
  initialData?: any[];
}

export function ExpenseTable({ initialData = [] }: ExpenseTableProps) {
  if (initialData.length === 0) {
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
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No expenses yet. Add your first expense to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

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
          {initialData.map((expense) => {
            const vendorName = expense.entities?.name || "—";
            const accountName = expense.chart_of_accounts?.name || "—";
            return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {format(new Date(expense.expense_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{vendorName}</TableCell>
                <TableCell>{accountName}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.description || "—"}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${Number(expense.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[expense.status as ExpenseStatus] || statusColors.draft}
                    variant="secondary"
                  >
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
