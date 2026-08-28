import { createFileRoute, Outlet } from "@tanstack/react-router";

const PAGE_URL = "https://brunobarretoimoveis.com.br/imoveis";

export const Route = createFileRoute("/imoveis")({
  head: () => ({
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: () => <Outlet />,
});
