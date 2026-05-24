import { Check } from "lucide-react";

const GOLD = "#C9A84C";

export function SubmittedState({
  onReset,
  variant = "dark",
}: {
  onReset: () => void;
  variant?: "dark" | "light";
}) {
  const isDark = variant === "dark";
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 text-center"
      style={{
        border: isDark
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid rgba(0,0,0,0.08)",
        borderRadius: 4,
        padding: "40px 24px",
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: `2px solid ${GOLD}`,
        }}
      >
        <Check style={{ color: GOLD, width: 32, height: 32 }} strokeWidth={2.5} />
      </div>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26,
          color: isDark ? "#fff" : "#1a1a1a",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Mensagem enviada!
      </h3>
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
          lineHeight: 1.6,
          maxWidth: 420,
          margin: 0,
        }}
      >
        Parabéns, você está a um passo de adquirir seu novo imóvel. Em breve nossa
        equipe entrará em contato para te atender.
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          marginTop: 8,
          backgroundColor: "transparent",
          color: GOLD,
          border: `1px solid ${GOLD}`,
          padding: "12px 24px",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: 0.5,
          borderRadius: 2,
          cursor: "pointer",
        }}
      >
        Enviar outra mensagem
      </button>
    </div>
  );
}
