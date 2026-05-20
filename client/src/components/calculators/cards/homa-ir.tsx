import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalcLayout, parseNum } from "./shared";
import { cn } from "@/lib/utils";

export function HomaIrCalculator() {
    const [glucose, setGlucose] = useState("");
    const [insulin, setInsulin] = useState("");

    const result = useMemo(() => {
        const g = parseNum(glucose);
        const i = parseNum(insulin);
        if (!g || !i) return null;
        const homaIr = (g * i) / 405;
        const denominator = g - 63;
        const homaBeta = denominator > 0 ? (360 * i) / denominator : null;
        const irHigh = homaIr > 2.5;
        return { homaIr, homaBeta, irHigh };
    }, [glucose, insulin]);

    return (
        <CalcLayout
            title="HOMA-IR & HOMA-β"
            subtitle="Avaliação de resistência insulínica e função das células β em jejum."
            result={
                result ? (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                HOMA-IR
                            </span>
                            <span
                                className={cn(
                                    "text-2xl font-bold tabular-nums",
                                    result.irHigh
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-foreground"
                                )}
                            >
                                {result.homaIr.toFixed(2)}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {result.irHigh
                                ? "Acima de 2,5 — sugere resistência à insulina."
                                : "Dentro da faixa habitual (≤ 2,5)."}
                        </p>
                        {result.homaBeta != null && (
                            <div className="flex items-baseline justify-between border-t border-border pt-3">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    HOMA-β
                                </span>
                                <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                                    {result.homaBeta.toFixed(0)} %
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Preencha glicemia e insulina em jejum.
                    </p>
                )
            }
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="homa-glucose">Glicemia jejum (mg/dL)</Label>
                    <Input
                        id="homa-glucose"
                        inputMode="decimal"
                        value={glucose}
                        onChange={(e) => setGlucose(e.target.value)}
                        placeholder="92"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="homa-insulin">Insulina jejum (µU/mL)</Label>
                    <Input
                        id="homa-insulin"
                        inputMode="decimal"
                        value={insulin}
                        onChange={(e) => setInsulin(e.target.value)}
                        placeholder="8"
                    />
                </div>
            </div>
        </CalcLayout>
    );
}
