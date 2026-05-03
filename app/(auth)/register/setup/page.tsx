"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Checking Account", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "4000", name: "Revenue", type: "revenue" },
  { code: "6000", name: "Advertising & Marketing", type: "expense" },
  { code: "6100", name: "Office Supplies", type: "expense" },
  { code: "6200", name: "Travel & Meals", type: "expense" },
  { code: "6300", name: "Software & Subscriptions", type: "expense" },
  { code: "6400", name: "Utilities", type: "expense" },
];

export default function SetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Pre-fill org name from user metadata if available
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.org_name) {
        setOrgName(user.user_metadata.org_name);
      } else if (user?.user_metadata?.first_name) {
        setOrgName(`${user.user_metadata.first_name}'s Organization`);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName || "My Organization" })
        .select()
        .single();
      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: org.id, user_id: user.id, role: "owner" });
      if (memberError) throw memberError;

      const { error: accountsError } = await supabase
        .from("chart_of_accounts")
        .insert(DEFAULT_ACCOUNTS.map((a) => ({ ...a, organization_id: org.id })));
      if (accountsError) throw accountsError;

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to set up organization");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Complete Setup</CardTitle>
          <CardDescription>
            Your account needs an organization to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
