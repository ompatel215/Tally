import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Checking Account", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "4000", name: "Revenue", type: "revenue" },
  { code: "6000", name: "Advertising & Marketing", type: "expense" },
  { code: "6100", name: "Office Supplies", type: "expense" },
  { code: "6200", name: "Travel & Meals", type: "expense" },
  { code: "6300", name: "Software & Subscriptions", type: "expense" },
  { code: "6400", name: "Utilities", type: "expense" },
]

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user already has an org (e.g. re-confirming)
        const { data: existing } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!existing) {
          const orgName = user.user_metadata?.org_name || 'My Organization'

          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: orgName })
            .select()
            .single()

          if (orgError || !org) {
            // Org setup failed — redirect to setup page so user can retry
            return NextResponse.redirect(`${origin}/register/setup`)
          }

          await supabase
            .from('organization_members')
            .insert({ organization_id: org.id, user_id: user.id, role: 'owner' })

          await supabase
            .from('chart_of_accounts')
            .insert(DEFAULT_ACCOUNTS.map((a) => ({ ...a, organization_id: org.id })))
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
