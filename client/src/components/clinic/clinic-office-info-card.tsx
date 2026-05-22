import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Save, MapPin, Loader2, ChevronDown } from "lucide-react";

type OfficeForm = {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    phoneNumber: string;
    email: string;
    website: string;
    cnpj: string;
};

const EMPTY_FORM: OfficeForm = {
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phoneNumber: "",
    email: "",
    website: "",
    cnpj: "",
};

const formatCnpj = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

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

export function ClinicOfficeInfoCard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<OfficeForm>(EMPTY_FORM);
    const [extrasOpen, setExtrasOpen] = useState(false);
    const [cepLookup, setCepLookup] = useState<{ loading: boolean; lastDigits: string }>({
        loading: false,
        lastDigits: "",
    });

    // Auto-open the extras panel when the user already has any of the fields saved
    useEffect(() => {
        const u = user as any;
        if (!u) return;
        if (u.email || u.website || u.cnpj) setExtrasOpen(true);
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const u = user as any;
        setForm({
            cep: formatCep(u.cep ?? ""),
            street: u.street ?? "",
            number: u.number ?? "",
            complement: u.complement ?? "",
            neighborhood: u.neighborhood ?? "",
            city: u.city ?? "",
            state: u.state ?? "",
            phoneNumber: formatPhone(u.phoneNumber ?? ""),
            email: u.email ?? "",
            website: u.website ?? "",
            cnpj: formatCnpj(u.cnpj ?? ""),
        });
    }, [user]);

    // Auto-fill street/neighborhood/city/UF when CEP reaches 8 digits via ViaCEP.
    // Loading state always resets in finally — even if the user edits the field
    // mid-flight or the request times out, so the spinner can't get stuck.
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
            toast({ title: "Dados do consultório salvos" });
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
        },
    });

    const setField = <K extends keyof OfficeForm>(key: K, value: OfficeForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        mutation.mutate(form);
    };

    return (
        <Card className="border border-border shadow-sm">
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dados do consultório
                </CardTitle>
                <CardDescription>
                    Endereço, cidade e telefone que aparecem nas suas receitas e atestados.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <Field label="Rua / Logradouro" value={form.street} onChange={(v) => setField("street", v)} className="md:col-span-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Field label="Número" value={form.number} onChange={(v) => setField("number", v)} />
                    <Field label="Complemento" value={form.complement} onChange={(v) => setField("complement", v)} />
                    <Field label="Bairro" value={form.neighborhood} onChange={(v) => setField("neighborhood", v)} className="md:col-span-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} required className="md:col-span-2" />
                    <Field label="UF" value={form.state} onChange={(v) => setField("state", v.toUpperCase().slice(0, 2))} required />
                    <Field label="Telefone do consultório" value={form.phoneNumber} onChange={(v) => setField("phoneNumber", formatPhone(v))} placeholder="(00) 00000-0000" />
                </div>

                <button
                    type="button"
                    onClick={() => setExtrasOpen((v) => !v)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${extrasOpen ? "" : "-rotate-90"}`} />
                    Informações adicionais (opcional)
                </button>

                {extrasOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-dashed border-border p-3">
                        <Field label="E-mail de contato" value={form.email} onChange={(v) => setField("email", v)} placeholder="contato@clinica.com.br" />
                        <Field label="Site" value={form.website} onChange={(v) => setField("website", v)} placeholder="www.clinica.com.br" />
                        <Field label="CNPJ" value={form.cnpj} onChange={(v) => setField("cnpj", formatCnpj(v))} placeholder="00.000.000/0000-00" />
                    </div>
                )}

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={mutation.isPending} className="bg-primary hover:bg-primary/90">
                        {mutation.isPending ? <BrandLoader className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar dados
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Field({
    label,
    value,
    onChange,
    required,
    className,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    className?: string;
    placeholder?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className ?? ""}`}>
            <Label className="text-xs font-medium text-foreground">
                {label}{required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9"
            />
        </div>
    );
}
