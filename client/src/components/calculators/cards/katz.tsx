import { useState, useMemo } from "react";
import { CalcLayout, ResultBlock, YesNoToggle } from "./shared";

const ITEMS: { key: string; label: string; hint: string }[] = [
    {
        key: "bath",
        label: "Banho",
        hint: "Toma banho sozinho ou precisa de ajuda apenas para uma parte do corpo",
    },
    {
        key: "dress",
        label: "Vestir-se",
        hint: "Pega as roupas e se veste sem ajuda (exceto amarrar sapatos)",
    },
    {
        key: "toilet",
        label: "Higiene íntima",
        hint: "Vai ao banheiro, se limpa e se veste sem ajuda",
    },
    {
        key: "transfer",
        label: "Transferência",
        hint: "Senta, levanta da cama/cadeira sem ajuda (auxílio mecânico permitido)",
    },
    {
        key: "continence",
        label: "Continência",
        hint: "Controle total sobre micção e evacuação",
    },
    {
        key: "feeding",
        label: "Alimentação",
        hint: "Alimenta-se sem ajuda (pode haver preparo prévio)",
    },
];

export function KatzCalculator() {
    const [state, setState] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(ITEMS.map((i) => [i.key, true]))
    );

    const { score, label, tone } = useMemo(() => {
        const score = ITEMS.reduce((acc, i) => acc + (state[i.key] ? 1 : 0), 0);
        let label = "";
        let tone: "good" | "warn" | "bad" = "good";
        if (score === 6) {
            label = "Independente para todas as ABVD.";
            tone = "good";
        } else if (score >= 4) {
            label = "Dependência parcial / moderada.";
            tone = "warn";
        } else if (score >= 2) {
            label = "Dependência importante.";
            tone = "bad";
        } else {
            label = "Dependência total para as ABVD.";
            tone = "bad";
        }
        return { score, label, tone };
    }, [state]);

    return (
        <CalcLayout
            title="Índice de Katz — ABVD"
            subtitle="Atividades básicas de vida diária. Pontuação 0–6 (independente)."
            result={
                <ResultBlock
                    label="Pontuação"
                    value={`${score} / 6`}
                    interpretation={label}
                    tone={tone}
                />
            }
        >
            {ITEMS.map((item) => (
                <YesNoToggle
                    key={item.key}
                    label={`${item.label} — independente?`}
                    value={state[item.key]}
                    onChange={(v) =>
                        setState((prev) => ({ ...prev, [item.key]: v }))
                    }
                    hint={item.hint}
                />
            ))}
        </CalcLayout>
    );
}
