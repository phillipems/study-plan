import { Link, NavLink, Outlet } from "react-router";

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
          <Link to="/" className="text-lg font-semibold">
            Study Plan
          </Link>
          <nav aria-label="Principal">
            <NavLink
              to="/goals"
              className="text-sm text-muted-foreground hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            >
              Objetivos
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
