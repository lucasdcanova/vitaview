import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAnamnesisTemplates,
  type ResolvedAnamnesisTemplate,
} from "@/hooks/use-anamnesis-templates";
import {
  getAnamnesisTemplate,
  isAnamnesisTemplateId,
} from "@shared/anamnesis-templates";

export type AnamnesisTemplateEditorMode =
  | { kind: "edit"; template: ResolvedAnamnesisTemplate }
  | { kind: "create" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AnamnesisTemplateEditorMode | null;
  onSaved?: (template: { key: string; label: string; structure: string }) => void;
}

export function AnamnesisTemplateEditorDialog({ open, onOpenChange, mode, onSaved }: Props) {
  const { createTemplate, updateTemplate, isMutating } = useAnamnesisTemplates();
  const { toast } = useToast();
  const [label, setLabel] = useState("");
  const [structure, setStructure] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode?.kind === "edit") {
      setLabel(mode.template.label);
      setStructure(mode.template.structure);
    } else {
      setLabel("");
      setStructure("");
    }
  }, [open, mode]);

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      toast({ title: "Nome obrigatório", description: "Dê um nome ao padrão.", variant: "destructive" });
      return;
    }
    if (trimmedLabel.length > 80) {
      toast({ title: "Nome muito longo", description: "Máximo de 80 caracteres.", variant: "destructive" });
      return;
    }

    try {
      if (mode?.kind === "edit") {
        const target = mode.template;
        if (target.source === "builtin") {
          // Primeira edição de um built-in: cria override
          const baseId = target.key;
          if (!isAnamnesisTemplateId(baseId)) {
            toast({ title: "Erro", description: "ID base inválido.", variant: "destructive" });
            return;
          }
          const base = getAnamnesisTemplate(baseId);
          const created = await createTemplate({
            label: trimmedLabel,
            structure,
            baseTemplateId: baseId,
            freeForm: base.freeForm ?? false,
          });
          toast({ title: "Padrão personalizado", description: `"${trimmedLabel}" salvo como personalização sua.` });
          onSaved?.({ key: baseId, label: trimmedLabel, structure: created.structure });
        } else if (target.rowId) {
          const updated = await updateTemplate({
            id: target.rowId,
            label: trimmedLabel,
            structure,
          });
          toast({ title: "Padrão atualizado", description: `"${trimmedLabel}" salvo.` });
          onSaved?.({ key: target.key, label: updated.label, structure: updated.structure });
        }
      } else {
        const created = await createTemplate({
          label: trimmedLabel,
          structure,
          baseTemplateId: null,
          freeForm: false,
        });
        toast({ title: "Padrão criado", description: `"${trimmedLabel}" disponível no seletor.` });
        onSaved?.({
          key: `custom-${created.id}`,
          label: created.label,
          structure: created.structure,
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error?.message ?? "Não foi possível salvar o padrão.",
        variant: "destructive",
      });
    }
  };

  const title =
    mode?.kind === "edit"
      ? mode.template.source === "builtin"
        ? `Personalizar "${mode.template.label}"`
        : `Editar "${mode.template.label}"`
      : "Novo padrão personalizado";

  const description =
    mode?.kind === "edit" && mode.template.source === "builtin"
      ? "Sua personalização não altera o padrão original — você pode restaurar a qualquer momento."
      : "Defina o nome e a estrutura. Cada linha vira uma linha no editor de anamnese.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anamnesis-template-name">Nome</Label>
            <Input
              id="anamnesis-template-name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex.: Retorno cardiológico"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anamnesis-template-structure">Estrutura</Label>
            <Textarea
              id="anamnesis-template-structure"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              rows={16}
              placeholder={`# Comorbidades\n# Nega tabagismo e etilismo\n\nSubjetivo\n\nObjetivo\n\nImpressão\n\nConduta`}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Quebras de linha são preservadas. Você pode usar marcadores como "#" no começo das linhas.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isMutating}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isMutating}>
            {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
