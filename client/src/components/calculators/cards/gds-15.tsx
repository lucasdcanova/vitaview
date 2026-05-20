import { useState, useMemo } from "react";
import { CalcLayout, ResultBlock, YesNoToggle } from "./shared";

type Question = { id: number; text: string; positive: "sim" | "nao" };

const QUESTIONS: Question[] = [
    { id: 1, text: "Está satisfeito(a) com sua vida?", positive: "nao" },
    { id: 2, text: "Diminuiu a maior parte de suas atividades e interesses?", positive: "sim" },
    { id: 3, text: "Sente que a vida está vazia?", positive: "sim" },
    { id: 4, text: "Aborrece-se com frequência?", positive: "sim" },
    { id: 5, text: "Sente-se de bom humor a maior parte do tempo?", positive: "nao" },
    { id: 6, text: "Teme que algo de ruim possa lhe acontecer?", positive: "sim" },
    { id: 7, text: "Sente-se feliz a maior parte do tempo?", positive: "nao" },
    { id: 8, text: "Sente-se frequentemente desamparado(a)?", positive: "sim" },
    { id: 9, text: "Prefere ficar em casa a sair e fazer coisas novas?", positive: "sim" },
    { id: 10, text: "Acha que tem mais problemas de memória do que a maioria?", positive: "sim" },
    { id: 11, text: "Acha bom estar vivo(a) agora?", positive: "nao" },
    { id: 12, text: "Sente-se inútil nas atuais condições?", positive: "sim" },
    { id: 13, text: "Sente-se cheio(a) de energia?", positive: "nao" },
    { id: 14, text: "Acha que a sua situação é sem esperança?", positive: "sim" },
    { id: 15, text: "Acha que a maioria das pessoas está em melhor situação que você?", positive: "sim" },
];

export function Gds15Calculator() {
    const [answers, setAnswers] = useState<Record<number, "sim" | "nao" | null>>(
        () => Object.fromEntries(QUESTIONS.map((q) => [q.id, null])) as Record<number, "sim" | "nao" | null>
    );

    const { score, answered, label, tone } = useMemo(() => {
        let score = 0;
        let answered = 0;
        for (const q of QUESTIONS) {
            const a = answers[q.id];
            if (a == null) continue;
            answered += 1;
            if (a === q.positive) score += 1;
        }

        let label = "";
        let tone: "good" | "warn" | "bad" = "good";
        if (answered < QUESTIONS.length) {
            label = `${QUESTIONS.length - answered} pergunta(s) pendente(s).`;
            tone = "warn";
        } else if (score <= 4) {
            label = "Sem indício de depressão.";
            tone = "good";
        } else if (score <= 9) {
            label = "Depressão leve a moderada.";
            tone = "warn";
        } else {
            label = "Depressão grave.";
            tone = "bad";
        }

        return { score, answered, label, tone };
    }, [answers]);

    return (
        <CalcLayout
            title="GDS-15 — Escala de Depressão Geriátrica"
            subtitle="Rastreio de sintomas depressivos em idosos. Período: última semana."
            result={
                <ResultBlock
                    label={answered === QUESTIONS.length ? "Pontuação" : "Parcial"}
                    value={`${score} / 15`}
                    interpretation={label}
                    tone={tone}
                />
            }
        >
            <p className="text-xs text-muted-foreground">
                Responda pensando em como se sentiu durante a última semana:
            </p>
            {QUESTIONS.map((q) => {
                const a = answers[q.id];
                const value = a == null ? null : a === "sim";
                return (
                    <YesNoToggle
                        key={q.id}
                        label={`${q.id}. ${q.text}`}
                        value={value}
                        onChange={(v) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: v ? "sim" : "nao" }))
                        }
                    />
                );
            })}
        </CalcLayout>
    );
}
