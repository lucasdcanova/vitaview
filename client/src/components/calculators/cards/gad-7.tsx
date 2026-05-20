import { useState, useMemo } from "react";
import { CalcLayout, ResultBlock, ScaleQuestion } from "./shared";

const QUESTIONS = [
    "Sentir-se nervoso(a), ansioso(a) ou no limite",
    "Não conseguir parar ou controlar as preocupações",
    "Preocupar-se demais com diversas coisas",
    "Dificuldade para relaxar",
    "Ficar tão inquieto(a) que é difícil permanecer parado(a)",
    "Ficar facilmente irritado(a) ou aborrecido(a)",
    "Sentir medo, como se algo ruim fosse acontecer",
];

const OPTIONS = [
    { value: 0, label: "Nenhuma vez" },
    { value: 1, label: "Vários dias" },
    { value: 2, label: ">½ dos dias" },
    { value: 3, label: "Quase todos" },
];

function classify(score: number) {
    if (score <= 4) return { label: "Sintomas mínimos", tone: "good" as const };
    if (score <= 9) return { label: "Ansiedade leve", tone: "warn" as const };
    if (score <= 14) return { label: "Ansiedade moderada", tone: "warn" as const };
    return { label: "Ansiedade grave", tone: "bad" as const };
}

export function Gad7Calculator() {
    const [answers, setAnswers] = useState<(number | null)[]>(() => Array(7).fill(null));

    const { score, complete, classification } = useMemo(() => {
        const filled = answers.filter((v) => v != null) as number[];
        const complete = filled.length === QUESTIONS.length;
        const score = filled.reduce((acc, v) => acc + v, 0);
        return { score, complete, classification: classify(score) };
    }, [answers]);

    const setAt = (idx: number, v: number) => {
        setAnswers((prev) => {
            const next = [...prev];
            next[idx] = v;
            return next;
        });
    };

    return (
        <CalcLayout
            title="GAD-7 — Generalized Anxiety Disorder"
            subtitle="Rastreio e gravidade de transtorno de ansiedade. Período: últimas 2 semanas."
            result={
                <ResultBlock
                    label={complete ? "Pontuação" : "Parcial"}
                    value={`${score} / 21`}
                    interpretation={complete ? classification.label : `${QUESTIONS.length - answers.filter((v) => v != null).length} pergunta(s) pendente(s).`}
                    tone={complete ? classification.tone : "neutral"}
                />
            }
        >
            <p className="text-xs text-muted-foreground">
                Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:
            </p>
            {QUESTIONS.map((q, idx) => (
                <ScaleQuestion
                    key={idx}
                    label={`${idx + 1}. ${q}`}
                    value={answers[idx]}
                    onChange={(v) => setAt(idx, v)}
                    options={OPTIONS}
                />
            ))}
        </CalcLayout>
    );
}
