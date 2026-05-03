import { Upload, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockReceipts } from "@/lib/mockData";
import { ReceiptStatus } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const statusIcons: Record<ReceiptStatus, any> = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle2,
  failed: AlertCircle,
};

const statusColors: Record<ReceiptStatus, string> = {
  pending: "text-slate-500",
  processing: "text-blue-500 animate-pulse",
  completed: "text-emerald-500",
  failed: "text-rose-500",
};

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const { data: receipts } = await supabase
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false });

  const displayReceipts = receipts && receipts.length > 0 ? receipts : mockReceipts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">Upload and manage your business receipts for OCR processing.</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Receipt
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="border-dashed flex flex-col items-center justify-center p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <CardTitle className="text-base mb-1">Click or drag to upload</CardTitle>
          <p className="text-xs text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
        </Card>

        {displayReceipts.map((receipt) => {
          const StatusIcon = statusIcons[receipt.ocr_status as ReceiptStatus] || Clock;
          return (
            <Card key={receipt.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-muted flex items-center justify-center relative border-b">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    {receipt.ocr_status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm truncate" title={receipt.original_filename}>
                  {receipt.original_filename}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                {receipt.extracted_amount ? (
                  <div className="mt-2">
                    <p className="text-2xl font-bold">${Number(receipt.extracted_amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{receipt.extracted_vendor}</p>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <StatusIcon className={cn("h-4 w-4", statusColors[receipt.ocr_status as ReceiptStatus])} />
                    <span className="text-xs">Processing data...</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 border-t bg-muted/20 flex justify-between items-center h-10">
                <span className="text-[10px] text-muted-foreground">Added May 12, 2024</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2">View</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
