import { expect, test } from "@playwright/test";

// Desktop only: the scene is the same on phones, and software WebGL in CI is slow
test.beforeEach(({}, info) => info.skip(info.project.name !== "desktop"));

test("3D library: browse with the keyboard, open a book, go to its page", async ({ page }) => {
  test.setTimeout(90_000);
  // ?view=3d (dev only) keeps the scene even if headless WebGL is slow
  await page.goto("/?view=3d&time=12:00");
  const stage = page.getByRole("application", { name: /3D library/ });
  await expect(stage).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Opening the library…")).toHaveCount(0, { timeout: 60_000 });

  // Zoom controls are there and usable
  await page.getByRole("button", { name: "Zoom out" }).click();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.getByRole("button", { name: "Reset zoom" }).click();

  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  const panel = page.getByRole("complementary", { name: "Book details" });
  await expect(panel).toBeVisible();
  const title = await panel.getByRole("heading").textContent();
  expect(title?.trim().length).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await panel.getByRole("link", { name: "Open book page" }).click();
  await expect(page).toHaveURL(/\/books\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!.trim());
});

test("falls back to the grid when WebGL isn't available", async ({ page }) => {
  await page.addInitScript(() => {
    // Simulate a browser without WebGL; other context types still work
    const original = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, ...a: unknown[]) => unknown;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        return type.startsWith("webgl") ? null : original.call(this, type, ...rest);
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator('a[href^="/books/"]').first()).toBeVisible();
});

test("the site theme follows the time of day", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("library-view", "grid"));
  await page.goto("/?time=21:00");
  await expect(page.locator("html")).toHaveAttribute("data-phase", "night");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/?time=12:00");
  await expect(page.locator("html")).toHaveAttribute("data-phase", "day");
});
