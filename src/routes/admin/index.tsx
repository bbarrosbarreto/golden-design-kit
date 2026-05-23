import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Home, LayoutDashboard, LogOut, Users, Handshake } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>
  );
}

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Empreendimentos", icon: Building2, to: "/admin" },
  { label: "Imóveis", icon: Home, to: "/admin" },
  { label: "Leads", icon: Users, to: "/admin" },
] as const;

const METRICS = [
  { label: "Empreendimentos", icon: Building2 },
  { label: "Imóveis", icon: Home },
  { label: "Leads", icon: Users },
  { label: "Parceiros", icon: Handshake },
];

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-background">
        <div className="border-b border-border p-6">
          <Link to="/admin" className="font-heading text-3xl text-foreground">
            BB
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 rounded-md px-3 py-2 font-body text-sm text-foreground transition-colors hover:bg-surface hover:text-primary"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-10">
        <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
        <p className="mt-2 font-body text-muted-foreground">
          Visão geral do site
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-body text-sm text-muted-foreground">
                    {m.label}
                  </p>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-heading text-4xl text-foreground">0</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
