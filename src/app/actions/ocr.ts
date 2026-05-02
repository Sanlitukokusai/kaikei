"use server";

export type OcrResult = {
  vendor_name: string | null;
  entry_date: string | null; // YYYY-MM-DD
  total_amount: number | null;
  tax_amount: number | null;
  tax_rate: "課税10%" | "課税8%" | "非課税" | null;
  registration_no: string | null; // T + 13 digits (適格請求書登録番号)
  description: string | null;
  confidence: number; // 0-1
};

// DashScope OpenAI-compatible endpoint (international region)
const DASHSCOPE_BASE = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const MODEL = "qwen-vl-plus";

const SYSTEM_PROMPT = `あなたは日本の領収書・請求書・レシートのOCRアシスタントです。
画像から以下の情報をJSONで抽出してください。

必ず以下のJSONスキーマで返してください（他のテキストは不要）:
{
  "vendor_name": "取引先名（文字列またはnull）",
  "entry_date": "取引日（YYYY-MM-DD形式またはnull）",
  "total_amount": 合計金額（税込、整数またはnull）,
  "tax_amount": 消費税額（整数またはnull）,
  "tax_rate": "課税10%" | "課税8%" | "非課税" | null,
  "registration_no": "適格請求書登録番号（T+13桁またはnull）",
  "description": "取引内容の短い説明（文字列またはnull）",
  "confidence": 0〜1の信頼度スコア（数値）
}

注意事項:
- 金額はカンマなしの整数で返す（例: 10800）
- 日付が読み取れない場合はnull
- 軽減税率8%品目が含まれる場合は"課税8%"を返す
- 税率が混在する場合は金額が大きい方の税率を返す
- confidence は読み取りの確実性を示す（1.0=完全に読み取れた）`;

export async function ocrReceipt(formData: FormData): Promise<OcrResult> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("ファイルが指定されていません");

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("ファイルサイズは5MB以内にしてください");

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    throw new Error("JPEG・PNG・WebP・GIF・PDFのみ対応しています");
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY が設定されていません");

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type === "application/pdf" ? "image/jpeg" : file.type; // DashScope doesn't support PDF natively
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text", text: "この領収書・請求書の情報をJSONで抽出してください。" },
        ],
      },
    ],
    max_tokens: 512,
    temperature: 0,
  };

  const res = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Qwen API エラー (${res.status}): ${detail.slice(0, 200)}`);
  }

  type ChatResponse = {
    choices: Array<{ message: { content: string } }>;
  };
  const json = (await res.json()) as ChatResponse;
  const text = json.choices?.[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("OCR結果の解析に失敗しました");

  try {
    return JSON.parse(jsonMatch[0]) as OcrResult;
  } catch {
    throw new Error("OCR結果のJSON解析に失敗しました");
  }
}

/** Extract and parse a JSON block from raw LLM output. Exported for testing. */
export function parseOcrJson(raw: string): OcrResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("OCR結果の解析に失敗しました");
  return JSON.parse(match[0]) as OcrResult;
}
