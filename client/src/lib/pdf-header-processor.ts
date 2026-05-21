/**
 * Recebe um arquivo PDF do usuário (timbrado), renderiza a primeira página em
 * canvas usando pdfjs, envia ao backend para o GPT-4 Vision identificar a
 * região do cabeçalho, recorta o bbox detectado e devolve um PNG pronto para
 * ser enviado ao endpoint existente de upload de cabeçalho.
 *
 * Tudo client-side exceto a chamada ao GPT — evita dependências nativas
 * (poppler/imagemagick) no servidor.
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export interface HeaderBoundingBox {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface ProcessedHeader {
    /** Full first-page render as PNG dataURL — used as the document background */
    pngDataUrl: string;
    /** Body region where document content (medication list, atestado text) goes */
    bodyBbox: HeaderBoundingBox;
    confidence: "high" | "medium" | "low";
    fallback: boolean;
}

const TARGET_WIDTH = 2400; // High-res, downsized server-side when generating PDFs
const RENDER_SCALE_FALLBACK = 2.0;

async function renderPdfFirstPage(file: File): Promise<HTMLCanvasElement> {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    if (pdf.numPages < 1) throw new Error("PDF sem páginas");

    const page = await pdf.getPage(1);
    const viewport1x = page.getViewport({ scale: 1 });
    // Compute scale to hit ~TARGET_WIDTH on the long edge
    const scale = TARGET_WIDTH / Math.max(viewport1x.width, viewport1x.height);
    const finalScale = Number.isFinite(scale) && scale > 0 ? scale : RENDER_SCALE_FALLBACK;
    const viewport = page.getViewport({ scale: finalScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context indisponível");

    // White background — letterheads often have transparent areas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
}

/** Downscale a PNG dataURL to fit max width while keeping aspect, returns dataURL. */
function downscaleForUpload(canvas: HTMLCanvasElement, maxWidth = 2000): string {
    if (canvas.width <= maxWidth) return canvas.toDataURL("image/png");
    const ratio = maxWidth / canvas.width;
    const out = document.createElement("canvas");
    out.width = maxWidth;
    out.height = Math.round(canvas.height * ratio);
    const ctx = out.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
}

async function analyzeBboxViaServer(clinicId: number, dataUrl: string): Promise<{
    bbox: HeaderBoundingBox;
    confidence: "high" | "medium" | "low";
    fallback: boolean;
}> {
    // Downscale to send a smaller payload to GPT-Vision
    const previewCanvas = document.createElement("canvas");
    const img = await loadImage(dataUrl);
    const targetW = Math.min(1200, img.naturalWidth);
    const ratio = targetW / img.naturalWidth;
    previewCanvas.width = targetW;
    previewCanvas.height = Math.round(img.naturalHeight * ratio);
    const ctx = previewCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context indisponível");
    ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
    const previewDataUrl = previewCanvas.toDataURL("image/jpeg", 0.85);

    const res = await fetch(`/api/clinics/${clinicId}/header/analyze-image`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: previewDataUrl }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao analisar imagem");
    }
    return res.json();
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Full pipeline: PDF File → full-page letterhead PNG + body bbox.
 * The result is uploaded to /api/clinics/:id/header/letterhead and the entire
 * PDF design becomes the document template; the AI-identified body region
 * tells the renderer where to drop the prescription content.
 */
export async function processPdfHeader(file: File, clinicId: number): Promise<ProcessedHeader> {
    const canvas = await renderPdfFirstPage(file);
    const pngDataUrl = downscaleForUpload(canvas, 1800);

    let bodyBbox: HeaderBoundingBox = { top: 0.18, bottom: 0.85, left: 0.08, right: 0.92 };
    let confidence: ProcessedHeader["confidence"] = "low";
    let fallback = true;

    try {
        const result = await analyzeBboxViaServer(clinicId, pngDataUrl);
        bodyBbox = result.bbox;
        confidence = result.confidence;
        fallback = result.fallback;
    } catch (err) {
        console.warn("[pdf-header-processor] análise falhou, usando bbox padrão", err);
    }

    return { pngDataUrl, bodyBbox, confidence, fallback };
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
}
