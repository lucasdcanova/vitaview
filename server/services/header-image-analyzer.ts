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

/** Default fallback for body region: leave room for top header (~18%) and footer (~15%), margins 8%. */
function defaultBbox(): HeaderBoundingBox {
    return { top: 0.18, bottom: 0.85, left: 0.08, right: 0.92 };
}

function clamp(v: number, min = 0, max = 1): number {
    if (!Number.isFinite(v)) return min;
    return Math.max(min, Math.min(max, v));
}

function sanitizeBbox(raw: any): HeaderBoundingBox | null {
    if (!raw || typeof raw !== "object") return null;
    const top = clamp(parseFloat(raw.top), 0, 0.6);
    const bottom = clamp(parseFloat(raw.bottom), 0.4, 1);
    const left = clamp(parseFloat(raw.left ?? 0), 0, 0.35);
    const right = clamp(parseFloat(raw.right ?? 1), 0.65, 1);
    if (bottom - top < 0.3) return null; // body too thin
    if (right - left < 0.5) return null; // body too narrow
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

    const systemPrompt = `Você analisa imagens de timbrados/cabeçalhos médicos (PDFs enviados pelo médico) para identificar onde o CORPO do documento deve ser inserido.

O médico envia o desenho COMPLETO do receituário/atestado dele — cabeçalho (logo, nome, contato), bordas decorativas, marca d'água, rodapé com endereço, área de assinatura. A plataforma vai usar esse desenho INTEIRO como fundo de página e precisa saber onde encaixar o conteúdo gerado (lista de medicamentos, texto do atestado, etc).

Sua tarefa: identificar a região retangular do CORPO — o espaço em branco/útil onde o conteúdo do documento deve ser escrito, evitando o cabeçalho, o rodapé, as bordas decorativas e qualquer elemento gráfico.

Responda APENAS com JSON válido:
{
  "bbox": { "top": 0.18, "bottom": 0.82, "left": 0.10, "right": 0.90 },
  "confidence": "high|medium|low"
}

Os valores são frações de 0 a 1 (top=0 é o topo da página, top=1 é a base).

Regras:
- O CORPO é tipicamente o miolo da página, abaixo do cabeçalho e acima do rodapé/assinatura. Valores típicos: top entre 0.15 e 0.30, bottom entre 0.75 e 0.90.
- Considere margens laterais das bordas decorativas (left ~0.08-0.15, right ~0.85-0.92).
- Se a página é apenas um cabeçalho (sem rodapé desenhado), use bottom alto (0.85-0.95) — o conteúdo desce até quase o fim.
- NUNCA retorne uma área menor que 30% da altura ou 50% da largura.
- Confidence:
  - "high" se você identificou claramente os limites do corpo
  - "medium" se há ambiguidade
  - "low" se a estrutura do timbrado é incomum`;

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
                            text: "Analise este timbrado/receituário e identifique a região do CORPO onde o conteúdo do documento deve ser inserido. Retorne o bbox em frações da imagem.",
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
