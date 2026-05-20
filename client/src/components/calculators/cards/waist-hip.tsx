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

export function WaistHipCalculator() {
    const [waist, setWaist] = useState("");
    const [hip, setHip] = useState("");
    const [sex, setSex] = useState<"M" | "F">("F");

    const result = useMemo(() => {
        const w = parseNum(waist);
        const h = parseNum(hip);
        if (!w || !h) return null;
        const ratio = w / h;
        const threshold = sex === "M" ? 0.9 : 0.85;
        const high = ratio > threshold;
        return { ratio, high, threshold };
    }, [waist, hip, sex]);

    return (
        <CalcLayout
            title="Razão cintura-quadril"
            subtitle="Critério OMS: risco metabólico aumentado se >0,90 (homens) ou >0,85 (mulheres)."
            result={
                result ? (
                    <ResultBlock
                        label="RCQ"
                        value={result.ratio.toFixed(2)}
                        interpretation={
                            result.high
                                ? `Acima do limite (${result.threshold}). Risco metabólico aumentado.`
                                : `Dentro da faixa de referência (≤ ${result.threshold}).`
                        }
                        tone={result.high ? "warn" : "good"}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">Preencha cintura e quadril.</p>
                )
            }
        >
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="wh-waist">Cintura (cm)</Label>
                    <Input
                        id="wh-waist"
                        inputMode="decimal"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        placeholder="88"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="wh-hip">Quadril (cm)</Label>
                    <Input
                        id="wh-hip"
                        inputMode="decimal"
                        value={hip}
                        onChange={(e) => setHip(e.target.value)}
                        placeholder="100"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="wh-sex">Sexo</Label>
                    <Select value={sex} onValueChange={(v) => setSex(v as "M" | "F")}>
                        <SelectTrigger id="wh-sex">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="F">Feminino</SelectItem>
                            <SelectItem value="M">Masculino</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CalcLayout>
    );
}
