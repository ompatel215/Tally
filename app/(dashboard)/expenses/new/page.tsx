import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewExpensePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Expense</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Accounting Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                <strong>Receipts:</strong> Always attach a receipt for expenses over $75 to comply with tax regulations.
              </p>
              <p>
                <strong>Categories:</strong> If you're unsure of the category, use "Office Supplies" and your accountant can reclassify it later.
              </p>
              <p>
                <strong>Reconciliation:</strong> Transactions are matched against your bank statement automatically if the amount and date are within 3 days.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
