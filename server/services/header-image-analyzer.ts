/**
 * Recebe uma renderização da primeira página de um cabeçalho/timbrado em base64
 * e pede ao GPT-4 Vision para identificar a região da pá­gina que contém o
 * cabeçalho institucional (logo, nome, contato). Retorna bbox normalizado
 * (0..1) que o frontend usa para cropar antes de fazer upload.
 */

import { openai } from "./openai";
import { ModelRouter } from "./model-router";
import logger from "../logger";

export interface HeaderBoundingBox {
    /** Top edge as a fraction of image height (0 = top, 1 = bottom) */
    top: number;
    /** Bottom edge as a fraction of image height */
    bottom: number;
    /** Left edge as a fraction of image width */
    left: number;
    /** Right edge as a fraction of image width */
    right: number;
}

export interface HeaderAnalysisResult {
    bbox: HeaderBoundingBox;
    confidence: "high" | "medium" | "low";
    /** True when the model could not find a header and we fell back to a top strip */
    fallback: boolean;
}

/** Default fallback: top 22% of the page, full width. */
function defaultBbox(): HeaderBoundingBox {
    return { top: 0, bottom: 0.22, left: 0, right: 1 };
}

function clamp(v: number, min = 0, max = 1): number {
    if (!Number.isFinite(v)) return min;
    return Math.max(min, Math.min(max, v));
}

function sanitizeBbox(raw: any): HeaderBoundingBox | null {
    if (!raw || typeof raw !== "object") return null;
    const top = clamp(parseFloat(raw.top), 0, 0.95);
    const bottom = clamp(parseFloat(raw.bottom), 0.05, 1);
    const left = clamp(parseFloat(raw.left ?? 0), 0, 0.5);
    const right = clamp(parseFloat(raw.right ?? 1), 0.5, 1);
    if (bottom - top < 0.04) return null; // too thin
    return { top, bottom, left, right };
}

export async function analyzeHeaderRegion(
    pngDataUrl: string,
    context: { userId?: number; clinicId?: number }
): Promise<HeaderAnalysisResult> {
    if (!openai) {
        logger.warn("[HeaderImageAnalyzer] OpenAI not configured, using fallback bbox");
        return { bbox: defaultBbox(), confidence: "low", fallback: true };
    }

    const taskName = "clinic-header-region-analysis";
    const model = ModelRouter.getModel(taskName, "simple"); // gpt-4o-mini supports vision

    const systemPrompt = `Você analisa imagens de timbrados/cabeçalhos médicos para identificar a região institucional da página.

A imagem é a primeira página de um arquivo enviado pelo médico — pode ser:
1. Um timbrado completo já no formato de letterhead (banner horizontal estreito)
2. Uma página A4 completa onde o cabeçalho ocupa só o topo (geralmente 15-25% da altura)
3. Apenas a logo isolada da clínica

Sua tarefa: identificar a região retangular que contém TODOS os elementos institucionais do cabeçalho (logo, nome da clínica, médico, endereço, contato). Ignore o corpo do documento, miolo da receita, marcadores de assinatura, espaços em branco abaixo do cabeçalho.

Responda APENAS com JSON válido:
{
  "bbox": { "top": 0.0, "bottom": 0.25, "left": 0.0, "right": 1.0 },
  "confidence": "high|medium|low"
}

Os valores top/bottom/left/right são frações de 0 a 1 (top=0 é o topo, bottom=1 é a base, left=0 é a borda esquerda).

Regras:
- Se a imagem inteira já É o cabeçalho (formato banner): retorne { top: 0, bottom: 1, left: 0, right: 1 } e confidence "high"
- Se for uma página A4 completa: retorne o bbox apenas da faixa superior com cabeçalho (tipicamente top: 0, bottom: 0.15-0.30)
- Confidence:
  - "high" se você identificou claramente o limite do cabeçalho
  - "medium" se há ambiguidade
  - "low" se você não tem certeza`;

    try {
        const response = await openai.chat.completions.create({
            model,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analise esta imagem e identifique a região do cabeçalho institucional. Retorne o bbox em frações da imagem.",
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: pngDataUrl,
                                detail: "low",
                            },
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 200,
        });

        if (response.usage) {
            await ModelRouter.trackUsage(taskName, model, response.usage, context.userId, context.clinicId);
        }

        const raw = response.choices[0]?.message?.content;
        if (!raw) throw new Error("Empty response");
        const parsed = JSON.parse(raw);

        const bbox = sanitizeBbox(parsed.bbox);
        if (!bbox) {
            logger.warn("[HeaderImageAnalyzer] Invalid bbox from GPT, using fallback");
            return { bbox: defaultBbox(), confidence: "low", fallback: true };
        }

        const confidence: HeaderAnalysisResult["confidence"] = ["high", "medium", "low"].includes(parsed.confidence)
            ? parsed.confidence
            : "medium";

        return { bbox, confidence, fallback: false };
    } catch (err) {
        logger.error("[HeaderImageAnalyzer] Failed", { error: (err as Error).message });
        return { bbox: defaultBbox(), confidence: "low", fallback: true };
    }
}
