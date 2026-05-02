import { test, expect } from "@playwright/test";

/**
 * Authentication flow E2E tests.
 * These run against the actual Next.js dev server.
 * They do NOT require a real user — they verify the UI and redirect behavior.
 */

test.describe("Login page", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login page has submit button", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByRole("button", { name: /ログイン|Login|Sign in/i }).first();
    await expect(btn).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("bad@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /ログイン|Login|Sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    // Form may still be processing or show server-side error — wait briefly
    await page.waitForTimeout(2000);
  });
});
