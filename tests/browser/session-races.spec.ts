import { test, expect, type Page, type Route } from "@playwright/test";
const api = "https://events-circle-api-production.up.railway.app";
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
async function fixture(page: Page) {
  await page.route(api + "/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const org = req.headers()["x-organization-id"] || "A";
    const supplier = {
      id: org,
      organizationId: org,
      businessName: `Studio ${org}`,
      category: "Planner",
      city: "Beirut",
      serviceAreas: [],
    };
    const profile = {
      id: org,
      supplierId: org,
      slug: org.toLowerCase(),
      description: `Private ${org}`,
      published: true,
      pageAddressConfirmed: true,
      version: 1,
    };
    let data: unknown = {};
    if (path.endsWith("/auth/login"))
      data = {
        accessToken: "access",
        refreshToken: "refresh",
        expiresIn: 600,
        tokenType: "Bearer",
      };
    else if (path.endsWith("/memberships"))
      data = ["A", "B"].map((id) => ({
        organizationId: id,
        role: "OWNER",
        organization: { name: `Studio ${id}` },
      }));
    else if (path.endsWith("/suppliers/current")) data = supplier;
    else if (path.endsWith("/presence/profile")) data = profile;
    else if (path.endsWith("/readiness"))
      data = { score: 100, ready: true, missing: [] };
    else if (path.endsWith("/modules"))
      data = [{ id: "presence", enabled: true, implemented: true }];
    else if (path.includes("/collections/")) data = [];
    else if (path.includes("/presence/public/")) {
      const id = path.endsWith("/a") ? "A" : "B";
      data = {
        ...profile,
        description: `Public ${id}`,
        supplier: { ...supplier, businessName: `Studio ${id}` },
        portfolio: [],
        listings: [],
        gallery: [],
      };
    }
    await route.fulfill({ json: data });
  });
  await page.goto("/");
  await button(page, "Login").click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("testing-password");
  await button(page, "Sign in").click();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(button(page, "Studio A · Current")).toBeVisible();
}
test("business switching stays disabled until publishing and its refresh finish", async ({
  page,
}) => {
  await fixture(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    api + "/api/v1/presence/profile/unpublish",
    async (route) => {
      await pending;
      await route.fulfill({ json: {} });
    },
  );
  const sent = page.waitForRequest(api + "/api/v1/presence/profile/unpublish");
  await button(page, "Unpublish page").click();
  await sent;
  await expect(button(page, "Studio B")).toBeDisabled();
  release();
  await expect(button(page, "Studio B")).toBeEnabled();
  await button(page, "Studio B").click();
  await expect(button(page, "Studio B · Current")).toBeVisible();
  await button(page, "Preview page").click();
  await expect(page.getByText("Public B", { exact: true })).toBeVisible();
});
for (const returnToOriginal of [false, true]) {
  test(`late public preview cannot replace the current business (return to original: ${returnToOriginal})`, async ({
    page,
  }) => {
    await fixture(page);
    let delayed!: Route;
    await page.route(api + "/api/v1/presence/public/a", (route) => {
      if (!delayed) delayed = route;
      else return route.fallback();
    });
    const sent = page.waitForRequest(api + "/api/v1/presence/public/a");
    await button(page, "Preview page").click();
    await sent;
    await button(page, "Close").click();
    await button(page, "Studio B").click();
    await expect(button(page, "Studio B · Current")).toBeVisible();
    await button(page, "Preview page").click();
    await expect(page.getByText("Public B", { exact: true })).toBeVisible();
    let expected = "Public B";
    if (returnToOriginal) {
      await button(page, "Close").click();
      await button(page, "Studio A").click();
      await expect(button(page, "Studio A · Current")).toBeVisible();
      await button(page, "Preview page").click();
      expected = "Public A";
      await expect(page.getByText(expected, { exact: true })).toBeVisible();
    }
    const completed = page.waitForResponse(api + "/api/v1/presence/public/a");
    await delayed.fulfill({
      json: {
        description: "Late Public A",
        supplier: {
          businessName: "Studio A",
          category: "Planner",
          city: "Beirut",
          serviceAreas: [],
        },
        portfolio: [],
        listings: [],
        gallery: [],
      },
    });
    await (await completed).finished();
    // Allow the fetch continuation and React commit to run before inspecting it.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await expect(page.getByText(expected, { exact: true })).toBeVisible();
    await expect(page.getByText("Late Public A", { exact: true })).toHaveCount(
      0,
    );
  });
}
