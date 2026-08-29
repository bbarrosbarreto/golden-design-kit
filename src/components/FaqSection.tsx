import { useId } from "react";
import { visibleFaqItems, type FaqItem } from "@/lib/faq";

/**
 * Seção pública de perguntas frequentes.
 *
 * Semântica proposital: <section> + <h2> + um <h3> por pergunta com a
 * resposta em <p> logo abaixo, sempre visível no HTML servido (nenhum
 * accordion/details) — o conteúdo precisa ser legível por crawlers de IA
 * sem interação.
 *
 * Itens inválidos (vazios ou com placeholder "[PREENCHER") são descartados
 * por visibleFaqItems, a mesma função usada para montar o JSON-LD FAQPage.
 * Sem itens válidos, renderiza null.
 */
export function FaqSection({
  items,
  title = "Perguntas frequentes",
  bg = "#fff",
}: {
  items: FaqItem[];
  title?: string;
  bg?: string;
}) {
  const headingId = useId();
  const visible = visibleFaqItems(items);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby={headingId} style={{ backgroundColor: bg, padding: "60px 5%" }}>
      <div className="mx-auto max-w-3xl">
        <h2
          id={headingId}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30,
            color: "#1a1a1a",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <div className="mt-8">
          {visible.map((item, i) => (
            <div
              key={i}
              style={
                i > 0
                  ? { borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 24, marginTop: 24 }
                  : undefined
              }
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                {item.q}
              </h3>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 16,
                  color: "#555",
                  lineHeight: 1.8,
                  maxWidth: "65ch",
                  marginTop: 8,
                  marginBottom: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
