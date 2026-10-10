import { Link, NavLink, Outlet } from "react-router";

const focusRing = "outline-offset-2 outline-foreground focus-visible:outline-2";

const navLink = `${focusRing} inline-flex h-9 items-center rounded-full border border-foreground/25 px-3 text-sm font-medium transition-colors hover:border-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background sm:px-4`;

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className={`${focusRing} fixed top-2 left-2 z-20 -translate-y-16 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background opacity-0 focus-visible:translate-y-0 focus-visible:opacity-100`}
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-10 border-b-2 border-foreground bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className={`${focusRing} text-display -mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-1 text-xl whitespace-nowrap uppercase sm:text-2xl`}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px] bg-primary sm:size-3"
            />
            Study Plan
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1.5">
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
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 outline-none sm:px-6 sm:py-16"
      >
        <Outlet />
      </main>
    </div>
  );
}
