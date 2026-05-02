import { test, expect } from "@playwright/test";

/**
 * E2E tests for the reports page (P/L, B/S, trial balance, consumption tax)
 * and multi-period navigation. Verifies route protection.
 */

test.describe("Reports page (consumption tax + multi-period)", () => {
  test("/reports redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/reports?from=2024-04-01&to=2025-03-31 also requires auth", async ({ page }) => {
    await page.goto("/reports?from=2024-04-01&to=2025-03-31");
    await expect(page).toHaveURL(/\/login/);
  });
});
