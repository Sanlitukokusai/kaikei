import { test, expect, type Page } from "@playwright/test";

/**
 * Journal entry E2E tests.
 *
 * These tests use Supabase magic-link / test credentials via the
 * PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD env vars.
 * If those are not set, the login step is skipped and the tests
 * are designed to still verify public-facing redirect behavior.
 */

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "";
const HAS_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function loginIfPossible(page: Page) {
  if (!HAS_CREDENTIALS) return false;
  await page.goto("/login");
  await page.getByLabel(/メール|Email/i).fill(TEST_EMAIL);
  await page.getByLabel(/パスワード|Password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /ログイン|Login|Sign in/i }).click();
  await page.waitForURL(/^\/(journal|$)/, { timeout: 10_000 }).catch(() => {});
  return true;
}

test.describe("Journal page (unauthenticated)", () => {
  test("redirects to login", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /journal/new to login", async ({ page }) => {
    await page.goto("/journal/new");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Journal page (authenticated)", () => {
  test.skip(!HAS_CREDENTIALS, "PLAYWRIGHT_TEST_EMAIL / _PASSWORD not set");

  test.beforeEach(async ({ page }) => {
    await loginIfPossible(page);
  });

  test("renders journal list page", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/journal/);
    await expect(page.getByRole("heading", { name: /仕訳帳|Journal/i })).toBeVisible();
  });

  test("can navigate to new journal entry form", async ({ page }) => {
    await page.goto("/journal");
    await page.getByRole("link", { name: /新規|New|追加/i }).click();
    await expect(page).toHaveURL(/\/journal\/new/);
  });

  test("new entry form shows debit and credit line inputs", async ({ page }) => {
    await page.goto("/journal/new");
    await expect(page.getByText(/借方|Debit/i).first()).toBeVisible();
    await expect(page.getByText(/貸方|Credit/i).first()).toBeVisible();
  });

  test("submitting unbalanced amounts shows validation error", async ({ page }) => {
    await page.goto("/journal/new");
    // Fill date
    const dateInput = page.locator("input[type='date']").first();
    await dateInput.fill("2024-03-15");
    // Fill debit amount (no credit)
    await page.locator("input[placeholder*='金額']").first().fill("10000");
    await page.getByRole("button", { name: /保存|登録|Submit/i }).click();
    await expect(page.locator("body")).toContainText(/一致しません|バランス|balanced/i);
  });
});
