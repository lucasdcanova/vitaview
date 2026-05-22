import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    missing: string[];
}

export function ClinicInfoIncompleteDialog({ open, onOpenChange, missing }: Props) {
    const [, setLocation] = useLocation();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        <DialogTitle>Informações da clínica incompletas</DialogTitle>
                    </div>
                    <DialogDescription>
                        Para que a receita saia corretamente preenchida, complete os dados abaixo em Minha Clínica antes de gerar:
                    </DialogDescription>
                </DialogHeader>
                <ul className="list-disc list-inside text-sm text-foreground space-y-1 pl-1">
                    {missing.map((field) => (
                        <li key={field}>{field}</li>
                    ))}
                </ul>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            setLocation("/minha-clinica");
                        }}
                    >
                        Ir para Minha Clínica
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
