import { useState, useMemo } from "react";
import { CalcLayout, ResultBlock, YesNoToggle } from "./shared";

export function Curb65Calculator() {
    const [confusion, setConfusion] = useState(false);
    const [ureaHigh, setUreaHigh] = useState(false);
    const [respHigh, setRespHigh] = useState(false);
    const [lowBp, setLowBp] = useState(false);
    const [age65, setAge65] = useState(false);

    const { score, tone, recommendation, mortality } = useMemo(() => {
        const s =
            (confusion ? 1 : 0) +
            (ureaHigh ? 1 : 0) +
            (respHigh ? 1 : 0) +
            (lowBp ? 1 : 0) +
            (age65 ? 1 : 0);

        let tone: "good" | "warn" | "bad" = "good";
        let rec = "Tratamento ambulatorial.";
        let mortality = "~ 0,6 %";
        if (s === 1) {
            mortality = "~ 2,7 %";
            rec = "Tratamento ambulatorial considerado.";
            tone = "good";
        } else if (s === 2) {
            mortality = "~ 6,8 %";
            rec = "Internação curta ou observação hospitalar.";
            tone = "warn";
        } else if (s === 3) {
            mortality = "~ 14 %";
            rec = "Internação. Considerar UTI.";
            tone = "bad";
        } else if (s >= 4) {
            mortality = "~ 27 %";
            rec = "Internação em UTI.";
            tone = "bad";
        }

        return { score: s, tone, recommendation: rec, mortality };
    }, [confusion, ureaHigh, respHigh, lowBp, age65]);

    return (
        <CalcLayout
            title="CURB-65"
            subtitle="Gravidade de pneumonia adquirida na comunidade — decisão entre ambulatório e internação."
            result={
                <ResultBlock
                    label="Pontuação"
                    value={score}
                    interpretation={`${recommendation} Mortalidade estimada em 30 dias: ${mortality}.`}
                    tone={tone}
                />
            }
        >
            <YesNoToggle
                label="Confusão mental"
                value={confusion}
                onChange={setConfusion}
                hint="Desorientação no tempo, espaço ou pessoa"
            />
            <YesNoToggle
                label="Ureia > 50 mg/dL (BUN > 19 mg/dL)"
                value={ureaHigh}
                onChange={setUreaHigh}
            />
            <YesNoToggle
                label="FR ≥ 30 irpm"
                value={respHigh}
                onChange={setRespHigh}
            />
            <YesNoToggle
                label="PAS < 90 mmHg ou PAD ≤ 60 mmHg"
                value={lowBp}
                onChange={setLowBp}
            />
            <YesNoToggle
                label="Idade ≥ 65 anos"
                value={age65}
                onChange={setAge65}
            />
        </CalcLayout>
    );
}
