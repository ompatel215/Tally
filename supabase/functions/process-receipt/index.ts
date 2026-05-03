import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from process-receipt!")

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // 1. Initialize Supabase client with service role key (needs to be set in Supabase project)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Simulating OCR processing
    console.log(`Processing receipt: ${record.id} - ${record.original_filename}`)
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 3. Update receipt record with dummy extracted data
    const { error } = await supabase
      .from('receipts')
      .update({
        ocr_status: 'completed',
        extracted_amount: 100.00, // Dummy
        extracted_date: new Date().toISOString().split('T')[0],
        extracted_vendor: 'Simulated Vendor'
      })
      .eq('id', record.id)

    if (error) throw error

    return new Response(JSON.stringify({ message: "Receipt processed" }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
