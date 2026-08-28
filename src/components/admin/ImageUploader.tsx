import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { IMAGE_CATEGORIES } from "@/lib/development-images";
import { findDuplicateOrders, nextOrderFor, type PropImage } from "@/lib/property-images";

type UploaderImage = PropImage;

interface Props {
  value: UploaderImage[] | unknown;
  onChange: (images: UploaderImage[]) => void;
  bucket?: string;
  categories?: { value: string; label: string }[];
  onValidityChange?: (valid: boolean) => void;
}

export function ImageUploader({
  value,
  onChange,
  bucket = "developments",
  categories,
  onValidityChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<string>("todas");

  const cats = categories ?? IMAGE_CATEGORIES;
  const validValues = new Set(cats.map((c) => c.value));

  // Normaliza contra o conjunto de categorias recebido e garante `order`.
  const images: UploaderImage[] = (() => {
    if (!Array.isArray(value)) return [];
    const maxByCat = new Map<string, number>();
    const pending: { img: UploaderImage; hasOrder: boolean }[] = [];
    for (const it of value as unknown[]) {
      let url: string | null = null;
      let rawCat = "";
      let rawOrder: unknown;
      if (typeof it === "string") {
        url = it;
      } else if (it && typeof it === "object" && "url" in it) {
        const u = (it as { url: unknown }).url;
        if (typeof u === "string") url = u;
        const c = (it as { category?: unknown }).category;
        rawCat = typeof c === "string" ? c : "";
        rawOrder = (it as { order?: unknown }).order;
      }
      if (!url) continue;
      const category = validValues.has(rawCat) ? rawCat : "outros";
      const num = Number(rawOrder);
      const hasOrder =
        rawOrder !== undefined &&
        rawOrder !== null &&
        rawOrder !== "" &&
        Number.isFinite(num) &&
        Math.trunc(num) >= 1;
      const order = hasOrder ? Math.trunc(num) : 0;
      if (hasOrder) maxByCat.set(category, Math.max(maxByCat.get(category) ?? 0, order));
      pending.push({ img: { url, category, order }, hasOrder });
    }
    return pending.map(({ img, hasOrder }) => {
      if (hasOrder) return img;
      const next = (maxByCat.get(img.category) ?? 0) + 1;
      maxByCat.set(img.category, next);
      return { ...img, order: next };
    });
  })();

  const duplicates = findDuplicateOrders(images);
  const isDuplicate = (img: UploaderImage) =>
    duplicates.some((d) => d.category === img.category && d.order === img.order);

  const dupKey = duplicates.map((d) => `${d.category}:${d.order}`).sort().join("|");
  useEffect(() => {
    onValidityChange?.(dupKey === "");
  }, [dupKey, onValidityChange]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Sessão expirada, faça login novamente");
      return;
    }

    setUploading(true);
    try {
      const uploaded: UploaderImage[] = [];
      let next = nextOrderFor(images, "outros");
      for (const file of Array.from(files)) {
        const path = `${crypto.randomUUID()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: true });
        if (error || !data) {
          console.error("[ImageUploader] upload failed", error);
          toast.error(`Falha ao enviar ${file.name}: ${error?.message ?? "erro desconhecido"}`);
          continue;
        }
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
        uploaded.push({ url: pub.publicUrl, category: "outros", order: next });
        next += 1;
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded]);
        toast.success(`${uploaded.length} imagem(ns) enviada(s)`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const updateCategory = (url: string, category: string) => {
    const order = nextOrderFor(
      images.filter((i) => i.url !== url),
      category,
    );
    onChange(images.map((img) => (img.url === url ? { ...img, category, order } : img)));
  };

  const updateOrder = (url: string, raw: string) => {
    const n = Math.trunc(Number(raw));
    const order = Number.isFinite(n) && n >= 1 ? n : 1;
    onChange(images.map((img) => (img.url === url ? { ...img, order } : img)));
  };

  const removeImage = (url: string) => {
    onChange(images.filter((img) => img.url !== url));
  };

  const grouped = cats
    .map((cat) => ({
      ...cat,
      items: images
        .filter((img) => img.category === cat.value)
        .sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.items.length > 0);

  const renderCard = (img: UploaderImage, i: number) => {
    const dup = isDuplicate(img);
    return (
      <div
        key={`${img.url}-${i}`}
        className="group relative overflow-hidden rounded-md border border-border bg-surface"
      >
        <div className="aspect-square">
          <img src={img.url} alt="" className="h-full w-full object-cover" />
        </div>
        <button
          type="button"
          onClick={() => removeImage(img.url)}
          className="absolute right-1 top-1 grid h-6 w-6 place-content-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Remover imagem"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="space-y-1 border-t border-border p-2">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Select value={img.category} onValueChange={(v) => updateCategory(img.url, v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-14 shrink-0">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                Ordem
              </label>
              <Input
                type="number"
                min={1}
                value={img.order}
                onChange={(e) => updateOrder(img.url, e.target.value)}
                className={`h-8 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${dup ? "border-destructive" : ""}`}
              />
            </div>
          </div>
          {dup && (
            <p className="w-full text-xs leading-tight text-destructive">
              Número repetido nesta categoria
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Adicionar imagens
      </Button>

      {images.length > 0 && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="todas">Todas ({images.length})</TabsTrigger>
            {grouped.map((g) => (
              <TabsTrigger key={g.value} value={g.value}>
                {g.label} ({g.items.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="todas" className="mt-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, i) => renderCard(img, i))}
            </div>
          </TabsContent>

          {grouped.map((g) => (
            <TabsContent key={g.value} value={g.value} className="mt-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {g.items.map((img, i) => renderCard(img, i))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
