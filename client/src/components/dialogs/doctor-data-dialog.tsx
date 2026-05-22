import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Save, BadgeCheck } from "lucide-react";

const SPECIALTIES = [
    "Clínico geral",
    "Acupuntura", "Alergia e Imunologia", "Anestesiologia", "Angiologia",
    "Cardiologia", "Cirurgia Cardiovascular", "Cirurgia da Mão", "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo", "Cirurgia Geral", "Cirurgia Pediátrica", "Cirurgia Plástica",
    "Cirurgia Torácica", "Cirurgia Vascular", "Clínica Médica", "Coloproctologia",
    "Dermatologia", "Endocrinologia e Metabologia", "Endoscopia", "Gastroenterologia",
    "Genética Médica", "Geriatria", "Ginecologia e Obstetrícia", "Hematologia e Hemoterapia",
    "Homeopatia", "Infectologia", "Mastologia", "Medicina de Emergência",
    "Medicina de Família e Comunidade", "Medicina do Trabalho", "Medicina Esportiva", "Medicina Física e Reabilitação",
    "Medicina Intensiva", "Medicina Legal e Perícia Médica", "Medicina Nuclear", "Medicina Preventiva e Social",
    "Nefrologia", "Neurocirurgia", "Neurologia", "Nutrologia",
    "Oftalmologia", "Oncologia Clínica", "Ortopedia e Traumatologia", "Otorrinolaringologia",
    "Patologia", "Patologia Clínica/Medicina Laboratorial", "Pediatria", "Pneumologia",
    "Psiquiatria", "Radiologia e Diagnóstico por Imagem", "Radioterapia", "Reumatologia", "Urologia",
];

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type DoctorForm = {
    crm: string;
    crmState: string;
    specialty: string;
    rqe: string;
};

const EMPTY_FORM: DoctorForm = { crm: "", crmState: "", specialty: "", rqe: "" };

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DoctorDataDialog({ open, onOpenChange }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<DoctorForm>(EMPTY_FORM);

    useEffect(() => {
        if (!user) return;
        const u = user as any;
        setForm({
            crm: u.crm ?? "",
            crmState: u.crmState ?? "",
            specialty: u.specialty ?? "",
            rqe: u.rqe ?? "",
        });
    }, [user, open]);

    const mutation = useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Dados profissionais salvos" });
            onOpenChange(false);
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
        },
    });

    const setField = <K extends keyof DoctorForm>(key: K, value: DoctorForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Dados do médico prescritor</DialogTitle>
                    <DialogDescription>
                        CRM e especialidade que aparecem nas receitas, atestados e laudos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <BadgeCheck className="h-4 w-4" />
                        Identificação profissional
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-medium text-foreground">
                                CRM <span className="text-destructive ml-0.5">*</span>
                            </Label>
                            <Input
                                value={form.crm}
                                onChange={(e) => setField("crm", e.target.value)}
                                placeholder="123456"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">
                                UF <span className="text-destructive ml-0.5">*</span>
                            </Label>
                            <select
                                value={form.crmState}
                                onChange={(e) => setField("crmState", e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">—</option>
                                {UF_OPTIONS.map((uf) => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">RQE</Label>
                            <Input
                                value={form.rqe}
                                onChange={(e) => setField("rqe", e.target.value)}
                                placeholder="1234"
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Especialidade</Label>
                        <select
                            value={form.specialty}
                            onChange={(e) => setField("specialty", e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">—</option>
                            {SPECIALTIES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="bg-primary hover:bg-primary/90">
                        {mutation.isPending ? <BrandLoader className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar dados
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
