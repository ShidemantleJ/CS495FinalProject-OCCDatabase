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
        [`shoebox_${currentYear}`]: 100,
        [`shoebox_${prevYear}`]: 50,
      },
      {
        church_name: `FilterTest Beta ${timestamp}`,
        church_physical_city: "CityB",
        church_physical_state: "SC",
        church_physical_zip: "20002",
        church_physical_county: "Fayette",
        [`shoebox_${currentYear}`]: 200,
        [`shoebox_${prevYear}`]: 20,
      },
      {
        church_name: `FilterTest Gamma ${timestamp}`,
        church_physical_city: "CityC",
        church_physical_state: "SC",
        church_physical_zip: "10001",
        church_physical_county: "Lamar",
        [`shoebox_${currentYear}`]: 50,
        [`shoebox_${prevYear}`]: 100,
      },
    ];

    const { data: inserted, error } = await supabase
      .from("church2")
      .insert(data)
      .select();

    if (error) {
      console.error("Error seeding data:", error);
    } else {
      testChurches = inserted;
    }
  });

  test.afterAll(async () => {
    if (supabase && testChurches.length > 0) {
      const ids = testChurches.map((c) => c.id);
      await supabase.from("church2").delete().in("id", ids);
    }
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto("/");
    // Ensure page is loaded
    await expect(page.getByText("Filter by County")).toBeVisible();
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
    await page
      .getByPlaceholder("Search by church name")
      .fill("FilterTest Beta");
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
    const yearSelect = page
      .locator("select")
      .filter({ hasText: String(currentYear) })
      .first();
    await yearSelect.selectOption(String(prevYear));

    // Verify shoebox counts update. Alpha prevYear: 50
    await expect(page.getByText(`Shoebox ${prevYear}: 50`)).toBeVisible();
  });

  test("Sort by: Shoebox Count (High → Low)", async ({ page }) => {
    if (testChurches.length === 0) test.skip();

    // Filter to just our test churches to make sorting verification easier
    await page.getByPlaceholder("Search by church name").fill("FilterTest");
    await page.getByRole("button", { name: "Apply Filters" }).click();

    // Select Sort by Shoebox Desc
    const sortSelect = page
      .locator("select")
      .filter({ hasText: "Name (A → Z)" });
    await sortSelect.selectOption("shoebox_desc");

    // Expected Order: Beta (200), Alpha (100), Gamma (50)
    const cards = page.locator(".bg-white.shadow-md");
    await expect(cards.nth(0)).toContainText(testChurches[1].church_name);
    await expect(cards.nth(1)).toContainText(testChurches[0].church_name);
    await expect(cards.nth(2)).toContainText(testChurches[2].church_name);
  });
});
