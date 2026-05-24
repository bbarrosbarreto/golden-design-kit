import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Building2, Home, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Empreendimentos", icon: Building2, to: "/admin/empreendimentos" },
  { label: "Imóveis", icon: Home, to: "/admin/imoveis" },
  { label: "Leads", icon: MessageSquare, to: "/admin/leads" },
] as const;


export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-surface">
        <aside className="flex w-64 flex-col border-r border-border bg-background">
          <div className="border-b border-border p-6">
            <Link to="/admin" className="font-heading text-3xl text-foreground">
              BB
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 font-body text-sm transition-colors hover:bg-surface hover:text-primary",
                    active ? "bg-surface text-primary" : "text-foreground",
                  )}
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

        <main className="flex-1 p-10">{children}</main>
      </div>
    </AdminGuard>
  );
}
