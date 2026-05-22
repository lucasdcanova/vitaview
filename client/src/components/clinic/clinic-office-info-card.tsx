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
import { Save, MapPin } from "lucide-react";

type OfficeForm = {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    phoneNumber: string;
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
};

export function ClinicOfficeInfoCard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<OfficeForm>(EMPTY_FORM);

    useEffect(() => {
        if (!user) return;
        const u = user as any;
        setForm({
            cep: u.cep ?? "",
            street: u.street ?? "",
            number: u.number ?? "",
            complement: u.complement ?? "",
            neighborhood: u.neighborhood ?? "",
            city: u.city ?? "",
            state: u.state ?? "",
            phoneNumber: u.phoneNumber ?? "",
        });
    }, [user]);

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
                    <Field label="CEP" value={form.cep} onChange={(v) => setField("cep", v)} className="md:col-span-1" />
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
                    <Field label="Telefone do consultório" value={form.phoneNumber} onChange={(v) => setField("phoneNumber", v)} />
                </div>
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
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className ?? ""}`}>
            <Label className="text-xs font-medium text-foreground">
                {label}{required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9"
            />
        </div>
    );
}
