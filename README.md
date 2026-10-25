# Study Plan

A personal workspace for planning, organizing, and tracking continuous learning.

## About

Self-directed learning tends to scatter across tools: goals in one place, plans in another, and no clear record of what was actually studied. Study Plan aims to keep that in a single, focused workspace that runs entirely in the browser, with no account and no server.

The project is built incrementally. Today it covers the first step, defining and managing study goals. The planned next steps are listed in the [Roadmap](#roadmap).

## Current Features

- Create study goals with a required name and an optional description.
- Field validation: the name is required and limited to 100 characters, the description is limited to 500 characters, and surrounding whitespace is removed.
- List the saved goals, most recent first, with empty, loading, and error states.
- Edit a goal's name and description in a dialog, with the same validation rules; editing keeps the goal in its position.
- Delete a goal permanently, after an explicit confirmation.
- Local persistence with IndexedDB: goals remain available after reloading or reopening the app in the same browser.
- Responsive interface, usable from 320 px wide screens to desktop, with keyboard navigation.

The interface is currently available in Brazilian Portuguese only.

## Roadmap

- Plan study activities.
- Mark activities as completed.
- Record study sessions and time spent.
- View learning progress and history.

## Tech Stack

- **Frontend and styling:** React 19, TypeScript, React Router, Tailwind CSS 4, shadcn/ui components, and Lucide icons, with the Bricolage Grotesque and Instrument Sans typefaces.
- **Persistence:** IndexedDB through Dexie.js.
- **Testing and quality:** Vitest and React Testing Library for unit and component tests, Playwright for end-to-end tests, ESLint, and Prettier.
- **Build and automation:** Vite, pnpm, and a GitHub Actions workflow that runs every check on pull requests and on `main`.

## Getting Started

Requirements: [Node.js](https://nodejs.org/) 24 or later, with Corepack, which provides the pnpm version pinned in `package.json`.

```bash
# 1. Install the dependencies
corepack pnpm install

# 2. Start the development server (http://localhost:5173/)
corepack pnpm dev

# 3. Run the unit and component tests
corepack pnpm test

# 4. Build for production
corepack pnpm build
```

End-to-end tests run against the production build and need Chromium, installed once per machine:

```bash
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e
```

### Validation

The checks below also run in continuous integration:

```bash
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
```

## Architecture

- **Local-first:** there is no backend. All data stays in the user's browser.
- **Persistence:** a single IndexedDB database, accessed through Dexie.js. The schema and its versions are defined in one place, and each feature keeps its own data access code. See [ADR 0001](docs/architecture/adr/0001-local-persistence-with-dexie.md) (in Portuguese).
- **Feature-first organization:** business code is grouped by feature, and each feature exposes a single public entry point.

The source code is split into four areas:

| Directory            | Responsibility                                                  |
| -------------------- | --------------------------------------------------------------- |
| `src/app`            | Application startup, routing, and the application shell.        |
| `src/features`       | One directory per feature, with its rules, data access, and UI. |
| `src/infrastructure` | Shared technical resources, such as the database setup.         |
| `src/shared`         | Reusable UI components and utilities with no business rules.    |

Dependencies point in one direction: `app` may use everything, features may use `infrastructure` and `shared`, and neither of those depends on a feature. These boundaries are enforced by ESLint.

## Project Status

In active development. The technical foundation, the first functional feature (creating, listing, editing, and deleting study goals), and the visual identity are in place. New capabilities are delivered in small increments, following the roadmap above.
