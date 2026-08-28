import { createFileRoute, Outlet } from "@tanstack/react-router";

const PAGE_URL = "https://brunobarretoimoveis.com.br/empreendimentos";

export const Route = createFileRoute("/empreendimentos")({
  head: () => ({
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: () => <Outlet />,
});
