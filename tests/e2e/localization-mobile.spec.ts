import { expect, test } from "@playwright/test";

test("locale query renders localized metadata, content, and complete CV links", async ({
  page,
}) => {
  await page.goto("/?source=e2e&lang=ko#career");

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveTitle("유리 허샤 - 로보틱스 소프트웨어 · 피지컬 AI");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /시니어 로보틱스 소프트웨어 엔지니어/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "피지컬 AI를 위한 신뢰성 높은 소프트웨어를 만듭니다.",
  );
  await expect(page.locator(".proof-strip")).toHaveCount(0);

  const koreanCvLinks = page.getByRole("link", { name: "이력서", exact: true });
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

test("Brazilian Portuguese system language selects Portuguese automatically", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["pt-BR", "en-US"],
    });
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "pt-BR",
    });
  });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page).toHaveTitle("Yuri Rocha - Software para robótica e IA física");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Construindo software confiável para IA física.",
  );

  const menuToggle = page.getByRole("button", { name: "Abrir menu" });
  if (await menuToggle.isVisible()) await menuToggle.click();
  await expect(page.getByRole("button", {
    name: "Mudar para português (Brasil)",
  })).toHaveAttribute("aria-pressed", "true");

  const cvLinks = page.getByRole("link", { name: "Currículo", exact: true });
  await expect(cvLinks).toHaveCount(2);
  for (const link of await cvLinks.all()) {
    await expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-pt-BR.pdf");
  }
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

test("YR favicon is declared and served in modern and fallback formats", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The favicon contract only needs one browser");

  await page.goto("/?lang=en");
  const svgLink = page.locator('link[rel="icon"][type="image/svg+xml"]');
  await expect(svgLink).toHaveAttribute("href", /(?:^|\/)favicon\.svg$/);
  await expect(svgLink).toHaveAttribute("sizes", "any");

  const svgResponse = await request.get("/favicon.svg");
  expect(svgResponse.ok()).toBe(true);
  expect(svgResponse.headers()["content-type"]).toMatch(/image\/svg\+xml/);
  const svg = await svgResponse.text();
  expect(svg).toContain('viewBox="0 0 48 48"');
  expect(svg).toContain("M3.5 4.5 12.5 15.5 21.5 4.5");
  expect(svg).toContain('<path d="M34.5 19 44 31.5" stroke-linecap="butt"');
  expect(svg).toContain('stroke="#151713"');
  expect(svg).toContain('fill="#d39b2a"');

  await expect(page.locator('link[rel="icon"][href$="favicon.ico"]')).toHaveAttribute(
    "sizes",
    "16x16 32x32 48x48",
  );
  const response = await request.get("/favicon.ico");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/image\/(?:x-icon|vnd\.microsoft\.icon)/);
  const icon = await response.body();
  expect(icon.length).toBeGreaterThan(100);
  expect([...icon.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  expect(icon.readUInt16LE(4)).toBeGreaterThanOrEqual(3);
});
