import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
};

export function Partners() {
  const { data, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id,name,logo_url,website_url")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Partner[];
    },
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="bg-surface py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-xl text-foreground">Nossos Parceiros</h2>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Construtoras e parceiros selecionados
          </p>
        </div>

        <div className="mt-6 flex gap-6 overflow-x-auto pb-2 md:justify-center md:overflow-visible">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-40 shrink-0 animate-pulse rounded-lg bg-muted/40"
                />
              ))
            : data!.map((p) => {
                const inner = p.logo_url ? (
                  <img
                    src={p.logo_url}
                    alt={p.name}
                    loading="lazy"
                    className="max-h-12 max-w-32 object-contain"
                  />
                ) : (
                  <span className="font-body text-sm text-muted-foreground">
                    {p.name}
                  </span>
                );
                const cls =
                  "flex h-20 w-40 shrink-0 items-center justify-center rounded-lg bg-background grayscale transition-all duration-300 hover:grayscale-0";
                return p.website_url ? (
                  <a
                    key={p.id}
                    href={p.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cls}
                    title={p.name}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={p.id} className={cls} title={p.name}>
                    {inner}
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
