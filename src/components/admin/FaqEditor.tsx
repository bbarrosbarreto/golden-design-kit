import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { type FaqItem, sameQuestion } from "@/lib/faq";

interface FaqEditorProps {
  value: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  suggestions?: FaqItem[];
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={cn(
        "flex min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
    />
  );
}

function isPending(answer: string): boolean {
  return answer.includes("[PREENCHER");
}

export function FaqEditor({ value, onChange, suggestions = [] }: FaqEditorProps) {
  const [items, setItems] = useState<FaqItem[]>(value);

  useEffect(() => {
    setItems(value);
  }, [value]);

  const updateItem = (index: number, patch: Partial<FaqItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    setItems(next);
    onChange(next);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    onChange(next);
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    onChange(next);
  };

  const addEmpty = () => {
    const next = [...items, { q: "", a: "" }];
    setItems(next);
    onChange(next);
  };

  const addSuggestions = () => {
    const existing = new Set(
      items.map((item) =>
        item.q
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase(),
      ),
    );
    const toAdd = suggestions.filter((s) => {
      const key = sameQuestion(s.q, "");
      return !existing.has(
        s.q
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase(),
      );
    });
    if (toAdd.length === 0) return;
    const next = [...items, ...toAdd.map((s) => ({ q: s.q, a: s.a }))];
    setItems(next);
    onChange(next);
  };

  const pendingCount = items.filter((item) => isPending(item.a)).length;
  const allSuggestionsAdded = suggestions.every((s) =>
    items.some((item) => sameQuestion(item.q, s.q)),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Aparecem no final da página e são o que as IAs mais citam. Responda
            com números e detalhes concretos — evite frases genéricas.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">{items.length} perguntas</div>
      </div>

      {pendingCount > 0 && (
        <Alert className="border-warning bg-warning-muted text-warning">
          <AlertDescription>
            {pendingCount} resposta{pendingCount > 1 ? "s" : ""} ainda contém
            texto de exemplo. Publicar assim prejudica o site — reescreva antes
            de salvar.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {items.map((item, index) => {
          const pending = isPending(item.a);
          return (
            <div
              key={index}
              className={cn(
                "space-y-3 rounded-lg border p-4 transition-colors",
                pending ? "border-warning bg-warning-muted" : "border-border bg-surface",
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Pergunta</Label>
                  {pending && (
                    <span className="text-xs text-warning">Falta preencher</span>
                  )}
                </div>
                <Input
                  value={item.q}
                  onChange={(e) => updateItem(index, { q: e.target.value })}
                  placeholder="Ex.: Quanto custa este imóvel?"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Resposta</Label>
                <AutoTextarea
                  value={item.a}
                  onChange={(v) => updateItem(index, { a: v })}
                  placeholder="Escreva a resposta com dados concretos..."
                  className={cn(pending && "border-warning")}
                />
              </div>

              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Mover para cima"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Mover para baixo"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover pergunta"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={addEmpty}>
          Adicionar pergunta
        </Button>
        {suggestions.length > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={allSuggestionsAdded}
            onClick={addSuggestions}
          >
            Gerar perguntas sugeridas
          </Button>
        )}
      </div>
    </div>
  );
}
