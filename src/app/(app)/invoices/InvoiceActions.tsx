"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { deleteInvoice } from "@/app/actions/invoices";

export default function InvoiceActions({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("この請求書を削除しますか？")) return;
    startTransition(async () => {
      try { await deleteInvoice(id); router.refresh(); }
      catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    });
  };

  return (
    <div className="row">
      <Link href={`/invoices/${id}`}>
        <Button variant="light" size="sm" icon="Pencil" />
      </Link>
      <Link href={`/invoices/${id}/print`} target="_blank">
        <Button variant="light" size="sm" icon="Printer" />
      </Link>
      <Button variant="light" size="sm" icon="Trash2" onClick={handleDelete} disabled={isPending} />
    </div>
  );
}
