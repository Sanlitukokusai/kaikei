"use client";
import { useRef, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui";
import { importBankCsv } from "@/app/actions/bank-import";

export default function BankImport({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        const res = await importBankCsv(fd);
        setResult(res);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <Button
        variant="bordered"
        icon="Upload"
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? "取込み中..." : "CSVインポート"}
      </Button>

      {result && (
        <span style={{ fontSize: 13, color: "var(--foreground-500)" }}>
          <Icon name="CheckCircle2" size={14} style={{ color: "var(--green-500)", marginRight: 4 }} />
          {result.imported}件取込完了{result.skipped > 0 ? `（${result.skipped}件重複スキップ）` : ""}
        </span>
      )}
      {error && (
        <span style={{ fontSize: 13, color: "var(--money-negative)" }}>{error}</span>
      )}
    </div>
  );
}
