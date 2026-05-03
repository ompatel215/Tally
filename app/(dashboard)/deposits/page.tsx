"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const depositSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
    message: "Must be a positive number",
  }),
  credit_account_id: z.string().min(1, "Income account is required"),
  debit_account_id: z.string().min(1, "Asset account is required"),
});

type Deposit = {
  id: string;
  date: string;
  description: string | null;
  credit: number;
  account_name: string;
};

type Account = { id: string; code: string; name: string; type: string };

export default function DepositsPage() {
  const supabase = createClient();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      credit_account_id: "",
      debit_account_id: "",
    },
  });

  async function loadDeposits(orgId: string) {
    const { data } = await supabase
      .from("transactions")
      .select("id, credit, journal_entries!journal_entry_id(id, date, description), chart_of_accounts!account_id(name)")
      .eq("organization_id", orgId)
      .gt("credit", 0)
      .order("created_at", { ascending: false });
    const rows: Deposit[] = (data || []).map((t: any) => ({
      id: (t.journal_entries as any)?.id || t.id,
      date: (t.journal_entries as any)?.date || "",
      description: (t.journal_entries as any)?.description || null,
      credit: Number(t.credit),
      account_name: (t.chart_of_accounts as any)?.name || "—",
    }));
    setDeposits(rows);
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();
      if (!membership) return;
      setOrgId(membership.organization_id);

      const { data: accountData } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type")
        .eq("organization_id", membership.organization_id)
        .eq("is_active", true)
        .order("code");
      setAllAccounts(accountData || []);

      await loadDeposits(membership.organization_id);
      setLoading(false);
    }
    load();
  }, []);

  async function onSubmit(values: z.infer<typeof depositSchema>) {
    if (!orgId || !userId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("record_deposit", {
        p_org_id: orgId,
        p_date: values.date,
        p_description: values.description,
        p_amount: parseFloat(values.amount),
        p_debit_account_id: values.debit_account_id,
        p_credit_account_id: values.credit_account_id,
        p_user_id: userId,
      });
      if (error) throw error;
      toast.success("Deposit recorded");
      setDialogOpen(false);
      form.reset({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        credit_account_id: "",
        debit_account_id: "",
      });
      await loadDeposits(orgId);
    } catch (err: any) {
      toast.error(err.message || "Failed to record deposit");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", deletingId);
      if (error) throw error;
      setDeposits((prev) => prev.filter((d) => d.id !== deletingId));
      toast.success("Deposit deleted");
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete deposit");
    } finally {
      setIsDeleting(false);
    }
  }

  const revenueAccounts = allAccounts.filter((a) => a.type === "revenue");
  const assetAccounts = allAccounts.filter((a) => a.type === "asset");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposits</h1>
          <p className="text-muted-foreground">Track incoming payments and revenue.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Deposit
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No deposits yet.
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((d) => (
                <TableRow key={d.id + d.credit}>
                  <TableCell>{d.date ? format(new Date(d.date), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell>{d.description || "—"}</TableCell>
                  <TableCell>{d.account_name}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    +${d.credit.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(d.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Deposit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Deposit</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
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
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Client payment, sales revenue..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="credit_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Income Account (Credit)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select revenue account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {revenueAccounts.map((a) => (
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
                name="debit_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit To (Debit)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Deposit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deposit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete the deposit and its journal entry. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
