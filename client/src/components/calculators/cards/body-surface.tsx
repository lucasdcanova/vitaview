import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalcLayout, parseNum } from "./shared";

export function BodySurfaceCalculator() {
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");

    const result = useMemo(() => {
        const w = parseNum(weight);
        const h = parseNum(height);
        if (!w || !h) return null;
        const hcm = h <= 3 ? h * 100 : h;
        const mosteller = Math.sqrt((hcm * w) / 3600);
        const dubois = 0.007184 * Math.pow(w, 0.425) * Math.pow(hcm, 0.725);
        return { mosteller, dubois };
    }, [weight, height]);

    return (
        <CalcLayout
            title="Superfície corporal"
            subtitle="Mosteller (mais usada em oncologia/pediatria) e DuBois."
            result={
                result ? (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Mosteller
                            </span>
                            <span className="text-2xl font-bold tabular-nums">
                                {result.mosteller.toFixed(2)} m²
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                DuBois
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                                {result.dubois.toFixed(2)} m²
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Preencha peso e altura.</p>
                )
            }
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="bsa-weight">Peso (kg)</Label>
                    <Input
                        id="bsa-weight"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="70"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="bsa-height">Altura (m ou cm)</Label>
                    <Input
                        id="bsa-height"
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
