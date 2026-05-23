import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="font-heading text-4xl text-foreground">Bruno Barreto Imóveis</h1>
        <p className="mt-4 font-body text-muted-foreground">
          Onde a arquitetura encontra oportunidade.
        </p>
      </div>
    </Layout>
  );
}
