import { expect, test, type Locator, type Page } from "@playwright/test";

const SCENE_ASSET_TIMEOUT = 15_000;
const SCENE_TEST_TIMEOUT = 60_000;
const browserErrors = new WeakMap<Page, string[]>();

async function scrollToCenter(locator: Locator) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await expect(locator).toBeInViewport();
}

async function expectAttributeToChange(locator: Locator, attribute: string) {
  const changed = await locator.evaluate(
    (element, { attributeName, timeout }) => new Promise<boolean>((resolve) => {
      const initialValue = element.getAttribute(attributeName);
      const observer = new MutationObserver(() => {
        if (element.getAttribute(attributeName) === initialValue) return;
        window.clearTimeout(timer);
        observer.disconnect();
        resolve(true);
      });
      const timer = window.setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeout);
      observer.observe(element, { attributeFilter: [attributeName], attributes: true });
    }),
    { attributeName: attribute, timeout: SCENE_ASSET_TIMEOUT },
  );
  expect(changed).toBe(true);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("layout, navigation, and project contracts remain valid", async ({ page }) => {
  await page.goto("/");

  const contract = await page.evaluate(() => {
    const navTargets = Array.from(document.querySelectorAll<HTMLAnchorElement>("nav a, .skip-link"))
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href?.startsWith("#")));
    const ids = Array.from(document.querySelectorAll<HTMLElement>("[id]")).map((node) => node.id);
    const cards = Array.from(document.querySelectorAll<HTMLElement>("article.project-card"));
    const chromeLinks = Array.from(document.querySelectorAll<HTMLElement>(".nav-links a"));
    const heroLinkClasses = new Map(
      Array.from(document.querySelectorAll<HTMLAnchorElement>(".hero-actions a"))
        .map((link) => [link.getAttribute("href"), link.className]),
    );
    const footerLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".footer-links a"));
    const readingSurfaces = [
      ".board-header",
      ".board-metrics",
      ".timeline",
      ".project-copy",
      ".paper-row",
      ".contribution-row",
    ].map((selector) => document.querySelector<HTMLElement>(selector));
    const leadSurface = document.querySelector<HTMLElement>(".lead span");
    const hasOpaqueBackground = (element: HTMLElement | null) => {
      if (!element) return false;
      const color = getComputedStyle(element).backgroundColor;
      if (color === "transparent" || color === "rgba(0, 0, 0, 0)") return false;
      const legacyAlpha = color.match(/^rgba\(.+,\s*([\d.]+)\)$/)?.[1];
      const modernAlpha = color.match(/\/\s*([\d.]+)\s*\)$/)?.[1];
      return Number(legacyAlpha ?? modernAlpha ?? 1) === 1;
    };
    const timelineItem = document.querySelector<HTMLElement>(".timeline-item");
    const marker = timelineItem ? getComputedStyle(timelineItem, "::before") : null;
    const axis = timelineItem ? getComputedStyle(timelineItem, "::after") : null;
    return {
      cardsValid: cards.every((card) => {
        const bounds = card.getBoundingClientRect();
        return bounds.width > 0 && bounds.right <= document.documentElement.clientWidth + 1;
      }),
      chromeLinksConsistent: chromeLinks.every((link) => link.classList.contains("chrome-link")),
      profileLinkButtonsConsistent: footerLinks.every((link) => (
        link.classList.contains("button")
          && heroLinkClasses.get(link.getAttribute("href")) === link.className
      )),
      idsUnique: new Set(ids).size === ids.length,
      navTargetsValid: navTargets.every((href) => document.querySelector(href)),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pageGridPresent: getComputedStyle(document.body).backgroundImage.includes("linear-gradient"),
      readingSurfacesOpaque: readingSurfaces.every(hasOpaqueBackground),
      leadSurfaceVisible: (() => {
        if (!leadSurface) return false;
        const color = getComputedStyle(leadSurface).backgroundColor;
        const alpha = color.match(/^rgba\(.+,\s*([\d.]+)\)$/)?.[1]
          ?? color.match(/\/\s*([\d.]+)\s*\)$/)?.[1];
        return Number(alpha ?? 1) >= 0.8;
      })(),
      timelineAxisAligned: marker?.left === axis?.left,
    };
  });

  expect(contract).toEqual({
    cardsValid: true,
    chromeLinksConsistent: true,
    idsUnique: true,
    leadSurfaceVisible: true,
    navTargetsValid: true,
    overflow: 0,
    pageGridPresent: true,
    profileLinkButtonsConsistent: true,
    readingSurfacesOpaque: true,
    timelineAxisAligned: true,
  });
});

test("labels and framed content respond to pointer hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer hover is exercised once per CI job");
  await page.goto("/");

  const label = page.locator(".tag-list span").first();
  await label.hover();
  await expect.poll(() => label.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe("none");

  const textBox = page.locator(".board-metrics > div").first();
  await scrollToCenter(textBox);
  await textBox.hover();
  await expect.poll(() => textBox.evaluate((element) => getComputedStyle(element).translate))
    .not.toBe("none");

  const card = page.locator(".project-card").first();
  await scrollToCenter(card);
  await card.hover();
  expect(await card.evaluate((element) => getComputedStyle(element).translate)).toBe("none");

  const timelineItem = page.locator(".timeline-item").first();
  await scrollToCenter(timelineItem);
  await timelineItem.hover();
  const timelineBody = timelineItem.locator(".timeline-body");
  expect(await timelineBody.evaluate((element) => getComputedStyle(element).translate)).toBe("none");
});

test("project scenes load on demand and pause when offscreen", async ({ page }) => {
  test.setTimeout(SCENE_TEST_TIMEOUT);
  await page.goto("/");
  const palletizer = page.locator(".project-visual-palletizer");
  const canvas = palletizer.locator("canvas");

  await expect(canvas).toHaveCount(0);
  await scrollToCenter(palletizer);
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute("data-robot-ready", "true", {
    timeout: SCENE_ASSET_TIMEOUT,
  });
  await expect(canvas).toHaveAttribute("data-runtime-active", "true", {
    timeout: SCENE_ASSET_TIMEOUT,
  });
  await expectAttributeToChange(canvas, "data-phase");

  await page.evaluate(() => window.scrollTo({ behavior: "instant", top: 0 }));
  await expect(page.locator(".hero-copy")).toBeInViewport();
  await expect(canvas).toHaveAttribute("data-runtime-active", "false", {
    timeout: SCENE_ASSET_TIMEOUT,
  });
  let stablePhase: string | null = null;
  let stableSamples = 0;
  await expect.poll(async () => {
    const current = await canvas.getAttribute("data-phase");
    stableSamples = current === stablePhase ? stableSamples + 1 : 0;
    stablePhase = current;
    return stableSamples;
  }, { intervals: [100, 150, 200, 250], timeout: 3000 }).toBeGreaterThanOrEqual(2);

  await scrollToCenter(palletizer);
  await expect(canvas).toHaveAttribute("data-runtime-active", "true", {
    timeout: SCENE_ASSET_TIMEOUT,
  });
  await expectAttributeToChange(canvas, "data-phase");
});

test("reduced motion exposes content and keeps a deterministic scene frame", async ({ page }) => {
  test.setTimeout(SCENE_TEST_TIMEOUT);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  expect(await page.locator("[data-reveal]:not(.is-visible)").count()).toBe(0);
  const palletizer = page.locator(".project-visual-palletizer");
  await scrollToCenter(palletizer);
  const canvas = palletizer.locator("canvas");
  await expect(canvas).toHaveAttribute("data-runtime-active", "true", {
    timeout: SCENE_ASSET_TIMEOUT,
  });
  await expect(canvas).toHaveAttribute("data-phase", /.+/, {
    timeout: SCENE_ASSET_TIMEOUT,
  });
  const phase = await canvas.getAttribute("data-phase");
  await expect.poll(() => canvas.getAttribute("data-phase"), {
    intervals: [100, 150, 200],
    timeout: 1500,
  }).toBe(phase);
});

test("all robot scenes reach readiness and render nonblank WebGL pixels", async ({ page }, testInfo) => {
  test.setTimeout(SCENE_TEST_TIMEOUT);
  test.skip(testInfo.project.name !== "desktop", "WebGL pixel sampling runs once per CI job");
  await page.goto("/");

  const scenes = [
    {
      frame: ".robot-scene-canvas",
      canvas: '[data-scene="franka-robot-cell"]',
      readyAttribute: "data-robot-ready",
      readyValue: "true",
    },
    {
      frame: ".project-visual-palletizer",
      canvas: '[data-scene="palletizer"]',
      readyAttribute: "data-robot-ready",
      readyValue: "true",
    },
    {
      frame: ".project-visual-smart-frame",
      canvas: '[data-scene="smart-frame-welding-line"]',
      readyAttribute: "data-robot-count",
      readyValue: "12",
    },
  ];

  for (const scene of scenes) {
    await scrollToCenter(page.locator(scene.frame));
    const canvas = page.locator(scene.canvas);
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute("data-runtime-active", "true", {
      timeout: SCENE_ASSET_TIMEOUT,
    });
    await expect(canvas).toHaveAttribute(scene.readyAttribute, scene.readyValue, {
      timeout: SCENE_ASSET_TIMEOUT,
    });
    await expect(canvas).toHaveAttribute("data-pixel-signal", "true", {
      timeout: SCENE_ASSET_TIMEOUT,
    });
  }
});

test("controller and platform visuals use source-backed labels", async ({ page }) => {
  await page.goto("/");

  const controllerVisual = page
    .locator("[data-content-id=robot-controller-core]")
    .locator(".project-visual");
  await expect(controllerVisual).toContainText("real-time controller");
  await expect(controllerVisual).toContainText("task management");
  await expect(controllerVisual).toContainText("data flow");
  await expect(controllerVisual).toContainText("agent interface");
  await expect(controllerVisual).not.toContainText("safety");
  await expect(controllerVisual).not.toContainText("I/O");

  const platformVisual = page
    .locator("[data-content-id=development-infrastructure]")
    .locator(".project-visual");
  await expect(platformVisual).toContainText("LLM environment");
  await expect(platformVisual).toContainText("Simulation");
  await expect(platformVisual).toContainText("Metrics");
  await expect(platformVisual).toContainText("Kubernetes cluster");
});

test("generated CV routes are valid and the visible link uses the complete English CV", async ({ page, request }) => {
  const routes = [
    "/cv/yuri-rocha-cv-en.pdf",
    "/cv/yuri-rocha-cv-ko.pdf",
    "/cv/yuri-rocha-resume-en.pdf",
    "/cv/yuri-rocha-resume-ko.pdf",
  ];

  for (const route of routes) {
    const response = await request.get(route);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }

  await page.goto("/");
  const cvLinks = page.getByRole("link", { name: "CV", exact: true });
  await expect(cvLinks).toHaveCount(2);
  for (const link of await cvLinks.all()) {
    await expect(link).toHaveAttribute("href", "/cv/yuri-rocha-cv-en.pdf");
  }

  const canonicalResponse = await request.get("/cv/yuri-rocha-cv-en.pdf");
  const legacyResponse = await request.get("/assets/cv_yuri_website.pdf");
  const canonicalPdf = await canonicalResponse.body();
  const legacyPdf = await legacyResponse.body();
  expect(legacyPdf.equals(canonicalPdf)).toBe(true);
});
