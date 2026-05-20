import { useState, useMemo } from "react";
import { CalcLayout, ResultBlock, YesNoToggle } from "./shared";

export function HasBledCalculator() {
    const [htn, setHtn] = useState(false);
    const [renal, setRenal] = useState(false);
    const [hepatic, setHepatic] = useState(false);
    const [stroke, setStroke] = useState(false);
    const [bleeding, setBleeding] = useState(false);
    const [labileInr, setLabileInr] = useState(false);
    const [elderly, setElderly] = useState(false);
    const [drugs, setDrugs] = useState(false);
    const [alcohol, setAlcohol] = useState(false);

    const { score, tone, interpretation } = useMemo(() => {
        const s =
            (htn ? 1 : 0) +
            (renal ? 1 : 0) +
            (hepatic ? 1 : 0) +
            (stroke ? 1 : 0) +
            (bleeding ? 1 : 0) +
            (labileInr ? 1 : 0) +
            (elderly ? 1 : 0) +
            (drugs ? 1 : 0) +
            (alcohol ? 1 : 0);

        let tone: "good" | "warn" | "bad" = "good";
        let txt = "Risco baixo de sangramento. Mantenha cuidados habituais.";
        if (s >= 3) {
            tone = "bad";
            txt = "Risco alto — atenção redobrada, controle de PA, reavaliação periódica.";
        } else if (s === 2) {
            tone = "warn";
            txt = "Risco moderado — monitorar e tratar fatores modificáveis.";
        }

        return { score: s, tone, interpretation: txt };
    }, [htn, renal, hepatic, stroke, bleeding, labileInr, elderly, drugs, alcohol]);

    return (
        <CalcLayout
            title="HAS-BLED"
            subtitle="Risco de sangramento maior em pacientes anticoagulados por FA."
            result={
                <ResultBlock
                    label="Pontuação"
                    value={score}
                    interpretation={interpretation}
                    tone={tone}
                />
            }
        >
            <YesNoToggle
                label="Hipertensão não controlada (PAS > 160 mmHg)"
                value={htn}
                onChange={setHtn}
            />
            <YesNoToggle
                label="Disfunção renal"
                value={renal}
                onChange={setRenal}
                hint="Diálise, transplante ou Cr ≥ 2,3 mg/dL"
            />
            <YesNoToggle
                label="Disfunção hepática"
                value={hepatic}
                onChange={setHepatic}
                hint="Cirrose ou bilirrubina >2× e TGO/TGP/FA >3× normal"
            />
            <YesNoToggle
                label="AVC prévio"
                value={stroke}
                onChange={setStroke}
            />
            <YesNoToggle
                label="História ou predisposição a sangramento"
                value={bleeding}
                onChange={setBleeding}
            />
            <YesNoToggle
                label="INR lábil (TTR < 60%)"
                value={labileInr}
                onChange={setLabileInr}
                hint="Aplicável apenas a varfarina"
            />
            <YesNoToggle
                label="Idade > 65 anos"
                value={elderly}
                onChange={setElderly}
            />
            <YesNoToggle
                label="Uso de drogas que predispõem a sangramento"
                value={drugs}
                onChange={setDrugs}
                hint="AINE, antiplaquetário"
            />
            <YesNoToggle
                label="Etilismo (≥ 8 doses/semana)"
                value={alcohol}
                onChange={setAlcohol}
            />
        </CalcLayout>
    );
}
