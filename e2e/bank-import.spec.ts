import { test, expect } from "@playwright/test";

/**
 * E2E tests for bank CSV import flow.
 * The /bank page is protected; we verify route protection here.
 */

test.describe("Bank page (CSV import)", () => {
  test("/bank redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/bank");
    await expect(page).toHaveURL(/\/login/);
  });
});
