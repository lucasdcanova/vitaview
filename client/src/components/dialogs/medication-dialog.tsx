import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Sparkles, Lightbulb, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomMedication } from "@shared/schema";

// Helper function to render prescription type badge with appropriate colors
export const PrescriptionTypeBadge = ({ type }: { type?: 'common' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1' | 'padrao' }) => {
    if (!type || type === 'common') return null;

    const badgeConfig: Record<string, { label: string; className: string }> = {
        'A': {
            label: 'A',
            className: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100'
        },
        'B1': {
            label: 'B1',
            className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100'
        },
        'B2': {
            label: 'B2',
            className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100'
        },
        'C': {
            label: 'C',
            className: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100'
        },
        'C1': {
            label: 'C1',
            className: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100'
        },
        'especial': {
            label: 'Controle Especial',
            className: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100'
        },
    };

    const config = badgeConfig[type];
    if (!config) return null;

    return (
        <Badge variant="outline" className={cn("text-xs font-semibold", config.className)}>
            {config.label}
        </Badge>
    );

};

// Helper function to get medication icon based on format
export const getMedicationIcon = (format: string) => {
    const formatLower = (format || "").toLowerCase();

    if (formatLower.includes("injecao") || formatLower.includes("injeção") || formatLower.includes("ampola") || formatLower.includes("refil") || formatLower.includes("caneta")) {
        return "💉";
    }
    if (formatLower.includes("pomada") || formatLower.includes("creme") || formatLower.includes("gel") || formatLower.includes("locao") || formatLower.includes("loção")) {
        return "🧴";
    }
    if (formatLower.includes("gotas") || formatLower.includes("xarope") || formatLower.includes("elixir") || formatLower.includes(" po ") || formatLower.includes("pó") || formatLower.includes("solucao") || formatLower.includes("solução") || formatLower.includes("suspensao") || formatLower.includes("suspensão") || formatLower.includes("colirio") || formatLower.includes("colírio")) {
        return "💧";
    }
    if (formatLower.includes("spray") || formatLower.includes("aerosol") || formatLower.includes("inalatoria") || formatLower.includes("jato")) {
        return "💨";
    }
    if (formatLower.includes("capsula") || formatLower.includes("cápsula") || formatLower.includes("sache") || formatLower.includes("sachê") || formatLower.includes("supositorio") || formatLower.includes("supositório")) {
        return "💊";
    }

    if (formatLower.includes("enema") || formatLower.includes("clister")) {
        return "🧴";
    }

    // Default to pill for tablets and others
    return "💊";
};

export const medicationSchema = z.object({
    name: z.string().min(1, "Nome do medicamento é obrigatório"),
    format: z.string().default("comprimido"),
    dosage: z.string().min(1, "Dosagem é obrigatória"),
    dosageUnit: z.string().default("mg"),
    frequency: z.string().min(1, "Frequência é obrigatória"),
    doseAmount: z.coerce.number().min(1).default(1),
    prescriptionType: z.string().default("padrao"), // padrao, especial, A, B1, B2, C
    quantity: z.string().optional(),
    administrationRoute: z.string().default("oral"),
    startDate: z.string().min(1, "Data de início é obrigatória"),
    notes: z.string().optional(),
});

export type MedicationFormData = z.infer<typeof medicationSchema>;

interface MedicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<MedicationFormData>;
    onSubmit: (data: MedicationFormData) => void;
    isPending: boolean;
    mode: "create" | "edit";
    onRemove?: () => void;
    isRemovePending?: boolean;
}

// Tipos e dados foram extraídos para client/src/data/medication-database-core.ts.
// Re-exportamos aqui para manter back-compat com imports antigos.
export {
    MEDICATION_DATABASE,
    CONTROLLED_MEDICATIONS,
    type MedicationInfo,
    type MedicationPresentation,
} from "@/data/medication-database-core";
import {
    MEDICATION_DATABASE,
    type MedicationInfo,
    type MedicationPresentation,
} from "@/data/medication-database-core";

// Interface para item de medicamento com apresentação
interface MedicationListItem {
    displayName: string;  // Nome exibido: "Dipirona (comprimido)"
    baseName: string;     // Nome base: "Dipirona"
    format: string;       // Formato: "comprimido"
    dosage?: string;      // Dosagem: "500"
    unit?: string;        // Unidade: "mg"
    prescriptionType?: 'common' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1' | 'padrao';
}

// Mapear formatos para categorias amigáveis
const formatCategory = (format: string): string => {
    const lower = format.toLowerCase();
    if (lower.includes('comprimido') || lower.includes('capsula') || lower.includes('cápsula')) {
        return 'comprimido/cápsula';
    }
    if (lower.includes('gotas') || lower.includes('solucao') || lower.includes('solução') || lower.includes('xarope') || lower.includes('suspensao') || lower.includes('suspensão')) {
        return 'gotas/solução';
    }
    if (lower.includes('injecao') || lower.includes('injeção') || lower.includes('injetável') || lower.includes('injetavel')) {
        return 'injetável';
    }
    if (lower.includes('creme') || lower.includes('pomada') || lower.includes('gel')) {
        return 'tópico';
    }
    if (lower.includes('colirio') || lower.includes('colírio')) {
        return 'colírio';
    }
    if (lower.includes('spray') || lower.includes('inalatorio') || lower.includes('inalatório')) {
        return 'inalatório';
    }
    return format;
};

// Gerar lista de medicamentos com apresentações únicas - usa emoji para indicar tipo
export const ALL_MEDICATIONS_WITH_PRESENTATIONS: MedicationListItem[] = (() => {
    const items: MedicationListItem[] = [];
    const seen = new Set<string>();

    // Função para obter emoji baseado no formato
    const getFormatEmoji = (format: string): string => {
        const formatLower = format.toLowerCase();

        // Comprimidos e cápsulas
        if (formatLower.includes('comprimido') || formatLower.includes('capsula') || formatLower.includes('cápsula')) {
            return '💊';
        }

        // Líquidos (gotas, suspensão, solução, xarope)
        if (formatLower.includes('gotas') || formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
            formatLower.includes('solucao') || formatLower.includes('solução') || formatLower.includes('xarope')) {
            return '💧';
        }

        // Injetáveis
        if (formatLower.includes('injecao') || formatLower.includes('injeção') || formatLower.includes('ampola')) {
            return '💉';
        }

        // Inalatórios
        if (formatLower.includes('spray') || formatLower.includes('aerosol') || formatLower.includes('inalatorio') || formatLower.includes('inalatório')) {
            return '💨';
        }

        // Outros (cremes, pomadas, colírios) - usar emoji genérico
        return '💊';
    };

    MEDICATION_DATABASE.forEach(med => {
        med.presentations.forEach(pres => {
            // Criar displayName simplificado: "Medicamento 100 mg" (emoji removido pois já existe ícone na UI)
            const displayName = `${med.name} ${pres.dosage} ${pres.unit}`;

            // Usar displayName como chave única para evitar duplicatas
            if (!seen.has(displayName)) {
                seen.add(displayName);

                items.push({
                    displayName: displayName,
                    baseName: med.name,
                    format: pres.format,
                    dosage: pres.dosage,
                    unit: pres.unit,
                    prescriptionType: med.prescriptionType
                });
            }
        });
    });

    // Ordenar alfabeticamente e por formato/dosagem
    return items.sort((a, b) => {
        // Comparar nomes base
        const nameCompare = a.baseName.localeCompare(b.baseName, 'pt-BR');
        if (nameCompare !== 0) return nameCompare;

        // Se for o mesmo medicamento, ordenar por formato
        const getFormatPriority = (format: string) => {
            const f = format.toLowerCase();
            if (f.includes('comprimido') || f.includes('capsula') || f.includes('cápsula')) return 1;
            if (f.includes('oral') || f.includes('solucao') || f.includes('xarope') || f.includes('gotas')) return 2;
            if (f.includes('topico') || f.includes('creme') || f.includes('pomada')) return 3;
            if (f.includes('oftalmico') || f.includes('colirio')) return 4;
            if (f.includes('nasal') || f.includes('spray') || f.includes('aerosol')) return 5;
            if (f.includes('injetavel') || f.includes('ampola')) return 6;
            return 9;
        };

        const priorityA = getFormatPriority(a.format);
        const priorityB = getFormatPriority(b.format);

        if (priorityA !== priorityB) return priorityA - priorityB;

        // Se mesmo formato, ordenar por dosagem (numérico se possível)
        const parseDosage = (d: string) => {
            const num = parseFloat(d.replace(',', '.'));
            return isNaN(num) ? 0 : num;
        };

        return parseDosage(a.dosage || "0") - parseDosage(b.dosage || "0");
    });
})();

// Lista simples de nomes base para busca (mantido para compatibilidade)
const ALL_MEDICATIONS = MEDICATION_DATABASE.map(m => m.name).sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const MEDICATION_FORMATS = [
    { value: "comprimido", label: "Comprimido" },
    { value: "capsula", label: "Cápsula" },
    { value: "solucao", label: "Solução" },
    { value: "xarope", label: "Xarope" },
    { value: "gotas", label: "Gotas" },
    { value: "injecao", label: "Injeção" },
    { value: "creme", label: "Creme" },
    { value: "pomada", label: "Pomada" },
    { value: "spray", label: "Spray" },
    { value: "adesivo", label: "Adesivo" },
    { value: "supositorio", label: "Supositório" },
    { value: "colirio", label: "Colírio" },
    { value: "suspensao", label: "Suspensão" },
    { value: "bisnaga", label: "Bisnaga" },
    { value: "ampola", label: "Ampola" },
    { value: "refil", label: "Refil" },
    { value: "caneta", label: "Caneta" },
    { value: "aerosol", label: "Aerossol" },
    { value: "capsula inalatoria", label: "Cápsula Inalatória" },
    { value: "sache", label: "Sachê" },
    { value: "enema", label: "Enema" },
];

export const DOSAGE_UNITS = [
    { value: "mg", label: "mg" },
    { value: "g", label: "g" },
    { value: "ml", label: "ml" },
    { value: "gt", label: "gotas" },
    { value: "cps", label: "cápsulas" },
    { value: "cp", label: "comprimidos" },
    { value: "amp", label: "ampola" },
    { value: "ui", label: "UI" },
    { value: "mcg", label: "mcg" },
    { value: "puff", label: "jatos/puffs" },
    { value: "aplicacao", label: "aplicação" },
    { value: "sache", label: "sachê" },
    { value: "adesivo", label: "adesivo" },
    { value: "supositorio", label: "supositório" },
];

export const PRESCRIPTION_TYPES = [
    { value: "padrao", label: "Comum / Livre" },
    { value: "A", label: "A (Amarela e A3)" },
    { value: "B1", label: "B1 (Azul)" },
    { value: "B2", label: "B2 (Azul)" },
    { value: "C1", label: "C1 (Branca)" },
    { value: "C5", label: "C5 (Branca)" },
    { value: "especial", label: "Especial" },
];

export const FREQUENCIES = [
    { value: "Dose única", label: "Dose única" },
    { value: "1x ao dia", label: "1x ao dia" },
    { value: "2x ao dia", label: "2x ao dia" },
    { value: "3x ao dia", label: "3x ao dia" },
    { value: "4x ao dia", label: "4x ao dia" },
    { value: "12h em 12h", label: "12h em 12h" },
    { value: "8h em 8h", label: "8h em 8h" },
    { value: "6h em 6h", label: "6h em 6h" },
    { value: "4h em 4h", label: "4h em 4h" },
    { value: "Quando necessário", label: "Quando necessário" },
    { value: "1x por semana", label: "1x por semana" },
    { value: "1x por mês", label: "1x por mês" },
];

const ADMINISTRATION_ROUTES = [
    { value: "oral", label: "Oral" },
    { value: "sublingual", label: "Sublingual" },
    { value: "injetavel", label: "Injetável" },
    { value: "topico", label: "Tópico" },
    { value: "oftalmico", label: "Oftálmico" },
    { value: "inalatorio", label: "Inalatório" },
    { value: "retal", label: "Retal" },
    { value: "nasal", label: "Nasal" },
    { value: "transdermico", label: "Transdérmico" },
];

const normalizeFormat = (format: string) => {
    if (!format) return "comprimido";
    const lower = format.toLowerCase().trim();

    // Manual overrides for known issues
    const overrides: Record<string, string> = {
        "suspensão": "suspensao",
        "solução": "solucao",
        "cápsula": "capsula",
        "inalatório": "inalatorio",
        "tópico": "topico",
        "supositório": "supositorio",
        "injeção": "injecao",
        "colírio": "colirio",
        "cápsula inalatória": "capsula inalatoria",
        "sachê": "sache",

    };

    if (overrides[lower]) return overrides[lower];

    return lower
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c");
};

const normalizeSuggestionText = (value?: string) =>
    (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c")
        .trim();

const mapSuggestionUnitToDosageUnit = (presentation: MedicationPresentation) => {
    const formatLower = normalizeSuggestionText(presentation.format);
    const unitLower = normalizeSuggestionText(presentation.suggestedUnit || presentation.unit);

    if (formatLower.includes("comprimido")) return "cp";
    if (formatLower.includes("capsula")) return "cps";
    if (formatLower.includes("gota")) return "gt";
    if (formatLower.includes("injecao") || formatLower.includes("ampola")) return "amp";
    if (formatLower.includes("spray") || formatLower.includes("aerossol")) return "puff";
    if (formatLower.includes("sache")) return "sache";
    if (formatLower.includes("adesivo")) return "adesivo";
    if (formatLower.includes("supositorio")) return "supositorio";

    if (unitLower.includes("gota")) return "gt";
    if (unitLower.includes("caps")) return "cps";
    if (unitLower.includes("comprim")) return "cp";
    if (unitLower.includes("amp")) return "amp";
    if (unitLower.includes("jato") || unitLower.includes("puff")) return "puff";
    if (unitLower.includes("aplica")) return "aplicacao";
    if (unitLower.includes("sache")) return "sache";
    if (unitLower.includes("adesivo")) return "adesivo";
    if (unitLower.includes("supositorio") || unitLower.includes("unidade")) return formatLower.includes("supositorio") ? "supositorio" : "cp";
    if (unitLower.includes("ml")) return "ml";
    if (unitLower.includes("mcg")) return "mcg";
    if (unitLower.includes("ui")) return "ui";
    if (unitLower.includes("g")) return unitLower === "g" ? "g" : "mg";
    return "mg";
};

const mapSuggestionFrequency = (presentation: MedicationPresentation, medicationInfo?: MedicationInfo | null) => {
    const commonDose = normalizeSuggestionText(presentation.commonDose);

    if (commonDose.includes("se necessario") || commonDose.includes("quando necessario")) {
        return "Quando necessário";
    }
    if (commonDose.includes("dose unica") || commonDose.includes("dose única") || commonDose.includes("dose unica")) {
        return "Dose única";
    }
    if (commonDose.includes("1x/semana") || commonDose.includes("1x por semana")) {
        return "1x por semana";
    }
    if (commonDose.includes("1x/mes") || commonDose.includes("1x por mes")) {
        return "1x por mês";
    }

    const timesPerDayRangeMatch = commonDose.match(/(\d+)\s*[-–]\s*(\d+)x\/dia/);
    if (timesPerDayRangeMatch) {
        return `${timesPerDayRangeMatch[1]}x ao dia`;
    }

    const hourRangeMatch = commonDose.match(/(\d+)\s*[-–]\s*(\d+)h/);
    if (hourRangeMatch) {
        const largerInterval = Math.max(Number(hourRangeMatch[1]), Number(hourRangeMatch[2]));
        if ([4, 6, 8, 12].includes(largerInterval)) {
            return `${largerInterval}h em ${largerInterval}h`;
        }
    }

    if (commonDose.includes("12/12h")) return "12h em 12h";
    if (commonDose.includes("8/8h")) return "8h em 8h";
    if (commonDose.includes("6/6h")) return "6h em 6h";
    if (commonDose.includes("4/4h")) return "4h em 4h";
    if (commonDose.includes("4x/dia")) return "4x ao dia";
    if (commonDose.includes("3x/dia")) return "3x ao dia";
    if (commonDose.includes("2x/dia")) return "2x ao dia";
    if (commonDose.includes("1x/dia") || commonDose.includes("a noite") || commonDose.includes("a noite")) {
        return "1x ao dia";
    }

    const fallback = medicationInfo?.commonFrequencies?.find((frequency) =>
        FREQUENCIES.some((option) => option.value === frequency)
    );

    return fallback || "";
};

const getSuggestionLowerDose = (presentation: MedicationPresentation) => {
    if (presentation.suggestedDose) {
        return presentation.suggestedDose;
    }

    const commonDose = presentation.commonDose || "";
    const dosageWithUiMatch = commonDose.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*\d+(?:[.,]\d+)?)?\s*ui/i);
    if (dosageWithUiMatch) {
        return dosageWithUiMatch[1].replace(",", ".");
    }

    const genericRangeMatch = commonDose.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?/);
    if (genericRangeMatch) {
        return genericRangeMatch[1].replace(",", ".");
    }

    return "1";
};

const getInsulinUnitsPerContainer = (presentation: MedicationPresentation) => {
    const concentration = Number.parseFloat((presentation.dosage || "").replace(",", "."));
    if (!Number.isFinite(concentration) || concentration <= 0) {
        return 300;
    }

    const formatLower = normalizeSuggestionText(presentation.format);
    if (formatLower.includes("refil") || formatLower.includes("caneta")) {
        return concentration * 3;
    }

    return concentration * 10;
};

export function MedicationDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    mode,
    onRemove,
    isRemovePending,
}: MedicationDialogProps) {
    const isEdit = mode === "edit";
    const [medicationOpen, setMedicationOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [dosagePopoverOpen, setDosagePopoverOpen] = useState(false);
    const [selectedMedInfo, setSelectedMedInfo] = useState<MedicationInfo | null>(null);
    const [selectedSuggestionPresentation, setSelectedSuggestionPresentation] = useState<MedicationPresentation | null>(null);
    const [patientWeight, setPatientWeight] = useState<string>("");

    // Ref para controlar quando ignorar o próximo evento de foco (após seleção)
    const skipNextFocusRef = useRef(false);

    // Fetch custom medications
    const { data: customMedications = [] } = useQuery<CustomMedication[]>({
        queryKey: ["/api/custom-medications"],
    });

    const createCustomMedicationMutation = useMutation({
        mutationFn: async (newMedication: { name: string }) => {
            const res = await apiRequest("POST", "/api/custom-medications", newMedication);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-medications"] });
        },
    });

    const deleteCustomMedicationMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/custom-medications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/custom-medications"] });
        },
    });

    // Função para calcular dose pediátrica baseada no peso
    const calculatePediatricDose = useCallback((pres: MedicationPresentation, weight: number) => {
        if (!pres.isPediatric || !pres.dosePerKg || !pres.concentration || !pres.frequency) {
            return null;
        }

        // Calcula dose diária total em mg
        const dailyDoseLow = pres.dosePerKg * weight;
        const dailyDoseHigh = (pres.dosePerKgMax || pres.dosePerKg) * weight;

        // Limita pela dose máxima diária
        const maxDaily = pres.maxDailyDose || Infinity;
        const effectiveDailyLow = Math.min(dailyDoseLow, maxDaily);
        const effectiveDailyHigh = Math.min(dailyDoseHigh, maxDaily);

        // Dose por administração em mg
        const dosePerAdminLow = effectiveDailyLow / pres.frequency;
        const dosePerAdminHigh = effectiveDailyHigh / pres.frequency;

        // Converte para ml
        const mlPerAdminLow = dosePerAdminLow / pres.concentration;
        const mlPerAdminHigh = dosePerAdminHigh / pres.concentration;

        return {
            dosePerAdminMgLow: Math.round(dosePerAdminLow * 10) / 10,
            dosePerAdminMgHigh: Math.round(dosePerAdminHigh * 10) / 10,
            mlPerAdminLow: Math.round(mlPerAdminLow * 10) / 10,
            mlPerAdminHigh: Math.round(mlPerAdminHigh * 10) / 10,
            frequency: pres.frequency,
        };
    }, []);

    // Watch para o nome do medicamento selecionado
    const selectedMedName = form.watch("name");

    // Atualizar informações do medicamento quando selecionado
    useEffect(() => {
        if (selectedMedName) {
            // Encontrar o item selecionado na lista de apresentações
            const selectedItem = ALL_MEDICATIONS_WITH_PRESENTATIONS.find(
                item => item.displayName === selectedMedName
            );

            // Se encontrar, buscar info do medicamento pelo baseName
            if (selectedItem) {
                const medInfo = MEDICATION_DATABASE.find(
                    m => m.name === selectedItem.baseName
                );
                setSelectedMedInfo(medInfo || null);
            } else {
                // Fallback: tentar buscar diretamente pelo nome (para medicamentos digitados manualmente)
                const medInfo = MEDICATION_DATABASE.find(
                    m => selectedMedName.toLowerCase().includes(m.name.toLowerCase())
                );
                setSelectedMedInfo(medInfo || null);
            }
        } else {
            setSelectedMedInfo(null);
        }
        setSelectedSuggestionPresentation(null);
    }, [selectedMedName]);

    // Filtrar medicamentos baseado na busca - agora usa lista com apresentações + customizados
    const filteredMedications = useMemo(() => {
        const customItems = customMedications.map(m => ({
            displayName: m.name,
            baseName: m.name,
            format: m.format || 'custom',
            prescriptionType: m.prescriptionType || 'padrao',
            isCustom: true,
            id: m.id
        }));

        const allMeds = [...customItems, ...ALL_MEDICATIONS_WITH_PRESENTATIONS] as (MedicationListItem & { isCustom?: boolean })[];

        if (!searchValue) return allMeds;
        const searchLower = searchValue.toLowerCase().trim();

        // Filtrar medicamentos que contenham o termo de busca
        const filtered = allMeds.filter(med =>
            med.displayName.toLowerCase().includes(searchLower) ||
            med.baseName.toLowerCase().includes(searchLower)
        );

        // Ordenar: Customizados primeiro, depois priorizar os que começam com o termo buscado
        return filtered.sort((a, b) => {
            // Prioridade para customizados
            const isCustomA = (a as any).isCustom;
            const isCustomB = (b as any).isCustom;
            if (isCustomA && !isCustomB) return -1;
            if (!isCustomA && isCustomB) return 1;

            const searchLower = searchValue.toLowerCase().trim();
            const aStartsWith = a.baseName.toLowerCase().startsWith(searchLower);
            const bStartsWith = b.baseName.toLowerCase().startsWith(searchLower);

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            // Comparar nomes base
            const nameCompare = a.baseName.localeCompare(b.baseName, 'pt-BR');
            if (nameCompare !== 0) return nameCompare;

            // Se for o mesmo medicamento, ordenar por formato
            const getFormatPriority = (format: string) => {
                const f = format.toLowerCase();
                if (f.includes('comprimido') || f.includes('capsula') || f.includes('cápsula')) return 1;
                if (f.includes('oral') || f.includes('solucao') || f.includes('xarope') || f.includes('gotas')) return 2;
                if (f.includes('topico') || f.includes('creme') || f.includes('pomada')) return 3;
                if (f.includes('oftalmico') || f.includes('colirio')) return 4;
                if (f.includes('nasal') || f.includes('spray') || f.includes('aerosol')) return 5;
                if (f.includes('injetavel') || f.includes('ampola')) return 6;
                return 9;
            };

            const priorityA = getFormatPriority(a.format);
            const priorityB = getFormatPriority(b.format);

            if (priorityA !== priorityB) return priorityA - priorityB;

            // Se mesmo formato, ordenar por dosagem (numérico se possível)
            const parseDosage = (d: string) => {
                const num = parseFloat(d.replace(',', '.'));
                return isNaN(num) ? 0 : num;
            };

            return parseDosage(a.dosage || "0") - parseDosage(b.dosage || "0");
        });
    }, [searchValue, customMedications]);

    // Watch para cálculo automático de quantidade
    const watchedFrequency = form.watch("frequency");
    const watchedFormat = form.watch("format");
    const watchedDosage = form.watch("dosage");

    // Calcular quantidade automaticamente baseada na frequência (para 30 dias)
    useEffect(() => {
        if (!watchedFrequency || !watchedFormat) return;

        const formatLower = (watchedFormat || "").toLowerCase();
        const isSolid = formatLower.includes("comprimido") || formatLower.includes("capsula") || formatLower.includes("cápsula");
        const isLiquid = formatLower.includes("gotas") || formatLower.includes("suspensao") || formatLower.includes("suspensão") ||
            formatLower.includes("solucao") || formatLower.includes("solução") || formatLower.includes("xarope");

        let frequencyMultiplier = 0;
        switch (watchedFrequency) {
            case "1x ao dia": frequencyMultiplier = 30; break;
            case "2x ao dia": frequencyMultiplier = 60; break;
            case "3x ao dia": frequencyMultiplier = 90; break;
            case "4x ao dia": frequencyMultiplier = 120; break;
            case "12h em 12h": frequencyMultiplier = 60; break;
            case "8h em 8h": frequencyMultiplier = 90; break;
            case "6h em 6h": frequencyMultiplier = 120; break;
            case "1x por semana": frequencyMultiplier = 4; break;
            case "1x por mês": frequencyMultiplier = 1; break;
            default:
                form.setValue("quantity", "");
                return; // Não calcular para "Quando necessário" ou outros
        }

        const isInsulinSuggestion = Boolean(
            selectedSuggestionPresentation &&
            normalizeSuggestionText(selectedSuggestionPresentation.unit).includes("ui") &&
            (formatLower.includes("injecao") || formatLower.includes("refil") || formatLower.includes("caneta"))
        );

        if (isInsulinSuggestion) {
            const dailyUnits = Number.parseFloat((watchedDosage || "").replace(",", ".")) || 0;
            const totalMonthlyUI = dailyUnits * frequencyMultiplier;
            const unitsPerContainer = getInsulinUnitsPerContainer(selectedSuggestionPresentation!);
            const totalContainers = Math.max(1, Math.ceil(totalMonthlyUI / unitsPerContainer));

            if (formatLower.includes("refil") || formatLower.includes("caneta")) {
                form.setValue("quantity", `${totalContainers} ${totalContainers === 1 ? "refil/caneta" : "refis/canetas"}`);
            } else {
                form.setValue("quantity", `${totalContainers} ${totalContainers === 1 ? "ampola" : "ampolas"}`);
            }
        } else if (isSolid) {
            // Para sólidos: calcular total de comprimidos/cápsulas
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            const suffix = formatLower.includes("capsula") || formatLower.includes("cápsula") ? "cápsulas" : "comprimidos";
            form.setValue("quantity", `${totalQuantity} ${suffix}`);
        } else if (isLiquid) {
            // Para líquidos: calcular em frascos
            const dosePerTake = parseInt(watchedDosage) || 5;
            const isGotas = formatLower.includes("gotas");

            if (isGotas) {
                // Gotas: frasco geralmente tem 20ml, ~20 gotas/ml = ~400 gotas/frasco
                const totalGotas = dosePerTake * frequencyMultiplier;
                const gotasPorFrasco = 400; // frasco padrão de 20ml, 20 gotas/ml
                const frascos = Math.ceil(totalGotas / gotasPorFrasco);
                form.setValue("quantity", `${frascos} ${frascos === 1 ? 'frasco' : 'frascos'}`);
            } else {
                // Suspensão/Solução: frasco geralmente tem 100ml
                const totalMl = dosePerTake * frequencyMultiplier;
                const frascos = Math.ceil(totalMl / 100); // Assumindo frasco de 100ml
                form.setValue("quantity", `${frascos} ${frascos === 1 ? 'frasco' : 'frascos'}`);
            }
        } else if (formatLower.includes("pomada") || formatLower.includes("creme") || formatLower.includes("gel")) {
            // Tópicos (Tubos/Bisnagas)
            form.setValue("quantity", "1 bisnaga");
        } else if (formatLower.includes("spray") || formatLower.includes("aerosol")) {
            // Sprays
            form.setValue("quantity", "1 frasco");
        } else if (formatLower.includes("capsula inalatoria")) {
            // Cápsulas inalatórias
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} cápsulas`);
        } else if (formatLower.includes("refil") || formatLower.includes("caneta")) {
            // Insulinas
            const dose = parseInt(watchedDosage) || 10;
            // Caneta tem 3ml = 300UI. Se dose diária for X...
            const totalUI = dose * frequencyMultiplier; // Total UI no mês
            const canetas = Math.ceil(totalUI / 300);
            form.setValue("quantity", `${canetas} ${canetas === 1 ? 'caneta/refil' : 'canetas/refis'}`);
        } else if (formatLower.includes("injecao") || formatLower.includes("injeção") || formatLower.includes("ampola")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} ampolas`);
        } else if (formatLower.includes("sache") || formatLower.includes("sachê")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} sachês`);
        } else if (formatLower.includes("adesivo")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} adesivos`);
        } else if (formatLower.includes("supositorio") || formatLower.includes("supositório")) {
            const dosePerTake = parseInt(watchedDosage) || 1;
            const totalQuantity = dosePerTake * frequencyMultiplier;
            form.setValue("quantity", `${totalQuantity} supositórios`);
        } else {
            // Outros formatos: Não preencher automaticamente
        }
    }, [watchedFrequency, watchedFormat, watchedDosage, form, selectedSuggestionPresentation]);

    // Função para aplicar sugestão de dosagem
    const applyDosageSuggestion = useCallback((presentation: MedicationPresentation) => {
        // Marcar para ignorar o próximo foco
        skipNextFocusRef.current = true;

        const formatLower = presentation.format.toLowerCase();
        const mappedUnit = mapSuggestionUnitToDosageUnit(presentation);
        const mappedFrequency = mapSuggestionFrequency(presentation, selectedMedInfo);
        const normalizedDose = getSuggestionLowerDose(presentation);
        const isInsulinSuggestion = normalizeSuggestionText(presentation.unit).includes("ui");

        setSelectedSuggestionPresentation(presentation);

        if (isInsulinSuggestion) {
            form.setValue("dosage", normalizedDose);
            form.setValue("dosageUnit", "ui");
            if (mappedFrequency) {
                form.setValue("frequency", mappedFrequency);
            }
            form.setValue("format", normalizeFormat(presentation.format));
            setDosagePopoverOpen(false);
            setTimeout(() => {
                skipNextFocusRef.current = false;
            }, 200);
            return;
        }

        // Determinar a unidade apropriada baseada no formato
        let unit = mappedUnit;
        if (formatLower.includes('capsula') || formatLower.includes('cápsula')) {
            unit = "cps";
        } else if (formatLower.includes('gotas')) {
            // Para gotas, usar a dose em gotas (ex: 20-40 gotas)
            // Pegar o valor comum da dose se disponível
            if (presentation.commonDose) {
                const match = presentation.commonDose.match(/(\d+)[-–]?(\d+)?/);
                if (match) {
                    form.setValue("dosage", match[1]); // Usa o valor mínimo
                    form.setValue("dosageUnit", mappedUnit);
                    if (mappedFrequency) {
                        form.setValue("frequency", mappedFrequency);
                    }
                    form.setValue("format", normalizeFormat(presentation.format));
                    setDosagePopoverOpen(false);
                    setTimeout(() => { skipNextFocusRef.current = false; }, 200);
                    return;
                }
            }
            unit = "gotas";
            form.setValue("dosage", "20"); // Dose padrão de gotas
        } else if (formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
            formatLower.includes('solucao') || formatLower.includes('solução') ||
            formatLower.includes('xarope')) {
            unit = "ml";
            form.setValue("dosage", "5"); // Dose padrão de líquido
            form.setValue("dosageUnit", mappedUnit);
            if (mappedFrequency) {
                form.setValue("frequency", mappedFrequency);
            }
            form.setValue("format", normalizeFormat(presentation.format));
            setDosagePopoverOpen(false);
            setTimeout(() => { skipNextFocusRef.current = false; }, 200);
            return;
        } else if (formatLower.includes('injecao') || formatLower.includes('injeção') ||
            formatLower.includes('ampola')) {
            unit = "amp";
        } else if (formatLower.includes('spray') || formatLower.includes('aerosol')) {
            unit = "puff";
            let dosage = "1";

            // Tentar extrair dose comum (ex: "1-2 jatos")
            if (presentation.commonDose) {
                const match = presentation.commonDose.match(/(\d+([-–]\d+)?)/);
                if (match) {
                    dosage = match[1];
                }
            }

            form.setValue("dosage", dosage);
            form.setValue("dosageUnit", mappedUnit);
            if (mappedFrequency) {
                form.setValue("frequency", mappedFrequency);
            }
            form.setValue("format", normalizeFormat(presentation.format));
            setDosagePopoverOpen(false);
            setTimeout(() => { skipNextFocusRef.current = false; }, 200);
            return;
        }

        // Para formas sólidas (comprimido, cápsula) e injetáveis, usar "1" como dose padrão
        form.setValue("dosage", "1");
        form.setValue("dosageUnit", unit);
        if (mappedFrequency) {
            form.setValue("frequency", mappedFrequency);
        }
        form.setValue("format", normalizeFormat(presentation.format));
        setDosagePopoverOpen(false);

        // Resetar o flag após um curto delay
        setTimeout(() => {
            skipNextFocusRef.current = false;
        }, 200);
    }, [form, selectedMedInfo]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar Medicamento" : "Adicionar Medicamento de Uso Contínuo"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Atualize as informações do medicamento"
                            : "Registre um medicamento que você usa regularmente"}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome do Medicamento */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Nome do Medicamento *</FormLabel>
                                    <div className="relative w-full">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={medicationOpen}
                                            onClick={() => setMedicationOpen(!medicationOpen)}
                                            className={cn(
                                                "w-full justify-between font-normal h-10",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="flex-1 flex items-center gap-2">
                                                {field.value || "Selecione o medicamento"}
                                                {(() => {
                                                    const val = (field.value || "").toLowerCase().trim();
                                                    const isStandard = ALL_MEDICATIONS_WITH_PRESENTATIONS.some(
                                                        m => m.displayName.toLowerCase() === val || m.baseName.toLowerCase() === val
                                                    );
                                                    const isCustom = customMedications.some(m => m.name.toLowerCase() === val) || !isStandard;

                                                    if (isCustom && val) {
                                                        return (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                Personalizado
                                                            </Badge>
                                                        );
                                                    }

                                                    if (selectedMedInfo?.prescriptionType && (selectedMedInfo.prescriptionType as string) !== 'common' && (selectedMedInfo.prescriptionType as string) !== 'padrao') {
                                                        return <PrescriptionTypeBadge type={selectedMedInfo.prescriptionType} />;
                                                    }
                                                    return null;
                                                })()}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                        
                                        {medicationOpen && (
                                            <div 
                                                className="absolute left-0 right-0 mt-1 rounded-md border shadow-md overflow-hidden flex flex-col z-[99999]"
                                                style={{ top: '100%', backgroundColor: 'white' }}
                                            >
                                            <div className="flex items-center border-b px-3">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <input
                                                    className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Buscar medicamento..."
                                                    value={searchValue}
                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                />
                                            </div>
                                            <div
                                                className="max-h-[300px] overflow-y-auto p-1"
                                                onWheel={(e) => {
                                                    e.stopPropagation();
                                                    const target = e.currentTarget;
                                                    target.scrollTop += e.deltaY;
                                                }}
                                            >
                                                <div className="pr-2">
                                                    {/* Opção de digitar manualmente - sempre visível se houver busca */}
                                                    {searchValue && (
                                                        <div
                                                            className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b mb-1 bg-gradient-to-r from-blue-50 to-transparent"
                                                            onClick={() => {
                                                                field.onChange(searchValue);

                                                                // Auto-save as custom medication if not exists
                                                                const exists = customMedications.some(m => m.name?.toLowerCase() === searchValue.toLowerCase()) ||
                                                                    ALL_MEDICATIONS_WITH_PRESENTATIONS.some(m => (m as any).name?.toLowerCase() === searchValue.toLowerCase());

                                                                if (!exists) {
                                                                    createCustomMedicationMutation.mutate({ name: searchValue });
                                                                }

                                                                // Limpar campos para preenchimento manual
                                                                form.setValue("dosage", "");
                                                                form.setValue("frequency", "");
                                                                form.setValue("quantity", "");
                                                                form.setValue("format", "");
                                                                form.setValue("dosageUnit", "mg");
                                                                setMedicationOpen(false);
                                                                setSearchValue("");
                                                            }}
                                                        >
                                                            <span className="text-blue-600">✏️</span>
                                                            <span className="flex-1 text-blue-700 font-medium">
                                                                Digitar manualmente: "{searchValue}"
                                                            </span>
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                Personalizado
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {filteredMedications.length === 0 ? (
                                                        <div className="py-6 text-center text-sm">
                                                            <p>Nenhum medicamento encontrado.</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {filteredMedications.map((medItem) => (
                                                                <div
                                                                    key={medItem.displayName}
                                                                    className={cn(
                                                                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                                                        field.value === medItem.displayName && "bg-accent"
                                                                    )}
                                                                    onClick={() => {
                                                                        // Definir o nome completo com concentração
                                                                        field.onChange(medItem.displayName);

                                                                        // Limpar campos ao trocar de medicamento
                                                                        form.setValue("dosage", "");
                                                                        form.setValue("frequency", "");
                                                                        form.setValue("quantity", "");

                                                                        // Auto-preencher formato
                                                                        if (medItem.format) {
                                                                            form.setValue("format", medItem.format);

                                                                            // Auto-preencher unidade baseada no formato
                                                                            const formatLower = medItem.format.toLowerCase();
                                                                            if (formatLower.includes('comprimido')) {
                                                                                form.setValue("dosageUnit", "cp");
                                                                            } else if (formatLower.includes('capsula') || formatLower.includes('cápsula')) {
                                                                                form.setValue("dosageUnit", "cps");
                                                                            } else if (formatLower.includes('gotas')) {
                                                                                form.setValue("dosageUnit", "gt");
                                                                            } else if (formatLower.includes('suspensao') || formatLower.includes('suspensão') ||
                                                                                formatLower.includes('solucao') || formatLower.includes('solução') ||
                                                                                formatLower.includes('xarope')) {
                                                                                form.setValue("dosageUnit", "ml");
                                                                            } else if (formatLower.includes('injecao') || formatLower.includes('injeção') ||
                                                                                formatLower.includes('ampola')) {
                                                                                form.setValue("dosageUnit", "amp");
                                                                            }
                                                                        }
                                                                        // Auto-preencher tipo de receituário
                                                                        if (medItem.prescriptionType) {
                                                                            form.setValue("prescriptionType", medItem.prescriptionType);
                                                                        }
                                                                        // Buscar info completa para via de administração
                                                                        const medInfo = MEDICATION_DATABASE.find(m => m.name === medItem.baseName);
                                                                        if (medInfo?.route) {
                                                                            form.setValue("administrationRoute", medInfo.route);
                                                                        }
                                                                        setMedicationOpen(false);
                                                                        setSearchValue("");
                                                                    }}
                                                                >
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-base">
                                                                        {getMedicationIcon(medItem.format || 'comprimido')}
                                                                    </div>
                                                                    <span className="flex-1">{medItem.displayName}</span>
                                                                    {(medItem as any).isCustom && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">
                                                                            Personalizado
                                                                        </Badge>
                                                                    )}
                                                                    {(medItem.prescriptionType && (medItem.prescriptionType as string) !== 'common' && (medItem.prescriptionType as string) !== 'padrao') && (
                                                                        <PrescriptionTypeBadge type={medItem.prescriptionType} />
                                                                    )}

                                                                    {(medItem as any).isCustom && (
                                                                        <div
                                                                            role="button"
                                                                            className="ml-auto p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteCustomMedicationMutation.mutate((medItem as any).id);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            </div>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formato *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o formato" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MEDICATION_FORMATS.map((format) => (
                                                        <SelectItem key={format.value} value={format.value}>
                                                            {format.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="administrationRoute"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Via de Administração *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value || "oral"}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a via" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ADMINISTRATION_ROUTES.map((route) => (
                                                        <SelectItem key={route.value} value={route.value}>
                                                            {route.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Dosagem com Popup de Sugestões */}
                            <FormField
                                control={form.control}
                                name="dosage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dose por vez *</FormLabel>
                                        <Popover open={dosagePopoverOpen} onOpenChange={setDosagePopoverOpen} modal={true}>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Ex: 6, 10, 1"
                                                        className="pr-8"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500 hover:text-yellow-600 transition-colors"
                                                        onClick={() => {
                                                            if (selectedMedInfo) setDosagePopoverOpen(true);
                                                        }}
                                                        title="Ver sugestões de dose"
                                                    >
                                                        <Sparkles className="h-4 w-4 fill-yellow-500" />
                                                    </button>
                                                </PopoverTrigger>
                                            </div>
                                            {selectedMedInfo && (
                                                <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
                                                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-2 border-b">
                                                        <div className="flex items-center gap-2 text-amber-700">
                                                            <Sparkles className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                            <span className="font-medium text-sm">Sugestão IA</span>
                                                            <Badge variant="outline" className="text-xs ml-auto">{selectedMedInfo.category}</Badge>
                                                        </div>
                                                    </div>

                                                    <div className="p-2 max-h-[280px] overflow-y-auto">
                                                        {/* Apresentações para adultos */}
                                                        {selectedMedInfo.presentations.filter(p => !p.isPediatric).length > 0 && (
                                                            <>
                                                                {selectedMedInfo.presentations.filter(p => !p.isPediatric).map((pres, idx) => (
                                                                    <div
                                                                        key={`adult-${idx}`}
                                                                        className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            applyDosageSuggestion(pres);
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <span className="font-semibold text-gray-900">{pres.dosage}{pres.unit}</span>
                                                                            <span className="text-gray-500 ml-2 text-sm">
                                                                                ({MEDICATION_FORMATS.find(f => f.value === pres.format)?.label || pres.format})
                                                                            </span>
                                                                        </div>
                                                                        {pres.commonDose && (
                                                                            <span className="text-xs text-gray-500">{pres.commonDose}</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}

                                                        {/* Seção pediátrica com campo de peso integrado */}
                                                        {selectedMedInfo.presentations.filter(p => p.isPediatric).length > 0 && (
                                                            <div className="mt-2 pt-2 border-t">
                                                                <div className="flex items-center justify-between px-2 py-1">
                                                                    <span className="text-xs text-purple-600 font-medium">👶 Pediátrico</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Peso"
                                                                            value={patientWeight}
                                                                            onChange={(e) => setPatientWeight(e.target.value)}
                                                                            className="h-6 w-16 text-xs px-2"
                                                                            min="0"
                                                                            step="0.1"
                                                                        />
                                                                        <span className="text-xs text-gray-500">kg</span>
                                                                    </div>
                                                                </div>
                                                                {selectedMedInfo.presentations.filter(p => p.isPediatric).map((pres, idx) => {
                                                                    const weight = parseFloat(patientWeight);
                                                                    const calculation = weight > 0 ? calculatePediatricDose(pres, weight) : null;

                                                                    return (
                                                                        <div
                                                                            key={`ped-${idx}`}
                                                                            className="p-2 rounded-md cursor-pointer hover:bg-purple-50 transition-colors border-l-2 border-purple-200 ml-2 mt-1"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (calculation) {
                                                                                    form.setValue("dosage", `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}`);
                                                                                    form.setValue("dosageUnit", "ml");
                                                                                    setSelectedSuggestionPresentation(pres);
                                                                                    const mappedFrequency = mapSuggestionFrequency(pres, selectedMedInfo);
                                                                                    if (mappedFrequency) {
                                                                                        form.setValue("frequency", mappedFrequency);
                                                                                    }
                                                                                    form.setValue("format", normalizeFormat(pres.format));
                                                                                    skipNextFocusRef.current = true;
                                                                                    setDosagePopoverOpen(false);
                                                                                    setTimeout(() => { skipNextFocusRef.current = false; }, 200);
                                                                                } else {
                                                                                    applyDosageSuggestion(pres);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="font-semibold text-gray-900 text-sm">{pres.dosage}</span>
                                                                                    {pres.format && (
                                                                                        <span className="text-gray-500 font-normal text-xs">
                                                                                            ({MEDICATION_FORMATS.find(f => f.value === pres.format)?.label || pres.format})
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {calculation ? (
                                                                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                                                        {calculation.mlPerAdminLow === calculation.mlPerAdminHigh
                                                                                            ? `${calculation.mlPerAdminLow}ml`
                                                                                            : `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}ml`
                                                                                        } / dose
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs text-purple-400 italic">informe peso</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">{pres.commonDose}</div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedMedInfo.notes && (
                                                        <div className="bg-amber-50 p-2 border-t flex items-start gap-2">
                                                            <Lightbulb className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-xs text-amber-700">{selectedMedInfo.notes}</span>
                                                        </div>
                                                    )}

                                                    {/* Disclaimer */}
                                                    <div className="bg-gray-50 p-2 border-t">
                                                        <p className="text-[10px] text-gray-400 text-center leading-tight">
                                                            ⚕️ Sugestões baseadas em referências gerais. Confirme a posologia conforme protocolo institucional e avaliação clínica.
                                                        </p>
                                                    </div>
                                                </PopoverContent>
                                            )}
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dosageUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidade *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DOSAGE_UNITS.map((unit) => (
                                                        <SelectItem key={unit.value} value={unit.value}>
                                                            {unit.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequência *</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a frequência" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FREQUENCIES.map((freq) => (
                                                        <SelectItem key={freq.value} value={freq.value}>
                                                            {freq.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prescriptionType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Receita</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value || "padrao"}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRESCRIPTION_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantidade (para 30 dias)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: 60 comprimidos"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Início *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                        </div>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Adicione observações sobre o medicamento..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className={isEdit ? "flex justify-between gap-3" : "flex justify-end gap-3"}>
                            {isEdit && onRemove && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => onRemove()}
                                    disabled={isRemovePending}
                                >
                                    {isRemovePending ? "Removendo..." : "Remover Medicamento"}
                                </Button>
                            )}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending
                                        ? isEdit
                                            ? "Salvando..."
                                            : "Adicionando..."
                                        : isEdit
                                            ? "Salvar Alterações"
                                            : "Adicionar Medicamento"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
