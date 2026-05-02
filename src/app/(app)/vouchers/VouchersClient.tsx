"use client";
import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import { uploadVoucher, deleteVoucher } from "@/app/actions/vouchers";
import type { Voucher } from "@/lib/database.types";

const OCR_TONE = { done: "s", processing: "w", pending: "w", failed: "d" } as const;
const OCR_LABEL = { done: "OCR完了", processing: "処理中", pending: "待機中", failed: "OCR失敗" } as const;

function ConfBar({ conf }: { conf: number }) {
  const pct = Math.round(conf * 100);
  const color = pct >= 90 ? "#16a34a" : pct >= 70 ? "#f59e0b" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <div style={{ width: 56, height: 4, background: "var(--zinc-200)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span style={{ color: "var(--foreground-500)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

function DropZone({ onFiles }: { onFiles: (files: FileList) => void }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  }, [onFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${drag ? "#2563EB" : "var(--zinc-300)"}`,
        borderRadius: 12, padding: "28px 20px", textAlign: "center",
        cursor: "pointer", transition: "border-color .15s, background .15s",
        background: drag ? "#eff6ff" : "transparent",
      }}
    >
      <input ref={inputRef} type="file" style={{ display: "none" }} multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,application/pdf"
        onChange={(e) => e.target.files && onFiles(e.target.files)} />
      <Icon name="UploadCloud" size={28} style={{ color: drag ? "#2563EB" : "var(--foreground-400)" }} />
      <div style={{ marginTop: 8, fontWeight: 500 }}>領収書・請求書をドラッグ&ドロップ</div>
      <div style={{ fontSize: 12, color: "var(--foreground-500)", marginTop: 4 }}>
        PDF · JPG · PNG · HEIC · 最大10MB · OCRで自動解析
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 16, fontSize: 11, color: "var(--foreground-500)" }}>
        <span><Icon name="ShieldCheck" size={12} style={{ color: "#16a34a" }} /> 電子帳簿保存法対応</span>
        <span><Icon name="Lock" size={12} style={{ color: "#16a34a" }} /> タイムスタンプ自動付与</span>
      </div>
    </div>
  );
}

type UploadItem = { name: string; progress: "uploading" | "done" | "error"; error?: string };

export default function VouchersClient({ vouchers }: { vouchers: Voucher[] }) {
  const [uploading, setUploading] = useState<UploadItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleFiles = useCallback((files: FileList) => {
    const arr = Array.from(files);
    setUploading((prev) => [...prev, ...arr.map((f) => ({ name: f.name, progress: "uploading" as const }))]);

    arr.forEach((file, i) => {
      const fd = new FormData();
      fd.append("file", file);
      startTransition(async () => {
        try {
          await uploadVoucher(fd);
          setUploading((prev) => prev.map((u, idx) => idx === i ? { ...u, progress: "done" } : u));
        } catch (e) {
          setUploading((prev) => prev.map((u, idx) =>
            idx === i ? { ...u, progress: "error", error: e instanceof Error ? e.message : String(e) } : u
          ));
        }
      });
    });
  }, [startTransition]);

  const handleDelete = (id: string) => {
    if (!confirm("この証憑を削除しますか？")) return;
    startTransition(async () => {
      try { await deleteVoucher(id); }
      catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    });
  };

  const done = vouchers.filter((v) => v.ocr_status === "done").length;
  const processing = vouchers.filter((v) => v.ocr_status === "processing" || v.ocr_status === "pending").length;
  const linked = vouchers.filter((v) => v.journal_id).length;

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>証憑・経費</span>
          </div>
          <h1 className="h1">証憑・経費</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {vouchers.length}件 · OCR完了 {done}件 · 仕訳済 {linked}件
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <DropZone onFiles={handleFiles} />
        <div className="kpi-grid" style={{ gridTemplateColumns: "1fr 1fr", alignContent: "start" }}>
          <div className="kpi">
            <div className="eb">今月アップロード</div>
            <div className="val">{vouchers.length}<span style={{ fontSize: 13, color: "var(--foreground-500)", fontWeight: 400 }}>件</span></div>
          </div>
          <div className="kpi">
            <div className="eb">OCR完了</div>
            <div className="val" style={{ color: "#16a34a" }}>{done}</div>
          </div>
          <div className="kpi">
            <div className="eb">処理中</div>
            <div className="val" style={{ color: "#f59e0b" }}>{processing}</div>
          </div>
          <div className="kpi">
            <div className="eb">仕訳済</div>
            <div className="val" style={{ color: "#2563EB" }}>{linked}</div>
          </div>
        </div>
      </div>

      {uploading.some((u) => u.progress === "uploading") && (
        <div className="alert" style={{ marginBottom: 14 }}>
          <Icon name="Sparkles" size={16} style={{ color: "var(--primary)" }} />
          <span>アップロード中... しばらくお待ちください</span>
        </div>
      )}
      {uploading.some((u) => u.progress === "error") && (
        <div className="alert" style={{ background: "#fdd0df", marginBottom: 14 }}>
          <Icon name="AlertCircle" size={16} />
          <span>{uploading.filter((u) => u.progress === "error").map((u) => `${u.name}: ${u.error}`).join(" / ")}</span>
        </div>
      )}

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th>ファイル</th>
              <th>アップロード日</th>
              <th>OCR結果</th>
              <th className="num">金額（OCR）</th>
              <th>信頼度</th>
              <th>状態</th>
              <th style={{ width: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id}>
                <td>
                  <div className="row">
                    <Icon
                      name={v.mime_type === "application/pdf" ? "FileText" : "Image"}
                      size={14}
                      style={{ color: "var(--foreground-500)", flexShrink: 0 }}
                    />
                    <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                      {v.file_name}
                    </span>
                  </div>
                  {v.extracted_vendor && (
                    <div style={{ fontSize: 11, color: "var(--foreground-500)", marginTop: 2, paddingLeft: 22 }}>
                      {v.extracted_vendor}{v.extracted_date && ` · ${v.extracted_date}`}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 12, color: "var(--foreground-600)" }}>
                  {v.uploaded_at.slice(0, 10)}
                </td>
                <td style={{ fontSize: 12 }}>
                  {v.extracted_reg_no ? (
                    <span className="code" style={{ fontSize: 10 }}>{v.extracted_reg_no}</span>
                  ) : v.ocr_status === "done" ? (
                    <span style={{ color: "var(--foreground-500)" }}>登録番号なし</span>
                  ) : "—"}
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {v.extracted_total != null ? `¥${v.extracted_total.toLocaleString()}` : "—"}
                </td>
                <td>
                  {v.ocr_confidence != null ? <ConfBar conf={v.ocr_confidence} /> : "—"}
                </td>
                <td>
                  <Chip tone={OCR_TONE[v.ocr_status ?? "pending"]}>
                    {OCR_LABEL[v.ocr_status ?? "pending"]}
                  </Chip>
                  {v.journal_id && (
                    <div style={{ marginTop: 4 }}>
                      <Chip tone="s">仕訳済</Chip>
                    </div>
                  )}
                </td>
                <td>
                  <div className="row">
                    {v.ocr_status === "done" && !v.journal_id && (
                      <Link href={`/journal/new?voucher=${v.id}`}>
                        <Button variant="primary" size="sm">仕訳作成</Button>
                      </Link>
                    )}
                    <Button
                      variant="light" size="sm" icon="Trash2"
                      onClick={() => handleDelete(v.id)}
                      disabled={isPending}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--foreground-500)" }}>
                  証憑がまだアップロードされていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
