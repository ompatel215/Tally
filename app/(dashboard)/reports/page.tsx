import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [
    { data: expenses },
    { data: entities },
    { data: accounts },
  ] = await Promise.all([
    supabase.from("expenses").select("amount, expense_date, description, entities(name), chart_of_accounts!account_id(name, type)"),
    supabase.from("entities").select("id, name, type"),
    supabase.from("chart_of_accounts").select("id, name, type").eq("type", "expense"),
  ]);

  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  const byAccount = (accounts ?? []).map((acc) => {
    const total = (expenses ?? [])
      .filter((e: any) => e.chart_of_accounts?.name === acc.name)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { name: acc.name, total };
  }).filter((a) => a.total > 0).sort((a, b) => b.total - a.total);

  const byVendor = (entities ?? []).map((v) => {
    const total = (expenses ?? [])
      .filter((e: any) => e.entities?.name === v.name)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { name: v.name, total };
  }).filter((v) => v.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Overview of your financial activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{expenses?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{entities?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {byAccount.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {byAccount.map((a) => (
                  <div key={a.name} className="flex justify-between items-center">
                    <span className="text-sm">{a.name}</span>
                    <span className="text-sm font-medium">${a.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            {byVendor.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {byVendor.map((v) => (
                  <div key={v.name} className="flex justify-between items-center">
                    <span className="text-sm">{v.name}</span>
                    <span className="text-sm font-medium">${v.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
