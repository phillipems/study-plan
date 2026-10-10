import { Link, NavLink, Outlet } from "react-router";

const focusRing =
  "rounded-md outline-offset-2 outline-foreground focus-visible:outline-2";

const navLink = `${focusRing} inline-flex h-9 items-center px-2.5 text-sm text-foreground/70 transition-colors hover:text-foreground aria-[current=page]:bg-secondary aria-[current=page]:font-medium aria-[current=page]:text-foreground sm:px-3`;

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className={`${focusRing} fixed top-2 left-2 z-20 -translate-y-16 bg-background px-3 py-2 text-sm font-medium focus-visible:translate-y-0`}
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
          <Link
            to="/"
            className={`${focusRing} -mx-1.5 px-1.5 py-1 text-base font-semibold tracking-tight whitespace-nowrap`}
          >
            Study Plan
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1">
            <NavLink to="/" end className={navLink}>
              Início
            </NavLink>
            <NavLink to="/goals" className={navLink}>
              Objetivos
            </NavLink>
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:px-6 sm:py-12"
      >
        <Outlet />
      </main>
    </div>
  );
}
