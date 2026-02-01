// @ts-check
import { expect } from "@playwright/test";

// @ts-ignore
export async function authenticate(page) {
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
  await expect(page).toHaveURL(/profile/, { timeout: 15000 });
}
