import { Link } from "react-router";
import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="text-lg text-muted-foreground">
        O endereço acessado não existe nesta aplicação.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Voltar para o início</Link>
      </Button>
    </section>
  );
}
