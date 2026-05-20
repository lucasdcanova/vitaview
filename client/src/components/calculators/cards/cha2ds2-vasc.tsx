import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalcLayout, ResultBlock, YesNoToggle } from "./shared";

export function Cha2ds2VascCalculator() {
    const [chf, setChf] = useState(false);
    const [htn, setHtn] = useState(false);
    const [dm, setDm] = useState(false);
    const [strokeHistory, setStroke] = useState(false);
    const [vascular, setVascular] = useState(false);
    const [sex, setSex] = useState<"M" | "F">("M");
    const [ageBand, setAgeBand] = useState<"<65" | "65-74" | "≥75">("<65");

    const { score, tone, recommendation } = useMemo(() => {
        let s = 0;
        if (chf) s += 1;
        if (htn) s += 1;
        if (dm) s += 1;
        if (strokeHistory) s += 2;
        if (vascular) s += 1;
        if (ageBand === "65-74") s += 1;
        if (ageBand === "≥75") s += 2;
        if (sex === "F") s += 1;

        const threshold = sex === "M" ? 2 : 3;
        const lowMen = sex === "M" && s === 0;
        const lowWomen = sex === "F" && s <= 1;
        const considerMen = sex === "M" && s === 1;
        const considerWomen = sex === "F" && s === 2;

        let rec = "";
        let tone: "good" | "warn" | "bad" = "good";
        if (lowMen || lowWomen) {
            rec = "Risco baixo — anticoagulação geralmente não indicada.";
            tone = "good";
        } else if (considerMen || considerWomen) {
            rec = "Considerar anticoagulação oral (decisão compartilhada).";
            tone = "warn";
        } else if (s >= threshold) {
            rec = "Anticoagulação oral recomendada (DOAC preferencial).";
            tone = "bad";
        }

        return { score: s, tone, recommendation: rec };
    }, [chf, htn, dm, strokeHistory, vascular, ageBand, sex]);

    return (
        <CalcLayout
            title="CHA₂DS₂-VASc"
            subtitle="Risco anual de AVC/embolia sistêmica em fibrilação atrial não valvar."
            result={
                <ResultBlock
                    label="Pontuação"
                    value={score}
                    interpretation={recommendation}
                    tone={tone}
                />
            }
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="cv-sex">Sexo</Label>
                    <Select value={sex} onValueChange={(v) => setSex(v as "M" | "F")}>
                        <SelectTrigger id="cv-sex">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="M">Masculino (0)</SelectItem>
                            <SelectItem value="F">Feminino (+1)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="cv-age">Faixa etária</Label>
                    <Select value={ageBand} onValueChange={(v) => setAgeBand(v as any)}>
                        <SelectTrigger id="cv-age">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="<65">&lt; 65 anos (0)</SelectItem>
                            <SelectItem value="65-74">65–74 anos (+1)</SelectItem>
                            <SelectItem value="≥75">≥ 75 anos (+2)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <YesNoToggle
                label="ICC / disfunção de VE (C)"
                value={chf}
                onChange={setChf}
                hint="Sinais clínicos ou FE reduzida"
            />
            <YesNoToggle
                label="Hipertensão arterial (H)"
                value={htn}
                onChange={setHtn}
            />
            <YesNoToggle
                label="Diabetes mellitus (D)"
                value={dm}
                onChange={setDm}
            />
            <YesNoToggle
                label="AVC, AIT ou tromboembolismo prévios (S, +2)"
                value={strokeHistory}
                onChange={setStroke}
            />
            <YesNoToggle
                label="Doença vascular (V)"
                value={vascular}
                onChange={setVascular}
                hint="IAM prévio, doença arterial periférica ou placa aórtica"
            />
        </CalcLayout>
    );
}
