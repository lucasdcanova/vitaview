import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Calculator as CalculatorIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { BmiCalculator } from "./cards/bmi";
import { GestationalAgeCalculator } from "./cards/gestational-age";
import { CkdEpiCalculator } from "./cards/ckd-epi";
import { Cha2ds2VascCalculator } from "./cards/cha2ds2-vasc";
import { HasBledCalculator } from "./cards/has-bled";
import { Curb65Calculator } from "./cards/curb-65";
import { Phq9Calculator } from "./cards/phq-9";
import { Gad7Calculator } from "./cards/gad-7";
import { BodySurfaceCalculator } from "./cards/body-surface";
import { HomaIrCalculator } from "./cards/homa-ir";
import { LdlFriedewaldCalculator } from "./cards/ldl-friedewald";
import { WaistHipCalculator } from "./cards/waist-hip";
import { KatzCalculator } from "./cards/katz";
import { LawtonCalculator } from "./cards/lawton";
import { Gds15Calculator } from "./cards/gds-15";

type CalculatorEntry = {
    id: string;
    name: string;
    category: string;
    description: string;
    keywords: string[];
    Component: () => JSX.Element;
};

const CALCULATORS: CalculatorEntry[] = [
    {
        id: "bmi",
        name: "IMC",
        category: "Antropometria",
        description: "Índice de massa corporal e classificação nutricional",
        keywords: ["imc", "bmi", "peso", "altura", "obesidade", "sobrepeso"],
        Component: BmiCalculator,
    },
    {
        id: "bsa",
        name: "Superfície corporal",
        category: "Antropometria",
        description: "Mosteller e DuBois (cálculo de dose por m²)",
        keywords: ["sc", "bsa", "superfície", "mosteller", "dubois"],
        Component: BodySurfaceCalculator,
    },
    {
        id: "waist-hip",
        name: "Razão cintura-quadril",
        category: "Antropometria",
        description: "Avaliação de risco metabólico",
        keywords: ["cintura", "quadril", "rcq"],
        Component: WaistHipCalculator,
    },
    {
        id: "gestational-age",
        name: "Idade gestacional / DPP",
        category: "Ginecologia & Obstetrícia",
        description: "Cálculo por DUM ou ultrassonografia",
        keywords: ["ig", "dpp", "dum", "gestação", "obstetrícia"],
        Component: GestationalAgeCalculator,
    },
    {
        id: "ckd-epi",
        name: "CKD-EPI 2021",
        category: "Nefrologia",
        description: "Taxa de filtração glomerular estimada (TFGe)",
        keywords: ["tfg", "ckd", "creatinina", "rim", "função renal"],
        Component: CkdEpiCalculator,
    },
    {
        id: "cha2ds2-vasc",
        name: "CHA₂DS₂-VASc",
        category: "Cardiologia",
        description: "Risco de AVC em fibrilação atrial",
        keywords: ["chads", "fa", "fibrilação", "avc", "anticoagulação"],
        Component: Cha2ds2VascCalculator,
    },
    {
        id: "has-bled",
        name: "HAS-BLED",
        category: "Cardiologia",
        description: "Risco de sangramento em pacientes anticoagulados",
        keywords: ["hasbled", "sangramento", "anticoagulante"],
        Component: HasBledCalculator,
    },
    {
        id: "curb-65",
        name: "CURB-65",
        category: "Pneumologia",
        description: "Gravidade de pneumonia comunitária — decisão ambulatorial",
        keywords: ["curb", "pneumonia", "pac"],
        Component: Curb65Calculator,
    },
    {
        id: "ldl-friedewald",
        name: "LDL (Friedewald)",
        category: "Metabolismo & Endocrinologia",
        description: "Cálculo de LDL-colesterol",
        keywords: ["ldl", "colesterol", "friedewald", "lipidograma"],
        Component: LdlFriedewaldCalculator,
    },
    {
        id: "homa-ir",
        name: "HOMA-IR / HOMA-β",
        category: "Metabolismo & Endocrinologia",
        description: "Resistência e função das células β",
        keywords: ["homa", "insulina", "resistência insulínica"],
        Component: HomaIrCalculator,
    },
    {
        id: "phq-9",
        name: "PHQ-9",
        category: "Saúde mental",
        description: "Rastreio e gravidade de depressão",
        keywords: ["phq", "depressão", "rastreio"],
        Component: Phq9Calculator,
    },
    {
        id: "gad-7",
        name: "GAD-7",
        category: "Saúde mental",
        description: "Rastreio e gravidade de ansiedade",
        keywords: ["gad", "ansiedade", "rastreio"],
        Component: Gad7Calculator,
    },
    {
        id: "katz",
        name: "Katz (ABVD)",
        category: "Geriatria",
        description: "Atividades básicas de vida diária",
        keywords: ["katz", "abvd", "funcionalidade", "independência", "idoso"],
        Component: KatzCalculator,
    },
    {
        id: "lawton",
        name: "Lawton-Brody (AIVD)",
        category: "Geriatria",
        description: "Atividades instrumentais de vida diária",
        keywords: ["lawton", "brody", "aivd", "funcionalidade", "idoso"],
        Component: LawtonCalculator,
    },
    {
        id: "gds-15",
        name: "GDS-15",
        category: "Geriatria",
        description: "Escala de depressão geriátrica (Yesavage)",
        keywords: ["gds", "yesavage", "depressão", "geriátrica", "idoso"],
        Component: Gds15Calculator,
    },
];

interface CalculatorsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CalculatorsDialog({ open, onOpenChange }: CalculatorsDialogProps) {
    const isMobile = useIsMobile();
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string>(CALCULATORS[0].id);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return CALCULATORS;
        return CALCULATORS.filter((c) => {
            const haystack = [
                c.name,
                c.category,
                c.description,
                ...c.keywords,
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(term);
        });
    }, [search]);

    const grouped = useMemo(() => {
        const map = new Map<string, CalculatorEntry[]>();
        for (const calc of filtered) {
            const list = map.get(calc.category) ?? [];
            list.push(calc);
            map.set(calc.category, list);
        }
        return Array.from(map.entries());
    }, [filtered]);

    const selected = CALCULATORS.find((c) => c.id === selectedId) ?? CALCULATORS[0];
    const SelectedComponent = selected.Component;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "max-w-5xl w-[95vw] p-0 gap-0 overflow-hidden",
                    isMobile ? "h-[92vh]" : "h-[85vh]"
                )}
            >
                <DialogHeader className="px-6 py-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <CalculatorIcon className="h-5 w-5" />
                        Calculadoras médicas
                    </DialogTitle>
                    <DialogDescription>
                        Ferramentas rápidas para avaliação ambulatorial.
                    </DialogDescription>
                </DialogHeader>

                {isMobile ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="px-4 pt-3 pb-2 border-b border-border">
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CALCULATORS.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} <span className="text-xs text-muted-foreground">— {c.category}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <SelectedComponent />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        <aside className="w-72 border-r border-border bg-muted/30 flex flex-col">
                            <div className="p-3 border-b border-border">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar calculadora..."
                                        className="pl-8 h-9"
                                    />
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-3">
                                    {grouped.length === 0 ? (
                                        <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                                            Nenhuma calculadora encontrada
                                        </p>
                                    ) : (
                                        grouped.map(([category, items]) => (
                                            <div key={category} className="space-y-0.5">
                                                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                                    {category}
                                                </p>
                                                {items.map((c) => {
                                                    const isActive = c.id === selectedId;
                                                    return (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => setSelectedId(c.id)}
                                                            className={cn(
                                                                "w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors",
                                                                isActive
                                                                    ? "bg-primary/10 text-primary font-medium"
                                                                    : "hover:bg-accent text-foreground"
                                                            )}
                                                        >
                                                            {c.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </aside>
                        <main className="flex-1 overflow-y-auto p-6">
                            <SelectedComponent />
                        </main>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
