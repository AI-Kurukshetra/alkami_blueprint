import { expect, test } from "@playwright/test";

test("login page exposes MFA and trusted-device controls", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await expect(page.getByPlaceholder("MFA code")).toBeVisible();
  await expect(page.getByText(/trust this device/i)).toBeVisible();
});

test("dashboard redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("admin routes redirect unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin/users");

  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
