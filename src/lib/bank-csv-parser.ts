export type BankCsvRow = {
  external_id: string;
  txn_date: string;
  description: string;
  amount_jpy: number;
  balance_jpy: number | null;
};

/**
 * Parses common Japanese bank CSV formats.
 * Supports two layouts:
 *   (A) 日付,摘要,お引出し,お預入れ,残高
 *   (B) 取引日,内容,出金,入金,残高
 * All values may be quoted and may include commas inside quotes.
 */
export function parseBankCsv(csv: string): BankCsvRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Detect column indices
  const dateIdx = findIdx(headers, ["日付", "取引日", "date", "年月日"]);
  const descIdx = findIdx(headers, ["摘要", "内容", "description", "摘要/内容", "取引内容"]);
  const debitIdx = findIdx(headers, ["お引出し", "出金", "支払金額", "debit", "引出金額"]);
  const creditIdx = findIdx(headers, ["お預入れ", "入金", "入金金額", "credit", "預入金額"]);
  const balanceIdx = findIdx(headers, ["残高", "balance"]);

  if (dateIdx === -1 || descIdx === -1) return [];

  const rows: BankCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= Math.max(dateIdx, descIdx)) continue;

    const rawDate = cols[dateIdx]?.trim() ?? "";
    const txn_date = normalizeDate(rawDate);
    if (!txn_date) continue;

    const description = cols[descIdx]?.trim() ?? "";
    if (!description) continue;

    const debit = parseAmount(cols[debitIdx]);
    const credit = parseAmount(cols[creditIdx]);
    // Incoming = positive, outgoing = negative (standard Japanese convention)
    const amount_jpy = credit - debit;

    const balance_jpy = balanceIdx !== -1 ? parseAmount(cols[balanceIdx]) : null;

    const external_id = `${txn_date}-${i}-${description.slice(0, 20)}`;

    rows.push({ external_id, txn_date, description, amount_jpy, balance_jpy });
  }

  return rows;
}

function findIdx(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/[,，￥¥\s]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(raw: string): string | null {
  // Handle various formats: 2024/01/15, 2024-01-15, 20240115, R6.1.15 (Reiwa)
  const iso = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const [, y, m, d] = compact;
    return `${y}-${m}-${d}`;
  }
  return null;
}
