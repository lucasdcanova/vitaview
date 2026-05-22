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
import { Save, Loader2, BadgeCheck, MapPin } from "lucide-react";

const SPECIALTIES = [
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

const formatCep = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
};

const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

type DoctorForm = {
    crm: string;
    crmState: string;
    specialty: string;
    rqe: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    phoneNumber: string;
};

const EMPTY_FORM: DoctorForm = {
    crm: "", crmState: "", specialty: "", rqe: "",
    cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
    phoneNumber: "",
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DoctorDataDialog({ open, onOpenChange }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<DoctorForm>(EMPTY_FORM);
    const [cepLookup, setCepLookup] = useState<{ loading: boolean; lastDigits: string }>({
        loading: false,
        lastDigits: "",
    });

    useEffect(() => {
        if (!user) return;
        const u = user as any;
        setForm({
            crm: u.crm ?? "",
            crmState: u.crmState ?? "",
            specialty: u.specialty ?? "",
            rqe: u.rqe ?? "",
            cep: formatCep(u.cep ?? ""),
            street: u.street ?? "",
            number: u.number ?? "",
            complement: u.complement ?? "",
            neighborhood: u.neighborhood ?? "",
            city: u.city ?? "",
            state: u.state ?? "",
            phoneNumber: formatPhone(u.phoneNumber ?? ""),
        });
    }, [user, open]);

    // Auto-fill via ViaCEP when CEP reaches 8 digits — spinner always resets in .finally
    useEffect(() => {
        const digits = form.cep.replace(/\D/g, "");
        if (digits.length !== 8) return;
        if (digits === cepLookup.lastDigits) return;

        setCepLookup({ loading: true, lastDigits: digits });
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);

        fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal })
            .then((r) => r.json())
            .then((data) => {
                if (data?.erro) {
                    toast({ title: "CEP não encontrado", variant: "destructive" });
                    return;
                }
                setForm((prev) => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: (data.uf || prev.state).toUpperCase(),
                }));
            })
            .catch((err) => {
                if (err?.name !== "AbortError") {
                    toast({ title: "Falha ao consultar CEP", variant: "destructive" });
                }
            })
            .finally(() => {
                window.clearTimeout(timeoutId);
                setCepLookup((s) => ({ ...s, loading: false }));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.cep]);

    const mutation = useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Dados salvos" });
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Dados do médico prescritor</DialogTitle>
                    <DialogDescription>
                        Esses dados aparecem nas receitas, atestados e laudos. Cidade, endereço e CRM são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                {/* Professional credentials */}
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

                {/* Office address */}
                <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground pt-3">
                        <MapPin className="h-4 w-4" />
                        Endereço do consultório
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5 md:col-span-1">
                            <Label className="text-xs font-medium text-foreground">CEP</Label>
                            <div className="relative">
                                <Input
                                    value={form.cep}
                                    onChange={(e) => setField("cep", formatCep(e.target.value))}
                                    placeholder="00000-000"
                                    className="h-9 pr-8"
                                    inputMode="numeric"
                                    maxLength={9}
                                />
                                {cepLookup.loading && (
                                    <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin absolute right-2 top-1/2 -translate-y-1/2" />
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-3">
                            <Label className="text-xs font-medium text-foreground">Rua / Logradouro</Label>
                            <Input
                                value={form.street}
                                onChange={(e) => setField("street", e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">Número</Label>
                            <Input value={form.number} onChange={(e) => setField("number", e.target.value)} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">Complemento</Label>
                            <Input value={form.complement} onChange={(e) => setField("complement", e.target.value)} className="h-9" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-medium text-foreground">Bairro</Label>
                            <Input value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} className="h-9" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-medium text-foreground">
                                Cidade <span className="text-destructive ml-0.5">*</span>
                            </Label>
                            <Input value={form.city} onChange={(e) => setField("city", e.target.value)} className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">
                                UF <span className="text-destructive ml-0.5">*</span>
                            </Label>
                            <Input
                                value={form.state}
                                onChange={(e) => setField("state", e.target.value.toUpperCase().slice(0, 2))}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground">Telefone</Label>
                            <Input
                                value={form.phoneNumber}
                                onChange={(e) => setField("phoneNumber", formatPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                className="h-9"
                            />
                        </div>
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
