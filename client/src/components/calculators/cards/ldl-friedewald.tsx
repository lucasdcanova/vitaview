import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalcLayout, ResultBlock, parseNum } from "./shared";

export function LdlFriedewaldCalculator() {
    const [tc, setTc] = useState("");
    const [hdl, setHdl] = useState("");
    const [tg, setTg] = useState("");

    const result = useMemo(() => {
        const total = parseNum(tc);
        const h = parseNum(hdl);
        const t = parseNum(tg);
        if (total == null || h == null || t == null) return null;
        if (t > 400) {
            return { invalid: true } as const;
        }
        const ldl = total - h - t / 5;
        const nonHdl = total - h;
        return { ldl, nonHdl, invalid: false } as const;
    }, [tc, hdl, tg]);

    return (
        <CalcLayout
            title="LDL — fórmula de Friedewald"
            subtitle="LDL = CT − HDL − TG/5. Não aplicável se TG > 400 mg/dL."
            result={
                result ? (
                    result.invalid ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Triglicerídeos &gt; 400 mg/dL — fórmula de Friedewald não confiável. Solicite dosagem direta de LDL.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <ResultBlock
                                label="LDL-colesterol"
                                value={`${result.ldl.toFixed(0)} mg/dL`}
                            />
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Não-HDL
                                </span>
                                <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                                    {result.nonHdl.toFixed(0)} mg/dL
                                </span>
                            </div>
                        </div>
                    )
                ) : (
                    <p className="text-sm text-muted-foreground">Preencha CT, HDL e TG.</p>
                )
            }
        >
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="ldl-tc">CT (mg/dL)</Label>
                    <Input
                        id="ldl-tc"
                        inputMode="decimal"
                        value={tc}
                        onChange={(e) => setTc(e.target.value)}
                        placeholder="200"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ldl-hdl">HDL (mg/dL)</Label>
                    <Input
                        id="ldl-hdl"
                        inputMode="decimal"
                        value={hdl}
                        onChange={(e) => setHdl(e.target.value)}
                        placeholder="45"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ldl-tg">Triglicerídeos (mg/dL)</Label>
                    <Input
                        id="ldl-tg"
                        inputMode="decimal"
                        value={tg}
                        onChange={(e) => setTg(e.target.value)}
                        placeholder="150"
                    />
                </div>
            </div>
        </CalcLayout>
    );
}
