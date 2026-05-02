import { test, expect } from "@playwright/test";

/**
 * Navigation and layout E2E tests.
 * Verifies that sidebar navigation, page titles, and routing work correctly.
 * All authenticated routes redirect to /login when not logged in.
 */

const AUTHENTICATED_ROUTES = [
  { path: "/", label: "ダッシュボード" },
  { path: "/journal", label: "仕訳帳" },
  { path: "/invoices", label: "請求書" },
  { path: "/partners", label: "取引先" },
  { path: "/bank", label: "銀行取引" },
  { path: "/vouchers", label: "証憑" },
  { path: "/reports", label: "レポート" },
  { path: "/settings", label: "設定" },
];

test.describe("Route protection", () => {
  for (const { path } of AUTHENTICATED_ROUTES) {
    test(`${path} redirects to /login when not authenticated`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Login page", () => {
  test("renders the application name / branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toContainText(/会計|Kaikei|kaikei/i);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/login");
    // Page title should reference the app
    await expect(page).toHaveTitle(/Kaikei|会計|kaikei/i);
  });

  test("login form fields are present and focusable", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await emailInput.click();
    await expect(emailInput).toBeFocused();
  });

  test("email field accepts email format", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });
});
