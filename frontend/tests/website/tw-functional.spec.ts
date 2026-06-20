/**
 * Test Suite: Modul 1 — Website / Company Profile
 * Coverage  : TW-01 → TW-09  (Functional)
 * Base URL  : http://localhost:3000  (website app)
 *
 * Run: npx playwright test tests/website/tw-functional.spec.ts --project=chromium
 */

import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const LMS_URL = "http://localhost:3001"; // matches NEXT_PUBLIC_LMS_URL

// ---------------------------------------------------------------------------
// TW-01 — Landing page: CTA "Daftar" & "Lihat Program" navigate correctly
// ---------------------------------------------------------------------------
test("TW-01 | Landing page CTA: 'Daftar Sekarang' mengarah ke halaman pendaftaran", async ({
  page,
}) => {
  await page.goto(BASE);

  // Verify hero section exists
  await expect(page.locator("h1")).toBeVisible();

  // Hero CTA "Daftar Sekarang" → LMS /register
  const heroCTA = page
    .locator("main section")
    .first()
    .locator("a", { hasText: "Daftar Sekarang" })
    .first();
  await expect(heroCTA).toBeVisible();
  const heroCTAHref = await heroCTA.getAttribute("href");
  expect(heroCTAHref).toContain("/register");

  // "Lihat Program" → scrolls to #program
  const lihatProgram = page.locator("a", { hasText: "Lihat Program" }).first();
  await expect(lihatProgram).toBeVisible();
  const lihatProgramHref = await lihatProgram.getAttribute("href");
  expect(lihatProgramHref).toContain("#program");

  // Navbar "Daftar Sekarang" → LMS /register
  const navbarCTA = page
    .locator("header")
    .locator("a", { hasText: "Daftar Sekarang" });
  await expect(navbarCTA).toBeVisible();
  const navbarHref = await navbarCTA.getAttribute("href");
  expect(navbarHref).toContain("/register");
});

// ---------------------------------------------------------------------------
// TW-02 — Program page: programs listed with price, level filter visible
// ---------------------------------------------------------------------------
test("TW-02 | Halaman Program: daftar program & harga muncul", async ({
  page,
}) => {
  await page.goto(BASE);

  // Navigate to #program section
  await page.locator('a[href="#program"]').first().click();
  await page.waitForTimeout(400); // let scroll complete

  const programSection = page.locator("#program");
  await expect(programSection).toBeVisible();

  // Check SD / SMP / SMA cards exist
  for (const level of ["SD", "SMP", "SMA"]) {
    await expect(programSection.locator(`text=Kelas ${level}`)).toBeVisible();
  }

  // Price information present
  await expect(programSection.locator("text=Rp")).toBeVisible();

  // Each card has a "Daftar Sekarang" CTA
  const ctaButtons = programSection.locator(
    'button:has-text("Daftar Sekarang"), a:has-text("Daftar Sekarang")'
  );
  await expect(ctaButtons.first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// TW-03 — Testimonials: section exists, testimonial cards rendered
//          (Admin CMS add/delete is a backend feature not yet implemented;
//           test validates static testimonials render correctly)
// ---------------------------------------------------------------------------
test("TW-03 | Testimoni: section render dengan benar", async ({ page }) => {
  await page.goto(BASE);

  const testimoniSection = page.locator("#testimoni");
  await expect(testimoniSection).toBeVisible();

  // Heading
  await expect(
    testimoniSection.locator("h2", { hasText: "Apa Kata Mereka" })
  ).toBeVisible();

  // At least 3 testimonial cards
  const cards = testimoniSection.locator(".rounded-xl");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // Each card has name and text
  const firstCard = cards.first();
  await expect(firstCard.locator("p").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// TW-04 — Galeri Prestasi: page/section exists
//          (Feature not yet implemented — expected FAIL)
// ---------------------------------------------------------------------------
test("TW-04 | Galeri Prestasi: section atau halaman /galeri-prestasi tersedia", async ({
  page,
}) => {
  // Try dedicated page first
  const response = await page.goto(`${BASE}/galeri-prestasi`);
  const status = response?.status() ?? 0;

  if (status === 404 || status === 0) {
    // Fall back: check for section in home page
    await page.goto(BASE);
    const section = page.locator(
      "section:has-text('Prestasi'), section:has-text('Galeri'), #galeri, #prestasi"
    );
    const exists = await section.count();
    expect(
      exists,
      "TW-04 FAIL: Halaman /galeri-prestasi tidak ditemukan dan section galeri tidak ada di homepage"
    ).toBeGreaterThan(0);
  } else {
    expect(status).toBeLessThan(400);
    // Check content renders
    await expect(page.locator("h1, h2")).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// TW-05 — Galeri Aktivitas: page/section exists
//          (Feature not yet implemented — expected FAIL)
// ---------------------------------------------------------------------------
test("TW-05 | Galeri Aktivitas: section atau halaman /galeri-aktivitas tersedia", async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/galeri-aktivitas`);
  const status = response?.status() ?? 0;

  if (status === 404 || status === 0) {
    await page.goto(BASE);
    const section = page.locator(
      "section:has-text('Aktivitas'), section:has-text('Kegiatan'), #aktivitas"
    );
    const exists = await section.count();
    expect(
      exists,
      "TW-05 FAIL: Halaman /galeri-aktivitas tidak ditemukan dan section aktivitas tidak ada di homepage"
    ).toBeGreaterThan(0);
  } else {
    expect(status).toBeLessThan(400);
  }
});

// ---------------------------------------------------------------------------
// TW-06 — Promo Event: event page/section with countdown & daftar button
//          (Feature not yet implemented — expected FAIL)
// ---------------------------------------------------------------------------
test("TW-06 | Promo Event: halaman event dengan countdown timer & tombol daftar", async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/event`);
  const status = response?.status() ?? 0;

  if (status === 404 || status === 0) {
    await page.goto(BASE);
    // Check if there is an event promo section
    const section = page.locator(
      "section:has-text('Event'), section:has-text('Olimpiade'), section:has-text('Try Out'), #event, #promo-event"
    );
    const exists = await section.count();
    expect(
      exists,
      "TW-06 FAIL: Halaman /event tidak ditemukan dan section event/promo tidak ada di homepage"
    ).toBeGreaterThan(0);
  } else {
    expect(status).toBeLessThan(400);
    // Countdown timer
    const countdown = page.locator(
      "[data-testid='countdown'], .countdown, text=/hari|jam|menit|detik/i"
    );
    await expect(
      countdown.first(),
      "TW-06 FAIL: Countdown timer tidak ditemukan di halaman event"
    ).toBeVisible();
    // Daftar button leads to event registration
    const daftarBtn = page.locator("a:has-text('Daftar'), button:has-text('Daftar')");
    await expect(daftarBtn.first()).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// TW-07 — Halaman Kontak: form send, WhatsApp link, multi-branch map
// ---------------------------------------------------------------------------
test("TW-07 | Kontak: form terkirim & WA link ada", async ({ page }) => {
  await page.goto(BASE);

  const kontakSection = page.locator("#kontak");
  await expect(kontakSection).toBeVisible();

  // --- WhatsApp link exists and has correct wa.me pattern ---
  const waLink = kontakSection.locator('a[href*="wa.me"]');
  await expect(waLink).toBeVisible();
  const waHref = await waLink.getAttribute("href");
  expect(waHref).toMatch(/wa\.me\/\d+/);

  // --- Contact form submit ---
  await kontakSection.locator('input[type="text"]').fill("Tester Otomatis");
  await kontakSection
    .locator('input[type="email"]')
    .fill("tester@bimbel.co.id");
  await kontakSection.locator("textarea").fill("Pesan pengujian otomatis.");
  await kontakSection
    .locator('button[type="submit"], button:has-text("Kirim")')
    .click();

  // Expect success notification
  await expect(
    kontakSection.locator("text=berhasil terkirim"),
    "TW-07: Success message tidak muncul setelah submit form"
  ).toBeVisible({ timeout: 5000 });
});

test("TW-07b | Kontak: validasi form wajib isi semua field", async ({ page }) => {
  await page.goto(BASE);
  const kontakSection = page.locator("#kontak");

  // Submit without filling → HTML5 required prevents submit, no success message
  await kontakSection
    .locator('button[type="submit"], button:has-text("Kirim")')
    .click();

  const success = kontakSection.locator("text=berhasil terkirim");
  await expect(success).not.toBeVisible();
});

test("TW-07c | Kontak: peta multi-cabang", async ({ page }) => {
  await page.goto(BASE);
  const kontakSection = page.locator("#kontak");
  await expect(kontakSection).toBeVisible();

  // Check for map embed (iframe/div with map) OR text indicating branch locations
  const mapElement = page.locator(
    'iframe[src*="maps"], [data-testid="map"], .map-container'
  );
  const hasMap = await mapElement.count();

  expect(
    hasMap,
    "TW-07c FAIL: Tidak ada embed peta lokasi cabang di section kontak"
  ).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// TW-08 — CMS Admin: edit content without coding
//          (Admin CMS not yet implemented — expected FAIL)
// ---------------------------------------------------------------------------
test("TW-08 | CMS Admin: halaman /admin/cms tersedia dan dapat edit konten", async ({
  page,
}) => {
  // Try common admin routes
  const routes = ["/admin", "/admin/cms", "/admin/content", "/dashboard/admin"];
  let foundAdmin = false;

  for (const route of routes) {
    const response = await page.goto(`${BASE}${route}`);
    const status = response?.status() ?? 0;
    if (status !== 404) {
      foundAdmin = true;
      break;
    }
  }

  expect(
    foundAdmin,
    "TW-08 FAIL: Tidak ada route admin/CMS yang tersedia. Route yang dicoba: /admin, /admin/cms, /admin/content, /dashboard/admin"
  ).toBe(true);
});

// ---------------------------------------------------------------------------
// TW-09 — Multi-bahasa: toggle ID/EN (Out-of-scope Fase 1 per PRD)
// ---------------------------------------------------------------------------
test("TW-09 | Multi-bahasa: toggle ID/EN tersedia (opsional Fase 2)", async ({
  page,
}) => {
  await page.goto(BASE);

  const langToggle = page.locator(
    "[data-testid='lang-toggle'], .lang-toggle, button:has-text('EN'), button:has-text('ID/EN'), select:has(option[value='en'])"
  );
  const hasToggle = await langToggle.count();

  // This is Fase 2 feature — mark as SKIP/INFO not hard failure
  if (hasToggle === 0) {
    console.log(
      "TW-09: SKIP — Multi-bahasa belum diimplementasikan (Fase 2 feature per PRD)"
    );
  } else {
    await expect(langToggle.first()).toBeVisible();
    await langToggle.first().click();
    // After click, some element should be in EN
    await page.waitForTimeout(500);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toMatch(/learn|program|contact|about/);
  }
  // Always pass — this is optional Fase 2
  expect(true).toBe(true);
});
