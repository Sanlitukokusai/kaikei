import { test, expect } from "@playwright/test";

/**
 * E2E tests for the invoice edit page (/invoices/[id]) and PDF print page.
 * Verifies route protection without requiring authenticated state.
 */

test.describe("Invoice edit & print routes (unauthenticated)", () => {
  test("/invoices/[id] redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/invoices/00000000-0000-0000-0000-000000000000");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/invoices/[id]/print redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/invoices/00000000-0000-0000-0000-000000000000/print");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Invoice list shows edit/print/delete actions", () => {
  test("/invoices is a protected route", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page).toHaveURL(/\/login/);
  });
});
