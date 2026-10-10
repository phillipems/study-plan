import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "@/app/app";

test("renders the home page inside the application shell", async () => {
  render(<App />);

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Seu aprendizado começa aqui.",
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Study Plan" })).toBeInTheDocument();
});

test("shows the main text of the home page", async () => {
  render(<App />);

  expect(
    await screen.findByText("Planeje, organize e acompanhe seus estudos."),
  ).toBeInTheDocument();
});
