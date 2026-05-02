/**
 * @jest-environment node
 *
 * Integration tests for OCR Server Action.
 * Mocks global fetch to verify the full request/response pipeline.
 * Runs in Node environment so File/Blob are the Node.js built-ins.
 */

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("server-only", () => ({}));

import { ocrReceipt } from "@/app/actions/ocr";

const MOCK_OCR_RESPONSE = {
  vendor_name: "テスト商店",
  entry_date: "2024-03-15",
  total_amount: 10800,
  tax_amount: 800,
  tax_rate: "課税10%",
  registration_no: "T1234567890123",
  description: "事務用品",
  confidence: 0.95,
};

function makeFormData(
  content: string = "fake-image-bytes",
  type = "image/jpeg",
  name = "receipt.jpg",
  overrideSize?: number,
) {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  if (overrideSize !== undefined) {
    Object.defineProperty(file, "size", { value: overrideSize, configurable: true });
  }
  const fd = new FormData();
  fd.set("file", file);
  return fd;
}

function mockFetchSuccess(body = MOCK_OCR_RESPONSE) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(body) } }],
    }),
  } as unknown as Response);
}

describe("ocrReceipt (integration)", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, DASHSCOPE_API_KEY: "sk-test-key" };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test("returns parsed OCR result on success", async () => {
    mockFetchSuccess();
    const result = await ocrReceipt(makeFormData());
    expect(result.vendor_name).toBe("テスト商店");
    expect(result.total_amount).toBe(10800);
    expect(result.confidence).toBe(0.95);
  });

  test("sends Authorization Bearer header with API key", async () => {
    mockFetchSuccess();
    await ocrReceipt(makeFormData());
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(init.headers["Authorization"]).toBe("Bearer sk-test-key");
  });

  test("sends image as base64 data URL in request body", async () => {
    mockFetchSuccess();
    await ocrReceipt(makeFormData("hello", "image/png", "test.png"));
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    const imageContent = body.messages[1].content.find(
      (c: { type: string }) => c.type === "image_url",
    );
    expect(imageContent.image_url.url).toMatch(/^data:image\/png;base64,/);
  });

  test("uses qwen-vl-plus model", async () => {
    mockFetchSuccess();
    await ocrReceipt(makeFormData());
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("qwen-vl-plus");
  });

  test("sends POST to DashScope international endpoint", async () => {
    mockFetchSuccess();
    await ocrReceipt(makeFormData());
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("dashscope-intl.aliyuncs.com");
    expect(init.method).toBe("POST");
  });

  test("throws when no DASHSCOPE_API_KEY", async () => {
    delete process.env.DASHSCOPE_API_KEY;
    await expect(ocrReceipt(makeFormData())).rejects.toThrow(/DASHSCOPE_API_KEY/);
  });

  test("throws when file exceeds 5MB", async () => {
    const fd = makeFormData("x", "image/jpeg", "big.jpg", 6 * 1024 * 1024);
    await expect(ocrReceipt(fd)).rejects.toThrow(/5MB/);
  });

  test("throws on unsupported file type", async () => {
    const fd = makeFormData("x", "text/plain", "doc.txt");
    await expect(ocrReceipt(fd)).rejects.toThrow(/JPEG|PNG|WebP/);
  });

  test("throws when no file provided", async () => {
    const fd = new FormData();
    await expect(ocrReceipt(fd)).rejects.toThrow(/ファイルが指定されていません/);
  });

  test("throws on non-ok API response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as unknown as Response);
    await expect(ocrReceipt(makeFormData())).rejects.toThrow(/401/);
  });

  test("throws when API returns no JSON block", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "申し訳ありません、読み取れませんでした。" } }],
      }),
    } as unknown as Response);
    await expect(ocrReceipt(makeFormData())).rejects.toThrow(/OCR結果の解析に失敗/);
  });

  test("handles LLM output with prose surrounding the JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `以下のJSON形式で回答します:\n${JSON.stringify(MOCK_OCR_RESPONSE)}\n以上です。`,
            },
          },
        ],
      }),
    } as unknown as Response);
    const result = await ocrReceipt(makeFormData());
    expect(result.entry_date).toBe("2024-03-15");
  });
});
