import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Upload, Trash2, Image as ImageIcon, Save, Eye, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderAiGeneratorDialog } from "@/components/clinic/header-ai-generator-dialog";

export type ClinicHeader = {
    clinicId: number;
    role: string;
    isAdmin: boolean;
    name: string;
    headerMode: "minimal" | "image" | "composed";
    headerImageUrl: string | null;
    headerLogoUrl: string | null;
    headerClinicName: string | null;
    headerAddress: string | null;
    headerPhone: string | null;
    headerEmail: string | null;
    headerWebsite: string | null;
    headerCnpj: string | null;
};

interface Props {
    onPreview?: () => void;
}

export function PrescriptionHeaderSettings({ onPreview }: Props) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: header, isLoading } = useQuery<ClinicHeader>({
        queryKey: ["/api/clinics/header/active"],
    });

    const [draft, setDraft] = useState<ClinicHeader | null>(null);
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (header) setDraft(header);
    }, [header]);

    const updateHeader = useMutation({
        mutationFn: async (payload: Partial<ClinicHeader>) => {
            const res = await apiRequest("PATCH", `/api/clinics/${header!.clinicId}/header`, payload);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            setDraft(data);
            toast({ title: "Cabeçalho salvo" });
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message || "Não foi possível salvar.", variant: "destructive" });
        },
    });

    const uploadImage = useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append("image", file);
            const res = await fetch(`/api/clinics/${header!.clinicId}/header/image`, {
                method: "POST",
                body: form,
                credentials: "include",
            });
            if (!res.ok) throw new Error((await res.json()).message || "Erro no upload");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            setDraft(data);
            toast({ title: "Cabeçalho enviado" });
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });

    const uploadLogo = useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append("logo", file);
            const res = await fetch(`/api/clinics/${header!.clinicId}/header/logo`, {
                method: "POST",
                body: form,
                credentials: "include",
            });
            if (!res.ok) throw new Error((await res.json()).message || "Erro no upload");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            setDraft(data);
            toast({ title: "Logo enviada" });
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });

    const deleteImage = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("DELETE", `/api/clinics/${header!.clinicId}/header/image`);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            setDraft(data);
        },
    });

    const deleteLogo = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("DELETE", `/api/clinics/${header!.clinicId}/header/logo`);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            setDraft(data);
        },
    });

    if (isLoading || !draft) {
        return (
            <Card className="border border-border shadow-sm">
                <CardContent className="py-12 flex justify-center">
                    <BrandLoader className="h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    const canEdit = draft.isAdmin;

    const setField = <K extends keyof ClinicHeader>(key: K, value: ClinicHeader[K]) => {
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const handleSaveTexts = () => {
        updateHeader.mutate({
            headerMode: draft.headerMode,
            headerClinicName: draft.headerClinicName,
            headerAddress: draft.headerAddress,
            headerPhone: draft.headerPhone,
            headerEmail: draft.headerEmail,
            headerWebsite: draft.headerWebsite,
            headerCnpj: draft.headerCnpj,
        });
    };

    const handleSelectMode = (mode: ClinicHeader["headerMode"]) => {
        setField("headerMode", mode);
        if (canEdit) updateHeader.mutate({ headerMode: mode });
    };

    const handleImageFileSelected = async (file: File) => {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
            uploadImage.mutate(file);
            return;
        }
        if (!header) return;
        setIsProcessingPdf(true);
        try {
            const { processPdfHeader, dataUrlToFile } = await import("@/lib/pdf-header-processor");
            const result = await processPdfHeader(file, header.clinicId);
            const png = dataUrlToFile(result.pngDataUrl, `header-pdf-${Date.now()}.png`);
            await uploadImage.mutateAsync(png);
            const note = result.fallback
                ? "Não consegui detectar o cabeçalho automaticamente — usei o topo do documento. Ajuste se necessário."
                : result.confidence === "low"
                    ? "Cabeçalho extraído, mas a confiança foi baixa. Confira o resultado."
                    : "Cabeçalho extraído do PDF e ajustado.";
            toast({ title: "PDF processado", description: note });
        } catch (e: any) {
            toast({ title: "Erro", description: e.message || "Falha ao processar PDF.", variant: "destructive" });
        } finally {
            setIsProcessingPdf(false);
        }
    };

    return (
        <Card className="border border-border shadow-sm">
            <CardHeader>
                <CardTitle className="text-foreground">Cabeçalho do receituário</CardTitle>
                <CardDescription>
                    Personalize o topo das receitas, atestados e laudos com a identidade da clínica.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!canEdit && (
                    <p className="text-xs text-muted-foreground">
                        Apenas o administrador da clínica pode alterar o cabeçalho.
                    </p>
                )}

                {/* Mode selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ModeCard
                        title="Imagem"
                        description="Envie sua arte de timbrado pronta."
                        active={draft.headerMode === "image"}
                        disabled={!canEdit}
                        onClick={() => handleSelectMode("image")}
                    />
                    <ModeCard
                        title="Logo + dados"
                        description="Logo da clínica com nome, endereço e contato."
                        active={draft.headerMode === "composed"}
                        disabled={!canEdit}
                        onClick={() => handleSelectMode("composed")}
                    />
                    <ModeCard
                        title="Minimalista"
                        description="Sem cabeçalho — apenas marca discreta do VitaView."
                        active={draft.headerMode === "minimal"}
                        disabled={!canEdit}
                        onClick={() => handleSelectMode("minimal")}
                    />
                </div>

                {/* AI generator entry point */}
                {canEdit && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4" style={{ color: "#AF9150" }} />
                                Gerar cabeçalho com IA
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug">
                                A IA propõe variações de layout no estilo clássico institucional usando seus dados de perfil.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAiDialogOpen(true)}
                            className="border-primary text-primary hover:bg-primary/10 shrink-0"
                        >
                            <Sparkles className="h-4 w-4 mr-2" style={{ color: "#AF9150" }} />
                            Gerar
                        </Button>
                    </div>
                )}

                <HeaderAiGeneratorDialog
                    clinicId={draft.clinicId}
                    open={aiDialogOpen}
                    onOpenChange={setAiDialogOpen}
                />

                {/* Image mode */}
                {draft.headerMode === "image" && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                        <Label className="text-sm font-medium">Imagem do timbrado</Label>
                        <div className="text-xs text-muted-foreground space-y-1.5">
                            <p>PNG, JPG, WebP ou SVG. Recomendado: largura mínima 1800px, proporção 8:1 ou 6:1 (estilo letterhead).</p>
                            <p className="flex items-start gap-1.5">
                                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#AF9150" }} />
                                <span>
                                    <strong>Tem um PDF do seu timbrado?</strong> Pode enviar direto. A IA identifica
                                    a região do cabeçalho e ajusta automaticamente ao formato da plataforma.
                                </span>
                            </p>
                        </div>
                        {draft.headerImageUrl ? (
                            <div className="space-y-3">
                                <div className="rounded-lg border border-border bg-white p-3">
                                    <img
                                        src={draft.headerImageUrl}
                                        alt="Cabeçalho da clínica"
                                        className="w-full max-h-32 object-contain"
                                    />
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={uploadImage.isPending || isProcessingPdf}
                                        >
                                            {isProcessingPdf ? (
                                                <BrandLoader className="h-4 w-4 mr-2" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            {isProcessingPdf ? "Processando PDF..." : "Substituir"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteImage.mutate()}
                                            disabled={deleteImage.isPending}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remover
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : canEdit ? (
                            <Button
                                variant="outline"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={uploadImage.isPending || isProcessingPdf}
                            >
                                {uploadImage.isPending || isProcessingPdf ? (
                                    <BrandLoader className="h-4 w-4 mr-2" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                )}
                                {isProcessingPdf ? "Processando PDF com IA..." : "Enviar imagem ou PDF"}
                            </Button>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma imagem enviada.</p>
                        )}
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageFileSelected(file);
                                e.target.value = "";
                            }}
                        />
                    </div>
                )}

                {/* Composed mode */}
                {draft.headerMode === "composed" && (
                    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Logo da clínica</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden">
                                    {draft.headerLogoUrl ? (
                                        <img src={draft.headerLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <ImageIcon className="h-7 w-7 text-muted-foreground" />
                                    )}
                                </div>
                                {canEdit && (
                                    <div className="flex flex-col gap-1.5">
                                        <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {draft.headerLogoUrl ? "Substituir" : "Enviar logo"}
                                        </Button>
                                        {draft.headerLogoUrl && (
                                            <Button variant="ghost" size="sm" onClick={() => deleteLogo.mutate()} className="text-destructive">
                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                Remover
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadLogo.mutate(file);
                                    e.target.value = "";
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Nome da clínica" value={draft.headerClinicName} onChange={(v) => setField("headerClinicName", v)} disabled={!canEdit} />
                            <Field label="CNPJ" value={draft.headerCnpj} onChange={(v) => setField("headerCnpj", v)} disabled={!canEdit} />
                        </div>
                        <Field label="Endereço completo" value={draft.headerAddress} onChange={(v) => setField("headerAddress", v)} disabled={!canEdit} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field label="Telefone" value={draft.headerPhone} onChange={(v) => setField("headerPhone", v)} disabled={!canEdit} />
                            <Field label="E-mail" value={draft.headerEmail} onChange={(v) => setField("headerEmail", v)} disabled={!canEdit} />
                            <Field label="Site" value={draft.headerWebsite} onChange={(v) => setField("headerWebsite", v)} disabled={!canEdit} />
                        </div>

                        {canEdit && (
                            <div className="flex justify-end">
                                <Button onClick={handleSaveTexts} disabled={updateHeader.isPending} className="bg-primary hover:bg-primary/90">
                                    {updateHeader.isPending ? <BrandLoader className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Salvar dados
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {draft.headerMode === "minimal" && (
                    <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-4">
                        Será usado um cabeçalho neutro com a assinatura discreta "VitaView.AI" no rodapé.
                    </p>
                )}

                {onPreview && (
                    <div className="flex justify-end pt-2 border-t border-border">
                        <Button variant="outline" size="sm" onClick={onPreview}>
                            <Eye className="h-4 w-4 mr-2" />
                            Pré-visualizar receita
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ModeCard({
    title,
    description,
    active,
    disabled,
    onClick,
}: {
    title: string;
    description: string;
    active: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                "text-left rounded-xl border p-3 transition-colors",
                active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                disabled && "opacity-60 cursor-not-allowed"
            )}
        >
            <p className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>{title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
        </button>
    );
}

function Field({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string;
    value: string | null;
    onChange: (v: string) => void;
    disabled: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">{label}</Label>
            <Input
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="h-9"
            />
        </div>
    );
}
