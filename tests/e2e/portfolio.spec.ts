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
    return {
      cardsValid: cards.every((card) => {
        const bounds = card.getBoundingClientRect();
        return bounds.width > 0 && bounds.right <= document.documentElement.clientWidth + 1;
      }),
      idsUnique: new Set(ids).size === ids.length,
      navTargetsValid: navTargets.every((href) => document.querySelector(href)),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(contract).toEqual({
    cardsValid: true,
    idsUnique: true,
    navTargetsValid: true,
    overflow: 0,
  });
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
