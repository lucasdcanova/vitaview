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
    const top = clamp(parseFloat(raw.top), 0, 0.55);
    const bottom = clamp(parseFloat(raw.bottom), 0.45, 1);
    const left = clamp(parseFloat(raw.left ?? 0), 0, 0.35);
    const right = clamp(parseFloat(raw.right ?? 1), 0.65, 1);
    // The body must comfortably fit title + doctor + patient + ≥2 medications + signature + boxes.
    // On a portrait page that means at least ~45% of the height.
    if (bottom - top < 0.45) return null;
    if (right - left < 0.6) return null;
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

O médico envia o desenho COMPLETO do receituário/atestado dele — cabeçalho (logo, nome, contato), bordas decorativas, marca d'água, rodapé com endereço, área de assinatura, e possivelmente campos pré-impressos como "PACIENTE:", "DATA:", "ENDEREÇO:", linhas tracejadas/sublinhadas para preenchimento manual. A plataforma vai usar esse desenho INTEIRO como fundo de página e precisa saber onde encaixar o conteúdo gerado (lista de medicamentos, texto do atestado).

Sua tarefa: identificar a região retangular do CORPO — espaço em branco que NÃO contém NENHUM elemento pré-impresso.

CRÍTICO: você deve EXCLUIR do bbox tudo que já tem desenho/texto/linha:
- Logos, monogramas, marcas
- Faixas coloridas (verde, azul, etc.) ou bordas decorativas
- Nome do médico, CRM, especialidade, contato
- Campos pré-impressos com rótulos ("PACIENTE:", "DATA:", "Rg:", "ENDEREÇO:", "ASSINATURA:") — mesmo que tenham linhas vazias para preenchimento
- Linhas horizontais decorativas ou de assinatura
- Rodapé com endereço/telefone
- Marca d'água
- Qualquer texto visível

O bbox final deve ser uma área 100% livre de qualquer elemento gráfico. SE EM DÚVIDA, encolha o bbox.

Responda APENAS com JSON válido:
{
  "bbox": { "top": 0.18, "bottom": 0.82, "left": 0.10, "right": 0.90 },
  "confidence": "high|medium|low",
  "excludedElements": ["faixa verde no topo", "campo PACIENTE: na linha ~25%", "logo monograma à esquerda", ...]
}

Os valores são frações de 0 a 1 (top=0 é o topo da página, top=1 é a base).

Regras de bbox:
- O CORPO fica DEPOIS de todos os elementos pré-impressos. Se há um campo "PACIENTE:" a 25% da altura, o top do bbox precisa ser maior que 0.25 (com margem de respiro).
- Adicione SEMPRE 2-3% de margem de segurança em cada borda (top, bottom, left, right) entre o último elemento pré-impresso e o bbox.
- left tipicamente 0.08-0.18, right 0.82-0.92.
- top típico 0.20-0.40 (mais alto se o cabeçalho/labels ocupam mais espaço).
- bottom típico 0.85-0.95 (use o máximo possível — só reduza se houver rodapé/assinatura pré-impressa).
- ALTURA MÍNIMA: bottom-top >= 0.50. O conteúdo precisa caber título + cabeçalho do médico + paciente + PELO MENOS 2 medicamentos + rodapé com assinatura e caixas de farmácia (em receitas controladas). Se o timbrado deixa pouco espaço útil, prefira expandir o bottom até onde o letterhead permitir, em vez de retornar um bbox muito curto.
- LARGURA MÍNIMA: right-left >= 0.6.
- Confidence:
  - "high" só se você tem certeza absoluta que não há elementos dentro do bbox
  - "medium" se há ambiguidade em alguma borda
  - "low" se a estrutura do timbrado é incomum ou cheia de elementos pré-impressos`;

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

/**
 * Second-pass validation: receives the letterhead image WITH the proposed bbox drawn
 * as a red rectangle overlay, and asks GPT-Vision to check whether the rectangle
 * collides with any pre-printed element. If yes, returns a refined bbox.
 */
export async function validateBboxOverlap(
    annotatedPngDataUrl: string,
    currentBbox: HeaderBoundingBox,
    context: { userId?: number; clinicId?: number }
): Promise<{ ok: boolean; bbox: HeaderBoundingBox; reason?: string }> {
    if (!openai) return { ok: true, bbox: currentBbox };

    const taskName = "clinic-header-region-validation";
    const model = ModelRouter.getModel(taskName, "simple");

    const systemPrompt = `Você é o revisor final de um sistema que coloca conteúdo dentro de um timbrado médico.

Você recebe a imagem do timbrado com um RETÂNGULO VERMELHO sobreposto. Esse retângulo é onde o sistema PRETENDE escrever o conteúdo do documento (texto do atestado, lista de medicamentos).

Sua única tarefa: o retângulo vermelho sobrepõe-se a QUALQUER elemento pré-impresso do timbrado? (logo, faixa colorida, nome do médico, CRM, campo "PACIENTE:", linha de assinatura, rodapé, marca d'água, borda decorativa, etc).

Se SIM, retorne um bbox novo que evite TODOS os elementos, com pelo menos 3% de margem de segurança.
Se NÃO, retorne ok=true e o mesmo bbox.

Responda APENAS com JSON:
{
  "ok": true|false,
  "bbox": { "top": 0.30, "bottom": 0.85, "left": 0.12, "right": 0.88 },
  "reason": "se ok=false, descreva qual elemento estava sobreposto e em qual borda"
}

Regras:
- O bbox precisa caber título + médico + paciente + ≥2 medicamentos + assinatura + caixas de farmácia.
- ALTURA MÍNIMA: bottom-top >= 0.50. Em caso de sobreposição, prefira deslocar (mover top pra baixo OU bottom pra cima conforme o lado conflitante) MANTENDO altura >= 0.50.
- Se for impossível evitar sobreposição com altura >= 0.50, retorne ok=true e o bbox atual (o sistema usará margens de segurança internas).
- Largura mínima: right-left >= 0.6.`;

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
                            text: `Bbox atual proposto: top=${currentBbox.top.toFixed(2)}, bottom=${currentBbox.bottom.toFixed(2)}, left=${currentBbox.left.toFixed(2)}, right=${currentBbox.right.toFixed(2)}. O retângulo vermelho na imagem mostra essa área. Há sobreposição com algum elemento pré-impresso?`,
                        },
                        {
                            type: "image_url",
                            image_url: { url: annotatedPngDataUrl, detail: "low" },
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 250,
        });

        if (response.usage) {
            await ModelRouter.trackUsage(taskName, model, response.usage, context.userId, context.clinicId);
        }

        const raw = response.choices[0]?.message?.content;
        if (!raw) return { ok: true, bbox: currentBbox };
        const parsed = JSON.parse(raw);

        if (parsed.ok === true) return { ok: true, bbox: currentBbox };

        const refined = sanitizeBbox(parsed.bbox);
        if (!refined) return { ok: true, bbox: currentBbox };

        return { ok: false, bbox: refined, reason: parsed.reason };
    } catch (err) {
        logger.error("[HeaderImageAnalyzer] Validation failed", { error: (err as Error).message });
        return { ok: true, bbox: currentBbox };
    }
}
