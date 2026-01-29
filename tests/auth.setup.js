// @ts-check
import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn(
      "Admin credentials not found in environment variables. Skipping auth setup.",
    );
    return;
  }

  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill(username);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL(/profile/);

  await page.context().storageState({ path: authFile });
});
