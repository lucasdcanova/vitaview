/**
 * Renders an AI-generated header spec onto a canvas and exports it as a PNG
 * data URL. The output is uploaded to the existing `image mode` endpoint, so
 * the rest of the document pipeline does not need to know it came from AI.
 */

export interface HeaderSpec {
    /** Short human-readable label, used in the UI as "Variação X" */
    variationLabel: string;

    palette: {
        ink: string; // primary text color
        accent: string; // gold / accent
        line: string; // divider / rule color
    };

    monogram: {
        style: "initials" | "circle" | "shield" | "none";
        initials: string;
    };

    layout: {
        composition: "centered" | "left-aligned" | "monogram-left";
    };

    typography: {
        nameFont: "serif" | "serif-display" | "sans-modern";
        nameWeight: "normal" | "bold";
        nameCase: "title" | "upper" | "smallcaps";
    };

    divider: {
        style: "single" | "double" | "double-thin" | "accent-tick" | "none";
    };
}

export interface HeaderContent {
    /** Title line — clinic name OR doctor name */
    primary: string;
    /** Secondary line — credentials (CRM, specialty) */
    secondary?: string;
    /** Tertiary line — address + contact */
    contact?: string;
}

const FONT_FAMILY: Record<HeaderSpec["typography"]["nameFont"], string> = {
    serif: "'Times New Roman', 'Times', serif",
    "serif-display": "'Playfair Display', 'Cormorant Garamond', 'Times New Roman', serif",
    "sans-modern": "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const SECONDARY_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 360;
const PADDING_X = 60;
const PADDING_Y = 50;

function applyCase(text: string, mode: HeaderSpec["typography"]["nameCase"]): string {
    if (mode === "upper" || mode === "smallcaps") return text.toUpperCase();
    return text;
}

function drawMonogram(
    ctx: CanvasRenderingContext2D,
    spec: HeaderSpec,
    cx: number,
    cy: number,
    size: number
) {
    const { monogram, palette } = spec;
    if (monogram.style === "none" || !monogram.initials) return;

    ctx.save();
    ctx.strokeStyle = palette.ink;
    ctx.fillStyle = palette.ink;
    ctx.lineWidth = Math.max(1.5, size * 0.025);

    if (monogram.style === "circle") {
        ctx.beginPath();
        ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx.stroke();
    } else if (monogram.style === "shield") {
        const w = size;
        const h = size;
        const x = cx - w / 2;
        const y = cy - h / 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h * 0.6);
        ctx.quadraticCurveTo(x + w / 2, y + h * 1.05, x, y + h * 0.6);
        ctx.closePath();
        ctx.stroke();
    } else {
        // "initials" — frame only when not too dense
        ctx.beginPath();
        ctx.rect(cx - size / 2, cy - size / 2, size, size);
        ctx.stroke();
    }

    // Top-left gold accent corner
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy - size / 2 + size * 0.18);
    ctx.lineTo(cx - size / 2, cy - size / 2);
    ctx.lineTo(cx - size / 2 + size * 0.18, cy - size / 2);
    ctx.stroke();

    // Initials
    ctx.fillStyle = palette.ink;
    const fontSize = size * 0.42;
    ctx.font = `600 ${fontSize}px ${FONT_FAMILY["serif-display"]}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(monogram.initials.slice(0, 3), cx, cy);
    ctx.restore();
}

function drawDivider(
    ctx: CanvasRenderingContext2D,
    spec: HeaderSpec,
    x1: number,
    x2: number,
    y: number
) {
    const { divider, palette } = spec;
    if (divider.style === "none") return;

    ctx.save();
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    if (divider.style === "double" || divider.style === "double-thin") {
        const gap = divider.style === "double-thin" ? 4 : 6;
        ctx.lineWidth = divider.style === "double-thin" ? 0.8 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y + gap);
        ctx.lineTo(x2, y + gap);
        ctx.stroke();
    }

    if (divider.style === "accent-tick") {
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const tickLen = Math.min(90, (x2 - x1) * 0.16);
        ctx.moveTo(x2 - tickLen, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
    }
    ctx.restore();
}

export function renderHeaderSpec(spec: HeaderSpec, content: HeaderContent): string {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // Soft background — keep paper white to keep ink low when printed
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const composition = spec.layout.composition;
    const primary = applyCase(content.primary, spec.typography.nameCase);
    const nameFontFamily = FONT_FAMILY[spec.typography.nameFont];
    const isUpper = spec.typography.nameCase !== "title";

    if (composition === "centered") {
        const cx = CANVAS_WIDTH / 2;
        let y = PADDING_Y + 40;

        // Monogram on top
        if (spec.monogram.style !== "none") {
            drawMonogram(ctx, spec, cx, y + 10, 90);
            y += 110;
        }

        // Name
        ctx.fillStyle = spec.palette.ink;
        const nameSize = isUpper ? 64 : 72;
        ctx.font = `${spec.typography.nameWeight === "bold" ? "700" : "500"} ${nameSize}px ${nameFontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(primary, cx, y + nameSize * 0.8);
        y += nameSize * 0.8 + 20;

        // Divider
        const dividerSpan = Math.min(720, CANVAS_WIDTH - PADDING_X * 2);
        drawDivider(ctx, spec, cx - dividerSpan / 2, cx + dividerSpan / 2, y + 6);
        y += 30;

        // Secondary
        if (content.secondary) {
            ctx.fillStyle = spec.palette.ink;
            ctx.font = `400 28px ${SECONDARY_FONT}`;
            ctx.fillText(content.secondary, cx, y + 22);
            y += 40;
        }
        // Contact
        if (content.contact) {
            ctx.fillStyle = spec.palette.line;
            ctx.font = `400 22px ${SECONDARY_FONT}`;
            ctx.fillText(content.contact, cx, y + 22);
        }
    } else if (composition === "monogram-left") {
        const monoSize = 130;
        const monoX = PADDING_X + monoSize / 2;
        const monoCY = CANVAS_HEIGHT / 2;
        drawMonogram(ctx, spec, monoX, monoCY, monoSize);

        const textX = PADDING_X + monoSize + 50;
        const textRight = CANVAS_WIDTH - PADDING_X;
        let y = PADDING_Y + 50;

        ctx.fillStyle = spec.palette.ink;
        const nameSize = isUpper ? 60 : 68;
        ctx.font = `${spec.typography.nameWeight === "bold" ? "700" : "500"} ${nameSize}px ${nameFontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(primary, textX, y + nameSize * 0.8);
        y += nameSize * 0.8 + 18;

        drawDivider(ctx, spec, textX, textRight, y + 6);
        y += 30;

        if (content.secondary) {
            ctx.fillStyle = spec.palette.ink;
            ctx.font = `400 26px ${SECONDARY_FONT}`;
            ctx.fillText(content.secondary, textX, y + 22);
            y += 36;
        }
        if (content.contact) {
            ctx.fillStyle = spec.palette.line;
            ctx.font = `400 22px ${SECONDARY_FONT}`;
            ctx.fillText(content.contact, textX, y + 22);
        }
    } else {
        // left-aligned
        const x = PADDING_X;
        const xRight = CANVAS_WIDTH - PADDING_X;
        let y = PADDING_Y + 40;

        ctx.fillStyle = spec.palette.ink;
        const nameSize = isUpper ? 62 : 70;
        ctx.font = `${spec.typography.nameWeight === "bold" ? "700" : "500"} ${nameSize}px ${nameFontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(primary, x, y + nameSize * 0.8);
        y += nameSize * 0.8 + 18;

        drawDivider(ctx, spec, x, xRight, y + 6);
        y += 30;

        if (content.secondary) {
            ctx.fillStyle = spec.palette.ink;
            ctx.font = `400 26px ${SECONDARY_FONT}`;
            ctx.fillText(content.secondary, x, y + 22);
            y += 36;
        }
        if (content.contact) {
            ctx.fillStyle = spec.palette.line;
            ctx.font = `400 22px ${SECONDARY_FONT}`;
            ctx.fillText(content.contact, x, y + 22);
        }
    }

    return canvas.toDataURL("image/png");
}

/** Converts a data URL into a File so it can be sent via FormData. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
}
