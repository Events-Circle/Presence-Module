import { test, expect } from "@playwright/test";
const api = "https://events-circle-api-production.up.railway.app";
const org = "org-test";
test("account, full dashboard, versioned profile save, listing creation, and logout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let profile = {
    id: "profile",
    supplierId: "supplier",
    slug: "ever-after",
    description: "Thoughtful events, beautifully planned.",
    tagline: "Moments that stay with you.",
    published: false,
    version: 1,
    publishedAt: null,
  };
  const supplier = {
    id: "supplier",
    organizationId: org,
    businessName: "Ever After Events",
    category: "Event planner",
    city: "Beirut, Lebanon",
    serviceAreas: [],
    acceptInquiries: true,
  };
  let listings: any[] = [];
  await page.route(api + "/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      p = url.pathname,
      method = req.method();
    let data: any = {},
      status = 200;
    if (p.endsWith("/auth/login"))
      data = {
        accessToken: "test-access",
        refreshToken: "test-refresh",
        expiresIn: 600,
        tokenType: "Bearer",
      };
    else if (p.endsWith("/auth/logout")) data = {};
    else if (p.endsWith("/memberships"))
      data = [
        {
          organizationId: org,
          role: "OWNER",
          organization: { name: "Ever After Events" },
        },
      ];
    else if (p.endsWith("/suppliers/current")) data = supplier;
    else if (p.endsWith("/modules"))
      data = [
        { id: "presence", enabled: true, implemented: true },
        { id: "leads", enabled: true, implemented: true },
      ];
    else if (p.endsWith("/readiness"))
      data = { score: 75, ready: false, missing: ["logo"] };
    else if (p.endsWith("/presence/profile")) {
      if (method === "PUT") {
        const body = req.postDataJSON();
        expect(body.version).toBe(1);
        profile = { ...profile, ...body, version: 2 };
      }
      data = profile;
    } else if (p.includes("/collections/")) {
      expect(req.headers()["x-organization-id"]).toBe(org);
      expect(req.headers().authorization).toBe("Bearer test-access");
      if (method === "POST") {
        const body = req.postDataJSON();
        listings.push({ ...body, id: "listing", status: "DRAFT", version: 1 });
        data = listings[0];
        status = 201;
      } else data = p.endsWith("/listings") ? listings : [];
    } else {
      status = 404;
      data = {};
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("example-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("My Presence", { exact: true })).toBeVisible();
  await expect(page.getByText("75%", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("overview-top.png") });
  for (const label of [
    "Business identity",
    "Page preview",
    "Listings snapshot",
    "Gallery",
  ])
    await expect(page.getByText(label, { exact: true })).toBeAttached();
  await page.getByRole("button", { name: "Complete profile →" }).click();
  await page
    .getByRole("button", { name: "Edit introduction", exact: true })
    .click();
  await page
    .getByLabel("Tagline", { exact: true })
    .fill("Beautiful celebrations, made personal.");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(
    page.getByText("Business profile", { exact: true }),
  ).toBeVisible();
  expect(profile.tagline).toBe("Beautiful celebrations, made personal.");
  await page.getByRole("tab", { name: "Listings", exact: true }).click();
  await page.getByRole("button", { name: "+ Add", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Wedding planning");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Wedding planning", { exact: true }),
  ).toBeVisible();
  expect(listings[0].type).toBe("SERVICE");
  expect(listings[0].pricingMode).toBe("ON_REQUEST");
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Publish page", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign up with email", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Sign up with email", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("failed login stays actionable", async ({ page }) => {
  await page.route(api + "/**", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("wrong@example.test");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/Email or password is incorrect/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
});

test("new supplier registration reaches a real empty dashboard", async ({
  page,
}, testInfo) => {
  let created = false;
  let supplier: any;
  await page.route(api + "/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    let data: any = null,
      status = 200;
    if (p.endsWith("/auth/register")) {
      expect(route.request().postDataJSON().displayName).toBe("Test Owner");
      data = {
        accessToken: "access",
        refreshToken: "refresh",
        expiresIn: 600,
        tokenType: "Bearer",
      };
    } else if (p.endsWith("/memberships"))
      data = created
        ? [
            {
              organizationId: org,
              role: "OWNER",
              organization: { name: "New Studio" },
            },
          ]
        : [];
    else if (p.endsWith("/suppliers")) {
      supplier = {
        ...route.request().postDataJSON(),
        id: "supplier",
        organizationId: org,
      };
      created = true;
      data = supplier;
      status = 201;
    } else if (p.endsWith("/suppliers/current")) data = supplier;
    else if (p.endsWith("/modules"))
      data = [{ id: "presence", enabled: true, implemented: true }];
    else if (p.endsWith("/presence/profile")) status = 404;
    else throw Error("Unexpected request: " + p);
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sign up with email", exact: true })
    .click();
  await page.getByLabel("Your name", { exact: true }).fill("Test Owner");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new@example.test");
  await page
    .getByLabel("Password · 12–128 characters", { exact: true })
    .fill("test-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText("Set up your business", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("onboarding-top.png") });
  await page.getByLabel("Business name", { exact: true }).fill("New Studio");
  await page.getByRole("button", { name: "Category", exact: true }).click();
  await page
    .getByRole("button", { name: "Event planner", exact: true })
    .click();
  await page.getByLabel("City", { exact: true }).fill("Beirut");
  await page
    .getByRole("button", { name: "Save business", exact: true })
    .click();
  await expect(page.getByText("My Presence", { exact: true })).toBeVisible();
  await expect(page.getByText("0%", { exact: true })).toBeVisible();
  await expect(page.getByText("New Studio", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview page", exact: true }),
  ).toBeDisabled();
});
