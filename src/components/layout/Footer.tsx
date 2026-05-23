import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle } from "lucide-react";

const NAV = [
  { to: "/empreendimentos", label: "Empreendimentos" },
  { to: "/imoveis", label: "Imóveis" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 py-16 text-center">
        <Link to="/" className="font-heading text-4xl text-background">
          BB
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 font-body text-sm">
          {NAV.map((item, i) => (
            <span key={item.to} className="flex items-center gap-2">
              <Link
                to={item.to}
                className="text-background transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
              {i < NAV.length - 1 && <span className="text-background/40">|</span>}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <a
            href="https://instagram.com/brunobarreto.corretor"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-background transition-colors hover:text-primary"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://wa.me/5561999350888"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-background transition-colors hover:text-primary"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        </div>

        <p className="font-body text-sm text-muted-foreground">CRECI-DF 34060</p>

        <p className="font-body text-xs text-background/60">
          © 2025 Bruno Barreto Imóveis. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
