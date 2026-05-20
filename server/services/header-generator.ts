/**
 * Generates 3 visual header specs via GPT, returning a strict JSON shape that
 * the client-side canvas renderer turns into a PNG. We don't ask the model to
 * generate pixels (DALL-E or SVG) — only structured design decisions.
 */
import { openai } from "./openai";
import { ModelRouter } from "./model-router";
import logger from "../logger";

export interface HeaderGenerationInput {
    doctorName: string;
    crm?: string | null;
    specialty?: string | null;
    rqe?: string | null;
    clinicName?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
}

export interface GeneratedHeaderSpec {
    variationLabel: string;
    palette: { ink: string; accent: string; line: string };
    monogram: { style: "initials" | "circle" | "shield" | "none"; initials: string };
    layout: { composition: "centered" | "left-aligned" | "monogram-left" };
    typography: {
        nameFont: "serif" | "serif-display" | "sans-modern";
        nameWeight: "normal" | "bold";
        nameCase: "title" | "upper" | "smallcaps";
    };
    divider: { style: "single" | "double" | "double-thin" | "accent-tick" | "none" };
}

export interface HeaderGenerationOutput {
    variations: GeneratedHeaderSpec[];
    content: {
        primary: string;
        secondary?: string;
        contact?: string;
    };
}

function buildPrimary(input: HeaderGenerationInput): string {
    return (input.clinicName || input.doctorName || "").trim();
}

function buildSecondary(input: HeaderGenerationInput): string | undefined {
    const bits: string[] = [];
    if (input.clinicName && input.doctorName && input.clinicName !== input.doctorName) {
        bits.push(input.doctorName);
    }
    if (input.crm) bits.push(`CRM ${input.crm}`);
    if (input.specialty) bits.push(input.specialty);
    if (input.rqe) bits.push(`RQE ${input.rqe}`);
    return bits.join("  ·  ") || undefined;
}

function buildContact(input: HeaderGenerationInput): string | undefined {
    const bits: string[] = [];
    if (input.address) bits.push(input.address);
    const inline: string[] = [];
    if (input.phone) inline.push(input.phone);
    if (input.email) inline.push(input.email);
    if (input.website) inline.push(input.website);
    if (inline.length) bits.push(inline.join("  ·  "));
    return bits.join("  ·  ") || undefined;
}

function computeInitials(input: HeaderGenerationInput): string {
    const source = (input.clinicName || input.doctorName || "VV").trim();
    const parts = source
        .replace(/(Dr|Dra|Dr\.|Dra\.)\s+/gi, "")
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0) return "VV";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
}

function fallbackVariations(initials: string): GeneratedHeaderSpec[] {
    return [
        {
            variationLabel: "Clássico centrado",
            palette: { ink: "#212121", accent: "#AF9150", line: "#9A9A9A" },
            monogram: { style: "initials", initials },
            layout: { composition: "centered" },
            typography: { nameFont: "serif-display", nameWeight: "bold", nameCase: "upper" },
            divider: { style: "double-thin" },
        },
        {
            variationLabel: "Monograma à esquerda",
            palette: { ink: "#1F1F1F", accent: "#AF9150", line: "#9A9A9A" },
            monogram: { style: "circle", initials },
            layout: { composition: "monogram-left" },
            typography: { nameFont: "serif", nameWeight: "bold", nameCase: "title" },
            divider: { style: "accent-tick" },
        },
        {
            variationLabel: "Institucional minimal",
            palette: { ink: "#212121", accent: "#AF9150", line: "#A8A8A8" },
            monogram: { style: "none", initials },
            layout: { composition: "left-aligned" },
            typography: { nameFont: "serif-display", nameWeight: "normal", nameCase: "smallcaps" },
            divider: { style: "single" },
        },
    ];
}

function sanitizeSpec(raw: any, fallback: GeneratedHeaderSpec): GeneratedHeaderSpec {
    if (!raw || typeof raw !== "object") return fallback;
    const palette = raw.palette || {};
    const monogram = raw.monogram || {};
    const layout = raw.layout || {};
    const typography = raw.typography || {};
    const divider = raw.divider || {};

    const monogramStyles = ["initials", "circle", "shield", "none"];
    const compositions = ["centered", "left-aligned", "monogram-left"];
    const nameFonts = ["serif", "serif-display", "sans-modern"];
    const nameWeights = ["normal", "bold"];
    const nameCases = ["title", "upper", "smallcaps"];
    const dividerStyles = ["single", "double", "double-thin", "accent-tick", "none"];

    const pickEnum = <T extends string>(value: unknown, allowed: T[], def: T): T =>
        allowed.includes(value as T) ? (value as T) : def;

    const hexRe = /^#[0-9a-fA-F]{6}$/;
    const pickHex = (value: unknown, def: string): string =>
        typeof value === "string" && hexRe.test(value) ? value : def;

    return {
        variationLabel: typeof raw.variationLabel === "string" && raw.variationLabel.trim()
            ? raw.variationLabel.trim().slice(0, 60)
            : fallback.variationLabel,
        palette: {
            ink: pickHex(palette.ink, fallback.palette.ink),
            accent: pickHex(palette.accent, fallback.palette.accent),
            line: pickHex(palette.line, fallback.palette.line),
        },
        monogram: {
            style: pickEnum(monogram.style, monogramStyles as any, fallback.monogram.style),
            initials: typeof monogram.initials === "string" && monogram.initials.trim()
                ? monogram.initials.trim().slice(0, 3).toUpperCase()
                : fallback.monogram.initials,
        },
        layout: {
            composition: pickEnum(layout.composition, compositions as any, fallback.layout.composition),
        },
        typography: {
            nameFont: pickEnum(typography.nameFont, nameFonts as any, fallback.typography.nameFont),
            nameWeight: pickEnum(typography.nameWeight, nameWeights as any, fallback.typography.nameWeight),
            nameCase: pickEnum(typography.nameCase, nameCases as any, fallback.typography.nameCase),
        },
        divider: {
            style: pickEnum(divider.style, dividerStyles as any, fallback.divider.style),
        },
    };
}

export async function generateHeaderVariations(
    input: HeaderGenerationInput,
    context: { userId?: number; clinicId?: number }
): Promise<HeaderGenerationOutput> {
    const initials = computeInitials(input);
    const content = {
        primary: buildPrimary(input),
        secondary: buildSecondary(input),
        contact: buildContact(input),
    };
    const fallback = fallbackVariations(initials);

    if (!openai) {
        logger.warn("[HeaderGenerator] OpenAI not configured — returning curated fallbacks");
        return { variations: fallback, content };
    }

    const taskName = "clinic-header-generation";
    const model = ModelRouter.getModel(taskName, "medium");

    const systemPrompt = `Você é um diretor de arte sênior especializado em identidade visual de consultórios médicos brasileiros.

Sua tarefa é desenhar 3 variações distintas de cabeçalho institucional para um receituário/atestado médico, no estilo CLÁSSICO INSTITUCIONAL (tipografia serifada de elegância editorial, paleta sóbria, accent dourado discreto, sem áreas grandes com fundo preto, prioriza economia de tinta na impressão).

Regras:
- As 3 variações devem ser visualmente DIFERENTES entre si (composição, monograma, divisor), mas todas dentro do estilo clássico institucional.
- Cores: ink em tons de quase-preto/grafite (#1A1A1A a #2A2A2A). Accent SEMPRE em ouro/cobre quente (#A07530 a #C29E54). Line em cinza neutro (#8A8A8A a #B0B0B0).
- Não use cores vivas, gradientes, ou paletas saturadas.
- Initials já calculadas: "${initials}". Use exatamente isso quando o monograma exibir iniciais.
- nameCase "upper" funciona bem com nameFont "serif-display" e "serif". "smallcaps" só com "serif-display".
- "monogram.style": "none" → exige composition "centered" ou "left-aligned"; "circle"/"shield" funcionam melhor em "monogram-left".

Retorne SOMENTE um JSON válido no shape:
{
  "variations": [
    {
      "variationLabel": "string curta descritiva (max 40 chars)",
      "palette": { "ink": "#hex", "accent": "#hex", "line": "#hex" },
      "monogram": { "style": "initials|circle|shield|none", "initials": "${initials}" },
      "layout": { "composition": "centered|left-aligned|monogram-left" },
      "typography": {
        "nameFont": "serif|serif-display|sans-modern",
        "nameWeight": "normal|bold",
        "nameCase": "title|upper|smallcaps"
      },
      "divider": { "style": "single|double|double-thin|accent-tick|none" }
    }
  ]
}`;

    const userPrompt = `Dados do médico/clínica:
- Nome principal: "${content.primary}"
- Subtítulo (credenciais): "${content.secondary ?? ""}"
- Contato/endereço: "${content.contact ?? ""}"

Gere 3 variações no estilo clássico institucional.`;

    try {
        const response = await openai.chat.completions.create({
            model,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.9,
        });

        if (response.usage) {
            await ModelRouter.trackUsage(taskName, model, response.usage, context.userId, context.clinicId);
        }

        const raw = response.choices[0]?.message?.content;
        if (!raw) throw new Error("Empty response");
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed.variations) ? parsed.variations : [];
        const variations = [0, 1, 2].map((i) => sanitizeSpec(list[i], fallback[i]));
        return { variations, content };
    } catch (err) {
        logger.error("[HeaderGenerator] Failed, returning fallback variations", { error: (err as Error).message });
        return { variations: fallback, content };
    }
}
