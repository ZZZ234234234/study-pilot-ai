"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { post, errorMessage } from "@/lib/api";
import type { Document } from "@/lib/types";
import { Spinner } from "./ui";

export function DemoButton({
  className = "button secondary",
  children = "Explore sample PDF",
  onCreated,
}: {
  className?: string;
  children?: React.ReactNode;
  onCreated?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function load() {
    setBusy(true);
    try {
      const doc = await post<Document>("/documents/demo");
      toast.success("Original sample added to your workspace.");
      if (onCreated) onCreated();
      else router.push(`/app/documents/${doc.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={load} disabled={busy} className={className}>
      {busy ? (
        <Spinner label="Opening sample" />
      ) : (
        <>
          {children}
          <ArrowUpRight size={17} />
        </>
      )}
    </button>
  );
}
