"use server";
import { actionClient, DEMO_COMPANY_ID } from "@/lib/supabase";
import { ocrReceipt } from "./ocr";
import { revalidatePath } from "next/cache";

export async function uploadVoucher(formData: FormData): Promise<{ id: string }> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("ファイルが指定されていません");

  if (file.size > 10 * 1024 * 1024) throw new Error("ファイルサイズは10MB以内にしてください");

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "application/pdf"];
  if (!allowed.includes(file.type)) throw new Error("対応外のファイル形式です");

  const sb = await actionClient();
  const { data: { user } } = await sb.auth.getUser();
  const companyId = DEMO_COMPANY_ID;

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${companyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await sb.storage
    .from("receipts")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`ストレージへのアップロードに失敗しました: ${uploadError.message}`);

  // Run OCR synchronously (2–3 s)
  let ocrFields: Record<string, unknown> = { ocr_status: "pending" };
  try {
    const fd = new FormData();
    fd.append("file", file);
    const result = await ocrReceipt(fd);
    ocrFields = {
      ocr_status: "done",
      ocr_confidence: result.confidence,
      extracted_vendor: result.vendor_name,
      extracted_date: result.entry_date,
      extracted_total: result.total_amount,
      extracted_tax: result.tax_amount,
      extracted_reg_no: result.registration_no,
    };
  } catch {
    ocrFields = { ocr_status: "failed" };
  }

  // Insert voucher record
  const { data: voucher, error: insertError } = await sb
    .from("vouchers")
    .insert({
      company_id: companyId,
      file_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: user?.id ?? null,
      voucher_type: file.name.includes("請求") ? "invoice_received" : "receipt",
      ...ocrFields,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(`証憑の登録に失敗しました: ${insertError.message}`);

  revalidatePath("/vouchers");
  return { id: voucher.id };
}

export async function deleteVoucher(voucherId: string) {
  const sb = await actionClient();
  const { data, error } = await sb
    .from("vouchers")
    .select("file_path")
    .eq("id", voucherId)
    .single();
  if (error) throw error;

  if (data?.file_path) {
    await sb.storage.from("receipts").remove([data.file_path]);
  }
  const { error: delError } = await sb.from("vouchers").delete().eq("id", voucherId);
  if (delError) throw delError;
  revalidatePath("/vouchers");
}
