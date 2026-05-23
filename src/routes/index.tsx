import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/home/Hero";
import { Pillars } from "@/components/home/Pillars";
import { FeaturedDevelopments } from "@/components/home/FeaturedDevelopments";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Layout>
      <Hero />
      <Pillars />
      <FeaturedProperties />
      <FeaturedDevelopments />
    </Layout>
  );
}
