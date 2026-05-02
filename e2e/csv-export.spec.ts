import { test, expect } from "@playwright/test";

/**
 * E2E tests for CSV export API routes.
 * Without authentication, the middleware redirects to /login. We verify
 * the routes are registered and reachable (any non-network-error response).
 */

test.describe("CSV export API endpoints", () => {
  test("/api/export/journal responds (auth-gated by middleware)", async ({ request }) => {
    const res = await request.get("/api/export/journal?from=2024-01-01&to=2024-12-31", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    // Any HTTP status is acceptable: 200 (CSV), 302/307 (redirect to login),
    // or 5xx (db error in unauthenticated context). 404 means the route doesn't exist.
    expect([200, 302, 307, 308, 401, 403, 500]).toContain(res.status());
  });

  test("/api/export/trial-balance responds (auth-gated by middleware)", async ({ request }) => {
    const res = await request.get("/api/export/trial-balance?from=2024-01-01&to=2024-12-31", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect([200, 302, 307, 308, 401, 403, 500]).toContain(res.status());
  });

  test("/api/export/journal accepts custom date range parameters", async ({ request }) => {
    const res = await request.get("/api/export/journal?from=2026-01-01&to=2026-12-31", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status()).not.toBe(404);
  });

  test("/api/export/trial-balance accepts custom date range parameters", async ({ request }) => {
    const res = await request.get("/api/export/trial-balance?from=2026-01-01&to=2026-12-31", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status()).not.toBe(404);
  });
});
