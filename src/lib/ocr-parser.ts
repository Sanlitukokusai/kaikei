// Pure helpers for OCR result parsing — extracted from the server action
// so they can be unit-tested and reused without the "use server" constraint
// (which forbids non-async exports).

export type OcrResult = {
  vendor_name: string | null;
  entry_date: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  tax_rate: "課税10%" | "課税8%" | "非課税" | null;
  registration_no: string | null;
  description: string | null;
  confidence: number;
};

/** Extract and parse the first JSON object found in raw LLM output. */
export function parseOcrJson(raw: string): OcrResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("OCR結果の解析に失敗しました");
  return JSON.parse(match[0]) as OcrResult;
}
