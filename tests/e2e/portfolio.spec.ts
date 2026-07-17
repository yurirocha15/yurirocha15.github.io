import { expect, test, type Locator, type Page } from "@playwright/test";

const ENGLISH_ROUTE = "/?lang=en";
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

async function hasRenderedPixelSignal(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => new Promise<boolean>((resolve) => {
    window.requestAnimationFrame(() => {
      const canvas = element as HTMLCanvasElement;
      if (canvas.dataset.pixelSignal === "true") {
        resolve(true);
        return;
      }

      const gl = canvas.getContext("webgl2");
      const width = Math.min(64, canvas.width);
      const height = Math.min(64, canvas.height);
      if (!gl || width < 2 || height < 2) {
        resolve(false);
        return;
      }

      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(
        Math.max(0, Math.floor((canvas.width - width) / 2)),
        Math.max(0, Math.floor((canvas.height - height) / 2)),
        width,
        height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      );

      let opaquePixels = 0;
      let minimum = 765;
      let maximum = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] === 0) continue;
        opaquePixels += 1;
        const luminance = pixels[index] + pixels[index + 1] + pixels[index + 2];
        minimum = Math.min(minimum, luminance);
        maximum = Math.max(maximum, luminance);
      }
      resolve(opaquePixels > 20 && maximum - minimum > 12);
    });
  }));
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
  await page.goto(ENGLISH_ROUTE);

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
    const heroElements = [
      document.querySelector<HTMLElement>(".hero-copy"),
      document.querySelector<HTMLElement>(".planning-board"),
    ];
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
      heroContentFitsViewport: heroElements.every((element) => {
        if (!element) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.left >= -1 && bounds.right <= document.documentElement.clientWidth + 1;
      }),
      heroSceneVisible: (() => {
        const scene = document.querySelector<HTMLElement>(".robot-scene-panel");
        if (!scene) return false;
        const bounds = scene.getBoundingClientRect();
        return getComputedStyle(scene).display !== "none" && bounds.height > 0;
      })(),
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
    heroContentFitsViewport: true,
    heroSceneVisible: true,
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

test("Korean career timeline uses compact mobile geometry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile career geometry is exercised once");

  await page.setViewportSize({ width: 490, height: 844 });
  await page.goto("/?lang=ko");

  const career = page.locator("#career");
  await scrollToCenter(career.locator(".timeline-item").first());

  const layout = await career.evaluate((section) => {
    const timelineItems = Array.from(section.querySelectorAll<HTMLElement>(".timeline-item"));
    const headings = Array.from(document.querySelectorAll<HTMLElement>(".section-heading"));

    return {
      documentOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      headingsMatchSectionBands: headings.every(
        (heading) => getComputedStyle(heading).backgroundColor === "rgba(0, 0, 0, 0)",
      ),
      headingsAreReadable: headings.every(
        (heading) => Number.parseFloat(getComputedStyle(heading).fontSize) >= 13.5,
      ),
      items: timelineItems.map((item) => {
        const body = item.querySelector<HTMLElement>(".timeline-body")!;
        const period = item.querySelector<HTMLElement>(".timeline-period")!;
        const axisStyle = getComputedStyle(item, "::after");
        const markerStyle = getComputedStyle(item, "::before");
        const itemBounds = item.getBoundingClientRect();
        const bodyBounds = body.getBoundingClientRect();
        const periodBounds = period.getBoundingClientRect();
        const periodStyle = getComputedStyle(period);
        const markerCenter = Number.parseFloat(markerStyle.top)
          + Number.parseFloat(markerStyle.height) / 2;
        const periodCenter = periodBounds.top - itemBounds.top + periodBounds.height / 2;

        return {
          axisStartsAtMarkerCenter:
            Math.abs(Number.parseFloat(axisStyle.top) - markerCenter) <= 0.5,
          bodyOffset: bodyBounds.left - itemBounds.left,
          bodyWidthRatio: bodyBounds.width / itemBounds.width,
          markerAboveAxis:
            Number.parseInt(markerStyle.zIndex, 10) > Number.parseInt(axisStyle.zIndex, 10),
          markerMatchesTimeline:
            markerStyle.borderTopColor
              === getComputedStyle(section.querySelector(".timeline")!).backgroundColor,
          markerPeriodAlignment: Math.abs(markerCenter - periodCenter),
          periodFits: period.scrollWidth <= period.clientWidth + 1,
          periodSingleLine:
            periodStyle.whiteSpace === "nowrap"
            && period.clientHeight <= Number.parseFloat(periodStyle.fontSize) * 1.8,
        };
      }),
    };
  });

  expect(layout.documentOverflow).toBe(0);
  expect(layout.headingsMatchSectionBands).toBe(true);
  expect(layout.headingsAreReadable).toBe(true);
  expect(layout.items).toHaveLength(3);
  for (const item of layout.items) {
    expect(item.axisStartsAtMarkerCenter).toBe(true);
    expect(item.bodyOffset).toBeLessThanOrEqual(18);
    expect(item.bodyWidthRatio).toBeGreaterThan(0.94);
    expect(item.markerAboveAxis).toBe(true);
    expect(item.markerMatchesTimeline).toBe(true);
    expect(item.markerPeriodAlignment).toBeLessThanOrEqual(0.5);
    expect(item.periodFits).toBe(true);
    expect(item.periodSingleLine).toBe(true);
  }
});

test("hero metadata clears the title and career periods stay intact", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Localized period geometry is exercised once");
  test.setTimeout(SCENE_TEST_TIMEOUT);

  for (const width of [320, 430, 980, 981, 1024]) {
    for (const locale of ["en", "ko"]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/?lang=${locale}`);

      const geometry = await page.evaluate(() => {
        const heroMeta = document.querySelector<HTMLElement>(".hero-meta")!;
        const heroHeading = document.querySelector<HTMLElement>(".hero h1")!;
        const metaBounds = heroMeta.getBoundingClientRect();
        const headingBounds = heroHeading.getBoundingClientRect();
        const section = document.querySelector<HTMLElement>("#career")!;
        const periods = Array.from(section.querySelectorAll<HTMLElement>(".timeline-period"))
          .map((period) => {
            const item = period.closest<HTMLElement>(".timeline-item")!;
            const body = item.querySelector<HTMLElement>(".timeline-body")!;
            const periodStyle = getComputedStyle(period);
            const range = document.createRange();
            range.selectNodeContents(period);
            const textBounds = range.getBoundingClientRect();
            const periodBounds = period.getBoundingClientRect();
            const bodyBounds = body.getBoundingClientRect();
            const itemBounds = item.getBoundingClientRect();

            return {
              doesNotOverlapBody:
                bodyBounds.top >= textBounds.bottom - 0.5
                || textBounds.right <= bodyBounds.left + 0.5,
              lineCount: new Set(
                Array.from(range.getClientRects()).map((rect) => Math.round(rect.top * 2) / 2),
              ).size,
              protectedDateUnits: period.textContent?.includes("\u00a0") ?? false,
              textFitsPeriod:
                period.scrollWidth <= period.clientWidth + 1
                && textBounds.left >= periodBounds.left - 0.5
                && textBounds.right <= periodBounds.right + 1,
              textFitsItem: textBounds.right <= itemBounds.right + 0.5,
              whiteSpace: periodStyle.whiteSpace,
            };
          });

        return {
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          heroGap: headingBounds.top - metaBounds.bottom,
          heroTagsClearHeading: Array.from(heroMeta.children).every(
            (tag) => tag.getBoundingClientRect().bottom <= headingBounds.top,
          ),
          periods,
        };
      });

      expect(geometry.documentOverflow, `${locale} overflow at ${width}px`).toBe(0);
      expect(geometry.heroGap, `${locale} hero gap at ${width}px`).toBeGreaterThanOrEqual(11.5);
      expect(geometry.heroTagsClearHeading, `${locale} hero overlap at ${width}px`).toBe(true);
      for (const period of geometry.periods) {
        expect(period.doesNotOverlapBody, `${locale} body overlap at ${width}px`).toBe(true);
        expect(period.lineCount, `${locale} wrapped period at ${width}px`).toBe(1);
        expect(period.protectedDateUnits, `${locale} breakable date unit at ${width}px`).toBe(true);
        expect(period.textFitsPeriod, `${locale} period track overflow at ${width}px`).toBe(true);
        expect(period.textFitsItem, `${locale} period overflow at ${width}px`).toBe(true);
        expect(period.whiteSpace).toBe("nowrap");
      }
    }
  }
});

test("Korean words never split between syllables", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Korean wrapping is exercised once");

  await page.goto("/?lang=ko");

  for (const width of [320, 390, 490, 790, 958]) {
    await page.setViewportSize({ width, height: 844 });

    const wrapping = await page.evaluate(() => {
      const splitWords: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();

      while (textNode) {
        const parent = textNode.parentElement;
        const text = textNode.textContent ?? "";
        if (parent && /[가-힣]{2,}/.test(text)) {
          const style = getComputedStyle(parent);
          if (style.display !== "none" && style.visibility !== "hidden") {
            for (const match of text.matchAll(/[가-힣]+(?:·[가-힣]+)*/g)) {
              const start = match.index ?? 0;
              const range = document.createRange();
              range.setStart(textNode, start);
              range.setEnd(textNode, start + match[0].length);
              const lineTops = new Set(
                Array.from(range.getClientRects())
                  .filter((rect) => rect.width > 0 && rect.height > 0)
                  .map((rect) => Math.round(rect.top * 2) / 2),
              );
              if (lineTops.size > 1) splitWords.push(match[0]);
            }
          }
        }
        textNode = walker.nextNode();
      }

      return {
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        splitWords,
      };
    });

    expect(wrapping.documentOverflow, `horizontal overflow at ${width}px`).toBe(0);
    expect(wrapping.splitWords, `split Korean words at ${width}px`).toEqual([]);
  }
});

test("Korean platform and controller visuals remain contained and legible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Responsive visual geometry is exercised once");

  await page.setViewportSize({ width: 958, height: 900 });
  await page.goto("/?lang=ko");

  const platform = page.locator(
    "[data-content-id=development-infrastructure] .project-visual",
  );
  await scrollToCenter(platform);
  const platformGeometry = await platform.evaluate((root) => {
    const consoleElement = root.querySelector<HTMLElement>(".platform-console")!;
    const lastRow = root.querySelector<HTMLElement>(".workload-row:last-child")!;
    const consoleBounds = consoleElement.getBoundingClientRect();
    const lastRowBounds = lastRow.getBoundingClientRect();
    const borderBottom = Number.parseFloat(
      getComputedStyle(consoleElement).borderBottomWidth,
    );

    return {
      bottomOverflow: lastRowBounds.bottom - (consoleBounds.bottom - borderBottom),
      scrollOverflow: consoleElement.scrollHeight - consoleElement.clientHeight,
    };
  });

  expect(platformGeometry.bottomOverflow).toBeLessThanOrEqual(0.5);
  expect(platformGeometry.scrollOverflow).toBeLessThanOrEqual(0);

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?lang=ko");

    const controller = page.locator(
      "[data-content-id=robot-controller-core] .controller-diagram",
    );
    await scrollToCenter(controller);
    const controllerGeometry = await controller.evaluate((root) => {
      const graph = root.querySelector<HTMLElement>(".task-manager-graph")!;
      const title = root.querySelector<HTMLElement>(".task-manager-node__title")!;
      const subtitle = root.querySelector<HTMLElement>(".task-manager-node__subtitle")!;
      const primaryLabels = Array.from(root.querySelectorAll<HTMLElement>(
        ".cycle-strip strong, .schedule-overview strong, .external-stack span, "
          + ".controller-tasks span, .hardware-node, .task-manager-node__title",
      ));
      const textNode = title.firstChild;
      const textContent = textNode?.textContent ?? "";
      const word = "인터페이스";
      const start = textContent.indexOf(word);
      if (!(textNode instanceof Text) || start < 0) {
        throw new Error("Agent interface label is missing");
      }
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, start + word.length);

      return {
        diagramOverflows:
          root.scrollWidth > root.clientWidth + 1
          || root.scrollHeight > root.clientHeight + 1
          || graph.scrollWidth > graph.clientWidth + 1,
        minimumPrimarySize: Math.min(
          ...primaryLabels.map(
            (label) => Number.parseFloat(getComputedStyle(label).fontSize),
          ),
        ),
        subtitleSize: Number.parseFloat(getComputedStyle(subtitle).fontSize),
        wordBreak: getComputedStyle(title).wordBreak,
        wordLines: new Set(
          Array.from(range.getClientRects()).map((rect) => Math.round(rect.top)),
        ).size,
      };
    });

    expect(controllerGeometry.diagramOverflows).toBe(false);
    expect(controllerGeometry.minimumPrimarySize).toBeGreaterThanOrEqual(9.5);
    expect(controllerGeometry.subtitleSize).toBeGreaterThanOrEqual(8);
    expect(controllerGeometry.wordBreak).toBe("keep-all");
    expect(controllerGeometry.wordLines).toBe(1);
  }
});

test("@scene labels and framed content respond to pointer hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer hover is exercised once per CI job");
  test.setTimeout(SCENE_TEST_TIMEOUT);
  await page.goto(ENGLISH_ROUTE);

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

test("@scene project scenes load on demand and pause when offscreen", async ({ page }) => {
  test.setTimeout(SCENE_TEST_TIMEOUT);
  await page.goto(ENGLISH_ROUTE);
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

test("@scene reduced motion exposes content and keeps a deterministic scene frame", async ({ page }) => {
  test.setTimeout(SCENE_TEST_TIMEOUT);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ENGLISH_ROUTE);

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

test("@scene all robot scenes reach readiness and render nonblank WebGL pixels", async ({ page }, testInfo) => {
  test.setTimeout(SCENE_TEST_TIMEOUT);
  test.skip(testInfo.project.name !== "desktop", "WebGL pixel sampling runs once per CI job");
  await page.goto(ENGLISH_ROUTE);

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
    await expect.poll(
      () => hasRenderedPixelSignal(canvas),
      { timeout: SCENE_ASSET_TIMEOUT },
    ).toBe(true);
  }
});

test("controller and platform visuals use source-backed labels", async ({ page }) => {
  await page.goto(ENGLISH_ROUTE);

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
  await expect(platformVisual).toContainText("LLM serving");
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

  await page.goto(ENGLISH_ROUTE);
  const cvLinks = page.getByRole("link", { name: "CV", exact: true });
  await expect(cvLinks).toHaveCount(2);
  for (const link of await cvLinks.all()) {
    await expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-en.pdf");
  }

  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  for (const label of ["GitHub", "LinkedIn", "CV", "Email"]) {
    await expect(footer.getByRole("link", { name: label, exact: true })).toBeVisible();
  }

  const canonicalResponse = await request.get("/cv/yuri-rocha-cv-en.pdf");
  const legacyResponse = await request.get("/assets/cv_yuri_website.pdf");
  const canonicalPdf = await canonicalResponse.body();
  const legacyPdf = await legacyResponse.body();
  expect(legacyPdf.equals(canonicalPdf)).toBe(true);
});

test("application remains mounted after delayed runtime loading", async ({ page }) => {
  await page.goto(ENGLISH_ROUTE);
  await page.waitForTimeout(1000);
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Building reliable software for Physical AI.",
  );
});

test("portfolio remains mounted when WebGL is unavailable", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const [contextId] = args;
      if (typeof contextId === "string" && contextId.includes("webgl")) return null;
      return Reflect.apply(originalGetContext, this, args);
    } as typeof originalGetContext;
  });

  await page.goto(ENGLISH_ROUTE);
  await expect(page.locator(".robot-scene-canvas")).toHaveAttribute(
    "data-scene-unavailable",
    "true",
  );
  const heroFallback = page.locator("[data-scene-fallback=hero]");
  if (testInfo.project.name === "desktop") {
    await expect(heroFallback).toBeVisible();
  } else {
    await expect(heroFallback).toBeAttached();
  }
  await expect(heroFallback).toContainText("Interactive 3D preview unavailable");
  await expect(heroFallback).toContainText("This 3D environment requires WebGL to run.");
  await page.waitForTimeout(1000);
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("ultra-wide layout expands content and caps hero height", async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto(ENGLISH_ROUTE);

  const layout = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".site-header")!;
    const hero = document.querySelector<HTMLElement>(".hero")!;
    return {
      headerWidth: header.getBoundingClientRect().width,
      heroHeight: hero.getBoundingClientRect().height,
    };
  });

  expect(layout.headerWidth).toBeGreaterThan(2000);
  expect(layout.heroHeight).toBeLessThanOrEqual(1100);
});
