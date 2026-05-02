/** @jest-environment node */
// Integration tests for updateJournalEntry Server Action.

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => { throw Object.assign(new Error("REDIRECT"), { url }); }),
}));
jest.mock("server-only", () => ({}));
jest.mock("@/lib/supabase", () => ({
  DEMO_COMPANY_ID: "comp-1",
  actionClient: jest.fn(),
  serverClient: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { actionClient } from "@/lib/supabase";
import { updateJournalEntry } from "@/app/actions/journal";
import type { CreateJournalEntryInput } from "@/app/actions/journal";

const VALID_INPUT: CreateJournalEntryInput = {
  entry_date: "2024-03-15",
  description: "修正仕訳",
  status: "confirmed",
  lines: [
    { side: "debit",  account_id: "acc-1", amount_jpy: 5000 },
    { side: "credit", account_id: "acc-2", amount_jpy: 5000 },
  ],
};

function setupUpdate(isLocked = false) {
  // Call 1: SELECT is_locked
  const lockChain: Record<string, jest.Mock> = {};
  lockChain.select = jest.fn().mockReturnValue(lockChain);
  lockChain.eq     = jest.fn().mockReturnValue(lockChain);
  lockChain.single = jest.fn().mockResolvedValue({ data: { is_locked: isLocked }, error: null });

  // Call 2: UPDATE journal_entries
  const updateChain: Record<string, jest.Mock> = {};
  updateChain.update = jest.fn().mockReturnValue(updateChain);
  updateChain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });

  // Call 3: DELETE journal_lines
  const deleteChain: Record<string, jest.Mock> = {};
  deleteChain.delete = jest.fn().mockReturnValue(deleteChain);
  deleteChain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });

  // Call 4: INSERT journal_lines
  const insertChain: Record<string, jest.Mock> = {};
  insertChain.insert = jest.fn().mockResolvedValue({ data: null, error: null });

  let entriesCallCount = 0;
  let linesCallCount = 0;

  (actionClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "journal_entries") {
        entriesCallCount += 1;
        return entriesCallCount === 1 ? lockChain : updateChain;
      }
      linesCallCount += 1;
      return linesCallCount === 1 ? deleteChain : insertChain;
    }),
  });

  return { lockChain, updateChain, deleteChain, insertChain };
}

beforeEach(() => jest.clearAllMocks());

describe("updateJournalEntry", () => {
  test("redirects to /journal on success", async () => {
    setupUpdate();
    await expect(updateJournalEntry("entry-1", VALID_INPUT)).rejects.toMatchObject({ url: "/journal" });
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
  });

  test("throws when entry is locked", async () => {
    setupUpdate(true);
    await expect(updateJournalEntry("entry-locked", VALID_INPUT)).rejects.toThrow(/ロック済み/);
  });

  test("does not call update or delete when locked", async () => {
    const { updateChain, deleteChain } = setupUpdate(true);
    await expect(updateJournalEntry("entry-locked", VALID_INPUT)).rejects.toThrow(/ロック済み/);
    expect(updateChain.update).not.toHaveBeenCalled();
    expect(deleteChain.delete).not.toHaveBeenCalled();
  });

  test("deletes old lines before inserting new ones", async () => {
    const { deleteChain, insertChain } = setupUpdate();
    await expect(updateJournalEntry("entry-1", VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith("journal_id", "entry-1");
    expect(insertChain.insert).toHaveBeenCalled();
  });

  test("inserts new lines with journal_id = entryId", async () => {
    const { insertChain } = setupUpdate();
    await expect(updateJournalEntry("entry-1", VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ journal_id: "entry-1", side: "debit" }),
        expect.objectContaining({ journal_id: "entry-1", side: "credit" }),
      ]),
    );
  });

  test("updates entry metadata fields", async () => {
    const { updateChain } = setupUpdate();
    await expect(updateJournalEntry("entry-1", VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_date: "2024-03-15",
        description: "修正仕訳",
        status: "confirmed",
      }),
    );
  });

  test("throws on unbalanced lines", async () => {
    setupUpdate();
    const unbalanced: CreateJournalEntryInput = {
      ...VALID_INPUT,
      lines: [
        { side: "debit",  account_id: "acc-1", amount_jpy: 5000 },
        { side: "credit", account_id: "acc-2", amount_jpy: 3000 },
      ],
    };
    await expect(updateJournalEntry("entry-1", unbalanced)).rejects.toThrow(/一致しません/);
  });
});
