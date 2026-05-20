import jsPDF from "jspdf";

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

export interface PreloadedHeaderAssets {
    image?: { dataUrl: string; aspect: number };
    logo?: { dataUrl: string; aspect: number };
}

/**
 * Loads an image URL into a data URL through canvas rasterization, returning
 * the data URL and natural dimensions. Supports any browser-decodable format
 * (PNG, JPG, WebP, SVG) and normalises the output to PNG so jsPDF can embed it.
 */
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
    if (!header) return {};
    const [image, logo] = await Promise.all([
        header.imageUrl ? loadImageForPdf(header.imageUrl) : Promise.resolve(undefined),
        header.logoUrl ? loadImageForPdf(header.logoUrl) : Promise.resolve(undefined),
    ]);
    return { image, logo };
}

/**
 * Fetches the active clinic header for the logged-in user and preloads its
 * image assets so they can be embedded synchronously into a jsPDF document.
 */
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

/**
 * Draws the document header for one page/via.
 *
 * @returns the Y coordinate where the document content should start.
 */
export function drawDocumentHeader(
    doc: jsPDF,
    header: ClinicHeaderForPdf | undefined | null,
    assets: PreloadedHeaderAssets,
    options: {
        xOffset: number;
        pageWidth: number;
        marginX?: number;
        topMargin?: number;
        showVitaViewMark?: boolean;
    }
): number {
    const xOffset = options.xOffset;
    const pageWidth = options.pageWidth;
    const marginX = options.marginX ?? 10;
    const topMargin = options.topMargin ?? 10;
    const showMark = options.showVitaViewMark ?? true;
    const leftX = xOffset + marginX;
    const rightX = xOffset + pageWidth - marginX;
    const contentWidth = pageWidth - marginX * 2;

    const mode = header?.mode ?? "minimal";

    // ===== IMAGE MODE =====
    if (mode === "image" && assets.image) {
        const maxHeight = 28;
        let drawWidth = contentWidth;
        let drawHeight = drawWidth / assets.image.aspect;
        if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * assets.image.aspect;
        }
        const drawX = leftX + (contentWidth - drawWidth) / 2;
        doc.addImage(assets.image.dataUrl, "PNG", drawX, topMargin, drawWidth, drawHeight);

        // Thin separator under image
        const separatorY = topMargin + drawHeight + 2;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(leftX, separatorY, rightX, separatorY);

        if (showMark) drawVitaViewFooterMark(doc, xOffset, pageWidth);
        return separatorY + 4;
    }

    // ===== COMPOSED MODE =====
    if (mode === "composed" && (assets.logo || header?.clinicName)) {
        let cursorY = topMargin + 2;
        const logoSize = 18;
        let textX = leftX;

        if (assets.logo) {
            const w = logoSize * Math.min(assets.logo.aspect, 1);
            const h = w / assets.logo.aspect;
            doc.addImage(assets.logo.dataUrl, "PNG", leftX, topMargin, w, h);
            textX = leftX + logoSize + 5;
        }

        const textWidth = rightX - textX;
        doc.setTextColor(20, 20, 20);
        if (header?.clinicName) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(header.clinicName.toUpperCase(), textX, cursorY + 4);
            cursorY += 6;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);

        const infoLines: string[] = [];
        if (header?.address) infoLines.push(header.address);

        const contactBits: string[] = [];
        if (header?.phone) contactBits.push(header.phone);
        if (header?.email) contactBits.push(header.email);
        if (header?.website) contactBits.push(header.website);
        if (contactBits.length) infoLines.push(contactBits.join("  ·  "));

        if (header?.cnpj) infoLines.push(`CNPJ ${header.cnpj}`);

        for (const line of infoLines) {
            const wrapped = doc.splitTextToSize(line, textWidth);
            doc.text(wrapped, textX, cursorY + 4);
            cursorY += wrapped.length * 3.5;
        }

        const baseline = Math.max(cursorY + 3, topMargin + logoSize + 1);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(leftX, baseline, rightX, baseline);

        doc.setTextColor(0, 0, 0);
        if (showMark) drawVitaViewFooterMark(doc, xOffset, pageWidth);
        return baseline + 4;
    }

    // ===== MINIMAL MODE (default) =====
    const minimalSeparatorY = topMargin + 8;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(leftX, minimalSeparatorY, rightX, minimalSeparatorY);
    if (showMark) drawVitaViewFooterMark(doc, xOffset, pageWidth);
    return minimalSeparatorY + 4;
}

/**
 * Draws a discreet "VitaView.AI" mark in the page footer.
 */
export function drawVitaViewFooterMark(
    doc: jsPDF,
    xOffset: number,
    pageWidth: number,
    pageHeight: number = 210
) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("VitaView.AI", xOffset + pageWidth - 10, pageHeight - 4, { align: "right" });
    doc.setTextColor(0, 0, 0);
}
