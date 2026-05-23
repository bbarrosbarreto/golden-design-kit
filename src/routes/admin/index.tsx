import { createFileRoute } from "@tanstack/react-router";
import { Building2, Home, Handshake, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

const METRICS = [
  { label: "Empreendimentos", icon: Building2 },
  { label: "Imóveis", icon: Home },
  { label: "Leads", icon: Users },
  { label: "Parceiros", icon: Handshake },
];

function AdminDashboardPage() {
  return (
    <AdminLayout>
      <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
      <p className="mt-2 font-body text-muted-foreground">Visão geral do site</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-muted-foreground">{m.label}</p>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 font-heading text-4xl text-foreground">0</p>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
