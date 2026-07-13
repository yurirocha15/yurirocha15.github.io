import { expect, test } from "@playwright/test";

test("locale query renders localized metadata, content, and complete CV links", async ({
  page,
}) => {
  await page.goto("/?source=e2e&lang=ko#career");

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveTitle("유리 허샤 - 로보틱스 소프트웨어 & Physical AI");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /시니어 로보틱스 소프트웨어 엔지니어/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Physical AI를 위한 신뢰성 높은 소프트웨어를 만듭니다.",
  );

  const koreanCvLinks = page.getByRole("link", { name: "CV", exact: true });
  await expect(koreanCvLinks).toHaveCount(2);
  for (const link of await koreanCvLinks.all()) {
    await expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-ko.pdf");
  }

  const menuToggle = page.getByRole("button", { name: "메뉴 열기" });
  if (await menuToggle.isVisible()) await menuToggle.click();
  await page.getByRole("button", { name: "영어로 전환" }).click();

  await expect(page).toHaveURL(/source=e2e&lang=en#career$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Building reliable software for Physical AI.",
  );
  const englishCvLinks = page.getByRole("link", { name: "CV", exact: true });
  for (const link of await englishCvLinks.all()) {
    await expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-en.pdf");
  }

  await page.goto("/?lang=ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Building reliable software for Physical AI.",
  );
});

test("responsive navigation stays usable and profile buttons do not overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/?lang=en");

  const toggle = page.locator(".menu-toggle");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });

  if (testInfo.project.name === "desktop") {
    await expect(toggle).toBeHidden();
    await expect(navigation).toBeVisible();
    return;
  }

  await expect(toggle).toHaveAccessibleName("Open menu");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();

  await page.evaluate(() => window.scrollTo({ behavior: "instant", top: 900 }));
  const stickyTop = await page.locator(".site-header").evaluate(
    (header) => header.getBoundingClientRect().top,
  );
  expect(stickyTop).toBeGreaterThanOrEqual(11);
  expect(stickyTop).toBeLessThanOrEqual(13);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();

  const targetHeights = await navigation.locator("a").evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height),
  );
  expect(targetHeights.every((height) => height >= 44)).toBe(true);

  await navigation.getByRole("link", { name: "Career", exact: true }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();
  await expect(page).toHaveURL(/#career$/);
  await expect(page.locator("#career")).toBeInViewport();

  await page.locator("footer").scrollIntoViewIfNeeded();
  const linkMeasurements = await page.locator(".footer-links .button").evaluateAll((links) =>
    links.map((link) => ({
      clientWidth: link.clientWidth,
      scrollWidth: link.scrollWidth,
    })),
  );
  expect(linkMeasurements.every(({ clientWidth, scrollWidth }) =>
    scrollWidth <= clientWidth
  )).toBe(true);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("favicon is declared and served from the production asset path", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The favicon contract only needs one browser");

  await page.goto("/?lang=en");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /favicon\.ico/);

  const response = await request.get("/favicon.ico");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/image\/(?:x-icon|vnd\.microsoft\.icon)/);
  const icon = await response.body();
  expect(icon.length).toBeGreaterThan(100);
  expect([...icon.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
});
