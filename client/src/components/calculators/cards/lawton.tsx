import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalcLayout, ResultBlock } from "./shared";

type Option = { label: string; score: 0 | 1 };
type Item = { key: string; label: string; options: Option[] };

const ITEMS: Item[] = [
    {
        key: "phone",
        label: "Uso do telefone",
        options: [
            { label: "Usa o telefone por iniciativa própria", score: 1 },
            { label: "Disca apenas números conhecidos", score: 1 },
            { label: "Atende, mas não disca", score: 1 },
            { label: "Não usa o telefone", score: 0 },
        ],
    },
    {
        key: "shopping",
        label: "Compras",
        options: [
            { label: "Realiza todas as compras de forma independente", score: 1 },
            { label: "Faz pequenas compras independentemente", score: 0 },
            { label: "Faz compras apenas acompanhado(a)", score: 0 },
            { label: "Totalmente incapaz", score: 0 },
        ],
    },
    {
        key: "cooking",
        label: "Preparo de refeições",
        options: [
            { label: "Planeja, prepara e serve refeições adequadamente", score: 1 },
            { label: "Prepara refeições se os ingredientes forem fornecidos", score: 0 },
            { label: "Aquece e serve refeições preparadas", score: 0 },
            { label: "Precisa que alguém prepare e sirva as refeições", score: 0 },
        ],
    },
    {
        key: "housework",
        label: "Tarefas domésticas",
        options: [
            { label: "Mantém a casa sozinho(a) (ajuda ocasional para tarefas pesadas)", score: 1 },
            { label: "Realiza tarefas leves (louça, arrumar cama)", score: 1 },
            { label: "Tarefas leves, mas não mantém padrão de limpeza", score: 1 },
            { label: "Precisa de ajuda em todas as tarefas", score: 1 },
            { label: "Não participa de nenhuma tarefa doméstica", score: 0 },
        ],
    },
    {
        key: "laundry",
        label: "Lavanderia",
        options: [
            { label: "Lava toda a sua roupa", score: 1 },
            { label: "Lava apenas peças pequenas", score: 1 },
            { label: "Necessita de outras pessoas", score: 0 },
        ],
    },
    {
        key: "transport",
        label: "Transporte",
        options: [
            { label: "Dirige ou usa transporte público de forma independente", score: 1 },
            { label: "Usa táxi mas não transporte público", score: 1 },
            { label: "Usa transporte público se acompanhado(a)", score: 1 },
            { label: "Só viaja em carro de outras pessoas, acompanhado(a)", score: 0 },
            { label: "Não viaja", score: 0 },
        ],
    },
    {
        key: "meds",
        label: "Medicamentos",
        options: [
            { label: "Toma os medicamentos no horário e dose corretos", score: 1 },
            { label: "Toma corretamente se preparados em doses separadas", score: 0 },
            { label: "Incapaz de gerenciar a medicação", score: 0 },
        ],
    },
    {
        key: "finance",
        label: "Finanças",
        options: [
            { label: "Gerencia finanças (contas, banco, etc.) independentemente", score: 1 },
            { label: "Gerencia despesas diárias mas precisa de ajuda em transações maiores", score: 1 },
            { label: "Incapaz de lidar com dinheiro", score: 0 },
        ],
    },
];

export function LawtonCalculator() {
    const [selection, setSelection] = useState<Record<string, number>>(() =>
        Object.fromEntries(ITEMS.map((i) => [i.key, 0]))
    );

    const { score, complete, label, tone } = useMemo(() => {
        let total = 0;
        for (const item of ITEMS) {
            const idx = selection[item.key];
            const opt = item.options[idx];
            if (opt) total += opt.score;
        }

        let label = "";
        let tone: "good" | "warn" | "bad" = "good";
        if (total >= 7) {
            label = "Independente para AIVD.";
            tone = "good";
        } else if (total >= 4) {
            label = "Dependência parcial.";
            tone = "warn";
        } else {
            label = "Dependência importante para AIVD.";
            tone = "bad";
        }

        return { score: total, complete: true, label, tone };
    }, [selection]);

    return (
        <CalcLayout
            title="Lawton-Brody — AIVD"
            subtitle="Atividades instrumentais de vida diária. Pontuação 0–8 (totalmente independente)."
            result={
                <ResultBlock
                    label="Pontuação"
                    value={`${score} / 8`}
                    interpretation={label}
                    tone={tone}
                />
            }
        >
            {ITEMS.map((item) => (
                <div key={item.key} className="space-y-1.5">
                    <Label htmlFor={`lawton-${item.key}`}>{item.label}</Label>
                    <Select
                        value={String(selection[item.key])}
                        onValueChange={(v) =>
                            setSelection((prev) => ({ ...prev, [item.key]: Number(v) }))
                        }
                    >
                        <SelectTrigger id={`lawton-${item.key}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {item.options.map((opt, idx) => (
                                <SelectItem key={idx} value={String(idx)}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ))}
        </CalcLayout>
    );
}
