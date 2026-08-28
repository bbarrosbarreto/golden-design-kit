import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { type FaqItem, normalizeFaq } from "@/lib/faq";
import { type DevImage, normalizeImages } from "@/lib/development-images";
import { suggestDevelopmentFaq } from "@/lib/development-faq";

export type DevelopmentRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  region_id: string | null;
  builder: string | null;
  status: "pronta_entrega" | "previsao" | null;
  delivery_date: string | null;
  typology: string[] | null;
  price_from: number | null;
  area_from: number | null;
  area_to: number | null;
  images: DevImage[] | string[] | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  featured: boolean | null;
  featured_order: number | null;
  active: boolean | null;
  faq?: unknown;
};

interface FormValues {
  title: string;
  slug: string;
  description: string;
  region_id: string;
  builder: string;
  status: "pronta_entrega" | "previsao";
  delivery_date: string;
  typology: string[];
  price_from: string;
  area_from: string;
  area_to: string;
  images: DevImage[];
  video_url: string;
  virtual_tour_url: string;
  featured: boolean;
  featured_order: string;
  active: boolean;
  faq: FaqItem[];
}

const empty: FormValues = {
  title: "",
  slug: "",
  description: "",
  region_id: "",
  builder: "",
  status: "pronta_entrega",
  delivery_date: "",
  typology: [],
  price_from: "",
  area_from: "",
  area_to: "",
  images: [],
  video_url: "",
  virtual_tour_url: "",
  featured: false,
  featured_order: "",
  active: true,
};

function toForm(d: DevelopmentRow): FormValues {
  return {
    title: d.title ?? "",
    slug: d.slug ?? "",
    description: d.description ?? "",
    region_id: d.region_id ?? "",
    builder: d.builder ?? "",
    status: (d.status ?? "pronta_entrega") as FormValues["status"],
    delivery_date: d.delivery_date ?? "",
    typology: d.typology ?? [],
    price_from: d.price_from?.toString() ?? "",
    area_from: d.area_from?.toString() ?? "",
    area_to: d.area_to?.toString() ?? "",
    images: normalizeImages(d.images),
    video_url: d.video_url ?? "",
    virtual_tour_url: d.virtual_tour_url ?? "",
    featured: d.featured ?? false,
    featured_order: d.featured_order?.toString() ?? "",
    active: d.active ?? true,
  };
}

function toPayload(v: FormValues) {
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
  return {
    title: v.title.trim(),
    slug: v.slug.trim(),
    description: v.description.trim() || null,
    region_id: v.region_id || null,
    builder: v.builder.trim() || null,
    status: v.status,
    delivery_date: v.status === "previsao" && v.delivery_date ? v.delivery_date : null,
    typology: v.typology,
    price_from: numOrNull(v.price_from),
    area_from: numOrNull(v.area_from),
    area_to: numOrNull(v.area_to),
    images: v.images,
    video_url: v.video_url.trim() || null,
    virtual_tour_url: v.virtual_tour_url.trim() || null,
    featured: v.featured,
    featured_order: v.featured ? numOrNull(v.featured_order) : null,
    active: v.active,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DevelopmentRow | null;
}

export function DevelopmentForm({ open, onOpenChange, initialData }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const { register, handleSubmit, watch, setValue, reset, formState } =
    useForm<FormValues>({ defaultValues: empty });

  const [slugDirty, setSlugDirty] = useState(false);
  const [typologyDraft, setTypologyDraft] = useState("");

  useEffect(() => {
    if (open) {
      reset(initialData ? toForm(initialData) : empty);
      setSlugDirty(!!initialData);
      setTypologyDraft("");
    }
  }, [open, initialData, reset]);

  const title = watch("title");
  const slug = watch("slug");
  const status = watch("status");
  const featured = watch("featured");
  const active = watch("active");
  const images = watch("images");
  const typology = watch("typology");

  useEffect(() => {
    if (!slugDirty) setValue("slug", slugify(title));
  }, [title, slugDirty, setValue]);

  const regionsQuery = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name")
        .eq("active", true)
        .order("display_order");
      if (error) {
        console.error("[DevelopmentForm] regions query failed", error);
        throw error;
      }
      return data as { id: string; name: string }[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = toPayload(values);
      if (!payload.title) throw new Error("Título é obrigatório");
      if (!payload.slug) throw new Error("Slug é obrigatório");
      if (isEdit && initialData) {
        const { error } = await supabase
          .from("developments")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("developments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Empreendimento atualizado" : "Empreendimento criado");
      queryClient.invalidateQueries({ queryKey: ["admin", "developments"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addTypology = () => {
    const t = typologyDraft.trim();
    if (!t) return;
    if (!typology.includes(t)) setValue("typology", [...typology, t]);
    setTypologyDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {isEdit ? "Editar Empreendimento" : "Novo Empreendimento"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-5 font-body"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...register("title", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugDirty(true);
                setValue("slug", e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Região</Label>
              <Select
                value={watch("region_id")}
                onValueChange={(v) => setValue("region_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma região" />
                </SelectTrigger>
                <SelectContent>
                  {regionsQuery.data?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="builder">Construtora</Label>
              <Input id="builder" {...register("builder")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pronta_entrega">Pronta entrega</SelectItem>
                  <SelectItem value="previsao">Previsão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "previsao" && (
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Data de entrega</Label>
                <Input id="delivery_date" type="date" {...register("delivery_date")} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipologia</Label>
            <div className="flex gap-2">
              <Input
                value={typologyDraft}
                onChange={(e) => setTypologyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTypology();
                  } else if (
                    e.key === "Backspace" &&
                    typologyDraft === "" &&
                    typology.length > 0
                  ) {
                    setValue("typology", typology.slice(0, -1));
                  }
                }}
                placeholder="ex: 2 quartos (Enter para adicionar)"
              />
              <Button type="button" variant="outline" onClick={addTypology}>
                Adicionar
              </Button>
            </div>
            {typology.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {typology.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "typology",
                          typology.filter((x) => x !== t),
                        )
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price_from">Preço a partir de</Label>
              <Input id="price_from" type="number" step="0.01" {...register("price_from")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_from">Área mín. (m²)</Label>
              <Input id="area_from" type="number" step="0.01" {...register("area_from")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_to">Área máx. (m²)</Label>
              <Input id="area_to" type="number" step="0.01" {...register("area_to")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagens</Label>
            <ImageUploader value={images} onChange={(urls) => setValue("images", urls)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="video_url">URL do vídeo</Label>
              <Input id="video_url" {...register("video_url")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="virtual_tour_url">URL do tour virtual</Label>
              <Input id="virtual_tour_url" {...register("virtual_tour_url")} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 rounded-md border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={featured}
                onCheckedChange={(v) => setValue("featured", v)}
              />
              <Label className="cursor-pointer">Destaque</Label>
            </div>
            {featured && (
              <div className="flex items-center gap-2">
                <Label htmlFor="featured_order" className="text-sm">
                  Ordem:
                </Label>
                <Input
                  id="featured_order"
                  type="number"
                  className="w-24"
                  {...register("featured_order")}
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch
                checked={active}
                onCheckedChange={(v) => setValue("active", v)}
              />
              <Label className="cursor-pointer">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={mutation.isPending || formState.isSubmitting}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Criar empreendimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
