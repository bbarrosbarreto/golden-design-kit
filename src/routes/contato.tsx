import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";

export const Route = createFileRoute("/contato")({
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="font-heading text-4xl text-foreground">Contato</h1>
      </div>
    </Layout>
  );
}
