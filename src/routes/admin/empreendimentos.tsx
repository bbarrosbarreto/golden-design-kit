import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DevelopmentForm,
  type DevelopmentRow,
} from "@/components/admin/DevelopmentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { pickCoverImage } from "@/lib/development-images";

export const Route = createFileRoute("/admin/empreendimentos")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: EmpreendimentosAdminPage,
});

type Row = DevelopmentRow & { regions: { id: string; name: string } | null };

function EmpreendimentosAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DevelopmentRow | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "developments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("*, regions(id,name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((d) => d.title?.toLowerCase().includes(q));
  }, [data, search]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("developments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empreendimento excluído");
      queryClient.invalidateQueries({ queryKey: ["admin", "developments"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Empreendimentos</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Gerencie os lançamentos exibidos no site
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Empreendimento
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Imagem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Destaque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum empreendimento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => {
                const thumb = pickCoverImage(d.images)?.url;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={d.title}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-surface" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {d.title}
                      {d.active === false && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          inativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.regions?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} deliveryDate={d.delivery_date} />
                    </TableCell>
                    <TableCell className="text-center">
                      {d.featured ? (
                        <Star className="mx-auto h-4 w-4 fill-primary text-primary" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(d);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(d)}
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

      <DevelopmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empreendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O empreendimento{" "}
              <strong>{deleting?.title}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function StatusBadge({
  status,
  deliveryDate,
}: {
  status: DevelopmentRow["status"];
  deliveryDate: string | null;
}) {
  if (status === "pronta_entrega") {
    return (
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium text-white bg-badge-green")}>
        PRONTA ENTREGA
      </span>
    );
  }
  if (status === "previsao") {
    const label = deliveryDate
      ? new Date(deliveryDate).toLocaleDateString("pt-BR", {
          month: "2-digit",
          year: "numeric",
        })
      : "—";
    return (
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium text-white bg-badge-blue")}>
        PREVISÃO {label}
      </span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}
