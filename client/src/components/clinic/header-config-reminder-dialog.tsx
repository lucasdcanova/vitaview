import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, Sparkles } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDismissForever: () => void;
}

export function HeaderConfigReminderDialog({ open, onOpenChange, onDismissForever }: Props) {
    const [, navigate] = useLocation();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = () => {
        if (dontShowAgain) onDismissForever();
        onOpenChange(false);
    };

    const handleNavigate = () => {
        if (dontShowAgain) onDismissForever();
        onOpenChange(false);
        navigate("/minha-clinica");
    };

    return (
        <Dialog open={open} onOpenChange={(o) => {
            if (!o && dontShowAgain) onDismissForever();
            onOpenChange(o);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Personalize seu cabeçalho
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-sm leading-relaxed">
                        Seu documento foi gerado com o cabeçalho padrão do VitaView. Você pode personalizar
                        com a logo, dados de contato da clínica ou gerar um layout com IA — tudo em{" "}
                        <span className="font-medium text-foreground">Minha Clínica → Configurações</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-2 mt-2 px-1">
                    <Checkbox
                        id="dont-show-header-reminder"
                        checked={dontShowAgain}
                        onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                        className="mt-0.5"
                    />
                    <label
                        htmlFor="dont-show-header-reminder"
                        className="text-xs text-muted-foreground cursor-pointer select-none leading-snug"
                    >
                        Não mostrar essa mensagem novamente
                    </label>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Lembrar depois
                    </Button>
                    <Button onClick={handleNavigate} className="bg-primary hover:bg-primary/90">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Personalizar agora
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
