// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "./auth.setup.js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PLAYWRIGHT_SUPABASE_SECRET_KEY;

test.describe.serial("Individuals Management", () => {
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let supabase;
  /** @type {any} */
  let testChurchId;
  const timestamp = Date.now();
  const churchName = `IndivTest Church ${timestamp}`;
  const firstName = `IndivFirst${timestamp}`;
  const lastName = `IndivLast${timestamp}`;
  const email = `indiv${timestamp}@example.com`;

  test.beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing. Skipping DB setup.");
      return;
    }
    // @ts-ignore
    supabase = createClient(supabaseUrl, supabaseKey);

    // Seed a church for affiliation testing
    const { data, error } = await supabase
      .from("church2")
      .insert({
        church_name: churchName,
        church_physical_city: "TestCity",
        church_physical_state: "TS",
        church_physical_zip: "12345",
        church_physical_county: "TestCounty",
        church_POC_first_name: "POC",
        church_POC_last_name: "Test",
      })
      .select()
      .single();

    if (error) {
      console.error("Error seeding church:", error);
    } else {
      testChurchId = data.id;
    }
  });

  test.afterAll(async () => {
    if (supabase) {
      // Clean up the individual created during tests
      await supabase.from("individuals").delete().eq("email", email);

      // Clean up the church
      if (testChurchId) {
        await supabase.from("church2").delete().eq("id", testChurchId);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("Add Individual", async ({ page }) => {
    await page.goto("/individuals");

    // Verify we are logged in as admin (button exists)
    const addButton = page.getByRole("button", { name: /add individual/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page).toHaveURL(/\/add-individual/);

    // Fill form
    await page.getByPlaceholder("First Name").fill(firstName);
    await page.getByPlaceholder("Last Name").fill(lastName);
    await page.getByPlaceholder("Email").fill(email);

    // Select Church
    await page
      .locator('select[name="church_name"]')
      .selectOption({ label: churchName });

    await page.getByPlaceholder("Role").fill("Volunteer");

    // Check "Craft Ideas" resource
    await page.getByLabel("Craft Ideas").check();

    await page.getByRole("button", { name: /add individual/i }).click();

    // Verify redirect and presence in list
    await expect(page).toHaveURL(/\/individuals/);
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  });

  test("Search and Filter Individuals", async ({ page }) => {
    await page.goto("/individuals");

    // 1. Search by Church Name
    await page.getByPlaceholder("Search by church...").fill(churchName);
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

    // Negative search
    await page
      .getByPlaceholder("Search by church...")
      .fill("NonExistentChurch");
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeHidden();
    await page.getByPlaceholder("Search by church...").fill(""); // Clear

    // 2. Filter by Active to Emails
    // Select "Active" (assuming "All" is default, we explicitly select Active)
    await page
      .locator("select")
      .filter({ hasText: "All" })
      .selectOption("true");
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

    // Select "Inactive" (should hide our user since default is active)
    await page
      .locator("select")
      .filter({ hasText: "All" })
      .selectOption("false");
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeHidden();

    // Reset
    await page.getByRole("button", { name: "Clear All Filters" }).click();

    // 3. Filter by Resources Requested
    // We checked "Craft Ideas" in creation
    await page.getByLabel("Craft Ideas").check();
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

    // Check "Packing Party Ideas" (which we didn't check)
    await page.getByLabel("Craft Ideas").uncheck();
    await page.getByLabel("Packing Party Ideas").check();
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeHidden();
  });

  test("Sort Individuals", async ({ page }) => {
    await page.goto("/individuals");
    // Verify the sort dropdown is functional
    const sortSelect = page
      .locator("select")
      .filter({ hasText: "Name (A → Z)" });
    await expect(sortSelect).toBeVisible();

    await sortSelect.selectOption("name_desc");
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  });

  test("Edit Individual", async ({ page }) => {
    await page.goto("/individuals");
    await page.getByPlaceholder("Search by church...").fill(churchName);

    // Click the row to expand
    const row = page.getByRole("row").filter({ hasText: email });
    await row.click();

    // Verify edit form appears (Notes field)
    const notesField = page.getByPlaceholder(
      "Add notes about this individual...",
    );
    await expect(notesField).toBeVisible();

    // Update notes
    const testNote = "Updated note via Playwright";
    await notesField.fill(testNote);

    // Save
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Wait for the edit form to close to ensure save is complete
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toBeHidden();

    // Wait for the row to return to collapsed state to ensure it's ready for interaction
    await expect(row.getByText("(Click to edit)")).toBeVisible();

    // Re-open to check value persisted
    // Click the first cell (Name) to avoid clicking the "Active" cell which stops propagation
    await row.locator("td").first().click();
    await expect(
      page.getByPlaceholder("Add notes about this individual..."),
    ).toHaveValue(testNote);
  });

  test("Copy All Emails", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-write"]);
    }
    await page.goto("/individuals");
    await page.getByPlaceholder("Search by church...").fill(churchName);
    await page.getByRole("button", { name: /copy all emails/i }).click();
    await expect(page.getByText("✓ Copied!")).toBeVisible();
  });

  test("Delete Individual", async ({ page }) => {
    await page.goto("/individuals");
    await page.getByPlaceholder("Search by church...").fill(churchName);
    const row = page
      .getByRole("row")
      .filter({ hasText: `${firstName} ${lastName}` });
    await row.getByTitle("Delete Individual").click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(row).toBeHidden();
  });
});
