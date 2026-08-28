import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PropertyForm, type PropertyRow } from "@/components/admin/PropertyForm";
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
import { pickPropCover } from "@/lib/property-images";

export const Route = createFileRoute("/admin/imoveis")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: ImoveisAdminPage,
});

type Row = PropertyRow & {
  regions: { id: string; name: string } | null;
  developments: { id: string; title: string } | null;
};

const TYPE_LABEL: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
};

const STATUS_STYLE: Record<string, string> = {
  disponivel: "bg-badge-green text-white",
  reservado: "bg-primary text-white",
  vendido: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  disponivel: "DISPONÍVEL",
  reservado: "RESERVADO",
  vendido: "VENDIDO",
};

function formatPrice(v: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function ImoveisAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRow | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, regions(id,name), developments(id,title)")
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
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Imóvel excluído");
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Imóveis</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Gerencie os anúncios prontos exibidos no site
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
          Novo Imóvel
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
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhum imóvel encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const thumb = pickPropCover(p.images, p.type)?.url;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {thumb ? (
                        <img src={thumb} alt={p.title} className="h-14 w-14 rounded-md object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-surface" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {p.title}
                      {p.featured && (
                        <Star className="ml-2 inline h-3.5 w-3.5 fill-primary text-primary" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TYPE_LABEL[p.type] ?? p.type}
                    </TableCell>
                    <TableCell>
                      {p.status ? (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            STATUS_STYLE[p.status],
                          )}
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.regions?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-foreground">{formatPrice(p.price)}</TableCell>
                    <TableCell className="text-center">
                      {p.active ? (
                        <span className="text-foreground">Sim</span>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(p)}
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

      <PropertyForm open={formOpen} onOpenChange={setFormOpen} initialData={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O imóvel{" "}
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
