import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
}

export function ImageUploader({ value, onChange, bucket = "developments" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Sessão expirada, faça login novamente");
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
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
        uploaded.push(pub.publicUrl);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} imagem(ns) enviada(s)`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-surface"
            >
              <img src={url} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((u) => u !== url))}
                className="absolute right-1 top-1 grid h-6 w-6 place-content-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remover imagem"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
