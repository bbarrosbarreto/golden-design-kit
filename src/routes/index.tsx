import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/home/Hero";
import { Pillars } from "@/components/home/Pillars";
import { FeaturedDevelopments } from "@/components/home/FeaturedDevelopments";
import { featuredDevelopmentsQueryOptions } from "@/lib/developments.query";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(featuredDevelopmentsQueryOptions),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <Hero />
      <Pillars />
      <FeaturedDevelopments />
    </Layout>
  );
}


