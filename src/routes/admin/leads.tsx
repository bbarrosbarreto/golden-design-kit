import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: LeadsAdminPage,
});

type LeadStatus = "novo" | "contactado" | "convertido" | "descartado";
type LeadSource = "empreendimento" | "imovel" | "contato" | string;

type LeadRow = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  message: string | null;
  source: LeadSource | null;
  status: LeadStatus | null;
  development_id: string | null;
  property_id: string | null;
  developments: { title: string | null } | null;
  properties: { title: string | null } | null;
};

const STATUS_OPTIONS: LeadStatus[] = [
  "novo",
  "contactado",
  "convertido",
  "descartado",
];

const onlyDigits = (s: string | null | undefined) =>
  (s ?? "").replace(/\D/g, "");

const formatPhone = (s: string | null) => {
  const d = onlyDigits(s);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s ?? "—";
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

const statusBadgeClass = (status: LeadStatus | null) => {
  switch (status) {
    case "contactado":
      return "bg-badge-blue text-white border-transparent";
    case "convertido":
      return "bg-badge-green text-white border-transparent";
    case "descartado":
      return "bg-destructive/15 text-destructive border-transparent";
    case "novo":
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
};

function SourceBadge({ lead }: { lead: LeadRow }) {
  if (lead.source === "empreendimento") {
    return (
      <Badge className="bg-primary text-primary-foreground border-transparent">
        {lead.developments?.title ?? "Empreendimento"}
      </Badge>
    );
  }
  if (lead.source === "imovel") {
    return (
      <Badge className="bg-badge-blue text-white border-transparent">
        {lead.properties?.title ?? "Imóvel"}
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-transparent">
      Contato Geral
    </Badge>
  );
}

function LeadsAdminPage() {
  const queryClient = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<LeadRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, developments(title), properties(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LeadRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const qDigits = onlyDigits(search);
    return data.filter((l) => {
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (statusFilter !== "all" && (l.status ?? "novo") !== statusFilter)
        return false;
      if (!q) return true;
      const nameMatch = (l.name ?? "").toLowerCase().includes(q);
      const phoneMatch =
        qDigits.length > 0 && onlyDigits(l.phone).includes(qDigits);
      return nameMatch || phoneMatch;
    });
  }, [data, search, sourceFilter, statusFilter]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead excluído");
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = data?.length ?? 0;

  return (
    <AdminLayout>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl text-foreground">Leads</h1>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                {total} {total === 1 ? "lead" : "leads"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="empreendimento">Empreendimento</SelectItem>
                <SelectItem value="imovel">Imóvel</SelectItem>
                <SelectItem value="contato">Contato</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou WhatsApp"
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => {
                    const status = (lead.status ?? "novo") as LeadStatus;
                    const phoneDigits = onlyDigits(lead.phone);
                    const waHref = phoneDigits
                      ? `https://wa.me/55${phoneDigits}`
                      : undefined;
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="whitespace-nowrap font-body text-xs text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </TableCell>
                        <TableCell className="font-body text-sm text-foreground">
                          {lead.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {waHref ? (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noreferrer"
                              className="font-body text-sm text-primary hover:underline"
                            >
                              {formatPhone(lead.phone)}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <SourceBadge lead={lead} />
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          {lead.message ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate text-sm text-foreground">
                                  {lead.message}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm whitespace-pre-wrap">
                                {lead.message}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={status}
                            onValueChange={(v) =>
                              updateStatusMutation.mutate({
                                id: lead.id,
                                status: v as LeadStatus,
                              })
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 w-full capitalize",
                                statusBadgeClass(status),
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem
                                  key={s}
                                  value={s}
                                  className="capitalize"
                                >
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {waHref && (
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                title="Abrir no WhatsApp"
                              >
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <MessageCircle className="h-4 w-4 text-primary" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(lead)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <AlertDialog
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O lead
                {deleting?.name ? ` de ${deleting.name}` : ""} será removido
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleting && deleteMutation.mutate(deleting.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </AdminLayout>
  );
}
