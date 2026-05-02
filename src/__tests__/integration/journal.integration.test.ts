/**
 * @jest-environment node
 *
 * Integration tests for Journal Server Actions.
 * Verifies the full action flow: auth check → validation → Supabase calls → revalidate → redirect.
 */

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw Object.assign(new Error("REDIRECT"), { url });
  }),
}));
jest.mock("server-only", () => ({}));

// ── Reusable chainable Supabase mock ──────────────────────────────────────
interface ChainMock {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
}

function makeEntryChain(entryId = "entry-001"): ChainMock {
  const chain = {} as ChainMock;
  chain.from    = jest.fn().mockReturnValue(chain);
  chain.select  = jest.fn().mockReturnValue(chain);
  chain.update  = jest.fn().mockReturnValue(chain);
  chain.delete  = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.eq      = jest.fn().mockReturnValue(chain);
  chain.order   = jest.fn().mockReturnValue(chain);
  chain.limit   = jest.fn().mockReturnValue(chain);
  chain.single  = jest.fn().mockResolvedValue({ data: { id: entryId }, error: null });
  chain.insert  = jest.fn().mockReturnValue(chain); // returns chain so .select().single() works
  return chain;
}

function makeLinesChain(): ChainMock {
  const chain = {} as ChainMock;
  chain.from    = jest.fn().mockReturnValue(chain);
  chain.select  = jest.fn().mockReturnValue(chain);
  chain.update  = jest.fn().mockReturnValue(chain);
  chain.delete  = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.eq      = jest.fn().mockReturnValue(chain);
  chain.order   = jest.fn().mockReturnValue(chain);
  chain.limit   = jest.fn().mockReturnValue(chain);
  chain.single  = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.insert  = jest.fn().mockResolvedValue({ data: null, error: null });
  return chain;
}

// We mock @/lib/supabase at the module level; the factory runs at hoist time
jest.mock("@/lib/supabase", () => ({
  DEMO_COMPANY_ID: "comp-1",
  actionClient: jest.fn(),
  serverClient: jest.fn(),
}));

// ── Import after mocks are hoisted ────────────────────────────────────────
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionClient } from "@/lib/supabase";
import { createJournalEntry, deleteJournalEntry } from "@/app/actions/journal";
import type { CreateJournalEntryInput } from "@/app/actions/journal";

const VALID_INPUT: CreateJournalEntryInput = {
  entry_date: "2024-03-15",
  description: "事務用品購入",
  status: "confirmed",
  source_type: "manual",
  lines: [
    { side: "debit",  account_id: "acc-1", amount_jpy: 10800 },
    { side: "credit", account_id: "acc-2", amount_jpy: 10800 },
  ],
};

// ── createJournalEntry ────────────────────────────────────────────────────

describe("createJournalEntry (integration)", () => {
  let entryChain: ChainMock;
  let linesChain: ChainMock;

  beforeEach(() => {
    jest.clearAllMocks();
    entryChain = makeEntryChain();
    linesChain = makeLinesChain();

    (actionClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }),
      },
      from: jest.fn().mockImplementation((table: string) =>
        table === "journal_entries" ? entryChain : linesChain,
      ),
    });
  });

  test("redirects to /journal on success", async () => {
    await expect(createJournalEntry(VALID_INPUT)).rejects.toMatchObject({ url: "/journal" });
    expect(redirect).toHaveBeenCalledWith("/journal");
  });

  test("revalidates /journal and / cache paths", async () => {
    await expect(createJournalEntry(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  test("inserts entry with correct metadata", async () => {
    await expect(createJournalEntry(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(entryChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_date: "2024-03-15",
        description: "事務用品購入",
        status: "confirmed",
        company_id: "comp-1",
        created_by: "user-abc",
      }),
    );
  });

  test("inserts debit and credit lines with line_no assigned", async () => {
    await expect(createJournalEntry(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(linesChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ side: "debit",  account_id: "acc-1", amount_jpy: 10800, line_no: 1 }),
        expect.objectContaining({ side: "credit", account_id: "acc-2", amount_jpy: 10800, line_no: 2 }),
      ]),
    );
  });

  test("throws when not authenticated", async () => {
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(createJournalEntry(VALID_INPUT)).rejects.toThrow("Not authenticated");
  });

  test("throws on unbalanced lines — DB insert is NOT called", async () => {
    const bad: CreateJournalEntryInput = {
      ...VALID_INPUT,
      lines: [
        { side: "debit",  account_id: "acc-1", amount_jpy: 10800 },
        { side: "credit", account_id: "acc-2", amount_jpy: 5000 },
      ],
    };
    await expect(createJournalEntry(bad)).rejects.toThrow(/一致しません/);
    expect(entryChain.insert).not.toHaveBeenCalled();
  });

  test("throws when lines with amount=0 are filtered out leaving < 2", async () => {
    const bad: CreateJournalEntryInput = {
      ...VALID_INPUT,
      lines: [
        { side: "debit",  account_id: "acc-1", amount_jpy: 0 },
        { side: "credit", account_id: "acc-2", amount_jpy: 0 },
      ],
    };
    await expect(createJournalEntry(bad)).rejects.toThrow(/1行以上/);
  });

  test("throws on DB error during journal_entries insert", async () => {
    entryChain.single = jest.fn().mockResolvedValue({ data: null, error: { message: "unique_violation" } });
    await expect(createJournalEntry(VALID_INPUT)).rejects.toThrow("unique_violation");
  });

  test("skips lines with empty account_id", async () => {
    const withEmpty: CreateJournalEntryInput = {
      ...VALID_INPUT,
      lines: [
        { side: "debit",  account_id: "",      amount_jpy: 10800 },
        { side: "debit",  account_id: "acc-1", amount_jpy: 10800 },
        { side: "credit", account_id: "acc-2", amount_jpy: 10800 },
      ],
    };
    // Only 2 valid lines: balanced (10800 vs 10800)
    await expect(createJournalEntry(withEmpty)).rejects.toThrow("REDIRECT");
    const insertedLines = linesChain.insert.mock.calls[0][0] as Array<{ account_id: string }>;
    expect(insertedLines.every((l) => l.account_id !== "")).toBe(true);
  });
});

// ── deleteJournalEntry ────────────────────────────────────────────────────

describe("deleteJournalEntry (integration)", () => {
  function setupDelete(isLocked: boolean) {
    // First call: SELECT is_locked — needs .select().eq().single()
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { is_locked: isLocked }, error: null }),
      delete: jest.fn().mockReturnThis(),
    };
    // Second call: DELETE — needs .delete().eq() to resolve
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    let fromCallCount = 0;
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
      from: jest.fn().mockImplementation(() => {
        fromCallCount += 1;
        return fromCallCount === 1 ? selectChain : deleteChain;
      }),
    });
    return { selectChain, deleteChain };
  }

  beforeEach(() => jest.clearAllMocks());

  test("throws when entry is locked", async () => {
    setupDelete(true);
    await expect(deleteJournalEntry("entry-locked")).rejects.toThrow(/ロック済み/);
  });

  test("calls DB delete when entry is not locked", async () => {
    const { deleteChain } = setupDelete(false);
    await deleteJournalEntry("entry-ok");
    expect(deleteChain.delete).toHaveBeenCalled();
  });

  test("revalidates paths after deletion", async () => {
    setupDelete(false);
    await deleteJournalEntry("entry-ok");
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
