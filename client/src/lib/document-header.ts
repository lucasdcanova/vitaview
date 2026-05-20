import jsPDF from "jspdf";
import { formatSpecialty } from "./specialty-format";

export interface ClinicHeaderForPdf {
    mode: "minimal" | "image" | "composed";
    imageUrl?: string | null;
    logoUrl?: string | null;
    clinicName?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    cnpj?: string | null;
}

export interface DocumentIdentity {
    /** Doctor full name used when no clinic name is set */
    doctorName?: string | null;
    doctorCrm?: string | null;
    /** UF (state) of the CRM, e.g. "SP". Required for legally valid prescriptions. */
    doctorCrmState?: string | null;
    doctorSpecialty?: string | null;
    doctorRqe?: string | null;
    doctorAddress?: string | null;
    doctorPhone?: string | null;
}

/**
 * Formats a CRM into the legal Brazilian format "CRM/UF 123456".
 * Falls back to the bare number if no UF is available.
 */
export function formatCrm(crm?: string | null, uf?: string | null): string {
    if (!crm) return "";
    const cleanCrm = crm.replace(/^crm[\s/-]*/i, "").trim();
    const cleanUf = (uf || "").trim().toUpperCase();
    if (cleanUf) return `CRM/${cleanUf} ${cleanCrm}`;
    return `CRM ${cleanCrm}`;
}

export interface PreloadedHeaderAssets {
    image?: { dataUrl: string; aspect: number };
    logo?: { dataUrl: string; aspect: number };
    /** The VitaView default VV mark (rasterized PNG) — always present after preload */
    vitaViewMark?: { dataUrl: string; aspect: number };
}

const VITAVIEW_MARK_URL = "/logo-icon-transparent.png";

async function loadImageForPdf(
    url: string
): Promise<{ dataUrl: string; aspect: number } | undefined> {
    if (!url) return undefined;
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => reject(err);
            img.src = url;
        });
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) return undefined;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        return { dataUrl, aspect: width / height };
    } catch {
        return undefined;
    }
}

export async function preloadHeaderAssets(
    header: ClinicHeaderForPdf | undefined | null
): Promise<PreloadedHeaderAssets> {
    const [image, logo, vitaViewMark] = await Promise.all([
        header?.imageUrl ? loadImageForPdf(header.imageUrl) : Promise.resolve(undefined),
        header?.logoUrl ? loadImageForPdf(header.logoUrl) : Promise.resolve(undefined),
        loadImageForPdf(VITAVIEW_MARK_URL),
    ]);
    return { image, logo, vitaViewMark };
}

export async function fetchAndPreloadClinicHeader(): Promise<{
    header: ClinicHeaderForPdf | null;
    assets: PreloadedHeaderAssets;
}> {
    try {
        const res = await fetch("/api/clinics/header/active", { credentials: "include" });
        if (!res.ok) return { header: null, assets: {} };
        const data = await res.json();
        const header: ClinicHeaderForPdf = {
            mode: data.headerMode || "minimal",
            imageUrl: data.headerImageUrl,
            logoUrl: data.headerLogoUrl,
            clinicName: data.headerClinicName,
            address: data.headerAddress,
            phone: data.headerPhone,
            email: data.headerEmail,
            website: data.headerWebsite,
            cnpj: data.headerCnpj,
        };
        const assets = await preloadHeaderAssets(header);
        return { header, assets };
    } catch {
        return { header: null, assets: {} };
    }
}

// ============================================================================
// VITAVIEW BRAND HELPERS
// ============================================================================

const INK = { r: 33, g: 33, b: 33 }; // #212121
const INK_SOFT = { r: 95, g: 95, b: 95 };
const INK_MUTED = { r: 150, g: 150, b: 150 };
const LINE_GRAY = { r: 210, g: 210, b: 210 };
const ACCENT = { r: 175, g: 145, b: 80 }; // warm gold accent

/**
 * Renders the actual VitaView VV PNG (or a clinic-supplied logo) inside a
 * subtle outlined box. Pure outlines + raster image — no large filled areas.
 */
function drawMonogramBox(
    doc: jsPDF,
    x: number,
    y: number,
    size: number,
    options: {
        logo?: PreloadedHeaderAssets["logo"];
        vitaViewMark?: PreloadedHeaderAssets["vitaViewMark"];
    }
) {
    doc.setDrawColor(LINE_GRAY.r, LINE_GRAY.g, LINE_GRAY.b);
    doc.setLineWidth(0.5);
    doc.rect(x, y, size, size, "S");

    // Top-left warm-gold accent notch
    doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
    doc.setLineWidth(0.8);
    doc.line(x, y + 2.4, x, y);
    doc.line(x, y, x + 2.4, y);

    const mark = options.logo ?? options.vitaViewMark;
    if (mark) {
        const padding = 1.2;
        const maxW = size - padding * 2;
        const maxH = size - padding * 2;
        let w = maxW;
        let h = w / mark.aspect;
        if (h > maxH) {
            h = maxH;
            w = h * mark.aspect;
        }
        doc.addImage(
            mark.dataUrl,
            "PNG",
            x + (size - w) / 2,
            y + (size - h) / 2,
            w,
            h
        );
    }
}

interface HeaderRenderInput {
    title: string;
    subtitleLine1: string;
    subtitleLine2?: string;
}

function resolveHeaderText(
    header: ClinicHeaderForPdf | undefined | null,
    identity: DocumentIdentity | undefined
): HeaderRenderInput {
    const usingComposed = header?.mode === "composed";

    // Title — prefer clinic name; fall back to doctor's name
    const title = (usingComposed && header?.clinicName) || identity?.doctorName || "VitaView.AI";

    const crmLabel = formatCrm(identity?.doctorCrm, identity?.doctorCrmState);

    const specialtyLabel = formatSpecialty(identity?.doctorSpecialty, identity?.doctorRqe, { prefixWhenNoRqe: false });

    const subtitleParts: string[] = [];
    if (usingComposed) {
        // Clinic mode: subtitle shows doctor identity (since clinic name is the title)
        if (identity?.doctorName && identity.doctorName !== title) {
            const docBits = [identity.doctorName];
            if (crmLabel) docBits.push(crmLabel);
            if (specialtyLabel) docBits.push(specialtyLabel);
            subtitleParts.push(docBits.join("  ·  "));
        } else if (crmLabel) {
            subtitleParts.push(crmLabel);
        }
    } else {
        // Minimal mode: subtitle shows credentials of the doctor
        const bits: string[] = [];
        if (crmLabel) bits.push(crmLabel);
        if (specialtyLabel) bits.push(specialtyLabel);
        if (identity?.doctorRqe) bits.push(`RQE ${identity.doctorRqe}`);
        subtitleParts.push(bits.join("  ·  "));
    }

    // Optional secondary line — composed clinic contact info
    let subtitleLine2: string | undefined;
    if (usingComposed) {
        const contact: string[] = [];
        if (header?.address) contact.push(header.address);
        const inline: string[] = [];
        if (header?.phone) inline.push(header.phone);
        if (header?.email) inline.push(header.email);
        if (header?.website) inline.push(header.website);
        if (inline.length) contact.push(inline.join("  ·  "));
        if (contact.length) subtitleLine2 = contact.join("  ·  ");
    }

    return {
        title,
        subtitleLine1: subtitleParts.filter(Boolean).join("  ·  ") || "VitaView.AI · plataforma médica",
        subtitleLine2,
    };
}

// ============================================================================
// PUBLIC: HEADER + FOOTER + WATERMARK
// ============================================================================

export interface DocumentHeaderOptions {
    xOffset: number;
    pageWidth: number;
    marginX?: number;
    topMargin?: number;
    identity?: DocumentIdentity;
}

export function drawDocumentHeader(
    doc: jsPDF,
    header: ClinicHeaderForPdf | undefined | null,
    assets: PreloadedHeaderAssets,
    options: DocumentHeaderOptions
): number {
    const xOffset = options.xOffset;
    const pageWidth = options.pageWidth;
    const marginX = options.marginX ?? 10;
    const topMargin = options.topMargin ?? 10;
    const leftX = xOffset + marginX;
    const rightX = xOffset + pageWidth - marginX;
    const mode = header?.mode ?? "minimal";

    // ===== IMAGE MODE (user-uploaded full letterhead) =====
    if (mode === "image" && assets.image) {
        const contentWidth = pageWidth - marginX * 2;
        const maxHeight = 30;
        let drawWidth = contentWidth;
        let drawHeight = drawWidth / assets.image.aspect;
        if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * assets.image.aspect;
        }
        const drawX = leftX + (contentWidth - drawWidth) / 2;
        doc.addImage(assets.image.dataUrl, "PNG", drawX, topMargin, drawWidth, drawHeight);
        const sepY = topMargin + drawHeight + 2;
        doc.setDrawColor(LINE_GRAY.r, LINE_GRAY.g, LINE_GRAY.b);
        doc.setLineWidth(0.3);
        doc.line(leftX, sepY, rightX, sepY);
        return sepY + 4;
    }

    // ===== VITA DEFAULT TEMPLATE (used for both composed and minimal) =====
    const { title, subtitleLine1, subtitleLine2 } = resolveHeaderText(header, options.identity);

    const monogramSize = 13;
    const monogramX = leftX;
    const monogramY = topMargin;
    drawMonogramBox(doc, monogramX, monogramY, monogramSize, {
        logo: assets.logo,
        vitaViewMark: assets.vitaViewMark,
    });

    const textX = monogramX + monogramSize + 5;
    const textBaselineY = monogramY + 5;
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    const titleMaxWidth = rightX - textX;
    const titleClean = title.toUpperCase();
    const titleLines = doc.splitTextToSize(titleClean, titleMaxWidth);
    doc.text(titleLines[0], textX, textBaselineY);
    let lineCursor = textBaselineY + 4;

    if (subtitleLine1) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(INK_SOFT.r, INK_SOFT.g, INK_SOFT.b);
        doc.text(subtitleLine1, textX, lineCursor);
        lineCursor += 3.6;
    }

    if (subtitleLine2) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(INK_MUTED.r, INK_MUTED.g, INK_MUTED.b);
        const wrapped = doc.splitTextToSize(subtitleLine2, titleMaxWidth);
        doc.text(wrapped[0], textX, lineCursor);
        lineCursor += 3.2;
        if (wrapped[1]) {
            doc.text(wrapped[1], textX, lineCursor);
            lineCursor += 3.2;
        }
    }

    const sepY = Math.max(monogramY + monogramSize + 2, lineCursor + 1);
    doc.setDrawColor(INK.r, INK.g, INK.b);
    doc.setLineWidth(0.5);
    doc.line(leftX, sepY, rightX, sepY);

    // Warm accent under the divider on the right side, tiny
    doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
    doc.setLineWidth(1.1);
    doc.line(rightX - 18, sepY, rightX, sepY);

    doc.setTextColor(0, 0, 0);
    return sepY + 5;
}

export interface DocumentFooterOptions {
    xOffset: number;
    pageWidth: number;
    pageHeight: number;
    marginX?: number;
    identity?: DocumentIdentity;
}

/**
 * Institutional footer band — outline only, no filled background.
 * Shows doctor identity centered with a small VitaView mark on the right.
 */
export function drawDocumentFooter(
    doc: jsPDF,
    header: ClinicHeaderForPdf | undefined | null,
    options: DocumentFooterOptions
): void {
    const xOffset = options.xOffset;
    const pageWidth = options.pageWidth;
    const pageHeight = options.pageHeight;
    const marginX = options.marginX ?? 10;
    const leftX = xOffset + marginX;
    const rightX = xOffset + pageWidth - marginX;
    const centerX = xOffset + pageWidth / 2;

    const usingComposed = header?.mode === "composed";
    const identity = options.identity;

    const primaryParts: string[] = [];
    if (usingComposed && header?.clinicName) primaryParts.push(header.clinicName);
    if (identity?.doctorName && (!usingComposed || identity.doctorName !== header?.clinicName)) {
        primaryParts.push(identity.doctorName);
    }
    const footerCrm = formatCrm(identity?.doctorCrm, identity?.doctorCrmState);
    if (footerCrm) primaryParts.push(footerCrm);

    const secondaryParts: string[] = [];
    if (usingComposed) {
        if (header?.address) secondaryParts.push(header.address);
        const contact: string[] = [];
        if (header?.phone) contact.push(header.phone);
        if (header?.email) contact.push(header.email);
        if (header?.website) contact.push(header.website);
        if (contact.length) secondaryParts.push(contact.join("  ·  "));
    } else {
        if (identity?.doctorAddress) secondaryParts.push(identity.doctorAddress);
        if (identity?.doctorPhone) secondaryParts.push(identity.doctorPhone);
    }

    const primaryLine = primaryParts.join("  ·  ");
    const secondaryLine = secondaryParts.join("  ·  ");

    const baseY = pageHeight - 14;

    // Thin top rule
    doc.setDrawColor(INK.r, INK.g, INK.b);
    doc.setLineWidth(0.4);
    doc.line(leftX, baseY, rightX, baseY);

    // Accent tick on the left
    doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
    doc.setLineWidth(1.1);
    doc.line(leftX, baseY, leftX + 18, baseY);

    if (primaryLine) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(INK.r, INK.g, INK.b);
        doc.text(primaryLine, centerX, baseY + 4, { align: "center", maxWidth: pageWidth - marginX * 2 - 30 });
    }
    if (secondaryLine) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(INK_SOFT.r, INK_SOFT.g, INK_SOFT.b);
        const yPos = primaryLine ? baseY + 7.5 : baseY + 4.5;
        doc.text(secondaryLine, centerX, yPos, { align: "center", maxWidth: pageWidth - marginX * 2 - 30 });
    }

    // VitaView mark in the right corner
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(INK_MUTED.r, INK_MUTED.g, INK_MUTED.b);
    doc.text("Sistema VitaView.AI", rightX, baseY + 4, { align: "right" });

    doc.setTextColor(0, 0, 0);
}

/**
 * Renders a faint logo watermark centered on the page. Uses the clinic's
 * uploaded logo when present, otherwise the VitaView default mark. The same
 * source file the user uploads for the header acts as the watermark, so it
 * stays consistent and clients can use their own brand.
 */
export function drawDocumentWatermark(
    doc: jsPDF,
    options: {
        xOffset: number;
        pageWidth: number;
        pageHeight: number;
        assets?: PreloadedHeaderAssets;
    }
): void {
    const mark = options.assets?.logo ?? options.assets?.vitaViewMark;
    if (!mark) return;

    const docAny = doc as any;
    if (typeof docAny.setGState !== "function" || typeof docAny.GState !== "function") {
        return;
    }

    const targetSize = Math.min(options.pageWidth, options.pageHeight) * 0.42;
    let w = targetSize;
    let h = w / mark.aspect;
    if (h > targetSize) {
        h = targetSize;
        w = h * mark.aspect;
    }

    const cx = options.xOffset + options.pageWidth / 2;
    const cy = options.pageHeight / 2;

    const transparentState = docAny.GState({ opacity: 0.05 });
    const opaqueState = docAny.GState({ opacity: 1 });
    docAny.setGState(transparentState);
    doc.addImage(mark.dataUrl, "PNG", cx - w / 2, cy - h / 2, w, h);
    docAny.setGState(opaqueState);
}

/**
 * Legacy compatibility export — older code paths might import this. Kept as a
 * no-op since drawDocumentFooter now handles the brand mark.
 */
export function drawVitaViewFooterMark(): void {
    /* no-op */
}
