import { expect, test } from "@playwright/test";

test("loads the home page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Study Plan");
  await expect(
    page.getByRole("heading", { level: 1, name: "Início" }),
  ).toBeVisible();
});

test("shows the not found page for an unknown route", async ({ page }) => {
  await page.goto("/#/rota-inexistente");

  await expect(
    page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
  ).toBeVisible();
});

test("keeps the current route after a page reload", async ({ page }) => {
  await page.goto("/#/rota-inexistente");
  await page.reload();

  await expect(page).toHaveURL(/#\/rota-inexistente$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
  ).toBeVisible();
});

test("returns to the home page through the link", async ({ page }) => {
  await page.goto("/#/rota-inexistente");
  await page.getByRole("link", { name: "Voltar para o início" }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Início" }),
  ).toBeVisible();
});
