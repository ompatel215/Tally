"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { ExpenseStatus } from "@/types";

const statusColors: Record<ExpenseStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-700",
  reconciled: "bg-blue-100 text-blue-700",
};

const editSchema = z.object({
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
    message: "Must be a positive number",
  }),
  expense_date: z.string().min(1, "Date is required"),
  vendor_id: z.string().optional(),
  account_id: z.string().min(1, "Account is required"),
  description: z.string().optional(),
});

type Vendor = { id: string; name: string };
type Account = { id: string; code: string; name: string };

interface ExpenseTableProps {
  initialData?: any[];
  vendors?: Vendor[];
  accounts?: Account[];
}

export function ExpenseTable({
  initialData = [],
  vendors = [],
  accounts = [],
}: ExpenseTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState(initialData);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount: "",
      expense_date: "",
      vendor_id: "",
      account_id: "",
      description: "",
    },
  });

  function openEdit(expense: any) {
    setEditingExpense(expense);
    form.reset({
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      vendor_id: expense.vendor_id || "",
      account_id: expense.account_id || "",
      description: expense.description || "",
    });
  }

  async function onEdit(values: z.infer<typeof editSchema>) {
    if (!editingExpense) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          amount: parseFloat(values.amount),
          expense_date: values.expense_date,
          vendor_id: values.vendor_id || null,
          account_id: values.account_id,
          description: values.description || null,
        })
        .eq("id", editingExpense.id);
      if (error) throw error;

      setData((prev) =>
        prev.map((e) =>
          e.id === editingExpense.id
            ? {
                ...e,
                amount: parseFloat(values.amount),
                expense_date: values.expense_date,
                vendor_id: values.vendor_id || null,
                account_id: values.account_id,
                description: values.description || null,
                entities: vendors.find((v) => v.id === values.vendor_id) || e.entities,
                chart_of_accounts: accounts.find((a) => a.id === values.account_id) || e.chart_of_accounts,
              }
            : e
        )
      );
      toast.success("Expense updated");
      setEditingExpense(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", deletingId);
      if (error) throw error;
      setData((prev) => prev.filter((e) => e.id !== deletingId));
      toast.success("Expense deleted");
      setDeletingId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
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
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No expenses yet. Add your first expense to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {format(new Date(expense.expense_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{expense.entities?.name || "—"}</TableCell>
                  <TableCell>{expense.chart_of_accounts?.name || "—"}</TableCell>
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
                      {expense.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(expense)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(expense.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(o) => !o && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                          <Input placeholder="0.00" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="What was this expense for?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingExpense(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
