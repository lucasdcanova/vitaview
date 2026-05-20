import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalcLayout, ResultBlock, parseNum } from "./shared";

function classify(egfr: number): { label: string; tone: "good" | "warn" | "bad" } {
    if (egfr >= 90) return { label: "G1 — função normal ou aumentada", tone: "good" };
    if (egfr >= 60) return { label: "G2 — discreta redução", tone: "good" };
    if (egfr >= 45) return { label: "G3a — redução leve a moderada", tone: "warn" };
    if (egfr >= 30) return { label: "G3b — redução moderada a grave", tone: "warn" };
    if (egfr >= 15) return { label: "G4 — redução grave", tone: "bad" };
    return { label: "G5 — falência renal (< 15)", tone: "bad" };
}

export function CkdEpiCalculator() {
    const [creat, setCreat] = useState("");
    const [age, setAge] = useState("");
    const [sex, setSex] = useState<"M" | "F">("M");

    const result = useMemo(() => {
        const scr = parseNum(creat);
        const a = parseNum(age);
        if (!scr || !a || scr <= 0 || a <= 0) return null;

        const female = sex === "F";
        const k = female ? 0.7 : 0.9;
        const alpha = female ? -0.241 : -0.302;
        const ratio = scr / k;
        const minPart = Math.pow(Math.min(ratio, 1), alpha);
        const maxPart = Math.pow(Math.max(ratio, 1), -1.2);
        const agePart = Math.pow(0.9938, a);
        const sexFactor = female ? 1.012 : 1;
        const egfr = 142 * minPart * maxPart * agePart * sexFactor;

        return { egfr, ...classify(egfr) };
    }, [creat, age, sex]);

    return (
        <CalcLayout
            title="CKD-EPI 2021 (sem ajuste de raça)"
            subtitle="Taxa de filtração glomerular estimada (TFGe) — adultos."
            result={
                result ? (
                    <ResultBlock
                        label="TFGe"
                        value={`${result.egfr.toFixed(0)} mL/min/1,73m²`}
                        interpretation={result.label}
                        tone={result.tone}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">Preencha creatinina e idade.</p>
                )
            }
        >
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="ckd-creat">Creatinina (mg/dL)</Label>
                    <Input
                        id="ckd-creat"
                        inputMode="decimal"
                        value={creat}
                        onChange={(e) => setCreat(e.target.value)}
                        placeholder="1.1"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ckd-age">Idade (anos)</Label>
                    <Input
                        id="ckd-age"
                        inputMode="numeric"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="55"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ckd-sex">Sexo</Label>
                    <Select value={sex} onValueChange={(v) => setSex(v as "M" | "F")}>
                        <SelectTrigger id="ckd-sex">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CalcLayout>
    );
}
