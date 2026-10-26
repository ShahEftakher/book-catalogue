import { expect, test } from "@playwright/test";

test("browse, sign in, add a Bangla book manually, find it by romanized title", async ({ page }, info) => {
  // Device projects run in parallel, so each run needs its own book
  const id = `${info.project.name}${crypto.randomUUID().slice(0, 8)}`;
  const unique = `পরীক্ষা ${id}`;
  const latin = `Porikkha ${id}`;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();

  // Admin pages bounce anonymous visitors to sign-in
  await page.goto("/admin/books/new");
  await expect(page).toHaveURL(/\/signin/);
  await page.getByRole("button", { name: /Dev sign-in/ }).click();
  await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();

  await page.getByRole("button", { name: "Enter manually" }).click();
  await page.getByLabel("Title", { exact: true }).fill(unique);
  await page.getByLabel("Romanized title").fill(latin);
  await page.getByLabel("Author 1", { exact: true }).fill("হুমায়ূন আহমেদ");
  await page.getByLabel("Year published").fill("২০০১");
  await page.getByRole("button", { name: "Add to catalogue" }).click();

  await expect(page.getByRole("heading", { name: unique })).toBeVisible();
  await expect(page.getByText("2001")).toBeVisible();
  await expect(page.getByText("Bangla")).toBeVisible();

  await page.goto(`/?q=${encodeURIComponent(latin.toLowerCase())}`);
  await expect(page.getByText(/book(s)? matching/)).toBeVisible();
  await page.getByRole("link", { name: new RegExp(unique) }).click();

  // Clean up
  await page.getByRole("link", { name: "Edit" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL("/");
});
