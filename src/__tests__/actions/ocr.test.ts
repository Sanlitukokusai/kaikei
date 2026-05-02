import { parseOcrJson } from "@/app/actions/ocr";

const VALID_JSON = JSON.stringify({
  vendor_name: "テスト商店",
  entry_date: "2024-01-15",
  total_amount: 10800,
  tax_amount: 800,
  tax_rate: "課税10%",
  registration_no: "T1234567890123",
  description: "事務用品購入",
  confidence: 0.95,
});

describe("parseOcrJson", () => {
  test("parses clean JSON string", () => {
    const result = parseOcrJson(VALID_JSON);
    expect(result.vendor_name).toBe("テスト商店");
    expect(result.total_amount).toBe(10800);
    expect(result.tax_rate).toBe("課税10%");
    expect(result.confidence).toBe(0.95);
  });

  test("extracts JSON embedded in LLM prose", () => {
    const raw = `以下のJSONで結果をお知らせします:\n\`\`\`\n${VALID_JSON}\n\`\`\``;
    const result = parseOcrJson(raw);
    expect(result.vendor_name).toBe("テスト商店");
  });

  test("handles null fields", () => {
    const json = JSON.stringify({
      vendor_name: null,
      entry_date: null,
      total_amount: null,
      tax_amount: null,
      tax_rate: null,
      registration_no: null,
      description: null,
      confidence: 0.1,
    });
    const result = parseOcrJson(json);
    expect(result.vendor_name).toBeNull();
    expect(result.confidence).toBe(0.1);
  });

  test("throws when no JSON object found", () => {
    expect(() => parseOcrJson("申し訳ありませんが、画像から情報を読み取れませんでした")).toThrow(
      /OCR結果の解析に失敗/,
    );
  });

  test("throws on invalid JSON", () => {
    expect(() => parseOcrJson("{ invalid json }")).toThrow();
  });

  test("handles tax_rate 課税8%", () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), tax_rate: "課税8%" });
    const result = parseOcrJson(json);
    expect(result.tax_rate).toBe("課税8%");
  });

  test("handles 非課税", () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), tax_rate: "非課税" });
    const result = parseOcrJson(json);
    expect(result.tax_rate).toBe("非課税");
  });
});
