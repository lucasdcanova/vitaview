import { useLocation } from "wouter";
import { Building2, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClinicSetupReminder } from "@/hooks/use-clinic-setup-reminder";
import { useOnboarding } from "@/hooks/use-onboarding";

export function ClinicSetupWelcomeDialog() {
    const { open, setOpen, dismiss } = useClinicSetupReminder();
    const { startTour, steps } = useOnboarding();
    const [, setLocation] = useLocation();

    const handleStart = () => {
        setOpen(false);
        setLocation("/minha-clinica");
        const clinicIndex = steps.findIndex((s) => s.id === "minha-clinica");
        startTour(clinicIndex >= 0 ? clinicIndex : 0);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
            <DialogContent className="sm:max-w-md">
                <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Building2 className="h-6 w-6" />
                </div>
                <DialogHeader className="text-center sm:text-center">
                    <DialogTitle className="text-center">Vamos configurar sua clínica</DialogTitle>
                    <DialogDescription className="text-center">
                        Pra emitir receitas, atestados e laudos com a sua identidade visual,
                        precisamos cadastrar os dados da clínica e o cabeçalho dos documentos.
                        Leva menos de 2 minutos.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                    <Button onClick={handleStart} className="w-full bg-primary hover:bg-primary/90">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Iniciar tour
                    </Button>
                    <Button variant="ghost" onClick={dismiss} className="w-full text-muted-foreground">
                        Agora não
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
