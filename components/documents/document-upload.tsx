"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Upload, Loader2, X } from "lucide-react";

interface DocumentUploadProps {
  onUpload: () => void;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<
    { id: string; filename: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) fetchDocuments();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const token = await getToken();
    if (!token) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch("/api/documents", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    setUploading(false);
    fetchDocuments();
    onUpload();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDocuments();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" className="w-full justify-start text-sm" />
        }
      >
        <FileText className="mr-2 h-4 w-4" />
        Documents
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>RAG Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleUpload}
              className="hidden"
              id="doc-upload"
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No documents uploaded
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{doc.filename}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="rounded p-1 hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
