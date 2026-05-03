"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Receipt = {
  id: string;
  file_path: string;
  original_filename: string;
  created_at: string;
};

export default function ReceiptsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();
      if (!membership) return;
      setOrgId(membership.organization_id);
      const { data } = await supabase
        .from("receipts")
        .select("id, file_path, original_filename, created_at")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: false });
      setReceipts((data as Receipt[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  async function openReceipt(receipt: Receipt) {
    const isPdf = receipt.file_path.toLowerCase().endsWith(".pdf");
    setViewLoading(true);

    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(receipt.file_path, 60);

    setViewLoading(false);

    if (error || !data?.signedUrl) {
      toast.error("Could not load receipt");
      return;
    }

    if (isPdf) {
      window.open(data.signedUrl, "_blank");
    } else {
      setViewingReceipt(receipt);
      setViewUrl(data.signedUrl);
    }
  }

  async function uploadFile(file: File) {
    if (!orgId) {
      toast.error("No organization found");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("receipts")
        .insert({
          organization_id: orgId,
          file_path: path,
          original_filename: file.name,
        })
        .select("id, file_path, original_filename, created_at")
        .single();
      if (insertError) throw insertError;

      setReceipts((prev) => [data as Receipt, ...prev]);
      toast.success("Receipt uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function onDelete() {
    if (!deletingId) return;
    const receipt = receipts.find((r) => r.id === deletingId);
    setIsDeleting(true);
    try {
      if (receipt?.file_path) {
        await supabase.storage.from("receipts").remove([receipt.file_path]);
      }
      const { error } = await supabase.from("receipts").delete().eq("id", deletingId);
      if (error) throw error;
      setReceipts((prev) => prev.filter((r) => r.id !== deletingId));
      toast.success("Receipt deleted");
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete receipt");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Upload and manage your business receipts.
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Receipt
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Upload dropzone */}
        <Card
          className={cn(
            "border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer group",
            dragOver ? "border-primary bg-primary/5" : "hover:bg-muted/50"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <CardTitle className="text-base mb-1">
            {uploading ? "Uploading..." : "Click or drag to upload"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
        </Card>

        {loading ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          receipts.map((receipt) => (
            <Card key={receipt.id} className="overflow-hidden flex flex-col">
              <button
                className="aspect-[4/3] bg-muted flex items-center justify-center border-b hover:bg-muted/70 transition-colors cursor-pointer relative group"
                onClick={() => openReceipt(receipt)}
                disabled={viewLoading}
              >
                {viewLoading ? (
                  <Loader2 className="h-12 w-12 text-muted-foreground/50 animate-spin" />
                ) : (
                  <>
                    <FileText className="h-12 w-12 text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors" />
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> View
                      </span>
                    </span>
                  </>
                )}
              </button>
              <CardHeader className="p-4 pb-2 flex-1">
                <CardTitle className="text-sm truncate" title={receipt.original_filename}>
                  {receipt.original_filename}
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-4 pt-0 border-t bg-muted/20 flex justify-between items-center h-10">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(receipt.created_at), "MMM d, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(receipt.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {!loading && receipts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No receipts yet. Upload your first receipt to get started.
        </div>
      )}

      {/* Image viewer */}
      <Dialog open={!!viewingReceipt} onOpenChange={(o) => { if (!o) { setViewingReceipt(null); setViewUrl(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{viewingReceipt?.original_filename}</DialogTitle>
          </DialogHeader>
          {viewUrl && (
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-muted rounded-md">
              <img src={viewUrl} alt={viewingReceipt?.original_filename} className="max-w-full object-contain" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={viewUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Receipt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the receipt file and record. This action cannot be undone.
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
