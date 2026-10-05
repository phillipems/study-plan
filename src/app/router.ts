import { createHashRouter } from "react-router";
import { AppShell } from "@/app/app-shell";
import { HomePage } from "@/app/pages/home-page";
import { NotFoundPage } from "@/app/pages/not-found-page";

// Hash-based routing: GitHub Pages serves static files only and cannot
// rewrite deep links to index.html, so the route lives after the "#".
export const router = createHashRouter([
  {
    Component: AppShell,
    children: [
      { index: true, Component: HomePage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
