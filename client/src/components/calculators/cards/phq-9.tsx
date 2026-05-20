import { useState, useMemo } from "react";
import { CalcLayout, ResultBlock, ScaleQuestion } from "./shared";

const QUESTIONS = [
    "Pouco interesse ou prazer em fazer as coisas",
    "Sentir-se para baixo, deprimido(a) ou sem esperança",
    "Dificuldade para pegar no sono, permanecer dormindo ou dormir demais",
    "Sentir-se cansado(a) ou com pouca energia",
    "Falta de apetite ou comendo demais",
    "Sentir-se mal consigo mesmo(a), ou que é um fracasso ou que decepcionou sua família",
    "Dificuldade de concentração",
    "Lentidão para se movimentar ou falar (notada por outros) ou, ao contrário, agitação que não consegue parar",
    "Pensar em se ferir ou que seria melhor estar morto(a)",
];

const OPTIONS = [
    { value: 0, label: "Nenhuma vez" },
    { value: 1, label: "Vários dias" },
    { value: 2, label: ">½ dos dias" },
    { value: 3, label: "Quase todos" },
];

function classify(score: number) {
    if (score <= 4) return { label: "Sintomas mínimos", tone: "good" as const };
    if (score <= 9) return { label: "Depressão leve", tone: "warn" as const };
    if (score <= 14) return { label: "Depressão moderada", tone: "warn" as const };
    if (score <= 19) return { label: "Depressão moderadamente grave", tone: "bad" as const };
    return { label: "Depressão grave", tone: "bad" as const };
}

export function Phq9Calculator() {
    const [answers, setAnswers] = useState<(number | null)[]>(() => Array(9).fill(null));

    const { score, complete, classification, suicideFlag } = useMemo(() => {
        const filled = answers.filter((v) => v != null) as number[];
        const complete = filled.length === QUESTIONS.length;
        const score = filled.reduce((acc, v) => acc + v, 0);
        const classification = classify(score);
        const suicideFlag = (answers[8] ?? 0) > 0;
        return { score, complete, classification, suicideFlag };
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
            title="PHQ-9 — Patient Health Questionnaire"
            subtitle="Rastreio e gradação de gravidade de transtorno depressivo. Período: últimas 2 semanas."
            result={
                <>
                    <ResultBlock
                        label={complete ? "Pontuação" : "Parcial"}
                        value={`${score} / 27`}
                        interpretation={complete ? classification.label : `${QUESTIONS.length - answers.filter((v) => v != null).length} pergunta(s) pendente(s).`}
                        tone={complete ? classification.tone : "neutral"}
                    />
                    {suicideFlag && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
                            ⚠ Item 9 positivo — avaliar risco de suicídio.
                        </p>
                    )}
                </>
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
