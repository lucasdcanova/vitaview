import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Sparkles, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    type HeaderContent,
    type HeaderSpec,
    dataUrlToFile,
    renderHeaderSpec,
} from "@/lib/header-spec-renderer";

interface Props {
    clinicId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface GenerationResponse {
    variations: HeaderSpec[];
    content: HeaderContent;
}

export function HeaderAiGeneratorDialog({ clinicId, open, onOpenChange }: Props) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [data, setData] = useState<GenerationResponse | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    const generate = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/clinics/${clinicId}/header/ai-generate`, {});
            return (await res.json()) as GenerationResponse;
        },
        onSuccess: (resp) => {
            setData(resp);
            setSelectedIdx(0);
            try {
                const rendered = resp.variations.map((spec) => renderHeaderSpec(spec, resp.content));
                setPreviews(rendered);
            } catch (e) {
                console.error(e);
                toast({ title: "Erro", description: "Falha ao renderizar pré-visualização.", variant: "destructive" });
            }
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message || "Falha ao gerar.", variant: "destructive" });
        },
    });

    const apply = useMutation({
        mutationFn: async () => {
            if (selectedIdx === null || !previews[selectedIdx]) {
                throw new Error("Nenhuma variação selecionada");
            }
            const file = dataUrlToFile(previews[selectedIdx], `header-ai-${Date.now()}.png`);
            const form = new FormData();
            form.append("image", file);
            const upload = await fetch(`/api/clinics/${clinicId}/header/image`, {
                method: "POST",
                body: form,
                credentials: "include",
            });
            if (!upload.ok) throw new Error((await upload.json()).message || "Erro no upload");
            return upload.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/clinics/header/active"], data);
            toast({ title: "Cabeçalho aplicado", description: "O novo cabeçalho será usado nos próximos documentos." });
            onOpenChange(false);
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: e.message || "Falha ao salvar.", variant: "destructive" });
        },
    });

    useEffect(() => {
        if (open && !data && !generate.isPending) {
            generate.mutate();
        }
        if (!open) {
            setData(null);
            setPreviews([]);
            setSelectedIdx(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Gerar cabeçalho com IA
                    </DialogTitle>
                    <DialogDescription>
                        A IA propõe 3 variações no estilo clássico institucional, baseadas no seu perfil. Escolha uma para aplicar.
                    </DialogDescription>
                </DialogHeader>

                {generate.isPending ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <BrandLoader className="h-8 w-8" />
                        <p className="text-sm text-muted-foreground">Gerando variações...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-3">
                        {data.variations.map((spec, idx) => (
                            <button
                                type="button"
                                key={idx}
                                onClick={() => setSelectedIdx(idx)}
                                className={cn(
                                    "block w-full text-left rounded-xl border-2 overflow-hidden transition-colors bg-white",
                                    selectedIdx === idx
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border hover:border-muted-foreground/40"
                                )}
                            >
                                {previews[idx] ? (
                                    <img
                                        src={previews[idx]}
                                        alt={spec.variationLabel}
                                        className="w-full"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                                        Sem pré-visualização
                                    </div>
                                )}
                                <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/40">
                                    <span className="text-xs font-medium text-foreground">{spec.variationLabel}</span>
                                    {selectedIdx === idx && (
                                        <span className="text-xs text-primary flex items-center gap-1">
                                            <Check className="h-3.5 w-3.5" />
                                            Selecionada
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : null}

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => generate.mutate()}
                        disabled={generate.isPending || apply.isPending}
                    >
                        {generate.isPending ? (
                            <BrandLoader className="h-4 w-4 mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Gerar outras variações
                    </Button>
                    <Button
                        onClick={() => apply.mutate()}
                        disabled={selectedIdx === null || generate.isPending || apply.isPending}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {apply.isPending ? (
                            <BrandLoader className="h-4 w-4 mr-2" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        Aplicar selecionada
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
