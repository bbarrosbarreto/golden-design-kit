import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  type DevImage,
  IMAGE_CATEGORIES,
  normalizeImages,
} from "@/lib/development-images";

interface Props {
  value: DevImage[] | unknown;
  onChange: (images: DevImage[]) => void;
  bucket?: string;
}

export function ImageUploader({ value, onChange, bucket = "developments" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<string>("todas");

  const images = normalizeImages(value);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Sessão expirada, faça login novamente");
      return;
    }

    setUploading(true);
    try {
      const uploaded: DevImage[] = [];
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
        uploaded.push({ url: pub.publicUrl, category: "outros" });
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
    onChange(images.map((img) => (img.url === url ? { ...img, category } : img)));
  };

  const removeImage = (url: string) => {
    onChange(images.filter((img) => img.url !== url));
  };

  const grouped = IMAGE_CATEGORIES.map((cat) => ({
    ...cat,
    items: images.filter((img) => img.category === cat.value),
  })).filter((g) => g.items.length > 0);

  const renderCard = (img: DevImage, i: number) => (
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
      <div className="border-t border-border p-2">
        <Select value={img.category} onValueChange={(v) => updateCategory(img.url, v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

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
