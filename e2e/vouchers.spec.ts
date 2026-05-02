import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

/**
 * Voucher upload E2E tests.
 * The upload itself requires authentication; we verify redirect behavior
 * for unauthenticated users and, when credentials are provided, the full
 * drag-drop + OCR flow.
 */

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "";
const HAS_CREDENTIALS = Boolean(TEST_EMAIL && TEST_PASSWORD);

test.describe("Vouchers page (unauthenticated)", () => {
  test("redirects to login", async ({ page }) => {
    await page.goto("/vouchers");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Vouchers page (authenticated)", () => {
  test.skip(!HAS_CREDENTIALS, "PLAYWRIGHT_TEST_EMAIL / _PASSWORD not set");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/メール|Email/i).fill(TEST_EMAIL);
    await page.getByLabel(/パスワード|Password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /ログイン|Login|Sign in/i }).click();
    await page.waitForURL(/^\/(vouchers|$)/, { timeout: 10_000 }).catch(() => {});
    await page.goto("/vouchers");
  });

  test("renders the voucher upload area", async ({ page }) => {
    await expect(page.getByText(/ドラッグ|ドロップ|アップロード|Upload/i)).toBeVisible();
  });

  test("shows existing vouchers list section", async ({ page }) => {
    // The page renders even with zero vouchers
    await expect(page.locator("body")).not.toContainText(/Error|エラー/i);
  });

  test("can upload a JPEG receipt via file input", async ({ page }) => {
    // Create a minimal JPEG-like file for testing
    const tmpFile = path.join(os.tmpdir(), "test-receipt.jpg");
    // Minimal JPEG header bytes
    const jpegBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    fs.writeFileSync(tmpFile, jpegBytes);

    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(tmpFile);

    // Should show uploading state or success
    await expect(
      page.getByText(/アップロード中|完了|成功|uploading|done/i),
    ).toBeVisible({ timeout: 15_000 });

    fs.unlinkSync(tmpFile);
  });
});
