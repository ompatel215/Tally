import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Receipt, 
  CreditCard,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Fetch data for metrics
  const { data: expenses } = await supabase.from('expenses').select('amount');
  const { count: pendingReceipts } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('ocr_status', 'pending');

  const totalExpenses = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  
  // Note: For revenue, we would normally fetch from 'deposits' or 'journal_entries' 
  // with a revenue account type. Mocking revenue for now but using real expense sum.
  const totalRevenue = 45231.89; 
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's what's happening with your business today.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/receipts/upload">Upload Receipt</Link>
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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-emerald-500 flex items-center">
                <ArrowUpRight className="h-3 w-3" /> +20.1%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-rose-500 flex items-center">
                <ArrowDownRight className="h-3 w-3" /> +4.5%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReceipts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-emerald-500 flex items-center">
                <ArrowUpRight className="h-3 w-3" /> +12.2%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <CashFlowChart />
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Expense at Starbucks
                    </p>
                    <p className="text-sm text-muted-foreground">
                      May 12, 2024
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-rose-500">
                    -$12.50
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
