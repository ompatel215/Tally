import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { name: format(d, "MMM"), year: d.getFullYear(), month: d.getMonth() };
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const months = getLast6Months();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    { data: expenses },
    { count: pendingReceipts },
    { data: recentExpenses },
    { data: monthlyExpenses },
    { data: revenueTransactions },
  ] = await Promise.all([
    supabase.from("expenses").select("amount"),
    supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("ocr_status", "pending"),
    supabase
      .from("expenses")
      .select("id, expense_date, amount, description, entities(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("expenses")
      .select("expense_date, amount")
      .gte("expense_date", sixMonthsAgo.toISOString().split("T")[0]),
    supabase
      .from("transactions")
      .select("credit, created_at, chart_of_accounts!account_id(type)")
      .gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  const totalExpenses =
    expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  const totalRevenue =
    (revenueTransactions ?? [])
      .filter((t: any) => t.chart_of_accounts?.type === "revenue")
      .reduce((acc: number, t: any) => acc + Number(t.credit), 0);

  const netProfit = totalRevenue - totalExpenses;

  const chartData = months.map(({ name, year, month }) => {
    const monthlyExpenseTotal = (monthlyExpenses ?? [])
      .filter((e) => {
        const d = new Date(e.expense_date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const monthlyIncomeTotal = (revenueTransactions ?? [])
      .filter((t: any) => {
        if (t.chart_of_accounts?.type !== "revenue") return false;
        const d = new Date(t.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum: number, t: any) => sum + Number(t.credit), 0);

    return { name, income: monthlyIncomeTotal, expenses: monthlyExpenseTotal };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/receipts">Upload Receipt</Link>
          </Button>
          <Button asChild>
            <Link href="/expenses/new">Add Expense</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From revenue accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Total recorded expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReceipts || 0}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit < 0 ? "text-rose-500" : ""}`}>
              {netProfit < 0 ? "-" : ""}${Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <CashFlowChart data={chartData} />
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentExpenses || recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses yet. Add your first expense.
              </p>
            ) : (
              <div className="space-y-8">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {expense.description || (expense as any).entities?.name || "Expense"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(expense.expense_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-rose-500">
                      -${Number(expense.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
