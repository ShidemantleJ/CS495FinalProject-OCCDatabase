// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

test.describe("Church Management", () => {
  test("should add a new church with full form data and verify DB", async ({
    page,
  }) => {
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

    /* ---------------- LOGIN ---------------- */
    await page.goto("/login");

    const emailInput = page.getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
      // @ts-ignore
      await emailInput.fill(process.env.ADMIN_USERNAME);
      // @ts-ignore
      await page.getByPlaceholder(/password/i).fill(process.env.ADMIN_PASSWORD);
      await page.getByRole("button", { name: /login/i }).click();
      await expect(page).toHaveURL(/profile/);
      await page.goto("/");
    }

    /* ---------------- NAVIGATION ---------------- */
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

    /* ---------------- DB VERIFICATION ---------------- */
    const { data: record, error } = await supabase
      .from("church2")
      .select("*")
      .eq("church_name", churchData.church_name)
      .single();

    expect(error).toBeNull();
    expect(record).not.toBeNull();
    expect(record.church_physical_city).toBe(churchData.church_physical_city);
    expect(record.church_POC_email).toBe(churchData.church_POC_email);
    expect(record.project_leader).toBe(true);

    /* ---------------- CLEANUP ---------------- */
    if (record?.id) {
      await supabase.from("church2").delete().eq("id", record.id);
    }
  });
});
