import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { DESTAQUE_LIMITS, HIGHLIGHT_SUPPORTED } from "@/lib/property-export";

/**
 * Configurações específicas de um portal na seção Exportação.
 * Novos campos por portal entram em PORTAL_OPTIONS + neste componente.
 */
const PORTAL_OPTIONS: Record<string, { highlight: boolean; note?: string }> = {
  dfimoveis: { highlight: true },
  wimoveis: { highlight: true, note: "Aguardando o portal confirmar os valores aceitos" },
  grupozap: { highlight: false, note: "Sem configurações específicas por enquanto" },
};

interface Props {
  portal: string;
  label: string;
  propertyId: string | null;
  highlighted: boolean;
  onHighlightChange: (value: boolean) => void;
}

export function PortalExportBlock({ portal, label, propertyId, highlighted, onHighlightChange }: Props) {
  const opts = PORTAL_OPTIONS[portal] ?? { highlight: false };
  const supported = HIGHLIGHT_SUPPORTED[portal] === true;
  const limit = DESTAQUE_LIMITS[portal] ?? null;
  const counting = opts.highlight && supported && limit !== null;

  // Espelha a elegibilidade do feed: só conta destaque de imóvel que o portal recebe.
  const othersQuery = useQuery({
    queryKey: ["highlight-count", portal, propertyId],
    enabled: counting,
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("active", true)
        .eq("status", "disponivel")
        .eq("export_enabled", true)
        .contains("export_portals", [portal])
        .contains("export_highlight_portals" as never, [portal] as never);
      if (propertyId) q = q.neq("id", propertyId);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });

  const used = (othersQuery.data ?? 0) + (highlighted ? 1 : 0);
  const over = limit !== null && used > limit;

  return (
    <div className="space-y-2 rounded-md border border-border bg-background p-3">
      <p className="text-sm font-medium">{label}</p>
      {opts.highlight && (
        <div className="flex items-center gap-3">
          <Checkbox
            id={`highlight-${portal}`}
            checked={supported && highlighted}
            disabled={!supported}
            onCheckedChange={(v) => onHighlightChange(v === true)}
          />
          <Label
            htmlFor={`highlight-${portal}`}
            className={supported ? "cursor-pointer" : "text-muted-foreground"}
          >
            Destaque no portal
          </Label>
        </div>
      )}
      {opts.note ? (
        <p className="text-sm text-muted-foreground">{opts.note}</p>
      ) : opts.highlight && supported ? (
        limit === null ? (
          <p className="text-sm text-muted-foreground">Limite não confirmado com o portal</p>
        ) : (
          <p className={over ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {othersQuery.isLoading ? "Contando destaques…" : `${used} de ${limit} destaques usados`}
          </p>
        )
      ) : null}
    </div>
  );
}
