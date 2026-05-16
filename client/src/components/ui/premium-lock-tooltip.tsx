import * as React from "react";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface PremiumLockTooltipProps {
  children: React.ReactNode;
  /** Disable tooltip when user already has premium. */
  enabled?: boolean;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function PremiumLockTooltip({
  children,
  enabled = true,
  description = "Faça upgrade do seu plano para desbloquear essa funcionalidade.",
  side = "bottom",
  align = "center",
}: PremiumLockTooltipProps) {
  const [, setLocation] = useLocation();

  if (!enabled) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={8}
          className="w-72 border border-white/10 bg-black p-5 text-white shadow-2xl"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Lock className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Recurso Premium</p>
              <p className="text-xs text-white/50">Disponível nos planos Vita</p>
            </div>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-white/70">{description}</p>
          <Button
            size="sm"
            className="w-full bg-white font-semibold text-black hover:bg-white/90"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocation("/subscription");
            }}
          >
            Fazer Upgrade
          </Button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
