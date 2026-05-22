import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Upload, Trash2, Image as ImageIcon, Save, Eye, Sparkles, Droplet, Pencil, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { HeaderAiGeneratorDialog } from "@/components/clinic/header-ai-generator-dialog";
import { HeaderElementsEditorDialog } from "@/components/clinic/header-elements-editor-dialog";

export type PreprintedConfig = {
    paperWidthMm: number;
    paperHeightMm: number;
    orientation: "landscape" | "portrait";
    topMm: number;
    bottomMm: number;
    leftMm: number;
    rightMm: number;
};

export type ClinicHeader = {
    clinicId: number;
    role: string;
    isAdmin: boolean;
    name: string;
    headerMode: "minimal" | "image" | "composed" | "letterhead" | "preprinted";
    headerImageUrl: string | null;
    headerLogoUrl: string | null;
    headerClinicName: string | null;
    headerAddress: string | null;
    headerPhone: string | null;
    headerEmail: string | null;
    headerWebsite: string | null;
    headerCnpj: string | null;
    headerWatermarkUseLogo: boolean;
    headerSuppressFields: Record<string, boolean>;
    headerBodyBbox: { top: number; bottom: number; left: number; right: number } | null;
    preprintedConfig: PreprintedConfig | null;
};

const DEFAULT_PREPRINTED: PreprintedConfig = {
    paperWidthMm: 210,
    paperHeightMm: 148.5,
    orientation: "landscape",
    topMm: 35,
    bottomMm: 18,
    leftMm: 14,
    rightMm: 14,
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
    const [elementsDialogOpen, setElementsDialogOpen] = useState(false);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [isAnalyzingPreprinted, setIsAnalyzingPreprinted] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const bannerInputRef = useRef<HTMLInputElement | null>(null);
    const logoInputRef = useRef<HTMLInputElement | null>(null);
    const preprintedInputRef = useRef<HTMLInputElement | null>(null);

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
            headerWatermarkUseLogo: draft.headerWatermarkUseLogo,
        });
    };

    const handleSelectMode = (mode: ClinicHeader["headerMode"]) => {
        setField("headerMode", mode);
        if (canEdit) {
            if (mode === "preprinted" && !draft?.preprintedConfig) {
                updateHeader.mutate({ headerMode: mode, preprintedConfig: DEFAULT_PREPRINTED } as any);
            } else {
                updateHeader.mutate({ headerMode: mode });
            }
        }
    };

    const setPreprintedField = (key: keyof PreprintedConfig, value: number | string) => {
        setDraft((prev) => {
            if (!prev) return prev;
            const base = prev.preprintedConfig ?? DEFAULT_PREPRINTED;
            const next = { ...base, [key]: value };
            return { ...prev, preprintedConfig: next };
        });
    };

    const handleSavePreprinted = () => {
        if (!draft?.preprintedConfig) return;
        updateHeader.mutate({ preprintedConfig: draft.preprintedConfig } as any);
    };

    const handlePreprintedPhoto = async (file: File) => {
        if (!header) return;
        setIsAnalyzingPreprinted(true);
        try {
            const dataUrl = await readFileAsDataUrl(file);
            const preview = await downscaleImageDataUrl(dataUrl, 1400);
            const cfg = draft?.preprintedConfig ?? DEFAULT_PREPRINTED;
            const res = await fetch(`/api/clinics/${header.clinicId}/header/analyze-preprinted`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageDataUrl: preview,
                    paperWidthMm: cfg.paperWidthMm,
                    paperHeightMm: cfg.paperHeightMm,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Falha ao analisar foto");
            }
            const result = await res.json();
            const next: PreprintedConfig = {
                paperWidthMm: result.paperWidthMm,
                paperHeightMm: result.paperHeightMm,
                orientation: result.orientation,
                topMm: round1(result.topMm),
                bottomMm: round1(result.bottomMm),
                leftMm: round1(result.leftMm),
                rightMm: round1(result.rightMm),
            };
            setDraft((prev) => (prev ? { ...prev, preprintedConfig: next, headerMode: "preprinted" } : prev));
            updateHeader.mutate({ headerMode: "preprinted", preprintedConfig: next } as any);
            toast({
                title: result.fallback ? "Foto analisada com baixa confiança" : "Margens detectadas",
                description: result.fallback
                    ? "Não consegui ler bem a foto. Use valores padrão e ajuste manualmente."
                    : `Confiança ${result.confidence}. Pode ajustar manualmente se quiser.`,
            });
        } catch (e: any) {
            toast({ title: "Erro", description: e.message || "Falha ao analisar foto", variant: "destructive" });
        } finally {
            setIsAnalyzingPreprinted(false);
        }
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

            const png = dataUrlToFile(result.pngDataUrl, `letterhead-${Date.now()}.png`);
            const form = new FormData();
            form.append("image", png);
            form.append("bodyBbox", JSON.stringify(result.bodyBbox));
            const res = await fetch(`/api/clinics/${header.clinicId}/header/letterhead`, {
                method: "POST",
                body: form,
                credentials: "include",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Erro ao salvar timbrado");
            }
            const data = await res.json();
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            setDraft(data);

            const note = result.fallback
                ? "Salvei o timbrado, mas não consegui identificar com precisão a área do corpo. Você pode testar uma receita pra ajustar."
                : result.confidence === "low"
                    ? "Timbrado salvo, mas a confiança foi baixa. Vale conferir o resultado."
                    : "Timbrado salvo. O design do PDF agora é a moldura completa dos seus documentos.";
            toast({ title: "Timbrado processado", description: note });
        } catch (e: any) {
            toast({ title: "Erro", description: e.message || "Falha ao processar PDF.", variant: "destructive" });
        } finally {
            setIsProcessingPdf(false);
        }
    };

    return (
        <Card className="border border-border shadow-sm">
            <CardHeader className="relative">
                <CardTitle className="text-foreground">Cabeçalho do receituário</CardTitle>
                <CardDescription>
                    Personalize o topo das receitas, atestados e laudos com a identidade da clínica.
                </CardDescription>
                <a
                    href="https://wa.me/555597032546?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20para%20configurar%20o%20cabe%C3%A7alho%20do%20meu%20receitu%C3%A1rio."
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Suporte no WhatsApp
                </a>
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
                        title="Padrão"
                        description="Use sua logo e/ou um cabeçalho próprio. O sistema cuida do resto."
                        active={draft.headerMode === "minimal" || draft.headerMode === "image" || draft.headerMode === "composed"}
                        disabled={!canEdit}
                        onClick={() => handleSelectMode("minimal")}
                    />
                    <ModeCard
                        title="Timbrado em PDF"
                        description="Você tem o PDF do receituário pronto. Sistema só injeta o conteúdo."
                        active={draft.headerMode === "letterhead"}
                        disabled={!canEdit}
                        onClick={() => handleSelectMode("letterhead")}
                    />
                    <ModeCard
                        title="Papel pré-impresso"
                        description="Você já tem receituário físico. Sistema imprime só dentro das margens."
                        active={draft.headerMode === "preprinted"}
                        disabled={!canEdit}
                        onClick={() => handleSelectMode("preprinted")}
                    />
                </div>

                {/* AI generator entry point — only relevant for Padrão mode (creates a banner image) */}
                {canEdit && (draft.headerMode === "minimal" || draft.headerMode === "composed" || draft.headerMode === "image") && (
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

                <HeaderElementsEditorDialog
                    clinicId={draft.clinicId}
                    open={elementsDialogOpen}
                    onOpenChange={setElementsDialogOpen}
                    initialSuppress={draft.headerSuppressFields ?? {}}
                    onSaved={(updated) => {
                        setDraft((prev) => prev ? { ...prev, headerSuppressFields: updated } : prev);
                        queryClient.invalidateQueries({ queryKey: ["/api/clinics/header/active"] });
                    }}
                />

                {/* Letterhead (full-page PDF) mode */}
                {draft.headerMode === "letterhead" && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                                <Label className="text-sm font-medium">PDF do receituário</Label>
                                <p className="text-xs text-muted-foreground leading-snug">
                                    Envie o PDF do seu receituário com o design completo. A IA identifica onde o conteúdo deve cair e gera as receitas usando o seu PDF como moldura.
                                </p>
                            </div>
                            {canEdit && !draft.headerImageUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploadImage.isPending || isProcessingPdf}
                                    className="shrink-0"
                                >
                                    {uploadImage.isPending || isProcessingPdf ? (
                                        <BrandLoader className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    {isProcessingPdf ? "Processando..." : "Enviar arquivo"}
                                </Button>
                            )}
                        </div>
                        {draft.headerMode === "letterhead" && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                                <p className="text-xs text-foreground flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" style={{ color: "#AF9150" }} />
                                    <span>
                                        <strong>Modo timbrado ativo.</strong> Receitas e atestados são gerados em
                                        portrait (1 via por página) usando o seu PDF como moldura completa.
                                    </span>
                                </p>
                            </div>
                        )}
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
                        ) : !canEdit ? (
                            <p className="text-sm text-muted-foreground">Nenhuma imagem enviada.</p>
                        ) : null}
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageFileSelected(file);
                                e.target.value = "";
                            }}
                        />
                    </div>
                )}

                {/* Preprinted paper mode */}
                {draft.headerMode === "preprinted" && (
                    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                        <div>
                            <Label className="text-sm font-medium">Foto do seu receituário pré-impresso</Label>
                            <p className="text-xs text-muted-foreground leading-snug mt-1">
                                Envie uma foto/scan de uma folha em branco do seu receituário. A IA detecta automaticamente as margens livres onde o conteúdo deve cair na impressão.
                            </p>
                            {canEdit && (
                                <div className="mt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => preprintedInputRef.current?.click()}
                                        disabled={isAnalyzingPreprinted || updateHeader.isPending}
                                    >
                                        {isAnalyzingPreprinted ? (
                                            <BrandLoader className="h-4 w-4 mr-2" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 mr-2" style={{ color: "#AF9150" }} />
                                        )}
                                        {isAnalyzingPreprinted ? "Analisando..." : "Enviar foto e detectar margens"}
                                    </Button>
                                </div>
                            )}
                            <input
                                ref={preprintedInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePreprintedPhoto(file);
                                    e.target.value = "";
                                }}
                            />
                        </div>

                        <div className="border-t border-border pt-4">
                            <Label className="text-sm font-medium">Margens (mm)</Label>
                            <p className="text-xs text-muted-foreground leading-snug mt-1">
                                Ajuste manualmente se necessário. As margens marcam o espaço reservado no papel físico (timbrado em cima, assinatura/caixas embaixo).
                            </p>
                            {(() => {
                                const cfg = draft.preprintedConfig ?? DEFAULT_PREPRINTED;
                                return (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                            <MarginField label="Topo" value={cfg.topMm} onChange={(v) => setPreprintedField("topMm", v)} disabled={!canEdit} max={cfg.paperHeightMm * 0.65} />
                                            <MarginField label="Rodapé" value={cfg.bottomMm} onChange={(v) => setPreprintedField("bottomMm", v)} disabled={!canEdit} max={cfg.paperHeightMm * 0.5} />
                                            <MarginField label="Esquerda" value={cfg.leftMm} onChange={(v) => setPreprintedField("leftMm", v)} disabled={!canEdit} max={cfg.paperWidthMm * 0.4} />
                                            <MarginField label="Direita" value={cfg.rightMm} onChange={(v) => setPreprintedField("rightMm", v)} disabled={!canEdit} max={cfg.paperWidthMm * 0.4} />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium text-foreground">Largura do papel (mm)</Label>
                                                <Input
                                                    type="number"
                                                    step={0.5}
                                                    min={50}
                                                    max={500}
                                                    value={cfg.paperWidthMm}
                                                    onChange={(e) => setPreprintedField("paperWidthMm", parseFloat(e.target.value) || 210)}
                                                    disabled={!canEdit}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium text-foreground">Altura do papel (mm)</Label>
                                                <Input
                                                    type="number"
                                                    step={0.5}
                                                    min={50}
                                                    max={500}
                                                    value={cfg.paperHeightMm}
                                                    onChange={(e) => setPreprintedField("paperHeightMm", parseFloat(e.target.value) || 148.5)}
                                                    disabled={!canEdit}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium text-foreground">Orientação</Label>
                                                <select
                                                    value={cfg.orientation}
                                                    onChange={(e) => setPreprintedField("orientation", e.target.value)}
                                                    disabled={!canEdit}
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    <option value="landscape">Paisagem</option>
                                                    <option value="portrait">Retrato</option>
                                                </select>
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <div className="flex justify-end mt-4">
                                                <Button onClick={handleSavePreprinted} disabled={updateHeader.isPending} className="bg-primary hover:bg-primary/90">
                                                    {updateHeader.isPending ? <BrandLoader className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Salvar margens
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                            <p className="text-xs text-foreground leading-snug">
                                <strong>Dica:</strong> imprima uma receita de teste em uma folha branca normal e sobreponha à sua folha pré-impressa contra a luz para conferir o alinhamento. Ajuste as margens em pequenos incrementos.
                            </p>
                        </div>
                    </div>
                )}

                {(draft.headerMode === "minimal" || draft.headerMode === "composed") && (
                    <div className="rounded-xl border border-dashed border-border p-4 space-y-4">
                        <p className="text-xs text-muted-foreground leading-snug">
                            Cabeçalho discreto com monograma — ou substitua por sua logo + um cabeçalho próprio. CNPJ, e-mail e site ficam em <strong>Dados do consultório</strong>.
                        </p>

                        {/* Logo + Cabeçalho slots side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-3 items-start">
                            {/* Logo slot */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground">Logo</Label>
                                <div className="relative h-20 w-20">
                                    <button
                                        type="button"
                                        onClick={() => canEdit && logoInputRef.current?.click()}
                                        disabled={!canEdit || uploadLogo.isPending}
                                        className="h-full w-full rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden hover:border-primary/60 transition-colors group relative"
                                    >
                                        {draft.headerLogoUrl ? (
                                            <>
                                                <img src={draft.headerLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                                {canEdit && (
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white">
                                                        <Upload className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-medium">Trocar</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                <Upload className="h-4 w-4" />
                                                <span className="text-[10px] font-medium">Enviar</span>
                                            </div>
                                        )}
                                    </button>
                                    {canEdit && draft.headerLogoUrl && (
                                        <button
                                            type="button"
                                            onClick={() => deleteLogo.mutate()}
                                            disabled={deleteLogo.isPending}
                                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm hover:bg-destructive/90"
                                            aria-label="Remover logo"
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </button>
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

                            {/* Banner slot — wide, top strip of the prescription */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 min-h-[20px]">
                                    <Label className="text-xs font-medium text-foreground">Cabeçalho (opcional)</Label>
                                    {canEdit && draft.headerImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setElementsDialogOpen(true)}
                                            className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Pencil className="h-3 w-3" />
                                            Editar elementos
                                        </button>
                                    )}
                                </div>
                                <div className="relative h-20 w-full">
                                    <button
                                        type="button"
                                        onClick={() => canEdit && bannerInputRef.current?.click()}
                                        disabled={!canEdit || uploadImage.isPending}
                                        className="h-full w-full rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden hover:border-primary/60 transition-colors group"
                                    >
                                        {draft.headerImageUrl ? (
                                            <>
                                                <img src={draft.headerImageUrl} alt="Cabeçalho" className="max-h-full max-w-full object-contain" />
                                                {canEdit && (
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white">
                                                        <Upload className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-medium">Trocar</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground px-3 text-center">
                                                <Upload className="h-4 w-4" />
                                                <span className="text-[10px] font-medium leading-tight">
                                                    Enviar cabeçalho (PNG/JPG)
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                    {canEdit && draft.headerImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => deleteImage.mutate()}
                                            disabled={deleteImage.isPending}
                                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm hover:bg-destructive/90"
                                            aria-label="Remover cabeçalho"
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadImage.mutate(file);
                                        e.target.value = "";
                                    }}
                                />
                            </div>
                        </div>

                        {/* Name + watermark toggle + save */}
                        <div className="space-y-3">
                            <Field
                                label="Nome exibido no cabeçalho"
                                value={draft.headerClinicName}
                                onChange={(v) => setField("headerClinicName", v)}
                                disabled={!canEdit}
                            />

                            <label className={cn(
                                "flex items-start gap-2.5 rounded-md border border-border bg-background px-3 py-2.5 text-xs cursor-pointer transition-colors",
                                !draft.headerLogoUrl && "opacity-60 cursor-not-allowed",
                            )}>
                                <Checkbox
                                    checked={!!draft.headerWatermarkUseLogo}
                                    onCheckedChange={(v) => setField("headerWatermarkUseLogo", !!v)}
                                    disabled={!canEdit || !draft.headerLogoUrl}
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground flex items-center gap-1.5">
                                        <Droplet className="h-3.5 w-3.5" />
                                        Usar minha logo como marca d'água
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                        {draft.headerLogoUrl
                                            ? "Substitui a marca d'água discreta do VitaView pela sua logo."
                                            : "Envie uma logo acima para habilitar."}
                                    </p>
                                </div>
                            </label>

                            {canEdit && (
                                <div className="flex justify-end pt-1">
                                    <Button onClick={handleSaveTexts} disabled={updateHeader.isPending} className="bg-primary hover:bg-primary/90 h-8 text-sm">
                                        {updateHeader.isPending ? <BrandLoader className="h-3.5 w-3.5 mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
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

const round1 = (n: number) => Math.round(n * 10) / 10;

const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const downscaleImageDataUrl = (src: string, maxWidth = 1400): Promise<string> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(1, maxWidth / img.naturalWidth);
            const w = Math.round(img.naturalWidth * ratio);
            const h = Math.round(img.naturalHeight * ratio);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas indisponível"));
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = src;
    });

function MarginField({
    label,
    value,
    onChange,
    disabled,
    max,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    disabled: boolean;
    max: number;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">{label} (mm)</Label>
            <Input
                type="number"
                step={0.5}
                min={0}
                max={max}
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="h-9"
            />
        </div>
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
