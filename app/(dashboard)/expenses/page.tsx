import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseTable } from "@/components/tables/ExpenseTable";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ExpensesPage() {
  const supabase = await createClient();

  const [
    { data: expenses },
    { data: vendors },
    { data: accounts },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, entities!vendor_id(id, name), chart_of_accounts!account_id(id, name)")
      .order("expense_date", { ascending: false }),
    supabase
      .from("entities")
      .select("id, name")
      .in("type", ["vendor", "both"])
      .order("name"),
    supabase
      .from("chart_of_accounts")
      .select("id, code, name")
      .eq("type", "expense")
      .eq("is_active", true)
      .order("code"),
  ]);

  const csvData = (expenses || [])
    .map((e: any) =>
      [
        e.expense_date,
        e.entities?.name || "",
        e.chart_of_accounts?.name || "",
        e.description || "",
        e.amount,
        e.status,
      ].join(",")
    )
    .join("\n");
  const csvHeader = "Date,Vendor,Category,Description,Amount,Status\n";
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvHeader + csvData)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your business expenses.</p>
        </div>
        <div className="flex gap-3">
          <a href={csvHref} download="expenses.csv">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </a>
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" /> New Expense
            </Link>
          </Button>
        </div>
      </div>

      <ExpenseTable
        initialData={expenses || []}
        vendors={vendors || []}
        accounts={accounts || []}
      />
    </div>
  );
}
