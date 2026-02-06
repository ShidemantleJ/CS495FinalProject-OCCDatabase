// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "./auth.setup.js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PLAYWRIGHT_SUPABASE_SECRET_KEY;

test.describe("Church Management & Editing", () => {
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let supabase;
  /**
   * @type {any}
   */
  let testChurchId;
  const currentYear = new Date().getFullYear();
  const timestamp = Date.now();
  const churchName = `EditTest Church ${timestamp}`;

  test.beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing. Skipping DB setup.");
      return;
    }
    // @ts-ignore
    supabase = createClient(supabaseUrl, supabaseKey);

    // Seed a church for testing
    const { data, error } = await supabase
      .from("church2")
      .insert({
        church_name: churchName,
        church_phone_number: "5555555555",
        church_physical_city: "TestCity",
        church_physical_state: "TS",
        church_physical_zip: "12345",
        church_physical_county: "TestCounty",
        church_POC_first_name: "Original",
        church_POC_last_name: "POC",
        project_leader: false,
        [`shoebox_${currentYear}`]: 10,
        notes: "Original Note",
      })
      .select()
      .single();

    if (error) {
      console.error("Error seeding church:", error);
      throw error;
    }
    testChurchId = data.id;
  });

  test.afterAll(async () => {
    if (supabase && testChurchId) {
      await supabase.from("church2").delete().eq("id", testChurchId);
    }
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("Edit Church: Basic Information", async ({ page }) => {
    await page.goto(`/church/${testChurchId}`);
    await page.getByRole("button", { name: /edit church/i }).click();

    // Verify we are on edit page
    await expect(page).toHaveURL(new RegExp(`/edit-church/${testChurchId}`));

    // Change Name and City
    const newName = `${churchName} Updated`;
    await page.locator('input[name="church_name"]').fill(newName);
    await page.locator('input[name="church_physical_city"]').fill("NewCity");

    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify redirect and content
    await expect(page).toHaveURL(new RegExp(`/church/${testChurchId}`));
    await expect(page.getByRole("heading", { name: newName })).toBeVisible();
    await expect(page.getByText("NewCity")).toBeVisible();

    // Reset name for other tests
    await page.getByRole("button", { name: /edit church/i }).click();
    await page.locator('input[name="church_name"]').fill(churchName);
    await page.getByRole("button", { name: /save changes/i }).click();
  });

  test("Edit Church: Is POC the Project Leader", async ({ page }) => {
    await page.goto(`/edit-church/${testChurchId}`);

    // Check the box
    await page.locator('input[name="project_leader"]').check();
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify on details page
    await expect(page.getByText("Project Leader: Original POC")).toBeVisible();

    // Uncheck the box
    await page.getByRole("button", { name: /edit church/i }).click();
    await page.locator('input[name="project_leader"]').uncheck();
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify change (Project Leader should be Different or N/A depending on logic, but definitely not just the name if logic holds)
    // Based on home.jsx logic, if false, it says "Different from POC"
    // On details page (not provided in context, but assuming similar logic), we check if the text changes.
    await expect(page.getByText("Project Leader: Original POC")).toBeHidden();
  });

  test("Edit Church: Manage Notes (Add, Edit, Delete)", async ({ page }) => {
    await page.goto(`/edit-church/${testChurchId}`);

    // 1. Edit Note (Append)
    const noteInput = page.locator('textarea[name="notes"]');
    await expect(noteInput).toHaveValue("Original Note");
    await noteInput.fill("Original Note - Updated");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify
    await page.getByRole("button", { name: /edit church/i }).click();
    await expect(page.locator('textarea[name="notes"]')).toHaveValue(
      "Original Note - Updated",
    );

    // 2. Add Note (Replace with longer text)
    await noteInput.fill("This is a completely new note added via test.");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify
    await page.getByRole("button", { name: /edit church/i }).click();
    await expect(page.locator('textarea[name="notes"]')).toHaveValue(
      "This is a completely new note added via test.",
    );

    // 3. Delete Note (Clear)
    await noteInput.fill("");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify
    await page.getByRole("button", { name: /edit church/i }).click();
    await expect(page.locator('textarea[name="notes"]')).toHaveValue("");
  });

  test("Edit Shoebox Counts (via Home Dashboard)", async ({ page }) => {
    // Shoebox editing is done via the modal on the Home page
    await page.goto("/");

    // Filter to find our church
    await page.getByPlaceholder("Search by church name").fill(churchName);
    await page.getByRole("button", { name: "Apply Filters" }).click();

    // Verify initial count (10)
    await expect(page.getByText(`Shoebox ${currentYear}: 10`)).toBeVisible();

    // Open Update Modal
    await page
      .getByRole("button", { name: /update .* shoebox counts/i })
      .click();

    // Find the input for our church in the modal
    // The modal lists churches. We need to find the row with our church name.
    const row = page.getByRole("row").filter({ hasText: churchName });
    const input = row.locator('input[type="number"]');

    // Update count to 50
    await input.fill("50");

    // Save
    await page.getByRole("button", { name: "Save All Changes" }).click();

    // Verify update on card
    await expect(page.getByText(`Shoebox ${currentYear}: 50`)).toBeVisible();
  });

  test("Church Relations Team Member (Display Verification)", async ({
    page,
  }) => {
    // Since we cannot edit this in the UI provided, we verify it displays "N/A" or the value if we seeded it.
    // We didn't seed a relation ID, so it should be N/A.
    await page.goto("/");
    await page.getByPlaceholder("Search by church name").fill(churchName);
    await page.getByRole("button", { name: "Apply Filters" }).click();

    const churchCard = page
      .locator("div.bg-white.shadow-md")
      .filter({ hasText: churchName });

    await expect(
      churchCard.getByText("Church Relations Team Member: N/A"),
    ).toBeVisible();
  });
});
