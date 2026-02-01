// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "./auth.setup.js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PLAYWRIGHT_SUPABASE_SECRET_KEY;

test.describe.serial("Team Members Management", () => {
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let supabase;
  /**
   * @type {any}
   */
  let testChurchId;
  const timestamp = Date.now();
  const churchName = `TeamTest Church ${timestamp}`;
  const firstName = `TestFirst${timestamp}`;
  const lastName = `TestLast${timestamp}`;
  const email = `test${timestamp}@example.com`;

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
      // Clean up the team member created during tests
      await supabase.from("team_members").delete().eq("email", email);

      // Clean up the church
      if (testChurchId) {
        await supabase.from("church2").delete().eq("id", testChurchId);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("Add Team Member", async ({ page }) => {
    await page.goto("/team-members");

    // Verify we are logged in as admin (button exists)
    const addButton = page.getByRole("button", { name: /add team member/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page).toHaveURL(/\/add-member/);

    // Fill form
    await page.locator('input[name="first_name"]').fill(firstName);
    await page.locator('input[name="last_name"]').fill(lastName);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone_number"]').fill("555-019-2834");
    await page.locator('input[name="home_address"]').fill("123 Test St");
    await page.locator('input[name="home_city"]').fill("Test City");
    await page.locator('input[name="home_state"]').fill("TS");
    await page.locator('input[name="home_zip"]').fill("12345");
    await page.locator('input[name="home_county"]').fill("Test County");
    await page.locator('input[name="date_of_birth"]').fill("1990-01-01");

    // Church info
    await page
      .locator('input[name="church_affiliation_name"]')
      .fill(churchName);
    await page
      .locator('input[name="church_affiliation_city"]')
      .fill("TestCity");
    await page.locator('input[name="church_affiliation_state"]').fill("TS");
    await page
      .locator('input[name="church_affiliation_county"]')
      .fill("TestCounty");

    await page.getByRole("button", { name: /add member/i }).click();

    // Verify redirect and presence in list
    await expect(page).toHaveURL(/\/team-members/);
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  });

  test("Search by Name", async ({ page }) => {
    await page.goto("/team-members");
    await page.getByPlaceholder("Search by name...").fill(firstName);
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

    // Negative test
    await page.getByPlaceholder("Search by name...").fill("ZZZZZZZZ");
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeHidden();
  });

  test("Search by Church", async ({ page }) => {
    await page.goto("/team-members");
    await page.getByPlaceholder("Search by church...").fill(churchName);
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  });

  test("Search by County", async ({ page }) => {
    await page.goto("/team-members");
    await page.getByPlaceholder("Search by county...").fill("Test County");
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  });

  test("Copy All Emails", async ({ page, context, browserName }) => {
    // Grant clipboard permissions
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-write"]);
    }

    await page.goto("/team-members");
    // Filter to just our user to avoid copying huge lists
    await page.getByPlaceholder("Search by name...").fill(firstName);

    await page.getByRole("button", { name: /copy all emails/i }).click();

    // Verify success message
    await expect(page.getByText("Emails copied!")).toBeVisible();
  });

  test("View Profile", async ({ page }) => {
    await page.goto("/team-members");
    await page.getByPlaceholder("Search by name...").fill(firstName);
    await page
      .locator("div.bg-white.shadow-lg.rounded-xl")
      .filter({ hasText: `${firstName} ${lastName}` })
      .getByRole("button", { name: /view profile/i })
      .click();

    // Verify profile page content
    await expect(
      page.getByRole("heading", { name: `${firstName} ${lastName}` }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    // Check church affiliation link
    await expect(
      page.getByRole("button", { name: churchName.replace(/_/g, " ") }).first(),
    ).toBeVisible();
  });

  test("Edit Member", async ({ page }) => {
    await page.goto(`/team-members`);
    await page.getByPlaceholder("Search by name...").fill(firstName);
    await page
      .locator("div.bg-white.shadow-lg.rounded-xl")
      .filter({ hasText: `${firstName} ${lastName}` })
      .getByRole("button", { name: /edit member/i })
      .click();

    const newPhone = "555-999-0000";
    const phoneInput = page.locator('input[name="phone_number"]');

    // Wait for the initial value to load to ensure the form is ready
    await expect(phoneInput).toHaveValue("555-019-2834");

    await phoneInput.fill(newPhone);
    await page.getByRole("button", { name: /update member/i }).click();

    await expect(page).toHaveURL(/\/team-members/);

    // Reload to ensure fresh data
    await page.reload();

    // Verify change
    await page.getByPlaceholder("Search by name...").fill(firstName);
    await expect(page.getByText(`Phone: ${newPhone}`)).toBeVisible();
  });

  test("Delete Member", async ({ page }) => {
    await page.goto("/team-members");
    await page.getByPlaceholder("Search by name...").fill(firstName);

    // Find the member card and click the delete button (trash icon)
    const memberCard = page
      .locator("div.bg-white.shadow-lg.rounded-xl")
      .filter({ hasText: `${firstName} ${lastName}` });
    await memberCard.getByTitle("Delete Member").click();

    // Confirm deletion in the modal
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    // Verify the member is gone
    await expect(memberCard).toBeHidden();
  });
});
