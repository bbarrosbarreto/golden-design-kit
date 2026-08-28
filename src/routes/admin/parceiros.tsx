import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/parceiros")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: ParceirosAdminPage,
});

type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
};

function ParceirosAdminPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState<Partner | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Partner[];
    },
  });

  const partners = useMemo(() => data ?? [], [data]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parceiro excluído");
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
      qc.invalidateQueries({ queryKey: ["partners"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Parceiros</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Logos exibidas na seção "Nossos Parceiros" da home. Dimensão recomendada:{" "}
            <strong>320×160px</strong> (PNG com fundo transparente).
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
          Novo Parceiro
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="w-24 text-center">Ordem</TableHead>
              <TableHead className="w-24 text-center">Ativo</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum parceiro cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.logo_url ? (
                      <img
                        src={p.logo_url}
                        alt={p.name}
                        className="h-12 w-24 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-24 rounded-md bg-surface" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.website_url ? (
                      <a
                        href={p.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary"
                      >
                        {p.website_url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {p.display_order}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.active ? (
                      <span className="rounded-full bg-badge-green/10 px-2 py-0.5 text-xs text-badge-green">
                        ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        inativo
                      </span>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PartnerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editing}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin", "partners"] });
          qc.invalidateQueries({ queryKey: ["partners"] });
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir parceiro?</AlertDialogTitle>
            <AlertDialogDescription>
              O parceiro <strong>{deleting?.name}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) del.mutate(deleting.id);
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

function PartnerForm({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialData: Partner | null;
  onSaved: () => void;
}) {
  const isEdit = !!initialData;
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialData?.name ?? "");
  const [website, setWebsite] = useState(initialData?.website_url ?? "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url ?? "");
  const [order, setOrder] = useState(initialData?.display_order ?? 0);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset when opens/changes
  useMemo(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setWebsite(initialData?.website_url ?? "");
      setLogoUrl(initialData?.logo_url ?? "");
      setOrder(initialData?.display_order ?? 0);
      setActive(initialData?.active ?? true);
    }
  }, [open, initialData]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("partners")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (error || !data) throw new Error(error?.message ?? "Falha no upload");
      const { data: pub } = supabase.storage.from("partners").getPublicUrl(data.path);
      setLogoUrl(pub.publicUrl);
      toast.success("Logo enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do parceiro");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        website_url: website.trim() || null,
        logo_url: logoUrl || null,
        display_order: Number(order) || 0,
        active,
      };
      if (isEdit && initialData) {
        const { error } = await supabase
          .from("partners")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partners").insert(payload);
        if (error) throw error;
      }
      toast.success(isEdit ? "Parceiro atualizado" : "Parceiro criado");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar parceiro" : "Novo parceiro"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Site (opcional)</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <div className="flex items-center gap-3">
              <div className="grid h-20 w-40 place-content-center rounded-md border border-border bg-surface">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="max-h-16 max-w-32 object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sem logo</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Enviar logo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recomendado: 320×160px, PNG transparente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ativo</Label>
              <div className="flex h-9 items-center">
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
