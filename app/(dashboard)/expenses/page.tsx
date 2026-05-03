import { Plus, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseTable } from "@/components/tables/ExpenseTable";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/server";

export default async function ExpensesPage() {
  const supabase = await createClient();
  
  // Fetch expenses for the current session user (RLS handles isolation)
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*, entities(name), chart_of_accounts(name)')
    .order('expense_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your business expenses.</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Time</DropdownMenuItem>
              <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem>Uncategorized</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>

          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" /> New Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Pass the real data to the table, with a fallback to mock if empty for this prototype */}
        <ExpenseTable initialData={expenses || []} />
      </div>
    </div>
  );
}
