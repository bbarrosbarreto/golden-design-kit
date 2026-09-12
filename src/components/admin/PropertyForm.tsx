import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  isApartmentType,
  isHouseType,
  normalizePropImages,
  PROPERTY_TYPES,
  resolveCategoryOrder,
} from "@/lib/property-images";
import { suggestPropertyFaq } from "@/lib/property-faq";
import {
  EXPORT_PORTALS,
  categoriesForType,
  digitsOnly,
  evaluateReadiness,
  firstCategoryFor,
  formatPostalCode,
  isCategoryValidFor,
  isReady,
} from "@/lib/property-export";

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
  faq?: unknown;
  // Endereço estruturado (exportação para portais)
  street?: string | null;
  street_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Valores lidos separadamente pelos portais
  rent_price?: number | null;
  condo_fee?: number | null;
  iptu?: number | null;
  year_built?: number | null;
  living_rooms?: number | null;
  // Controle de exportação
  category?: string | null;
  export_enabled?: boolean | null;
  export_portals?: string[] | null;
  listing_code?: string | null;
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
  faq: FaqItem[];
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  rent_price: string;
  condo_fee: string;
  iptu: string;
  year_built: string;
  living_rooms: string;
  category: string;
  export_enabled: boolean;
  export_portals: string[];
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
  faq: [],
  street: "",
  street_number: "",
  complement: "",
  neighborhood: "",
  city: "Brasília",
  state: "DF",
  postal_code: "",
  latitude: "",
  longitude: "",
  rent_price: "",
  condo_fee: "",
  iptu: "",
  year_built: "",
  living_rooms: "",
  category: "padrao",
  export_enabled: false,
  export_portals: [],
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
    faq: normalizeFaq(p.faq),
    street: p.street ?? "",
    street_number: p.street_number ?? "",
    complement: p.complement ?? "",
    neighborhood: p.neighborhood ?? "",
    city: p.city ?? "Brasília",
    state: p.state ?? "DF",
    postal_code: digitsOnly(p.postal_code),
    latitude: p.latitude?.toString() ?? "",
    longitude: p.longitude?.toString() ?? "",
    rent_price: p.rent_price?.toString() ?? "",
    condo_fee: p.condo_fee?.toString() ?? "",
    iptu: p.iptu?.toString() ?? "",
    year_built: p.year_built?.toString() ?? "",
    living_rooms: p.living_rooms?.toString() ?? "",
    category: p.category ?? "padrao",
    export_enabled: p.export_enabled ?? false,
    export_portals: Array.isArray(p.export_portals)
      ? p.export_portals.filter((c): c is string => typeof c === "string")
      : [],
  };
}

function numOrNull(s: string | number | undefined | null): number | null {
  if (s === undefined || s === null) return null;
  const str = typeof s === "string" ? s.trim() : String(s);
  if (str === "") return null;
  const n = Number(str);
  return Number.isNaN(n) ? null : n;
}

function intOrNull(s: string | number | undefined | null): number | null {
  const n = numOrNull(s);
  return n === null ? null : Math.trunc(n);
}

function uuidOrNull(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.trim();
  if (t === "" || t === "none") return null;
  return t;
}

/**
 * REGRA DE PREÇO (usada pelo gerador de XML na Etapa 2):
 * - purpose = 'venda'   → `price` é o valor de VENDA.
 * - purpose = 'aluguel' → `price` é o valor do ALUGUEL MENSAL.
 * - `rent_price` só é preenchido quando o imóvel é de venda e também aceita
 *   locação; com purpose = 'aluguel' ele é sempre gravado como null.
 *
 * `listing_code` NUNCA entra no payload — quem gera é o default da sequência
 * `listing_code_seq` no banco.
 */
function toPayload(v: FormValues, ready: boolean) {
  const isTerreno = v.type === "terreno";
  const isApto = isApartmentType(v.type);
  const isCasa = isHouseType(v.type);
  const isVenda = v.purpose === "venda";
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
    faq: v.faq,
    // Endereço estruturado
    street: v.street.trim() || null,
    street_number: v.street_number.trim() || null,
    complement: v.complement.trim() || null,
    neighborhood: v.neighborhood.trim() || null,
    // city e state são NOT NULL no banco — nunca gravar em branco.
    city: v.city.trim() || "Brasília",
    state: v.state.trim() || "DF",
    postal_code: digitsOnly(v.postal_code) || null,
    latitude: numOrNull(v.latitude),
    longitude: numOrNull(v.longitude),
    // Valores separados
    rent_price: isVenda ? numOrNull(v.rent_price) : null,
    condo_fee: numOrNull(v.condo_fee),
    iptu: numOrNull(v.iptu),
    year_built: intOrNull(v.year_built),
    living_rooms: intOrNull(v.living_rooms),
    // Nunca gravar categoria incompatível com o tipo.
    category: isCategoryValidFor(v.type, v.category)
      ? v.category
      : firstCategoryFor(v.type),
    // Anúncio incompleto nunca é exportado, independentemente da tela.
    export_enabled: ready ? v.export_enabled : false,
    export_portals: ready && v.export_enabled ? v.export_portals : [],
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

  const { register, handleSubmit, watch, setValue, reset, formState, setError, clearErrors } =
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
  const faq = watch("faq");
  const region_id = watch("region_id");
  const price = watch("price");
  const address = watch("address");
  const isTerreno = type === "terreno";
  const isVenda = purpose === "venda";

  const description = watch("description");
  const postalCode = watch("postal_code");
  const neighborhood = watch("neighborhood");
  const street = watch("street");
  const city = watch("city");
  const state = watch("state");
  const rentPrice = watch("rent_price");
  const category = watch("category");
  const exportEnabled = watch("export_enabled");
  const exportPortals = watch("export_portals");
  const usefulArea = watch("useful_area");
  const builtArea = watch("built_area");
  const greenArea = watch("green_area");
  const area = watch("area");
  const bedrooms = watch("bedrooms");
  const bathrooms = watch("bathrooms");

  const readinessChecks = evaluateReadiness({
    postal_code: postalCode,
    neighborhood,
    street,
    description,
    imageCount: images.length,
    title,
    price,
    rent_price: isVenda ? rentPrice : "",
    export_portals: exportPortals,
  });
  const ready = isReady(readinessChecks);

  // Anúncio que deixa de ser válido não pode continuar marcado para exportar.
  useEffect(() => {
    if (!ready && exportEnabled) setValue("export_enabled", false);
  }, [ready, exportEnabled, setValue]);

  // Categoria precisa ser válida para o tipo — os portais recusam combinações
  // como apartamento + Sobrado/Duplex.
  const typeCategories = categoriesForType(type);
  useEffect(() => {
    if (!isCategoryValidFor(type, category)) {
      setValue("category", firstCategoryFor(type));
    }
  }, [type, category, setValue]);

  const togglePortal = (value: string, checked: boolean) => {
    const next = checked
      ? [...exportPortals.filter((p) => p !== value), value]
      : exportPortals.filter((p) => p !== value);
    setValue("export_portals", next);
  };

  // Quando a exportação é desligada, limpa os erros de campos obrigatórios dela.
  useEffect(() => {
    if (!exportEnabled) {
      clearErrors([
        "title",
        "description",
        "neighborhood",
        "postal_code",
        "street",
        "city",
        "state",
        "area",
        "price",
        "images",
        "bedrooms",
        "bathrooms",
      ]);
    }
  }, [exportEnabled, clearErrors]);

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

  const regionName = regionsQuery.data?.find((r) => r.id === region_id)?.name ?? null;

  const propertyFaqSuggestions = suggestPropertyFaq({
    title,
    type,
    purpose,
    price: numOrNull(price),
    address,
    bedrooms: intOrNull(watch("bedrooms")),
    suites: intOrNull(watch("suites")),
    bathrooms: intOrNull(watch("bathrooms")),
    parking_spots: intOrNull(watch("parking_spots")),
    area: numOrNull(watch("area")),
    built_area: numOrNull(watch("built_area")),
    useful_area: numOrNull(watch("useful_area")),
    green_area: numOrNull(watch("green_area")),
    region_name: regionName,
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

  function validateForExport(values: FormValues): Record<string, string> {
    const errors: Record<string, string> = {};
    const titleLen = values.title.trim().length;
    if (titleLen < 10 || titleLen > 100) {
      errors.title = "Título precisa ter entre 10 e 100 caracteres";
    }
    const descLen = values.description.trim().length;
    if (descLen < 50 || descLen > 3000) {
      errors.description = "Descrição precisa ter entre 50 e 3000 caracteres";
    }
    if (values.neighborhood.trim() === "") {
      errors.neighborhood = "Informe o bairro";
    }
    if (digitsOnly(values.postal_code).length !== 8) {
      errors.postal_code = "CEP precisa ter 8 dígitos";
    }
    if (values.street.trim() === "") {
      errors.street = "Informe o logradouro";
    }
    if (values.city.trim() === "") {
      errors.city = "Informe a cidade";
    }
    if (values.state.trim() === "") {
      errors.state = "Informe o estado";
    }
    const hasArea =
      numOrNull(values.area) != null ||
      numOrNull(values.useful_area) != null ||
      numOrNull(values.built_area) != null ||
      numOrNull(values.green_area) != null;
    if (!hasArea) {
      errors.area = "Informe ao menos uma área";
    }
    if (numOrNull(values.price) == null) {
      errors.price = "Informe um valor maior que zero";
    }
    if (values.images.length < 5) {
      errors.images = "Adicione pelo menos 5 imagens";
    }
    const isResidential =
      values.type === "apartamento" ||
      values.type === "cobertura" ||
      values.type === "casa" ||
      values.type === "casa_condominio";
    if (isResidential) {
      if (numOrNull(values.bedrooms) == null) {
        errors.bedrooms = "Informe a quantidade de quartos";
      }
      if (numOrNull(values.bathrooms) == null) {
        errors.bathrooms = "Informe a quantidade de banheiros";
      }
    }
    return errors;
  }

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (values.export_enabled && values.export_portals.length === 0) {
        throw new Error(
          "Selecione ao menos um portal para exportar, ou desligue a exportação.",
        );
      }
      if (!isCategoryValidFor(values.type, values.category)) {
        throw new Error(
          "A categoria selecionada não é válida para este tipo de imóvel.",
        );
      }
      if (values.export_enabled) {
        const exportErrors = validateForExport(values);
        if (Object.keys(exportErrors).length > 0) {
          for (const [key, message] of Object.entries(exportErrors)) {
            setError(key as keyof FormValues, { type: "manual", message });
          }
          throw new Error("Preencha os campos obrigatórios para exportação");
        }
      }
      const payload = toPayload(values, ready);
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
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
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

          <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
            <div className="space-y-1">
              <h3 className="font-heading text-lg">Endereço</h3>
              <p className="text-sm text-muted-foreground">
                Bairro e CEP são obrigatórios para exportar o anúncio aos portais.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input id="street" {...register("street")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street_number">Número</Label>
                  <Input id="street_number" {...register("street_number")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input id="complement" {...register("complement")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input id="neighborhood" {...register("neighborhood")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP *</Label>
                <Input
                  id="postal_code"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={formatPostalCode(postalCode)}
                  onChange={(e) => setValue("postal_code", digitsOnly(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" {...register("state")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (opcional)</Label>
                <Input id="latitude" type="number" step="any" {...register("latitude")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (opcional)</Label>
                <Input id="longitude" type="number" step="any" {...register("longitude")} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição{exportEnabled && " *"}
            </Label>
            <Textarea id="description" rows={4} {...register("description")} />
            {formState.errors.description?.message && (
              <p className="text-sm text-destructive">{formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              {isVenda ? "Valor de venda" : "Valor do aluguel (mensal)"}
            </Label>
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

          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <div className="space-y-1">
              <h3 className="font-heading text-lg">Perguntas frequentes</h3>
              <p className="text-sm text-muted-foreground">
                Responda com dados reais — evite respostas genéricas. Perguntas
                em branco ou com [PREENCHER] não serão publicadas.
              </p>
            </div>
            <FaqEditor
              value={faq}
              onChange={(items) => setValue("faq", items)}
              suggestions={propertyFaqSuggestions}
            />
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

          <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
            <div className="space-y-1">
              <h3 className="font-heading text-lg">Exportação para portais</h3>
              <p className="text-sm text-muted-foreground">
                Código do anúncio nos portais:{" "}
                <span className="font-medium text-foreground">
                  {initialData?.listing_code ?? "gerado ao salvar"}
                </span>
              </p>
            </div>

            <div className="space-y-2 rounded-md border border-border bg-background p-3">
              <p className="text-sm font-medium">Prontidão para exportação</p>
              <ul className="space-y-1">
                {readinessChecks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-sm">
                    {c.ok ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    )}
                    <span className={c.ok ? "" : "text-muted-foreground"}>
                      {c.label}{" "}
                      <span className="text-xs text-muted-foreground">— {c.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Portais</p>
              {EXPORT_PORTALS.map((p) => (
                <div key={p.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`portal-${p.value}`}
                    checked={exportPortals.includes(p.value)}
                    onCheckedChange={(v) => togglePortal(p.value, v === true)}
                  />
                  <Label htmlFor={`portal-${p.value}`} className="cursor-pointer">
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={exportEnabled}
                disabled={!ready}
                onCheckedChange={(v) => setValue("export_enabled", v)}
              />
              <Label className="cursor-pointer">Exportar para portais</Label>
            </div>
            {!ready && (
              <p className="text-sm text-muted-foreground">
                Complete os itens acima para exportar
              </p>
            )}

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isVenda && (
                <div className="space-y-2">
                  <Label htmlFor="rent_price">
                    Também aceita aluguel? Valor mensal (opcional)
                  </Label>
                  <Input id="rent_price" type="number" step="0.01" {...register("rent_price")} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="condo_fee">Condomínio</Label>
                <Input id="condo_fee" type="number" step="0.01" {...register("condo_fee")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iptu">IPTU</Label>
                <Input id="iptu" type="number" step="0.01" {...register("iptu")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_built">Ano de construção</Label>
                <Input id="year_built" type="number" {...register("year_built")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="living_rooms">Salas</Label>
                <Input id="living_rooms" type="number" {...register("living_rooms")} />
              </div>
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
