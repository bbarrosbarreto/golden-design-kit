import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/home/Hero";
import { Pillars } from "@/components/home/Pillars";
import { FeaturedDevelopments } from "@/components/home/FeaturedDevelopments";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { Partners } from "@/components/home/Partners";

const TITLE = "Bruno Barreto Imóveis | Corretor em Brasília/DF";
const DESCRIPTION =
  "Curadoria de alto padrão em imóveis e lançamentos no Distrito Federal, com visão de arquiteto. CRECI-DF 34.060.";
const URL = "https://brunobarretoimoveis.com.br/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Index,
});


function Index() {
  return (
    <Layout>
      <Hero />
      <FeaturedDevelopments />
      <Pillars />
      <FeaturedProperties />
      <Partners />
    </Layout>
  );
}
