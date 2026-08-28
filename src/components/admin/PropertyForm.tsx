import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { type FaqItem, normalizeFaq } from "@/lib/faq";
import {
  type PropImage,
  type PropertyType,
  categoriesFor,
  categoryLabel,
  normalizePropImages,
  resolveCategoryOrder,
} from "@/lib/property-images";
import { suggestPropertyFaq } from "@/lib/property-faq";

export type PropertyRow = {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  purpose: "venda" | "aluguel" | null;
  status: "disponivel" | "reservado" | "vendido" | null;
  active: boolean | null;
  featured: boolean | null;
  region_id: string | null;
  development_id: string | null;
  address: string | null;
  price: number | null;
  description: string | null;
  area: number | null;
  useful_area: number | null;
  built_area: number | null;
  green_area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  images: PropImage[] | string[] | null;
  image_category_order?: string[] | null;
};

interface FormValues {
  title: string;
  slug: string;
  type: PropertyType;
  purpose: "venda" | "aluguel";
  status: "disponivel" | "reservado" | "vendido";
  active: boolean;
  featured: boolean;
  region_id: string;
  development_id: string;
  address: string;
  price: string;
  description: string;
  area: string;
  useful_area: string;
  built_area: string;
  green_area: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  parking_spots: string;
  video_url: string;
  virtual_tour_url: string;
  images: PropImage[];
  image_category_order: string[];
}

const empty: FormValues = {
  title: "",
  slug: "",
  type: "apartamento",
  purpose: "venda",
  status: "disponivel",
  active: true,
  featured: false,
  region_id: "",
  development_id: "",
  address: "",
  price: "",
  description: "",
  area: "",
  useful_area: "",
  built_area: "",
  green_area: "",
  bedrooms: "",
  suites: "",
  bathrooms: "",
  parking_spots: "",
  video_url: "",
  virtual_tour_url: "",
  images: [],
  image_category_order: [],
};

function toForm(p: PropertyRow): FormValues {
  return {
    title: p.title ?? "",
    slug: p.slug ?? "",
    type: (p.type ?? "apartamento") as PropertyType,
    purpose: (p.purpose ?? "venda") as FormValues["purpose"],
    status: (p.status ?? "disponivel") as FormValues["status"],
    active: p.active ?? true,
    featured: p.featured ?? false,
    region_id: p.region_id ?? "",
    development_id: p.development_id ?? "",
    address: p.address ?? "",
    price: p.price?.toString() ?? "",
    description: p.description ?? "",
    area: p.area?.toString() ?? "",
    useful_area: p.useful_area?.toString() ?? "",
    built_area: p.built_area?.toString() ?? "",
    green_area: p.green_area?.toString() ?? "",
    bedrooms: p.bedrooms?.toString() ?? "",
    suites: p.suites?.toString() ?? "",
    bathrooms: p.bathrooms?.toString() ?? "",
    parking_spots: p.parking_spots?.toString() ?? "",
    video_url: p.video_url ?? "",
    virtual_tour_url: p.virtual_tour_url ?? "",
    images: normalizePropImages(p.images, p.type),
    image_category_order: Array.isArray(p.image_category_order)
      ? p.image_category_order.filter((c): c is string => typeof c === "string")
      : [],
  };
}

function toPayload(v: FormValues) {
  const numOrNull = (s: string | number | undefined | null): number | null => {
    if (s === undefined || s === null) return null;
    const str = typeof s === "string" ? s.trim() : String(s);
    if (str === "") return null;
    const n = Number(str);
    return Number.isNaN(n) ? null : n;
  };
  const intOrNull = (s: string | number | undefined | null): number | null => {
    const n = numOrNull(s);
    return n === null ? null : Math.trunc(n);
  };
  const uuidOrNull = (s: string | undefined | null): string | null => {
    if (!s) return null;
    const t = s.trim();
    if (t === "" || t === "none") return null;
    return t;
  };
  const isTerreno = v.type === "terreno";
  const isApto = v.type === "apartamento";
  const isCasa = v.type === "casa";
  return {
    title: v.title.trim(),
    slug: v.slug.trim() || slugify(v.title),
    type: v.type,
    purpose: v.purpose,
    status: v.status,
    active: v.active,
    featured: v.featured,
    region_id: uuidOrNull(v.region_id),
    development_id: uuidOrNull(v.development_id),
    address: v.address.trim() || null,
    price: numOrNull(v.price),
    description: v.description.trim() || null,
    // Apto: só useful_area. Casa: area+built+useful+green. Terreno: area+useful+green.
    area: isApto ? null : numOrNull(v.area),
    useful_area: numOrNull(v.useful_area),
    built_area: isCasa ? numOrNull(v.built_area) : null,
    green_area: isApto ? null : numOrNull(v.green_area),
    bedrooms: isTerreno ? null : intOrNull(v.bedrooms),
    suites: isTerreno ? null : intOrNull(v.suites),
    bathrooms: isTerreno ? null : intOrNull(v.bathrooms),
    parking_spots: isTerreno ? null : intOrNull(v.parking_spots),
    video_url: v.video_url.trim() || null,
    virtual_tour_url: v.virtual_tour_url.trim() || null,
    images: v.images,
    image_category_order: v.image_category_order,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PropertyRow | null;
}

export function PropertyForm({ open, onOpenChange, initialData }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const { register, handleSubmit, watch, setValue, reset, formState } =
    useForm<FormValues>({ defaultValues: empty });

  const [slugDirty, setSlugDirty] = useState(false);
  const [imagesValid, setImagesValid] = useState(true);

  useEffect(() => {
    if (open) {
      reset(initialData ? toForm(initialData) : empty);
      setSlugDirty(!!initialData);
      setImagesValid(true);
    }
  }, [open, initialData, reset]);

  const title = watch("title");
  const slug = watch("slug");
  const type = watch("type");
  const purpose = watch("purpose");
  const status = watch("status");
  const active = watch("active");
  const featured = watch("featured");
  const images = watch("images");
  const categoryOrder = watch("image_category_order");
  const isTerreno = type === "terreno";

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
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const developmentsQuery = useQuery({
    queryKey: ["admin", "developments-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data as { id: string; title: string }[];
    },
  });

  const formatSupabaseError = (error: {
    message?: string;
    details?: string | null;
    hint?: string | null;
    code?: string | null;
  }) => {
    const parts = [
      error.message,
      error.details,
      error.hint,
      error.code ? `(${error.code})` : null,
    ].filter(Boolean);
    return parts.join(" — ") || "Erro desconhecido do banco";
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = toPayload(values);
      if (!payload.title) throw new Error("Título é obrigatório");
      if (!payload.slug) throw new Error("Slug é obrigatório");
      if (isEdit && initialData) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", initialData.id);
        if (error) {
          console.error("[PropertyForm] update error:", error);
          throw new Error(formatSupabaseError(error));
        }
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) {
          console.error("[PropertyForm] insert error:", error);
          throw new Error(formatSupabaseError(error));
        }
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Imóvel atualizado" : "Imóvel criado");
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      console.error("[PropertyForm] save error:", e);
      toast.error(e.message || "Erro ao salvar imóvel");
    },
  });

  const onInvalid = (errors: unknown) => {
    console.warn("[PropertyForm] validation errors:", errors);
    toast.error("Verifique os campos obrigatórios");
  };

  const sectionOrder = resolveCategoryOrder(type, categoryOrder).filter((cat) =>
    images.some((i) => i.category === cat),
  );

  const moveSection = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    // Preserva as categorias sem fotos no fim, mantendo a ordem resolvida.
    const rest = resolveCategoryOrder(type, categoryOrder).filter((c) => !next.includes(c));
    setValue("image_category_order", [...next, ...rest]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {isEdit ? "Editar Imóvel" : "Novo Imóvel"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v), onInvalid)}
          className="space-y-5 font-body"
        >
          {!imagesValid && (
            <Alert variant="destructive">
              <AlertDescription>
                Corrija os números de ordem repetidos antes de salvar.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...register("title", { required: "Título é obrigatório" })} />
            {formState.errors.title?.message && (
              <p className="text-sm text-destructive">{formState.errors.title.message}</p>
            )}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setValue("type", v as PropertyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Finalidade</Label>
              <Select value={purpose} onValueChange={(v) => setValue("purpose", v as FormValues["purpose"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Região</Label>
              <Select value={watch("region_id")} onValueChange={(v) => setValue("region_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione uma região" /></SelectTrigger>
                <SelectContent>
                  {regionsQuery.data?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Empreendimento (opcional)</Label>
              <Select
                value={watch("development_id") || "none"}
                onValueChange={(v) => setValue("development_id", v === "none" ? "" : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum —</SelectItem>
                  {developmentsQuery.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço</Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {type === "apartamento" && (
              <div className="space-y-2">
                <Label htmlFor="useful_area">Área (m²)</Label>
                <Input id="useful_area" type="number" step="0.01" {...register("useful_area")} />
              </div>
            )}

            {type === "casa" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="area">Área Total do Terreno (m²)</Label>
                  <Input id="area" type="number" step="0.01" {...register("area")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="built_area">Área Construída (m²)</Label>
                  <Input id="built_area" type="number" step="0.01" {...register("built_area")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="useful_area">Área Útil (m²)</Label>
                  <Input id="useful_area" type="number" step="0.01" {...register("useful_area")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="green_area">Área Verde (m²)</Label>
                  <Input id="green_area" type="number" step="0.01" {...register("green_area")} />
                </div>
              </>
            )}

            {type === "terreno" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="area">Área Total (m²)</Label>
                  <Input id="area" type="number" step="0.01" {...register("area")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="useful_area">Área Útil/Construível (m²)</Label>
                  <Input id="useful_area" type="number" step="0.01" {...register("useful_area")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="green_area">Área Verde (m²)</Label>
                  <Input id="green_area" type="number" step="0.01" {...register("green_area")} />
                </div>
              </>
            )}
          </div>

          {!isTerreno && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Quartos</Label>
                <Input id="bedrooms" type="number" {...register("bedrooms")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suites">Suítes</Label>
                <Input id="suites" type="number" {...register("suites")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Banheiros</Label>
                <Input id="bathrooms" type="number" {...register("bathrooms")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking_spots">Vagas</Label>
                <Input id="parking_spots" type="number" {...register("parking_spots")} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Imagens</Label>
            <ImageUploader
              value={images}
              onChange={(urls) => setValue("images", urls)}
              bucket="properties"
              categories={categoriesFor(type)}
              onValidityChange={setImagesValid}
            />
          </div>

          {sectionOrder.length > 0 && (
            <div className="space-y-2 rounded-md border border-border bg-surface p-4">
              <Label>Ordem das seções na página</Label>
              <p className="text-xs text-muted-foreground">
                Define a ordem em que os blocos de fotos aparecem na página do imóvel.
              </p>
              <ul className="space-y-1">
                {sectionOrder.map((cat, idx) => (
                  <li
                    key={cat}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                  >
                    <span className="text-sm">
                      {categoryLabel(cat, type)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({images.filter((i) => i.category === cat).length} foto
                        {images.filter((i) => i.category === cat).length === 1 ? "" : "s"})
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Mover para cima"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Mover para baixo"
                        disabled={idx === sectionOrder.length - 1}
                        onClick={() => moveSection(idx, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => setValue("image_category_order", [])}
              >
                Restaurar ordem padrão
              </Button>
            </div>
          )}

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
              <Switch checked={featured} onCheckedChange={(v) => setValue("featured", v)} />
              <Label className="cursor-pointer">Destaque</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={(v) => setValue("active", v)} />
              <Label className="cursor-pointer">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={mutation.isPending || formState.isSubmitting || !imagesValid}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar imóvel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
