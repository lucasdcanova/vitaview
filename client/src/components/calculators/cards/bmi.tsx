import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalcLayout, ResultBlock, parseNum } from "./shared";

export function BmiCalculator() {
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");

    const { bmi, tone, label } = useMemo(() => {
        const w = parseNum(weight);
        const h = parseNum(height);
        if (!w || !h) return { bmi: null, tone: "neutral" as const, label: "" };
        const hm = h > 3 ? h / 100 : h;
        const value = w / (hm * hm);

        let label = "";
        let tone: "good" | "warn" | "bad" | "neutral" = "neutral";
        if (value < 18.5) {
            label = "Baixo peso";
            tone = "warn";
        } else if (value < 25) {
            label = "Eutrofia";
            tone = "good";
        } else if (value < 30) {
            label = "Sobrepeso";
            tone = "warn";
        } else if (value < 35) {
            label = "Obesidade grau I";
            tone = "bad";
        } else if (value < 40) {
            label = "Obesidade grau II";
            tone = "bad";
        } else {
            label = "Obesidade grau III";
            tone = "bad";
        }

        return { bmi: value, tone, label };
    }, [weight, height]);

    return (
        <CalcLayout
            title="IMC — Índice de massa corporal"
            subtitle="Classificação nutricional segundo OMS para adultos."
            result={
                bmi != null ? (
                    <ResultBlock
                        label="IMC"
                        value={`${bmi.toFixed(1)} kg/m²`}
                        interpretation={label}
                        tone={tone}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">Preencha peso e altura.</p>
                )
            }
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="bmi-weight">Peso (kg)</Label>
                    <Input
                        id="bmi-weight"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="70"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="bmi-height">Altura (m ou cm)</Label>
                    <Input
                        id="bmi-height"
                        inputMode="decimal"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="1.70"
                    />
                </div>
            </div>
        </CalcLayout>
    );
}
