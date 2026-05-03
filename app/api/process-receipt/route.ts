import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiptId } = await request.json();
  if (!receiptId) return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });

  // Fetch receipt and verify org access
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, file_path, organization_id")
    .eq("id", receiptId)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  // Mark as processing
  await admin.from("receipts").update({ ocr_status: "processing" }).eq("id", receiptId);

  // Download file from storage using admin (bucket is private)
  const { data: fileData, error: downloadError } = await admin.storage
    .from("receipts")
    .download(receipt.file_path);

  if (downloadError || !fileData) {
    await admin.from("receipts").update({ ocr_status: "failed" }).eq("id", receiptId);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const base64 = buffer.toString("base64");

  // Determine media type from file path
  const ext = receipt.file_path.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";
  const mediaType = isPdf ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";

  try {
    const contentBlock = isPdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/png" | "image/jpeg", data: base64 } };

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: `Extract the following from this receipt and respond with JSON only, no markdown:
{"amount": <total as number or null>, "date": "<YYYY-MM-DD or null>", "vendor": "<merchant name or null>"}`,
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const parsed = JSON.parse(raw);

    await admin.from("receipts").update({
      ocr_status: "completed",
      extracted_amount: parsed.amount ?? null,
      extracted_date: parsed.date ?? null,
      extracted_vendor: parsed.vendor ?? null,
    }).eq("id", receiptId);

    return NextResponse.json({ success: true, data: parsed });
  } catch {
    await admin.from("receipts").update({ ocr_status: "failed" }).eq("id", receiptId);
    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
