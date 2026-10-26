import { expect, test, type Page } from "@playwright/test";

// Small Android width; every page must fit without sideways scrolling and stay tappable.
test.use({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
// The viewport is fixed above, so running it once (not once per device project) is enough
test.beforeEach(({}, info) => info.skip(info.project.name !== "desktop"));

async function expectFitsAndTappable(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(0);

  const small = await page.evaluate(() =>
    [...document.querySelectorAll("button, select, textarea, input:not([type=checkbox]):not([type=hidden]):not([type=file])")]
      .filter((el) => el.getAttribute("role") !== "radio") // half-star hit areas
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0 && r.height < 40)
      .map(({ el, r }) => `${el.tagName} "${el.getAttribute("aria-label") ?? el.textContent?.trim()}" ${Math.round(r.height)}px`),
  );
  expect(small, `small tap targets on ${page.url()}`).toEqual([]);
}

test("public pages fit a 360px phone", async ({ page }) => {
  await page.goto("/");
  await expectFitsAndTappable(page);

  await page.getByRole("button", { name: /^Filters/ }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await expectFitsAndTappable(page);
  await page.keyboard.press("Escape");

  await page.locator('a[href^="/books/"]').first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectFitsAndTappable(page);

  await page.goto("/signin");
  await expectFitsAndTappable(page);
});

test("owner pages fit a 360px phone", async ({ page }) => {
  await page.goto("/signin?callbackUrl=/");
  await page.getByRole("button", { name: /Dev sign-in/ }).click();
  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
  await expectFitsAndTappable(page);

  await page.goto("/admin/books/new");
  await page.getByRole("button", { name: "Enter manually" }).click();
  await expectFitsAndTappable(page);

  await page.goto("/");
  await page.locator('a[href^="/books/"]').first().click();
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  await expectFitsAndTappable(page);
});
