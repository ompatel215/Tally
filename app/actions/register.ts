"use server";

import { createClient } from "@supabase/supabase-js";

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

export async function registerWithKey(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  orgName: string;
  key: string;
}): Promise<{ error?: string; success?: boolean }> {
  if (!process.env.REGISTRATION_KEY || data.key !== process.env.REGISTRATION_KEY) {
    return { error: "Invalid access key" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const resolvedOrgName = data.orgName || `${data.firstName}'s Organization`;

  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName,
      org_name: resolvedOrgName,
    },
  });

  if (createError) return { error: createError.message };
  if (!user) return { error: "Failed to create user" };

  // Upsert profile in case trigger hasn't fired yet
  await supabase.from("profiles").upsert(
    { id: user.id, email: user.email!, first_name: data.firstName || null, last_name: data.lastName || null },
    { onConflict: "id" }
  );

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: resolvedOrgName })
    .select()
    .single();

  if (orgError || !org) {
    await supabase.auth.admin.deleteUser(user.id);
    return { error: orgError?.message ?? "Failed to create organization" };
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "owner" });

  if (memberError) {
    await supabase.auth.admin.deleteUser(user.id);
    return { error: memberError.message };
  }

  await supabase
    .from("chart_of_accounts")
    .insert(DEFAULT_ACCOUNTS.map((a) => ({ ...a, organization_id: org.id })));

  return { success: true };
}
