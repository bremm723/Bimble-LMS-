/**
 * Test Suite: Modul 1 — Website Non-Fungsional
 * Coverage  : TW-N1 (Lighthouse), TW-N2 (Loading time), TW-N3 (SEO meta tags),
 *             TW-N4 (Responsiveness)
 *
 * Run: npx playwright test tests/website/tw-nonfunctional.spec.ts --project=chromium
 *
 * Note: Real Lighthouse CLI is run separately (see bottom of file for instructions).
 *       These tests cover: meta tags, load timing, responsive breakpoints.
 */

import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

// ---------------------------------------------------------------------------
// TW-N2 — Loading time < 3 seconds (DOMContentLoaded)
// ---------------------------------------------------------------------------
test("TW-N2 | Loading time: halaman utama < 3 detik (DOMContentLoaded)", async ({
  page,
}) => {
  // Simulate 4G throttling via CDP
  const client = await page.context().newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
    uploadThroughput: (1 * 1024 * 1024) / 8,   // 1 Mbps
    latency: 40,                                // 40ms RTT
  });

  const startTime = Date.now();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const dclDuration = Date.now() - startTime;

  console.log(`TW-N2: DOMContentLoaded = ${dclDuration}ms`);

  // Reset throttling
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });

  expect(
    dclDuration,
    `TW-N2 FAIL: DOMContentLoaded took ${dclDuration}ms, target < 3000ms`
  ).toBeLessThan(3000);
});

// ---------------------------------------------------------------------------
// TW-N3 — SEO: meta tags, og:title, og:description, lang attribute
// ---------------------------------------------------------------------------
test("TW-N3 | SEO: meta title, description, og:title, og:description tersedia", async ({
  page,
}) => {
  await page.goto(BASE);

  // <title>
  const title = await page.title();
  expect(title.length, "TW-N3 FAIL: <title> kosong").toBeGreaterThan(0);
  console.log(`  title: "${title}"`);

  // meta description
  const metaDesc = await page
    .locator('meta[name="description"]')
    .getAttribute("content");
  expect(
    metaDesc && metaDesc.length > 0,
    "TW-N3 FAIL: meta[name=description] tidak ada atau kosong"
  ).toBe(true);
  console.log(`  description: "${metaDesc}"`);

  // og:title
  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .getAttribute("content")
    .catch(() => null);
  expect(
    ogTitle && ogTitle.length > 0,
    "TW-N3 FAIL: meta[property=og:title] tidak ada atau kosong"
  ).toBe(true);
  console.log(`  og:title: "${ogTitle}"`);

  // og:description
  const ogDesc = await page
    .locator('meta[property="og:description"]')
    .getAttribute("content")
    .catch(() => null);
  expect(
    ogDesc && ogDesc.length > 0,
    "TW-N3 FAIL: meta[property=og:description] tidak ada atau kosong"
  ).toBe(true);

  // html lang attribute
  const lang = await page.locator("html").getAttribute("lang");
  expect(
    lang && lang.length > 0,
    "TW-N3 FAIL: <html lang=...> tidak diset"
  ).toBe(true);
  console.log(`  html lang: "${lang}"`);
});

test("TW-N3b | SEO: sitemap.xml & robots.txt tersedia", async ({ page }) => {
  // sitemap.xml
  const sitemapResp = await page.goto(`${BASE}/sitemap.xml`);
  const sitemapStatus = sitemapResp?.status() ?? 0;
  console.log(`  sitemap.xml status: ${sitemapStatus}`);
  expect(
    sitemapStatus,
    "TW-N3b FAIL: sitemap.xml tidak tersedia (bukan 200)"
  ).toBe(200);

  // robots.txt
  const robotsResp = await page.goto(`${BASE}/robots.txt`);
  const robotsStatus = robotsResp?.status() ?? 0;
  console.log(`  robots.txt status: ${robotsStatus}`);
  expect(
    robotsStatus,
    "TW-N3b FAIL: robots.txt tidak tersedia (bukan 200)"
  ).toBe(200);
});

// ---------------------------------------------------------------------------
// TW-N4 — Responsiveness: key sections visible at mobile/tablet/desktop viewports
// ---------------------------------------------------------------------------
const VIEWPORTS = [
  { name: "Mobile (375px)", width: 375, height: 812 },
  { name: "Tablet (768px)", width: 768, height: 1024 },
  { name: "Desktop (1280px)", width: 1280, height: 900 },
];

for (const viewport of VIEWPORTS) {
  test(`TW-N4 | Responsif: layout tidak rusak di ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(BASE);

    // Hero section visible
    const hero = page.locator("main section").first();
    await expect(
      hero,
      `TW-N4 FAIL [${viewport.name}]: Hero section tidak terlihat`
    ).toBeVisible();

    // h1 visible and not overflowing
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const h1Box = await h1.boundingBox();
    expect(
      h1Box,
      `TW-N4 FAIL [${viewport.name}]: h1 tidak memiliki bounding box`
    ).not.toBeNull();
    if (h1Box) {
      expect(
        h1Box.width,
        `TW-N4 FAIL [${viewport.name}]: h1 lebih lebar dari viewport`
      ).toBeLessThanOrEqual(viewport.width + 1);
    }

    // Program section accessible
    const programSection = page.locator("#program");
    await programSection.scrollIntoViewIfNeeded();
    await expect(
      programSection,
      `TW-N4 FAIL [${viewport.name}]: Section #program tidak terlihat`
    ).toBeVisible();

    // No horizontal scrollbar (body scrollWidth <= viewport width)
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(
      bodyScrollWidth,
      `TW-N4 FAIL [${viewport.name}]: Ada horizontal scroll (scrollWidth=${bodyScrollWidth} > viewport=${viewport.width})`
    ).toBeLessThanOrEqual(viewport.width + 2);

    // Contact form visible
    const form = page.locator("form").first();
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible();
  });
}
