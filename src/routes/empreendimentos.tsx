import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";

export const Route = createFileRoute("/empreendimentos")({
  component: EmpreendimentosPage,
});

function EmpreendimentosPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="font-heading text-4xl text-foreground">Empreendimentos</h1>
      </div>
    </Layout>
  );
}
