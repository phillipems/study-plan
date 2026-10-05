import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">
        O endereço acessado não existe nesta aplicação.
      </p>
      <Link to="/" className="font-medium underline underline-offset-4">
        Voltar para o início
      </Link>
    </section>
  );
}
