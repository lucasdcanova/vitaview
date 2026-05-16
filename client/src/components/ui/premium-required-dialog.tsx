import { useLocation } from "wouter";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function PremiumRequiredDialog({
  open,
  onOpenChange,
  title = "Recurso Premium",
  description = "Faça upgrade do seu plano para desbloquear essa funcionalidade.",
}: PremiumRequiredDialogProps) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-start space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400/15">
            <Lock className="h-5 w-5 text-yellow-500" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              setLocation("/subscription");
            }}
          >
            Fazer upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
