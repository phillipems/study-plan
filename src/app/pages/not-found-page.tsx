import { Link } from "react-router";
import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
  return (
    <section className="space-y-6">
      <p className="text-eyebrow text-muted-foreground">Endereço inválido</p>
      <h1 className="text-display text-page uppercase">
        Página não encontrada
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        O endereço acessado não existe nesta aplicação.
      </p>
      <Button
        asChild
        variant="outline"
        className="h-12 rounded-full border-2 border-foreground px-6 text-base font-semibold focus-visible:ring-ring"
      >
        <Link to="/">Voltar para o início</Link>
      </Button>
    </section>
  );
}
