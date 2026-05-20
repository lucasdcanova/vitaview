import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CalcLayout({
    title,
    subtitle,
    children,
    result,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    result?: ReactNode;
}) {
    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
            </header>
            <div className="space-y-4">{children}</div>
            {result && (
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                    {result}
                </div>
            )}
        </div>
    );
}

export function ResultBlock({
    label,
    value,
    interpretation,
    tone = "neutral",
}: {
    label: string;
    value: ReactNode;
    interpretation?: ReactNode;
    tone?: "neutral" | "good" | "warn" | "bad";
}) {
    const toneClasses = {
        neutral: "text-foreground",
        good: "text-emerald-600 dark:text-emerald-400",
        warn: "text-amber-600 dark:text-amber-400",
        bad: "text-red-600 dark:text-red-400",
    } as const;

    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p className={cn("text-2xl font-bold tabular-nums", toneClasses[tone])}>
                    {value}
                </p>
            </div>
            {interpretation && (
                <p className={cn("text-sm leading-relaxed", toneClasses[tone])}>
                    {interpretation}
                </p>
            )}
        </div>
    );
}

export function YesNoToggle({
    label,
    value,
    onChange,
    hint,
}: {
    label: string;
    value: boolean | null;
    onChange: (v: boolean) => void;
    hint?: string;
}) {
    const isYes = value === true;
    const isNo = value === false;
    return (
        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {hint && (
                    <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        isNo
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    Não
                </button>
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        isYes
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    Sim
                </button>
            </div>
        </div>
    );
}

export function ScaleQuestion({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: number | null;
    onChange: (v: number) => void;
    options: { value: number; label: string }[];
}) {
    return (
        <div className="space-y-1.5 rounded-md border border-border bg-background px-3 py-2.5">
            <p className="text-sm text-foreground">{label}</p>
            <div className="grid grid-cols-4 gap-1">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-center",
                            value === opt.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function parseNum(v: string): number | null {
    if (v === "" || v == null) return null;
    const n = Number(v.replace(",", "."));
    if (!isFinite(n)) return null;
    return n;
}
