// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "./auth.setup.js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PLAYWRIGHT_SUPABASE_SECRET_KEY;

test.describe("Home Page Filters & Sorting", () => {
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let supabase;
  /** @type {any[]} */
  let testChurches = [];
  /** @type {any[]} */
  let testAttributes = [];
  const currentYear = new Date().getFullYear();
  // Ensure we have a previous year that is valid in the dropdown (2023+)
  const prevYear = currentYear > 2023 ? currentYear - 1 : currentYear;

  test.beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing. Skipping DB setup.");
      return;
    }
    // @ts-ignore
    supabase = createClient(supabaseUrl, supabaseKey);

    const timestamp = Date.now();
    // Create 3 churches with distinct data for filtering
    const data = [
      {
        church_name: `FilterTest Alpha ${timestamp}`,
        church_physical_city: "CityA",
        church_physical_state: "SC",
        church_physical_zip: "10001",
        church_physical_county: "Pickens",
      },
      {
        church_name: `FilterTest Beta ${timestamp}`,
        church_physical_city: "CityB",
        church_physical_state: "SC",
        church_physical_zip: "20002",
        church_physical_county: "Fayette",
      },
      {
        church_name: `FilterTest Gamma ${timestamp}`,
        church_physical_city: "CityC",
        church_physical_state: "SC",
        church_physical_zip: "10001",
        church_physical_county: "Lamar",
      },
    ];

    const { data: insertedChurches, error: churchError } = await supabase
      .from("church2")
      .insert(data)
      .select();

    if (churchError) {
      console.error("Error seeding churches:", churchError);
    } else {
      testChurches = insertedChurches;

      // Now, seed the corresponding annual attributes
      const attributesData = [
        // Alpha
        { church_id: testChurches[0].id, year: currentYear, shoebox_count: 100 },
        { church_id: testChurches[0].id, year: prevYear, shoebox_count: 50 },
        // Beta
        { church_id: testChurches[1].id, year: currentYear, shoebox_count: 200 },
        { church_id: testChurches[1].id, year: prevYear, shoebox_count: 20 },
        // Gamma
        { church_id: testChurches[2].id, year: currentYear, shoebox_count: 50 },
        { church_id: testChurches[2].id, year: prevYear, shoebox_count: 100 },
      ];

      const { data: insertedAttrs, error: attrError } = await supabase
        .from("church_annual_attributes")
        .insert(attributesData)
        .select();

      if (attrError) {
        console.error("Error seeding attributes:", attrError);
      } else {
        testAttributes = insertedAttrs;
      }
    }
  });

  test.afterAll(async () => {
    if (supabase && testChurches.length > 0) {
      const ids = testChurches.map((c) => c.id);
      await supabase.from("church_annual_attributes").delete().in("church_id", ids);
      await supabase.from("church2").delete().in("id", ids);
    }
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    // After authentication, we land on the /profile page. Navigate to the
    // home page by clicking the "Churches" link. This is more robust than
    // page.goto() for single-page apps as it leverages Playwright's actionability waits.
    await page.getByRole("link", { name: "Churches" }).click();
    // Ensure page is loaded by waiting for a key element. Using getByRole is more specific.
    await expect(page.getByRole("heading", { name: "Filter by County" })).toBeVisible();
  });

  test("Filter by county", async ({ page }) => {
    if (testChurches.length === 0) test.skip();
    await page.getByRole("button", { name: "Pickens" }).click();
    await expect(
      page.getByRole("heading", { name: testChurches[0].church_name }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testChurches[1].church_name }),
    ).toBeHidden();
  });

  test("Search by church name", async ({ page }) => {
    if (testChurches.length === 0) test.skip();
    const searchInput = page.getByPlaceholder("Search by church name").or(page.getByText("Search by church name").first());
    await searchInput.click();
    await page.keyboard.type("FilterTest Beta");
    await page.keyboard.press("Tab");
    await page.getByRole("button", { name: "Apply Filters" }).click();
    await expect(
      page.getByRole("heading", { name: testChurches[1].church_name }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testChurches[0].church_name }),
    ).toBeHidden();
  });

  test("Filter by zipcode", async ({ page }) => {
    if (testChurches.length === 0) test.skip();
    await page.getByPlaceholder("Filter by zipcode").fill("10001");
    await page.getByRole("button", { name: "Apply Filters" }).click();
    // Alpha and Gamma have 10001
    await expect(
      page.getByRole("heading", { name: testChurches[0].church_name }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testChurches[2].church_name }),
    ).toBeVisible();
    // Beta has 20002
    await expect(
      page.getByRole("heading", { name: testChurches[1].church_name }),
    ).toBeHidden();
  });

  test(`Minimum shoebox ${currentYear}`, async ({ page }) => {
    if (testChurches.length === 0) test.skip();
    // Current Year: Alpha=100, Beta=200, Gamma=50. Filter > 150.
    await page.getByPlaceholder(`Minimum shoebox ${currentYear}`).fill("150");
    await page.getByRole("button", { name: "Apply Filters" }).click();
    await expect(
      page.getByRole("heading", { name: testChurches[1].church_name }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testChurches[0].church_name }),
    ).toBeHidden();
  });

  test("Filter by Year", async ({ page }) => {
    if (testChurches.length === 0 || currentYear === prevYear) test.skip();

    // Select previous year. Finding the select by the option value it contains or context.
    // The year select contains the current year.
    const yearControl = page.getByText("Year:").locator("..").locator('div[class*="-control"]');
    await yearControl.click();
    await page.keyboard.type(String(prevYear));
    await page.keyboard.press("Enter");

    // Verify shoebox counts update. Alpha prevYear: 50
    const alphaCard = page
      .locator("div.bg-white.shadow-md")
      .filter({ hasText: testChurches[0].church_name });
    await expect(alphaCard.getByText(`Shoebox ${prevYear}: 50`)).toBeVisible();
  });

  test("Sort by: Shoebox Count (High → Low)", async ({ page }) => {
    if (testChurches.length === 0) test.skip();

    // Filter to just our test churches to make sorting verification easier
    await page.getByPlaceholder("Search by church name").fill("FilterTest");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    // Select Sort by Shoebox Desc
    const sortControl = page.getByText("Sort by:").locator("..").locator('div[class*="-control"]');
    await sortControl.click();
    await page.keyboard.type("Shoebox Count (High");
    await page.keyboard.press("Enter");

    // Expected Order: Beta (200), Alpha (100), Gamma (50)
    // Filter to only cards from this test run using the unique timestamp
    const runTimestamp = testChurches[0].church_name.split(" ").pop();
    const cards = page.locator(".bg-white.shadow-md").filter({ hasText: runTimestamp });
    await expect(cards.nth(0)).toContainText(testChurches[1].church_name);
    await expect(cards.nth(1)).toContainText(testChurches[0].church_name);
    await expect(cards.nth(2)).toContainText(testChurches[2].church_name);
  });
});
