import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const detailTypes = JSON.parse(
  readFileSync(new URL("./detail-types.json", import.meta.url), "utf8"),
);
const api = "https://events-circle-api-production.up.railway.app";
async function fixture(
  page: Page,
  options: {
    noProfile?: boolean;
    role?: string;
    published?: boolean;
    previewFail?: boolean;
    shareFail?: boolean;
    failLoad?: boolean;
    conflict?: boolean;
    detailsFail?: boolean;
  } = {},
) {
  let hasProfile = !options.noProfile;
  const state = {
    failLoad: !!options.failLoad,
    detailsFail: !!options.detailsFail,
    profile: {
      categoryDetails: {
        type: "GENERAL",
        values: {} as Record<string, unknown>,
      },
      id: "p",
      supplierId: "s",
      slug: options.noProfile ? "draft-internal-address" : "qa-studio",
      pageAddressConfirmed: !options.noProfile,
      description: "A thoughtful event studio.",
      tagline: "Made for you",
      published: !!options.published,
      version: 1,
      publishedAt: null,
      logoMediaId: null,
      coverMediaId: null,
    },
    items: { portfolio: [], listings: [], gallery: [] } as Record<
      string,
      any[]
    >,
    calls: [] as { path: string; body: any; method: string }[],
    imageReads: 0,
    uploads: 0,
  };
  const supplier = {
    id: "s",
    organizationId: "org",
    businessName: "QA Studio",
    category: "Event planner",
    city: "Beirut",
    serviceAreas: [],
    acceptInquiries: true,
  };
  await page.route(api + "/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method();
    const body =
      request.postData() &&
      request.headers()["content-type"]?.includes("application/json")
        ? request.postDataJSON()
        : null;
    state.calls.push({ path, body, method });
    let data: any = {},
      status = 200;
    if (path.endsWith("/auth/login"))
      data = {
        accessToken: "qa-access",
        refreshToken: "qa-refresh",
        expiresIn: 600,
        tokenType: "Bearer",
      };
    else if (path.endsWith("/auth/logout")) data = {};
    else if (path.endsWith("/memberships"))
      data = [
        {
          organizationId: "org",
          role: options.role || "OWNER",
          organization: { name: "QA Studio" },
        },
      ];
    else if (path.endsWith("/suppliers/current")) {
      if (method === "PUT") Object.assign(supplier, body);
      data = supplier;
      if (state.failLoad) status = 500;
    } else if (path.endsWith("/catalogs/categories"))
      data = [
        {
          id: "category-events",
          label: "Event planning",
          active: true,
          kind: "CATEGORY",
        },
      ];
    else if (path.endsWith("/detail-types")) {
      data = detailTypes;
      if (state.detailsFail) status = 503;
    } else if (path.endsWith("/modules"))
      data = [{ id: "presence", enabled: true, implemented: true }];
    else if (path.endsWith("/readiness"))
      data = state.profile.pageAddressConfirmed
        ? { score: 100, ready: true, missing: [] }
        : { score: 80, ready: false, missing: ["slug"] };
    else if (
      path.endsWith("/profile/publish") ||
      path.endsWith("/profile/unpublish")
    ) {
      state.profile.published = path.endsWith("/publish");
      state.profile.version++;
      data = state.profile;
    } else if (path.endsWith("/presence/profile")) {
      if (method === "PUT") {
        hasProfile = true;
        if (options.conflict) status = 409;
        else
          state.profile = {
            ...state.profile,
            ...body,
            pageAddressConfirmed:
              state.profile.pageAddressConfirmed ||
              (!!body.slug && body.slug !== state.profile.slug),
            version: state.profile.version + 1,
          };
      }
      data = state.profile;
      if (!hasProfile) status = 404;
    } else if (path.endsWith("/share")) {
      status = options.shareFail ? 503 : 200;
      data = {
        url: "https://example.com/qa-studio",
        qrPayload: "https://example.com/qa-studio",
        title: "QA Studio",
        description: "Studio",
      };
    } else if (path.includes("/presence/public/")) {
      status = options.previewFail ? 500 : 200;
      data = { ...state.profile, supplier, ...state.items };
    } else if (path === "/api/v1/core/media" && method === "POST") {
      data = { id: "image-" + ++state.uploads };
      status = 201;
    } else if (/\/media\/image-\d+\/file$/.test(path)) {
      expect(request.headers().authorization).toBe("Bearer qa-access");
      expect(request.headers()["x-organization-id"]).toBe("org");
      state.imageReads++;
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      });
      return;
    } else if (path.includes("/collections/")) {
      const parts = path.split("/"),
        collection = parts[5]!,
        id = parts[6],
        action = parts[7];
      const items = state.items[collection]!;
      if (!id && method === "POST") {
        data = {
          id: "item-" + items.length,
          ...body,
          status: "DRAFT",
          version: 1,
        };
        items.push(data);
        status = 201;
      } else if (id) {
        const item = items.find((x) => x.id === id);
        if (method === "PUT") {
          if (options.conflict) status = 409;
          else Object.assign(item, body, { version: item.version + 1 });
        } else if (method === "DELETE") item.status = "ARCHIVED";
        else if (action)
          item.status = action === "publish" ? "PUBLISHED" : "DRAFT";
        data = item;
      } else data = items;
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
  await page
    .getByLabel("Email address", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("testing-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  return state;
}
const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true }).click();
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
test("listing price, editing, publish, archive cancellation and restore", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Listings");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Planning session");
  await button(page, "Content category").click();
  await button(page, "Event planning").click();
  await button(page, "Starting from").click();
  await page.getByLabel("Price · e.g. 25.00").fill("25.50");
  await button(page, "Save draft").click();
  await expect(
    page.getByText("Planning session", { exact: true }),
  ).toBeVisible();
  expect(state.items.listings![0].amountMinor).toBe(2550);
  expect(state.items.listings![0].categoryId).toBe("category-events");
  await expect(page.getByText(/From USD 25.50/)).toBeVisible();
  await button(page, "Edit").click();
  await expect(page.getByLabel("Price · e.g. 25.00")).toHaveValue("25.50");
  await button(page, "Close").click();
  await button(page, "Publish").click();
  await expect(button(page, "Unpublish")).toBeVisible();
  await button(page, "Unpublish").click();
  await expect(button(page, "Publish")).toBeVisible();
  await button(page, "Publish").click();
  await expect(button(page, "Unpublish")).toBeVisible();
  await button(page, "Archive").click();
  await button(page, "Cancel").click();
  expect(state.items.listings![0].status).toBe("PUBLISHED");
  await button(page, "Archive").click();
  await button(page, "Archive item").click();
  await button(page, "Archived").click();
  await button(page, "Restore draft").click();
  await expect(
    page.getByText("No archived items", { exact: true }),
  ).toBeVisible();
  expect(state.items.listings![0].status).toBe("DRAFT");
});
test("portfolio and gallery creation, unsaved changes and scoped filters", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Portfolio");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Unsaved work");
  await button(page, "Close").click();
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toBeVisible();
  await button(page, "Keep editing").click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Unsaved work",
  );
  await button(page, "Close").click();
  await button(page, "Discard changes").click();
  await button(page, "+ Add").click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("");
  await page.getByLabel("Title", { exact: true }).fill("Garden wedding");
  await button(page, "Save draft").click();
  await expect.poll(() => state.items.portfolio.length).toBe(1);
  await button(page, "Gallery").click();
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Summer album");
  await button(page, "Save draft").click();
  await expect.poll(() => state.items.gallery.length).toBe(1);
  await tab(page, "Listings");
  await button(page, "Product").click();
  await expect(
    page.getByText("No matching listings", { exact: true }),
  ).toBeVisible();
});
test("profile publication, draft preview and share availability", async ({
  page,
}) => {
  const state = await fixture(page, { shareFail: true });
  await button(page, "Preview page").click();
  await expect(page.getByText(/Your page is still a draft/)).toBeVisible();
  await button(page, "Close").click();
  await tab(page, "Profile");
  await button(page, "Publish page").click();
  await expect(button(page, "Unpublish page")).toBeVisible();
  expect(state.profile.published).toBe(true);
  await tab(page, "Overview");
  await tab(page, "Profile");
  await button(page, "Link & QR").click();
  await expect(
    page.getByText(/Public website sharing is not available yet/),
  ).toBeVisible();
  await button(page, "Close").click();
  await tab(page, "Profile");
  await button(page, "Unpublish page").click();
  await expect(button(page, "Publish page")).toBeVisible();
  expect(state.profile.published).toBe(false);
});
test("public preview failure does not present private content as public", async ({
  page,
}) => {
  await fixture(page, { published: true, previewFail: true });
  await button(page, "Preview page").click();
  await expect(button(page, "Retry preview")).toBeVisible();
  await expect(
    page.getByText("A thoughtful event studio.", { exact: true }),
  ).not.toBeVisible();
});
test("loading failure can recover using Retry", async ({ page }) => {
  const state = await fixture(page, { failLoad: true });
  await expect(button(page, "Retry")).toBeVisible();
  state.failLoad = false;
  await button(page, "Retry").click();
  await expect(page.getByText("My Presence", { exact: true })).toBeVisible();
});
test("viewer cannot edit or publish and has clear guidance", async ({
  page,
}) => {
  await fixture(page, { role: "VIEWER" });
  await tab(page, "Listings");
  await expect(button(page, "+ Add")).toHaveCount(0);
  await expect(page.getByText(/An owner or editor can add/)).toBeVisible();
  await tab(page, "Profile");
  await expect(button(page, "Edit all profile details")).toHaveCount(0);
  await expect(button(page, "Publish page")).toHaveCount(0);
  await expect(page.getByText(/You have view-only access/)).toBeVisible();
});
test("version conflict keeps edits and gives recovery guidance", async ({
  page,
}) => {
  await fixture(page, { conflict: true });
  await tab(page, "Profile");
  await button(page, "Edit all profile details").click();
  await page.getByLabel("Tagline", { exact: true }).fill("My new tagline");
  await button(page, "Save profile").click();
  await expect(page.getByText(/This item changed/)).toBeVisible();
  await expect(page.getByLabel("Tagline", { exact: true })).toHaveValue(
    "My new tagline",
  );
});
test("signup validates email and password before making a request", async ({
  page,
}) => {
  await page.goto("/");
  await button(page, "Sign up with email").click();
  await page.getByLabel("Your name", { exact: true }).fill("Test");
  await page.getByLabel("Email address", { exact: true }).fill("invalid");
  await page.getByLabel("Password · 12–128 characters").fill("short");
  await button(page, "Create account").click();
  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("qa@example.test");
  await button(page, "Create account").click();
  await expect(
    page.getByText("Use 12–128 characters.", {
      exact: true,
    }),
  ).toBeVisible();
  await button(page, "Show password").click();
  await expect(page.getByLabel("Password · 12–128 characters")).toHaveAttribute(
    "type",
    "text",
  );
});
test("editor role edits presence but cannot edit shared business identity", async ({
  page,
}) => {
  await fixture(page, { role: "EDITOR" });
  await tab(page, "Profile");
  await expect(button(page, "Edit all profile details")).toBeVisible();
  await expect(button(page, "Edit business information")).toHaveCount(0);
});
test("private media carries credentials on web and form upload remains usable", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Profile");
  await button(page, "Edit all profile details").click();
  const chooser = page.waitForEvent("filechooser");
  await button(page, "Choose logo").click();
  await (
    await chooser
  ).setFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect.poll(() => state.imageReads).toBeGreaterThan(0);
  await button(page, "Save profile").click();
  await expect.poll(() => state.profile.logoMediaId).toBe("image-1");
});

test("offer expiry and price validation avoid accidental bad saves", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Listings");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Autumn offer");
  await button(page, "Offer").click();
  await button(page, "Fixed price").click();
  await page.getByLabel("Price · e.g. 25.00").fill("25.555");
  await button(page, "Save draft").click();
  await expect(page.getByText(/up to 2 decimal places/)).toBeVisible();
  expect(state.items.listings).toHaveLength(0);
  await page.getByLabel("Price · e.g. 25.00").fill("25");
  await button(page, "Choose expiry date").click();
  const today = new Date();
  const selected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-15`;
  await button(page, selected).click();
  await button(page, "Save draft").click();
  await expect
    .poll(() => state.items.listings![0]?.validUntil)
    .toBe(selected + "T23:59:59.999Z");
});
test("publish errors name missing content and stay recoverable", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Listings");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Draft");
  await button(page, "Save draft").click();
  await page.route(
    api + "/api/v1/presence/collections/listings/*/publish",
    (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          details: { missing: ["category", "media", "description"] },
        }),
      }),
  );
  await button(page, "Publish").click();
  await expect(
    page.getByText(/Not ready yet.*Business category.*Cover image/),
  ).toBeVisible();
  expect(state.items.listings![0].status).toBe("DRAFT");
  await expect(button(page, "Edit")).toBeEnabled();
});
test("successful public preview and share show supplied public data", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await fixture(page, { published: true });
  await button(page, "Preview page").click();
  await expect(
    page.getByText("A thoughtful event studio.", { exact: true }),
  ).toBeVisible();
  await button(page, "Close").click();
  await tab(page, "Profile");
  await button(page, "Link & QR").click();
  await expect(
    page.getByText("https://example.com/qa-studio", { exact: true }),
  ).toBeVisible();
  await button(page, "Copy link").click();
  await expect(
    page.getByText("Link copied. Ready to paste.", { exact: true }),
  ).toBeVisible();
});
test("an expired session returns to a usable sign-in screen", async ({
  page,
}) => {
  await fixture(page);
  await tab(page, "Profile");
  await page.route(api + "/api/v1/presence/profile", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
  );
  await button(page, "Refresh data").click();
  await expect(button(page, "Login")).toBeVisible();
  await expect(page.getByText(/session expired/)).toBeVisible();
});
test("catalog failure can be retried without losing the draft", async ({
  page,
}) => {
  await fixture(page);
  await page.route(api + "/api/v1/core/catalogs/categories", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await tab(page, "Portfolio");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Keep this draft");
  await expect(button(page, "Retry categories")).toBeVisible();
  await page.unroute(api + "/api/v1/core/catalogs/categories");
  await button(page, "Retry categories").click();
  await button(page, "Content category").click();
  await expect(button(page, "Event planning")).toBeVisible();
  await button(page, "Close content category choices").click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Keep this draft",
  );
});
test("web layout keeps navigation and editor fields within the viewport", async ({
  page,
}, testInfo) => {
  await fixture(page);
  for (const name of ["Overview", "Portfolio", "Listings", "Profile"]) {
    await tab(page, name);
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await page.screenshot({
      path: testInfo.outputPath(name.toLowerCase() + ".png"),
    });
  }
  await button(page, "Edit all profile details").click();
  await expect(
    page.getByLabel("Public page address · e.g. ever-after-events"),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("profile-editor.png") });
});
test("business editing validates required details and preserves API ownership", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Profile");
  await button(page, "Edit business information").click();
  await page.getByLabel("Business name", { exact: true }).fill("");
  await button(page, "Save business").click();
  await expect(
    page.getByText("Enter your business name.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Updated Studio");
  await page.getByLabel("Contact email", { exact: true }).fill("invalid");
  await button(page, "Save business").click();
  await expect(
    page.getByText("Enter a valid contact email, or leave it blank.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Contact email", { exact: true })
    .fill("contact@example.test");
  await button(page, "Save business").click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  expect(
    state.calls.find(
      (c) => c.method === "PUT" && c.path.endsWith("/suppliers/current"),
    )?.body.businessName,
  ).toBe("Updated Studio");
});
test("invalid profile address and media upload failure keep the editor usable", async ({
  page,
}) => {
  await fixture(page);
  await tab(page, "Profile");
  await button(page, "Edit all profile details").click();
  await page
    .getByLabel("Public page address · e.g. ever-after-events")
    .fill("bad address");
  await button(page, "Save profile").click();
  await expect(
    page.getByText("Use 3–80 letters, numbers or single hyphens.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.route(api + "/api/v1/core/media", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  const chooser = page.waitForEvent("filechooser");
  await button(page, "Choose logo").click();
  await (
    await chooser
  ).setFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByText(/Upload failed/)).toBeVisible();
  await expect(button(page, "Choose logo")).toBeEnabled();
});
test("gallery images can be reordered and removed before saving", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Portfolio");
  await button(page, "Gallery").click();
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Gallery");
  for (let i = 0; i < 2; i++) {
    const chooser = page.waitForEvent("filechooser");
    await button(page, "Add image").click();
    await (
      await chooser
    ).setFiles({
      name: "image.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await expect(
      page.getByLabel("Image description for accessibility"),
    ).toHaveCount(i + 1);
  }
  await button(page, "Make cover").click();
  await button(page, "Remove").last().click();
  await button(page, "Save draft").click();
  await expect.poll(() => state.items.gallery?.length).toBe(1);
  expect(state.items.gallery![0].media).toEqual([
    { mediaId: "image-2", role: "COVER", altText: "Gallery" },
  ]);
});
test("switching businesses clears old content and sends the selected organization", async ({
  page,
}) => {
  await fixture(page);
  await page.route(api + "/api/v1/core/memberships", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          organizationId: "org",
          role: "OWNER",
          organization: { name: "QA Studio" },
        },
        {
          organizationId: "other-org",
          role: "VIEWER",
          organization: { name: "Other Studio" },
        },
      ]),
    }),
  );
  await tab(page, "Profile");
  await button(page, "Sign out").click();
  await button(page, "Login").click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("testing-password");
  await button(page, "Sign in").click();
  await expect(page.getByText("My Presence", { exact: true })).toBeVisible();
  await page.route(api + "/api/v1/core/suppliers/current", (route) => {
    expect(route.request().headers()["x-organization-id"]).toBe("other-org");
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "other",
        organizationId: "other-org",
        businessName: "Other Studio",
        category: "Music",
        city: "Beirut",
        serviceAreas: [],
        acceptInquiries: false,
      }),
    });
  });
  await tab(page, "Profile");
  await button(page, "Other Studio").click();
  await expect(
    page.getByText("Other Studio · viewer", { exact: true }),
  ).toBeVisible();
  await expect(button(page, "Edit all profile details")).toHaveCount(0);
});

test("business setup uses searchable choices and accepts human phone formatting", async ({
  page,
}, testInfo) => {
  const state = await fixture(page);
  await tab(page, "Profile");
  await button(page, "Edit business information").click();
  await expect(page.getByText("Fields marked * are required.")).toBeVisible();
  await button(page, "Category").click();
  await page
    .getByLabel("Search category", { exact: true })
    .fill("Creative production");
  await button(page, "Add “Creative production”").click();
  await button(page, "Country code").click();
  await page.getByLabel("Search country code", { exact: true }).fill("Lebanon");
  await page.getByRole("button", { name: /Lebanon/ }).click();
  await page.getByLabel("Phone number", { exact: true }).fill("01 234 567");
  await expect(
    page.getByText(/clients cannot send inquiries now/),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("business-setup.png"),
    fullPage: true,
  });
  await button(page, "Save business").click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  const saved = state.calls.find(
    (c) => c.method === "PUT" && c.path.endsWith("/suppliers/current"),
  )?.body;
  expect(saved.category).toBe("Creative production");
  expect(saved.contactPhone).toBe("+9611234567");
});

test("user walkthrough exposes clear next steps across every main screen", async ({
  page,
}, testInfo) => {
  await fixture(page);
  await expect(
    page.getByText("Profile completion", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("01-overview.png") });
  await tab(page, "Portfolio");
  await page.screenshot({
    path: testInfo.outputPath("02-portfolio-empty.png"),
  });
  await button(page, "+ Add").click();
  await expect(
    page.getByRole("textbox", { name: "Title", exact: true }),
  ).toHaveAttribute("aria-required", "true");
  await page.screenshot({ path: testInfo.outputPath("03-project-form.png") });
  await button(page, "Close").click();
  await button(page, "Gallery").click();
  await button(page, "+ Add").click();
  await expect(
    page.getByText("Publishing a gallery requires at least one image.", {
      exact: false,
    }),
  ).toBeVisible();
  await button(page, "Close").click();
  await tab(page, "Listings");
  await button(page, "Offer").click();
  await button(page, "+ Add").click();
  await expect(button(page, "Offer")).toHaveAttribute("aria-pressed", "true");
  await button(page, "Fixed price").click();
  await button(page, "Currency").click();
  await page.getByLabel("Search currency", { exact: true }).fill("EUR");
  await button(page, "EUR").click();
  await expect(
    page.getByText("Enter the amount in EUR, not cents.", { exact: true }),
  ).toBeVisible();
  await button(page, "Choose expiry date").click();
  await page.screenshot({
    path: testInfo.outputPath("04-expiry-calendar.png"),
  });
  await button(page, "Cancel date selection").click();
  await button(page, "Save draft").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("05-listing-form-bottom.png"),
  });
  await button(page, "Close").click();
  await button(page, "Discard changes").click();
  await tab(page, "Profile");
  await page.screenshot({ path: testInfo.outputPath("06-profile.png") });
  await button(page, "Edit all profile details").click();
  await expect(
    page.getByLabel("Show phone publicly", { exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("07-profile-editor.png") });
  await button(page, "Save profile").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("08-contact-privacy.png"),
  });
});

test("focused profile editors preserve other sections and explain live saves", async ({
  page,
}, testInfo) => {
  const state = await fixture(page, { published: true });
  await tab(page, "Profile");
  await expect(button(page, "Edit introduction")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("profile-sections.png"),
    fullPage: true,
  });
  await button(page, "Edit introduction").click();
  await expect(
    page.getByText(
      "Your page is published. Saving updates the public page immediately.",
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel("Public page address · e.g. ever-after-events"),
  ).toHaveCount(0);
  await expect(button(page, "Choose logo")).toHaveCount(0);
  await page
    .getByLabel("Tagline", { exact: true })
    .fill("Celebrations with character");
  await page.screenshot({
    path: testInfo.outputPath("introduction-editor.png"),
  });
  await button(page, "Save profile").click();
  await expect(button(page, "Edit introduction")).toBeVisible();
  expect(state.profile.slug).toBe("qa-studio");
  expect(state.profile.description).toBe("A thoughtful event studio.");
  expect(state.profile.published).toBe(true);
  expect(state.profile.tagline).toBe("Celebrations with character");
  await button(page, "Edit page address").click();
  await expect(page.getByLabel("Tagline", { exact: true })).toHaveCount(0);
  await page
    .getByLabel("Public page address · e.g. ever-after-events")
    .fill("new-studio");
  await button(page, "Close").click();
  await button(page, "Discard changes").click();
  expect(state.profile.slug).toBe("qa-studio");
  await button(page, "Edit public contact details").click();
  await expect(
    page.getByLabel("Show phone publicly", { exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Tagline", { exact: true })).toHaveCount(0);
  await button(page, "Close").click();
  await button(page, "Edit brand images").click();
  await expect(button(page, "Choose logo")).toBeVisible();
  await expect(page.getByLabel("Tagline", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("brand-editor.png") });
});

test("public preview hides empty sections and never substitutes private profile content", async ({
  page,
}, testInfo) => {
  const state = await fixture(page, { published: true });
  await page.route(api + "/api/v1/presence/public/qa-studio", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ...state.profile,
        description: "",
        tagline: "",
        logoMediaId: null,
        coverMediaId: null,
        supplier: {
          businessName: "Public Studio",
          category: "Photography",
          city: "Beirut",
        },
        portfolio: [],
        listings: [],
        gallery: [],
      }),
    }),
  );
  await button(page, "Preview page").click();
  await expect(page.getByText("Public Studio", { exact: true })).toBeVisible();
  await expect(
    page.getByText("A thoughtful event studio.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Made for you", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Services & packages", { exact: true }),
  ).toHaveCount(0);
  await expect(button(page, "Call business")).toHaveCount(0);
  await expect(button(page, "Email business")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("public-preview.png") });
});

test("customer preview presents saved services and prices with approved contact actions", async ({
  page,
}, testInfo) => {
  await fixture(page, { published: true });
  await page.route(api + "/api/v1/presence/public/qa-studio", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        slug: "qa-studio",
        description:
          "Intimate celebrations and thoughtful details, from the first idea to the last dance.",
        tagline: "Celebrations with character",
        logoMediaId: "image-1",
        coverMediaId: null,
        supplier: {
          businessName: "QA Studio",
          category: "Event planner",
          city: "Beirut",
          contactEmail: "hello@example.com",
        },
        portfolio: [
          {
            id: "project",
            title: "Garden wedding",
            summary: "An intimate outdoor celebration.",
            media: [],
          },
        ],
        listings: [
          {
            id: "package",
            title: "Celebration planning",
            summary: "Planning support for your special day.",
            pricingMode: "FROM",
            amountMinor: 125000,
            currency: "USD",
            media: [],
          },
        ],
        gallery: [],
      }),
    }),
  );
  await button(page, "Preview page").click();
  await expect(
    page.getByText("Celebrations with character", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("From USD 1250.00", { exact: true }),
  ).toBeVisible();
  await expect(button(page, "Email business")).toBeVisible();
  await expect(button(page, "Call business")).toHaveCount(0);
  await page
    .getByText("Celebrations with character", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("customer-preview.png") });
});

test("category details validate venue capacity, preserve explicit no and show public answers", async ({
  page,
}, testInfo) => {
  const state = await fixture(page, { published: true });
  await tab(page, "Profile");
  await button(page, "Edit category details").click();
  await button(page, "Details for your business").click();
  await button(page, "Venue").click();
  await page.getByLabel("Seated capacity", { exact: true }).fill("1.5");
  await button(page, "Save category details").click();
  await expect(
    page.getByText("Enter a whole number from 1 to 100000.", { exact: true }),
  ).toBeVisible();
  expect(state.calls.filter((c) => c.method === "PUT")).toHaveLength(0);
  await page.getByLabel("Seated capacity", { exact: true }).fill("120");
  await button(page, "No").first().click();
  await button(page, "Event space").click();
  await button(page, "Outdoor").click();
  await page.screenshot({ path: testInfo.outputPath("category-venue.png") });
  await button(page, "Save category details").click();
  await expect(button(page, "Edit category details")).toBeVisible();
  expect(state.profile.categoryDetails).toEqual({
    type: "VENUE",
    values: { seatedCapacity: 120, spaceType: "Outdoor", parking: false },
  });
  await button(page, "Edit category details").click();
  await expect(page.getByLabel("Seated capacity", { exact: true })).toHaveValue(
    "120",
  );
  await expect(button(page, "No").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await button(page, "Close").click();
  await button(page, "Preview page").click();
  await expect(page.getByText("120 guests", { exact: true })).toBeVisible();
  await expect(
    page.getByText("On-site parking", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Standing capacity", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("category-preview.png") });
});
test("category forms retain unsaved drafts while switching and replace saved values explicitly", async ({
  page,
}) => {
  const state = await fixture(page);
  state.profile.categoryDetails = {
    type: "VENUE",
    values: { seatedCapacity: 100 },
  };
  await tab(page, "Profile");
  await button(page, "Edit category details").click();
  await button(page, "Details for your business").click();
  await button(page, "Catering").click();
  await page.getByLabel("Minimum guest count", { exact: true }).fill("50");
  await page.getByLabel("Maximum guest count", { exact: true }).fill("20");
  await button(page, "Save category details").click();
  await expect(
    page.getByText(
      "Maximum guest count must be at least the minimum guest count.",
      { exact: true },
    ),
  ).toBeVisible();
  await button(page, "Details for your business").click();
  await button(page, "Entertainment & DJs").click();
  await expect(page.getByText(/Saving this form replaces/)).toBeVisible();
  await page.getByLabel("Setup time needed", { exact: true }).fill("0");
  await button(page, "No").click();
  await button(page, "DJ").click();
  await button(page, "Details for your business").click();
  await button(page, "Catering").click();
  await expect(
    page.getByLabel("Minimum guest count", { exact: true }),
  ).toHaveValue("50");
  await button(page, "Details for your business").click();
  await button(page, "Entertainment & DJs").click();
  await button(page, "Save category details").click();
  await expect(
    page.getByText("Replace saved category details?", { exact: true }),
  ).toBeVisible();
  await button(page, "Keep editing").click();
  expect(state.profile.categoryDetails.type).toBe("VENUE");
  await button(page, "Save category details").click();
  await button(page, "Replace saved details").click();
  await expect(button(page, "Edit category details")).toBeVisible();
  expect(state.profile.categoryDetails).toEqual({
    type: "ENTERTAINMENT",
    values: { acts: ["DJ"], setupMinutes: 0, equipmentIncluded: false },
  });
});
test("category schema loading retries and conflicting saves preserve entered details", async ({
  page,
}) => {
  const state = await fixture(page, { detailsFail: true, conflict: true });
  await tab(page, "Profile");
  await button(page, "Edit category details").click();
  await expect(button(page, "Retry loading details")).toBeVisible();
  state.detailsFail = false;
  await button(page, "Retry loading details").click();
  await page
    .getByLabel("Specialties", { exact: true })
    .fill("Floral installations");
  await button(page, "Weddings").click();
  await button(page, "Save category details").click();
  await expect(page.getByText(/This item changed/)).toBeVisible();
  await expect(page.getByLabel("Specialties", { exact: true })).toHaveValue(
    "Floral installations",
  );
  expect(state.profile.categoryDetails.values).toEqual({});
});

test("package pricing and inclusions save, reopen and appear in customer preview", async ({
  page,
}, testInfo) => {
  const state = await fixture(page, { published: true });
  await tab(page, "Listings");
  await button(page, "Package").click();
  await button(page, "+ Add").click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Wedding dinner package");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A seasonal menu prepared and served at your venue.");
  await button(page, "Starting from").click();
  await page.getByLabel("Price · e.g. 25.00").fill("45.50");
  await button(page, "Price is for").click();
  await button(page, "Per person").click();
  await page
    .getByLabel("Pricing details", { exact: true })
    .fill("Minimum 40 guests. Travel quoted separately.");
  await button(page, "Add inclusion").click();
  await page
    .getByLabel("Inclusion 1", { exact: true })
    .fill("  Three-course meal  ");
  await button(page, "Add inclusion").click();
  await page.getByLabel("Inclusion 2", { exact: true }).fill("Welcome drinks");
  await page
    .getByText("Customer price preview · Unsaved", { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByText("From USD 45.50 per person", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("package-price-preview.png"),
  });
  await button(page, "Save draft").click();
  await expect(button(page, "Edit")).toBeVisible();
  expect(state.items.listings[0]).toMatchObject({
    type: "PACKAGE",
    pricingMode: "FROM",
    amountMinor: 4550,
    priceUnit: "PERSON",
    inclusions: ["Three-course meal", "Welcome drinks"],
    pricingNote: "Minimum 40 guests. Travel quoted separately.",
  });
  await button(page, "Edit").click();
  await expect(page.getByLabel("Inclusion 2", { exact: true })).toHaveValue(
    "Welcome drinks",
  );
  await button(page, "Price is for").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("package-price-form.png"),
  });
  await button(page, "Close").click();
  await button(page, "Publish").click();
  await tab(page, "Profile");
  await button(page, "Preview page").click();
  await expect(
    page.getByText("From USD 45.50 per person", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Three-course meal", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Minimum 40 guests. Travel quoted separately.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByText("Wedding dinner package", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("public-package.png") });
});
test("pricing validation and inclusion correction preserve drafts and free pricing clears units", async ({
  page,
}) => {
  const state = await fixture(page);
  await tab(page, "Listings");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Photography session");
  await button(page, "Fixed price").click();
  await page.getByLabel("Price · e.g. 25.00").fill("21474836.48");
  await button(page, "Price is for").click();
  await button(page, "Per hour").click();
  await button(page, "Save draft").click();
  await expect(page.getByText(/This amount is too large/)).toBeVisible();
  expect(state.items.listings).toHaveLength(0);
  await page.getByLabel("Price · e.g. 25.00").fill("100");
  await button(page, "Add inclusion").click();
  await page.getByLabel("Inclusion 1", { exact: true }).fill("Edited photos");
  await button(page, "Add inclusion").click();
  await page.getByLabel("Inclusion 2", { exact: true }).fill(" edited PHOTOS ");
  await button(page, "Save draft").click();
  await expect(
    page.getByText(/Each inclusion should be different/),
  ).toBeVisible();
  expect(state.items.listings).toHaveLength(0);
  await button(page, "Remove inclusion 2").click();
  await button(page, "Add inclusion").click();
  await button(page, "Free").click();
  await expect(button(page, "Price is for")).toHaveCount(0);
  await button(page, "Save draft").click();
  await expect(button(page, "Edit")).toBeVisible();
  expect(state.items.listings[0]).toMatchObject({
    pricingMode: "FREE",
    amountMinor: null,
    currency: null,
    priceUnit: null,
    inclusions: ["Edited photos"],
  });
  await button(page, "Edit").click();
  await button(page, "Remove inclusion 1").click();
  await button(page, "On request").click();
  await button(page, "Save draft").click();
  await expect(button(page, "Edit")).toBeVisible();
  expect(state.items.listings[0].inclusions).toEqual([]);
  await expect(
    page.getByText("Price on request", { exact: true }),
  ).toBeVisible();
});
test("listing conflict retains package edits and cancel confirms their removal", async ({
  page,
}) => {
  const state = await fixture(page, { conflict: true });
  await tab(page, "Listings");
  await button(page, "+ Add").click();
  await page.getByLabel("Title", { exact: true }).fill("Event package");
  await button(page, "Save draft").click();
  await button(page, "Edit").click();
  await button(page, "Add inclusion").click();
  await page.getByLabel("Inclusion 1", { exact: true }).fill("Lighting setup");
  await button(page, "Save draft").click();
  await expect(page.getByText(/This item changed/)).toBeVisible();
  await expect(page.getByLabel("Inclusion 1", { exact: true })).toHaveValue(
    "Lighting setup",
  );
  expect(state.items.listings[0].inclusions).toEqual([]);
  await button(page, "Close").click();
  await button(page, "Keep editing").click();
  await expect(page.getByLabel("Inclusion 1", { exact: true })).toHaveValue(
    "Lighting setup",
  );
  await button(page, "Close").click();
  await button(page, "Discard changes").click();
  await expect(button(page, "Edit")).toBeVisible();
});
test("legacy listing prices gain no assumed unit and public preview uses only public package fields", async ({
  page,
}) => {
  const state = await fixture(page, { published: true });
  state.items.listings.push({
    id: "legacy",
    title: "Legacy package",
    description: "Description",
    summary: "",
    media: [],
    type: "PACKAGE",
    status: "PUBLISHED",
    version: 1,
    pricingMode: "FIXED",
    amountMinor: 10000,
    currency: "USD",
    priceUnit: null,
    inclusions: ["Private-only inclusion"],
    pricingNote: "Private-only note",
  });
  await tab(page, "Profile");
  await page.route(api + "/api/v1/presence/public/qa-studio", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ...state.profile,
        supplier: {
          businessName: "QA Studio",
          category: "Events",
          city: "Beirut",
        },
        listings: [
          { ...state.items.listings[0], inclusions: [], pricingNote: "" },
        ],
        portfolio: [],
        gallery: [],
      }),
    }),
  );
  await button(page, "Preview page").click();
  await expect(page.getByText("USD 100.00", { exact: true })).toBeVisible();
  await expect(page.getByText("What’s included", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Private-only inclusion", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Private-only note", { exact: true }),
  ).toHaveCount(0);
});

test("batch one keeps save visible and focuses field errors without losing edits", async ({
  page,
}, testInfo) => {
  await fixture(page);
  await expect(
    page.getByText("Circle AI assistance · Coming later"),
  ).toHaveCount(0);
  await expect(button(page, "Review profile →")).toBeVisible();
  await button(page, "Review profile →").click();
  await expect(
    page.getByText("Business profile", { exact: true }),
  ).toBeVisible();
  await button(page, "Edit introduction").click();
  await expect(button(page, "Save profile")).toBeInViewport();
  await page.getByLabel("Tagline", { exact: true }).fill("A retained draft");
  await expect(
    page.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
  await button(page, "Close").click();
  await button(page, "Discard changes").click();
  await tab(page, "Listings");
  await button(page, "+ Add").click();
  await expect(button(page, "Save draft")).toBeInViewport();
  await page
    .getByLabel("Short summary", { exact: true })
    .fill("Keep this summary");
  await button(page, "Save draft").click();
  await expect(page.getByLabel("Title", { exact: true })).toBeFocused();
  await expect(page.getByText("Enter a title.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Short summary", { exact: true })).toHaveValue(
    "Keep this summary",
  );
  await page.screenshot({ path: testInfo.outputPath("batch-one-editor.png") });
});

test("auth keyboard next advances and invalid email receives focus", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Google", { exact: true })).toHaveCount(0);
  await button(page, "Sign up with email").click();
  const name = page.getByLabel("Your name", { exact: true });
  const email = page.getByLabel("Email address", { exact: true });
  const password = page.getByLabel("Password · 12–128 characters", {
    exact: true,
  });
  await name.fill("Test");
  await name.press("Enter");
  await expect(email).toBeFocused();
  await email.fill("invalid");
  await email.press("Enter");
  await expect(password).toBeFocused();
  await password.fill("valid-long-password");
  await password.press("Enter");
  await expect(email).toBeFocused();
  await expect(password).toHaveValue("valid-long-password");
});

test("batch two creates a private profile without a page name and unlocks content", async ({
  page,
}) => {
  const state = await fixture(page, { noProfile: true });
  await tab(page, "Listings");
  await button(page, "Set up profile").click();
  await expect(
    page.getByLabel("Public page address · e.g. ever-after-events"),
  ).toHaveCount(0);
  await page
    .getByLabel("About your business", { exact: true })
    .fill("Our private introduction");
  await button(page, "Save profile").click();
  const save = state.calls.find(
    (c) => c.method === "PUT" && c.path.endsWith("/presence/profile"),
  );
  expect(save?.body).not.toHaveProperty("slug");
  expect(save?.body.published).toBe(false);
  await button(page, "+ Add").click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Our first project package");
  await button(page, "Save draft").click();
  await tab(page, "Profile");
  await expect(
    page.getByText("Choose before publishing", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("/p/draft-internal-address", { exact: true }),
  ).toHaveCount(0);
});

test("batch two saves service areas and explains disabled inquiries", async ({
  page,
}, testInfo) => {
  const state = await fixture(page);
  await tab(page, "Profile");
  await button(page, "Edit business information").click();
  await page.getByLabel("Add a service area", { exact: true }).fill("Beirut");
  await button(page, "Add area").click();
  await page.getByLabel("Add a service area", { exact: true }).fill("beirut");
  await button(page, "Add area").click();
  await expect(
    page.getByText("This area is already listed.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Add a service area", { exact: true })
    .fill("Mount Lebanon");
  await page
    .getByText(/Inquiries are not available yet because/)
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("batch-two-business.png"),
  });
  await button(page, "Save business").click();
  await expect(button(page, "Edit business information")).toBeVisible();
  expect(
    state.calls.find(
      (c) => c.method === "PUT" && c.path.endsWith("/suppliers/current"),
    )?.body.serviceAreas,
  ).toEqual(["Beirut", "Mount Lebanon"]);
  await button(page, "Edit business information").click();
  await button(page, "Remove Beirut").click();
  await button(page, "Remove Mount Lebanon").click();
  await button(page, "Save business").click();
  await expect(button(page, "Edit business information")).toBeVisible();
  expect(
    state.calls
      .filter(
        (c) => c.method === "PUT" && c.path.endsWith("/suppliers/current"),
      )
      .at(-1)?.body.serviceAreas,
  ).toEqual([]);
});
