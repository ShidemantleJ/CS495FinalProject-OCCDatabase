// @ts-check
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "./auth.setup.js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PLAYWRIGHT_SUPABASE_SECRET_KEY;
const adminEmail = process.env.ADMIN_USERNAME;

test.describe("Profile & Team Management", () => {
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let supabase;
  // @ts-ignore
  let adminId;
  // @ts-ignore
  let subordinateId;
  const timestamp = Date.now();
  const subordinateEmail = `sub${timestamp}@test.com`;

  // Store original admin data to restore later
  let originalAdminData = {};

  test.beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey || !adminEmail) {
      console.warn("Missing credentials for Profile tests.");
      return;
    }
    // @ts-ignore
    supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Admin User ID
    const { data: admin } = await supabase
      .from("team_members")
      .select("*")
      .eq("email", adminEmail)
      .single();

    if (admin) {
      adminId = admin.id;
      originalAdminData = admin;
    } else {
      console.error("Admin user not found in team_members table.");
      return;
    }

    // 2. Assign 'Church Relations Coordinator' position to Admin
    // This ensures the "My Team" tab will populate based on the MANAGED_BY logic in profile.jsx
    await supabase.from("member_positions").insert({
      member_id: adminId,
      position: "Church Relations Coordinator",
    });

    // 3. Create a Subordinate Team Member
    const { data: sub, error: subError } = await supabase
      .from("team_members")
      .insert({
        first_name: "Subordinate",
        last_name: `User${timestamp}`,
        email: subordinateEmail,
        active: true,
        phone_number: "555-000-1111",
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creating subordinate:", subError);
    } else {
      subordinateId = sub.id;
      // 4. Assign 'Church Relations Team Member' position to Subordinate
      await supabase.from("member_positions").insert({
        member_id: subordinateId,
        position: "Church Relations Team Member",
      });
    }
  });

  test.afterAll(async () => {
    if (supabase) {
      // Cleanup Admin Position
      // @ts-ignore
      if (adminId) {
        await supabase.from("member_positions").delete().match({
          member_id: adminId,
          position: "Church Relations Coordinator",
        });

        // Restore original data (phone/city)
        await supabase
          .from("team_members")
          .update({
            // @ts-ignore
            phone_number: originalAdminData.phone_number,
            // @ts-ignore
            home_city: originalAdminData.home_city,
          })
          .eq("id", adminId);
      }

      // Cleanup Subordinate
      // @ts-ignore
      if (subordinateId) {
        await supabase
          .from("member_positions")
          .delete()
          .eq("member_id", subordinateId);
        await supabase.from("team_members").delete().eq("id", subordinateId);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("Profile Page: Verify Info and My Team", async ({ page }) => {
    // @ts-ignore
    if (!adminId || !subordinateId) test.skip();

    await page.goto("/profile");

    // 1. Verify Basic Info matches DB (Admin)
    await expect(
      page.getByText(
        // @ts-ignore
        `Name: ${originalAdminData.first_name} ${originalAdminData.last_name}`,
      ),
    ).toBeVisible();
    await expect(
      // @ts-ignore
      page.getByText(`Email: ${originalAdminData.email}`),
    ).toBeVisible();

    // 2. Verify Position is listed
    await expect(page.getByText("Church Relations Coordinator")).toBeVisible();

    // 3. Verify 'My Team' tab functionality
    await page.getByRole("button", { name: "My Team" }).click();

    // Should see the subordinate
    const subordinateRow = page
      .getByRole("listitem")
      .filter({ hasText: `Subordinate User${timestamp}` });
    await expect(subordinateRow).toBeVisible();
    await expect(subordinateRow).toContainText("Church Relations Team Member");
  });

  test("Edit Profile Information", async ({ page }) => {
    // @ts-ignore
    if (!adminId) test.skip();

    await page.goto("/profile");
    await page.getByRole("link", { name: "Edit Information" }).click();

    await expect(page).toHaveURL("/editProfile");

    // Update Phone and City
    const newPhone = "555-999-8888";
    const newCity = "Playwright City";

    const phoneInput = page.locator('input[name="phone_number"]');
    // Wait for the form to populate with original data to avoid race condition
    await expect(phoneInput).not.toHaveValue("");

    await phoneInput.fill(newPhone);
    await page.locator('input[name="home_city"]').fill(newCity);

    // Ensure the input is filled before saving
    await expect(page.locator('input[name="phone_number"]')).toHaveValue(
      newPhone,
    );

    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify redirect
    await expect(page).toHaveURL("/profile");

    // Reload to ensure fresh data is fetched
    await page.reload();

    // Verify updated info on Profile page
    // Note: Profile page format is "Phone: <number>" and address line contains city
    await expect(page.getByText(`Phone: ${newPhone}`)).toBeVisible();
    await expect(page.getByText(newCity)).toBeVisible();

    // Verify in DB
    const { data: updatedUser } = await supabase
      .from("team_members")
      .select("*")
      // @ts-ignore
      .eq("id", adminId)
      .single();
    expect(updatedUser.phone_number).toBe(newPhone);
    expect(updatedUser.home_city).toBe(newCity);
  });
});
