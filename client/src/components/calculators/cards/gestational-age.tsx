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
import { CalcLayout, parseNum } from "./shared";

function formatBR(d: Date) {
    return d.toLocaleDateString("pt-BR");
}

function diffDays(a: Date, b: Date) {
    const ms = a.setHours(0, 0, 0, 0) - b.setHours(0, 0, 0, 0);
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function GestationalAgeCalculator() {
    const [mode, setMode] = useState<"dum" | "usg">("dum");
    const [dum, setDum] = useState("");
    const [refDate, setRefDate] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    });
    const [usgDate, setUsgDate] = useState("");
    const [usgWeeks, setUsgWeeks] = useState("");
    const [usgDays, setUsgDays] = useState("");

    const result = useMemo(() => {
        const ref = new Date(refDate);
        if (isNaN(ref.getTime())) return null;

        if (mode === "dum") {
            if (!dum) return null;
            const start = new Date(dum);
            if (isNaN(start.getTime())) return null;
            const days = diffDays(new Date(ref), new Date(start));
            if (days < 0 || days > 320) return null;
            const dpp = new Date(start);
            dpp.setDate(dpp.getDate() + 280);
            return {
                weeks: Math.floor(days / 7),
                extraDays: days % 7,
                totalDays: days,
                dpp,
            };
        }

        if (!usgDate) return null;
        const usg = new Date(usgDate);
        if (isNaN(usg.getTime())) return null;
        const wks = parseNum(usgWeeks) ?? 0;
        const ds = parseNum(usgDays) ?? 0;
        const usgDaysTotal = wks * 7 + ds;
        if (usgDaysTotal <= 0 || usgDaysTotal > 320) return null;
        const elapsed = diffDays(new Date(ref), new Date(usg));
        const totalDays = usgDaysTotal + elapsed;
        if (totalDays < 0 || totalDays > 320) return null;
        const dpp = new Date(usg);
        dpp.setDate(dpp.getDate() + (280 - usgDaysTotal));
        return {
            weeks: Math.floor(totalDays / 7),
            extraDays: totalDays % 7,
            totalDays,
            dpp,
        };
    }, [mode, dum, refDate, usgDate, usgWeeks, usgDays]);

    return (
        <CalcLayout
            title="Idade gestacional & DPP"
            subtitle="Cálculo pela última menstruação (Naegele) ou por ultrassonografia."
            result={
                result ? (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Idade gestacional
                            </span>
                            <span className="text-2xl font-bold tabular-nums">
                                {result.weeks}s {result.extraDays}d
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                DPP
                            </span>
                            <span className="text-lg font-semibold tabular-nums">
                                {formatBR(result.dpp)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Preencha os campos para calcular.</p>
                )
            }
        >
            <div className="space-y-1.5">
                <Label htmlFor="ga-mode">Método</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as "dum" | "usg")}>
                    <SelectTrigger id="ga-mode">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dum">Pela DUM (regra de Naegele)</SelectItem>
                        <SelectItem value="usg">Por ultrassonografia</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {mode === "dum" ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="ga-dum">Data da última menstruação</Label>
                        <Input
                            id="ga-dum"
                            type="date"
                            value={dum}
                            onChange={(e) => setDum(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="ga-today">Data de referência</Label>
                        <Input
                            id="ga-today"
                            type="date"
                            value={refDate}
                            onChange={(e) => setRefDate(e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="ga-usg-date">Data do USG</Label>
                            <Input
                                id="ga-usg-date"
                                type="date"
                                value={usgDate}
                                onChange={(e) => setUsgDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ga-usg-w">IG no USG (semanas)</Label>
                            <Input
                                id="ga-usg-w"
                                inputMode="numeric"
                                value={usgWeeks}
                                onChange={(e) => setUsgWeeks(e.target.value)}
                                placeholder="8"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ga-usg-d">Dias</Label>
                            <Input
                                id="ga-usg-d"
                                inputMode="numeric"
                                value={usgDays}
                                onChange={(e) => setUsgDays(e.target.value)}
                                placeholder="3"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="ga-today-usg">Data de referência</Label>
                        <Input
                            id="ga-today-usg"
                            type="date"
                            value={refDate}
                            onChange={(e) => setRefDate(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </CalcLayout>
    );
}
