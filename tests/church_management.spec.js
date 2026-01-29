// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PLAYWRIGHT_SUPABASE_SECRET_KEY;

test.describe("Add New Church", () => {
  test("Add new church and verify via Dashboard", async ({ page }) => {
    if (!supabaseUrl || !supabaseKey) {
      test.skip();
    }

    // @ts-ignore
    const supabase = createClient(supabaseUrl, supabaseKey);

    const timestamp = Date.now();

    const churchData = {
      church_name: `Test Church ${timestamp}`,
      church_phone_number: "5551234567",
      church_physical_address: "123 Test Ave",
      church_physical_city: "Greenville",
      church_physical_state: "SC",
      church_physical_zip: "29601",
      church_physical_county: "Greenville",

      church_mailing_address: "PO Box 123",
      church_mailing_city: "Greenville",
      church_mailing_state: "SC",
      church_mailing_zip: "29602",

      church_POC_first_name: "John",
      church_POC_last_name: "Doe",
      church_POC_phone: "5559876543",
      church_POC_email: "johndoe@test.com",

      notes: "This church was added via automated Playwright test.",
    };

    /* ---------------- NAVIGATION ---------------- */
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /add church/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /add church/i }).click();
    await expect(page).toHaveURL(/add-church/);

    /* ---------------- FORM FILL ---------------- */
    await page
      .locator('input[name="church_name"]')
      .fill(churchData.church_name);
    await page
      .locator('input[name="church_phone_number"]')
      .fill(churchData.church_phone_number);
    await page
      .locator('input[name="church_physical_address"]')
      .fill(churchData.church_physical_address);
    await page
      .locator('input[name="church_physical_city"]')
      .fill(churchData.church_physical_city);
    await page
      .locator('input[name="church_physical_state"]')
      .fill(churchData.church_physical_state);
    await page
      .locator('input[name="church_physical_zip"]')
      .fill(churchData.church_physical_zip);
    await page
      .locator('input[name="church_physical_county"]')
      .fill(churchData.church_physical_county);

    await page
      .locator('input[name="church_mailing_address"]')
      .fill(churchData.church_mailing_address);
    await page
      .locator('input[name="church_mailing_city"]')
      .fill(churchData.church_mailing_city);
    await page
      .locator('input[name="church_mailing_state"]')
      .fill(churchData.church_mailing_state);
    await page
      .locator('input[name="church_mailing_zip"]')
      .fill(churchData.church_mailing_zip);

    await page
      .locator('input[name="church_POC_first_name"]')
      .fill(churchData.church_POC_first_name);
    await page
      .locator('input[name="church_POC_last_name"]')
      .fill(churchData.church_POC_last_name);
    await page
      .locator('input[name="church_POC_phone"]')
      .fill(churchData.church_POC_phone);
    await page
      .locator('input[name="church_POC_email"]')
      .fill(churchData.church_POC_email);

    await page.locator('textarea[name="notes"]').fill(churchData.notes);

    // Check project leader checkbox
    await page.locator('input[name="project_leader"]').check();

    /* ---------------- PHOTO UPLOAD (OPTIONAL) ---------------- */
    // CI-safe version usually skips uploads
    // await page.setInputFiles('input[type="file"]', 'tests/fixtures/church.jpg');

    /* ---------------- SUBMIT ---------------- */
    await page.getByRole("button", { name: /add church/i }).click();

    await expect(page).toHaveURL(/home/);

    /* ---------------- UI VERIFICATION ---------------- */
    // Use the dashboard filters to find the new church
    await page
      .getByPlaceholder(/search by church name/i)
      .fill(churchData.church_name);
    await page
      .getByPlaceholder(/filter by zipcode/i)
      .fill(churchData.church_physical_zip);
    await page.getByRole("button", { name: /apply filters/i }).click();

    // Verify the church card appears with correct info
    await expect(
      page.getByRole("heading", { name: churchData.church_name }),
    ).toBeVisible();
    await expect(
      page.getByText(
        `${churchData.church_physical_city}, ${churchData.church_physical_state}`,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(`${churchData.church_physical_county} County`),
    ).toBeVisible();

    /* ---------------- CLEANUP ---------------- */
    // Query DB only to get ID for deletion
    const { data: record, error } = await supabase
      .from("church2")
      .select("id")
      .eq("church_name", churchData.church_name)
      .single();

    if (record?.id) {
      await supabase.from("church2").delete().eq("id", record.id);
    }
  });
});
