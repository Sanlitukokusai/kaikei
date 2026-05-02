/** @jest-environment node */
import { importBankCsv } from "@/app/actions/bank-import";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/lib/supabase", () => ({
  DEMO_COMPANY_ID: "demo-co",
  actionClient: jest.fn(),
}));

function makeUpsertMock(error: object | null = null) {
  return jest.fn().mockResolvedValue({ error });
}

function makeSupabaseMock(upsertFn = makeUpsertMock()) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    from: jest.fn().mockReturnValue({ upsert: upsertFn }),
  };
}

function makeFormData(csvContent: string, filename = "test.csv"): FormData {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const file = new File([blob], filename, { type: "text/csv" });
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

const CSV = `日付,摘要,お引出し,お預入れ,残高
2024/01/15,テスト商店 カード決済,,50000,1200000
2024/01/16,振込 入金,0,100000,1300000
`;

describe("importBankCsv", () => {
  beforeEach(() => {
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValue(makeSupabaseMock());
  });

  test("imports rows from valid CSV", async () => {
    const result = await importBankCsv(makeFormData(CSV));
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  test("calls upsert for each row", async () => {
    const upsertFn = makeUpsertMock();
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce(makeSupabaseMock(upsertFn));
    await importBankCsv(makeFormData(CSV));
    expect(upsertFn).toHaveBeenCalledTimes(2);
  });

  test("upsert includes company_id and match_status", async () => {
    const upsertFn = makeUpsertMock();
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce(makeSupabaseMock(upsertFn));
    await importBankCsv(makeFormData(CSV));
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "demo-co",
        match_status: "pending",
        txn_date: "2024-01-15",
      }),
      expect.any(Object)
    );
  });

  test("throws when no file provided", async () => {
    const fd = new FormData();
    await expect(importBankCsv(fd)).rejects.toThrow("ファイルが指定されていません");
  });

  test("throws for non-CSV file", async () => {
    const blob = new Blob(["data"], { type: "text/plain" });
    const file = new File([blob], "data.txt", { type: "text/plain" });
    const fd = new FormData();
    fd.append("file", file);
    await expect(importBankCsv(fd)).rejects.toThrow("CSV");
  });

  test("throws when CSV has no parseable rows", async () => {
    const emptyCsv = "日付,摘要,お引出し,お預入れ,残高\n";
    await expect(importBankCsv(makeFormData(emptyCsv))).rejects.toThrow("読み取れませんでした");
  });

  test("counts skipped when upsert returns error", async () => {
    let call = 0;
    const upsertFn = jest.fn().mockImplementation(() => {
      call++;
      return Promise.resolve({ error: call === 1 ? { message: "duplicate" } : null });
    });
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce(makeSupabaseMock(upsertFn));
    const result = await importBankCsv(makeFormData(CSV));
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(1);
  });

  test("throws when not authenticated", async () => {
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(importBankCsv(makeFormData(CSV))).rejects.toThrow("Not authenticated");
  });
});
