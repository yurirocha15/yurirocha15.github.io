import { expect, test } from "@playwright/test";

test("layout, navigation, and project contracts remain valid", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
  expect(errors).toEqual([]);
});

test("project scenes load on demand and pause when offscreen", async ({ page }) => {
  await page.goto("/");
  const palletizer = page.locator(".project-visual-palletizer");
  const canvas = palletizer.locator("canvas");

  await expect(canvas).toHaveCount(0);
  await palletizer.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveCount(1);
  await expect.poll(() => canvas.getAttribute("data-robot-ready")).toBe("true");

  let previousPhase: string | null = null;
  await expect.poll(async () => {
    const current = await canvas.getAttribute("data-phase");
    const changed = previousPhase !== null && current !== previousPhase;
    previousPhase = current;
    return changed;
  }).toBe(true);

  await page.locator(".hero-copy").scrollIntoViewIfNeeded();
  let stablePhase: string | null = null;
  let stableSamples = 0;
  await expect.poll(async () => {
    const current = await canvas.getAttribute("data-phase");
    stableSamples = current === stablePhase ? stableSamples + 1 : 0;
    stablePhase = current;
    return stableSamples;
  }, { intervals: [100, 150, 200, 250], timeout: 3000 }).toBeGreaterThanOrEqual(2);

  await palletizer.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await canvas.getAttribute("data-phase")) !== stablePhase).toBe(true);
});

test("reduced motion exposes content and keeps a deterministic scene frame", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  expect(await page.locator("[data-reveal]:not(.is-visible)").count()).toBe(0);
  const palletizer = page.locator(".project-visual-palletizer");
  await palletizer.scrollIntoViewIfNeeded();
  const canvas = palletizer.locator("canvas");
  await expect.poll(() => canvas.getAttribute("data-phase")).not.toBeNull();
  const phase = await canvas.getAttribute("data-phase");
  await expect.poll(() => canvas.getAttribute("data-phase"), {
    intervals: [100, 150, 200],
    timeout: 1500,
  }).toBe(phase);
});
