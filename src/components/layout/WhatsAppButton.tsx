import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WhatsAppButton() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href="https://wa.me/5561999350888"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale comigo no WhatsApp"
            style={{ backgroundColor: "#25D366" }}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 animate-in zoom-in items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-110"
          >
            <MessageCircle className="h-7 w-7" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left">Fale comigo no WhatsApp</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
