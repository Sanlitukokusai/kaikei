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
    await expect(page.getByLabel(/メール|Email/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード|Password/i)).toBeVisible();
  });

  test("login page has submit button", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByRole("button", { name: /ログイン|Login|Sign in/i });
    await expect(btn).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/メール|Email/i).fill("bad@example.com");
    await page.getByLabel(/パスワード|Password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /ログイン|Login|Sign in/i }).click();
    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toContainText(/エラー|error|invalid|無効/i);
  });
});
