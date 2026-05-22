import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Save, Eye } from "lucide-react";
import { SuppressableField, SuppressFieldsMap, fetchAndPreloadClinicHeader } from "@/lib/document-header";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";

interface Props {
    clinicId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialSuppress: SuppressFieldsMap;
    onSaved: (updated: SuppressFieldsMap) => void;
}

type FieldDef = {
    key: SuppressableField;
    label: string;
    hint: string;
};

// Fields the renderer can skip. Order = visual order in the modal.
const FIELDS: FieldDef[] = [
    { key: "doctorName", label: "Nome do médico", hint: "Aparece no cabeçalho ao lado do monograma." },
    { key: "doctorCrm", label: "CRM/UF", hint: "Aparece no cabeçalho e no rodapé." },
    { key: "doctorSpecialty", label: "Especialidade", hint: "Ex.: Oftalmologia / Oftalmologista." },
    { key: "doctorRqe", label: "RQE", hint: "Registro de qualificação de especialidade." },
    { key: "doctorAddress", label: "Endereço do consultório", hint: "Aparece no rodapé institucional." },
    { key: "doctorPhone", label: "Telefone", hint: "Aparece no rodapé institucional." },
    { key: "doctorEmail", label: "E-mail", hint: "Aparece no rodapé institucional, se preenchido." },
    { key: "doctorWebsite", label: "Site", hint: "Aparece no rodapé institucional, se preenchido." },
    { key: "doctorCnpj", label: "CNPJ", hint: "Aparece no rodapé institucional, se preenchido." },
    { key: "footerBand", label: "Rodapé institucional inteiro", hint: "Pula todo o rodapé desenhado pelo sistema — use se seu cabeçalho já contém um rodapé." },
];

export function HeaderElementsEditorDialog({
    clinicId,
    open,
    onOpenChange,
    initialSuppress,
    onSaved,
}: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [suppress, setSuppress] = useState<SuppressFieldsMap>(initialSuppress);
    const [isPreviewing, setIsPreviewing] = useState(false);

    useEffect(() => {
        if (open) setSuppress(initialSuppress);
    }, [open, initialSuppress]);

    const toggle = (key: SuppressableField, value: boolean) => {
        setSuppress((prev) => {
            const next = { ...prev };
            if (value) next[key] = true;
            else delete next[key];
            return next;
        });
    };

    const save = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("PATCH", `/api/clinics/${clinicId}/header`, {
                headerSuppressFields: Object.keys(suppress).length ? suppress : null,
            });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            onSaved(data.headerSuppressFields ?? {});
            toast({ title: "Elementos atualizados" });
            onOpenChange(false);
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
        },
    });

    const handlePreview = async () => {
        if (isPreviewing) return;
        setIsPreviewing(true);
        try {
            const { header, assets } = await fetchAndPreloadClinicHeader();
            const previewHeader = header ? { ...header, suppressFields: suppress } : null;
            const u = (user as any) ?? {};
            await generatePrescriptionPDF({
                doctorName: u.fullName || "Médico Exemplo",
                doctorCrm: u.crm || "000000",
                doctorCrmState: u.crmState || "SP",
                doctorSpecialty: u.specialty || undefined,
                doctorRqe: u.rqe || undefined,
                doctorAddress: composeOfficeAddress(u),
                doctorPhone: u.phoneNumber || undefined,
                doctorCity: u.city || undefined,
                doctorEmail: u.email || undefined,
                doctorWebsite: u.website || undefined,
                doctorCnpj: u.cnpj || undefined,
                patientName: "Paciente Exemplo",
                patientCpf: "000.000.000-00",
                patientBirthDate: "01/01/1980",
                issueDate: new Date(),
                medications: [
                    {
                        name: "Medicamento Exemplo 500 mg",
                        dosage: "1 comprimido",
                        frequency: "1x ao dia",
                        quantity: "30 comprimidos",
                        prescriptionType: "padrao",
                    },
                ],
                clinicHeader: previewHeader,
                clinicHeaderAssets: assets,
            });
        } catch (e: any) {
            toast({ title: "Erro ao gerar pré-visualização", description: e.message, variant: "destructive" });
        } finally {
            setIsPreviewing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Elementos do receituário</DialogTitle>
                    <DialogDescription>
                        Marque o que <strong>já consta no seu cabeçalho</strong>. O sistema vai parar de desenhar esses elementos pra evitar duplicação.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    {FIELDS.map((f) => {
                        const checked = !!suppress[f.key];
                        return (
                            <label
                                key={f.key}
                                className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => toggle(f.key, !!v)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                        {f.hint}
                                    </p>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button variant="outline" onClick={handlePreview} disabled={isPreviewing}>
                        {isPreviewing ? <BrandLoader className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        Pré-visualizar
                    </Button>
                    <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-primary hover:bg-primary/90">
                        {save.isPending ? <BrandLoader className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function composeOfficeAddress(u: any): string | undefined {
    if (!u) return undefined;
    if (u.street) {
        const parts: string[] = [u.street];
        if (u.number) parts[parts.length - 1] = `${parts[parts.length - 1]}, ${u.number}`;
        if (u.complement) parts.push(u.complement);
        if (u.neighborhood) parts.push(u.neighborhood);
        const cityState = [u.city, u.state].filter(Boolean).join(" - ");
        if (cityState) parts.push(cityState);
        if (u.cep) parts.push(`CEP ${u.cep}`);
        return parts.join(", ");
    }
    return u.address || undefined;
}
