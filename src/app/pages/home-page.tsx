import { Link } from "react-router";
import { Button } from "@/shared/ui/button";

export function HomePage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end lg:gap-16">
      <section className="min-w-0 space-y-6">
        <p className="text-eyebrow text-muted-foreground">
          Planejamento de estudos
        </p>
        <h1 className="text-display text-hero uppercase">
          Seu aprendizado começa{" "}
          <span className="rounded-xl bg-primary box-decoration-clone px-[0.14em]">
            aqui.
          </span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Planeje, organize e acompanhe seus estudos.
        </p>
        <Button
          asChild
          className="h-12 rounded-full px-6 text-base font-semibold hover:bg-[color-mix(in_oklab,var(--primary),white_18%)] focus-visible:ring-ring"
        >
          <Link to="/goals">
            Começar agora <span aria-hidden="true">→</span>
          </Link>
        </Button>
      </section>

      <section
        aria-labelledby="home-goals-heading"
        className="surface-ink min-w-0 space-y-5 rounded-3xl p-6 sm:p-8"
      >
        <p className="text-eyebrow text-primary">Disponível agora</p>
        <h2
          id="home-goals-heading"
          className="text-display text-4xl uppercase sm:text-5xl"
        >
          Objetivos de estudo
        </h2>
        <p className="text-muted-foreground">
          Registre o que você quer aprender, com nome e descrição, e veja tudo
          reunido em uma lista.
        </p>
        <hr className="border-border" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Seus dados ficam neste navegador.
          </span>{" "}
          Sem conta e sem servidor.
        </p>
      </section>
    </div>
  );
}
