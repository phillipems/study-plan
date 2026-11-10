import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Wednesday, 11/11/2026, in the browser's local time zone.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 11, 10, 0));
});

async function createGoalAndSubjects(page: Page, subjects: string[]) {
  await page.goto("/#/goals");
  await page.getByLabel("Nome").fill("Desenvolvimento backend");
  await page.getByRole("button", { name: "Criar objetivo" }).click();
  await expect(page.getByRole("status")).toHaveText("Objetivo criado.");

  await page.getByRole("link", { name: "Disciplinas" }).click();
  for (const name of subjects) {
    await page.getByLabel("Nome").fill(name);
    await page
      .getByRole("checkbox", { name: "Desenvolvimento backend" })
      .check();
    await page.getByRole("button", { name: "Criar disciplina" }).click();
    await expect(page.getByRole("status")).toHaveText("Disciplina criada.");
  }
}

async function saveTime(
  page: Page,
  button: string,
  hours: string,
  minutes: string,
) {
  await page.getByRole("button", { name: button }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Horas").fill(hours);
  await dialog.getByLabel("Minutos").fill(minutes);
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toBeHidden();
}

const tuesday = (page: Page) =>
  page.getByRole("listitem").filter({ hasText: "TER 10/11" });

test("records, edits and removes the time of a day, keeping it after a reload", async ({
  page,
}) => {
  await createGoalAndSubjects(page, ["Python"]);
  await page.getByRole("link", { name: "Python" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Python" }),
  ).toBeVisible();
  await expect(page.getByText("09/11 – 15/11/2026")).toBeVisible();
  await expect(page.getByRole("list").getByRole("listitem")).toHaveCount(7);

  await saveTime(page, "Registrar tempo de terça-feira, 10/11/2026", "1", "30");
  await expect(tuesday(page)).toContainText("01:30");

  await saveTime(page, "Editar tempo de terça-feira, 10/11/2026", "2", "15");
  await expect(tuesday(page)).toContainText("02:15");

  await page.reload();
  await expect(tuesday(page)).toContainText("02:15");

  await page
    .getByRole("button", { name: "Editar tempo de terça-feira, 10/11/2026" })
    .click();
  await page.getByRole("button", { name: "Remover registro" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remover" })
    .click();
  await expect(tuesday(page)).toContainText("Sem registro");

  await page.reload();
  await expect(tuesday(page)).toContainText("Sem registro");
});

test("navigates to past weeks and never to future ones", async ({ page }) => {
  await createGoalAndSubjects(page, ["Python"]);
  await page.getByRole("link", { name: "Python" }).click();

  const next = page.getByRole("button", { name: "Próxima semana" });
  await expect(next).toBeDisabled();

  // Days after today (Wednesday, 11/11) cannot be recorded.
  await expect(
    page.getByRole("button", {
      name: "Registro indisponível para quinta-feira, 12/11/2026, data futura",
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("listitem").filter({ hasText: "DOM 15/11" }),
  ).toContainText("Data futura");

  await page.getByRole("button", { name: "Semana anterior" }).click();
  await expect(page.getByText("02/11 – 08/11/2026")).toBeVisible();
  await saveTime(page, "Registrar tempo de terça-feira, 03/11/2026", "0", "45");
  await expect(
    page.getByRole("listitem").filter({ hasText: "TER 03/11" }),
  ).toContainText("00:45");

  await next.click();
  await expect(page.getByText("09/11 – 15/11/2026")).toBeVisible();
  await expect(next).toBeDisabled();

  // A future week in the URL falls back to the current week.
  await page.goto(page.url().replace(/(\?.*)?$/, "?week=2026-11-23"));
  await expect(page.getByText("09/11 – 15/11/2026")).toBeVisible();
  await expect(next).toBeDisabled();
});

test("keeps the records of each subject apart", async ({ page }) => {
  await createGoalAndSubjects(page, ["Python", "SQL"]);

  await page.getByRole("link", { name: "Python" }).click();
  await saveTime(page, "Registrar tempo de terça-feira, 10/11/2026", "1", "0");
  await expect(tuesday(page)).toContainText("01:00");

  await page
    .getByRole("link", { name: "Disciplinas", exact: true })
    .first()
    .click();
  await page.getByRole("link", { name: "SQL" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "SQL" }),
  ).toBeVisible();
  await expect(tuesday(page)).toContainText("Sem registro");
});

test("reports a subject that does not exist", async ({ page }) => {
  await page.goto("/#/subjects/unknown-id");

  await expect(
    page.getByRole("heading", { level: 1, name: "Disciplina não encontrada" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar para Disciplinas" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Disciplinas" }),
  ).toBeVisible();
});
