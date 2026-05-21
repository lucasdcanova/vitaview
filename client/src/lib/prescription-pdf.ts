import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    drawDocumentFooter,
    drawDocumentHeader,
    drawDocumentWatermark,
    drawLetterheadBackground,
    fetchAndPreloadClinicHeader,
    formatBrazilianPhone,
    formatCrm,
    isLetterheadMode,
    isPreprintedMode,
    type ClinicHeaderForPdf,
    type DocumentIdentity,
    type PreloadedHeaderAssets,
    type PreprintedConfig,
} from "./document-header";
import { quantityWithExtenso } from "./quantity-extenso";
import { classifyPrescriptionType } from "@/data/controlled-substances";
import { formatSpecialty } from "./specialty-format";

interface PrescriptionData {
    // Dados do Emitente (Médico/Clínica)
    clinicName?: string;
    clinicAddress?: string;
    clinicPhone?: string;
    doctorName: string;
    doctorCrm: string;
    doctorCrmState?: string;
    doctorSpecialty?: string;
    doctorRqe?: string;
    doctorAddress?: string;
    doctorPhone?: string;
    doctorCity?: string;
    // Dados do Paciente
    patientName: string;
    patientCpf?: string;
    patientRg?: string;
    patientAge?: string;
    patientBirthDate?: string;
    patientAddress?: string;
    patientMotherName?: string;
    patientGender?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientGuardianName?: string;
    patientInsurance?: string;
    // Dados da Receita
    issueDate: Date;
    validUntil?: Date;
    isContinuousUse?: boolean;
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        format?: string;
        notes?: string;
        quantity?: string;
        prescriptionType?: string;
        /** True when the name matches a DCB (generic) in the medication database */
        isGeneric?: boolean;
        /** Optional explicit route, e.g. "oral", "tópico", "injetável" */
        route?: string;
        /** True when the medication is for continuous use (chronic, "ad eternum") */
        continuous?: boolean;
    }[];
    observations?: string;
    /** ICD-10 code (CID-10), optional but commonly requested on controlled prescriptions */
    cid?: string;
    /** Sequential prescription number per clinic — used for traceability */
    prescriptionNumber?: number | string;
    /** Whether this rendering is for a controlled prescription (adds extenso, via, etc.) */
    isControlledRender?: boolean;
    // Custom header (preloaded by caller via fetchAndPreloadClinicHeader)
    clinicHeader?: ClinicHeaderForPdf | null;
    clinicHeaderAssets?: PreloadedHeaderAssets;
    validityText?: string;
}

const buildIdentity = (data: PrescriptionData): DocumentIdentity => ({
    doctorName: data.doctorName,
    doctorCrm: data.doctorCrm,
    doctorCrmState: data.doctorCrmState,
    doctorSpecialty: data.doctorSpecialty,
    doctorRqe: data.doctorRqe,
    doctorAddress: data.doctorAddress,
    doctorPhone: data.doctorPhone,
});

// Lista de medicamentos controlados
// Legacy substring matcher kept as a defensive backstop: when a medication
// has no `prescriptionType` flag set, we re-classify it via the official
// Anvisa list to route it to the correct receita type.
const inferTypeFromName = (medName: string): 'padrao' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1' =>
    classifyPrescriptionType(medName) as any;

const cleanTextForPDF = (text: string): string => {
    if (!text) return "";
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\uD800-\uDFFF].|[☀-➿]/g, "").trim();
};

const formatBirthDate = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    if (raw.includes("-")) {
        const [year, month, day] = raw.split("-");
        if (year && month && day) return `${day}/${month}/${year}`;
    }
    return raw;
};

// Expand short Brazilian medication abbreviations to full names for legibility.
// "1 cp" -> "1 comprimido", "2 cps" -> "2 cápsulas", "3 caps" -> "3 cápsulas", "5 gts" -> "5 gotas"
const expandFormatName = (s: string): string => {
    if (!s) return s;
    const pluralize = (n: string, singular: string, plural: string) => {
        const num = parseFloat(n.replace(",", "."));
        return Number.isFinite(num) && num <= 1 ? singular : plural;
    };
    return s
        .replace(/(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*cps\b/gi, (_, n) => `${n} ${pluralize(n, "cápsula", "cápsulas")}`)
        .replace(/(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*caps\b/gi, (_, n) => `${n} ${pluralize(n, "cápsula", "cápsulas")}`)
        .replace(/(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*cp\b/gi, (_, n) => `${n} ${pluralize(n, "comprimido", "comprimidos")}`)
        .replace(/(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*gts?\b/gi, (_, n) => `${n} ${pluralize(n, "gota", "gotas")}`);
};

const resolveRouteOfAdministration = (medFormat?: string): string | null => {
    if (!medFormat) return null;
    const f = medFormat.toLowerCase();
    if (f.includes("injet") || f.includes("ampola")) return "Injetável";
    if (f.includes("topico") || f.includes("pomada") || f.includes("creme")) return "Tópico";
    if (f.includes("gotas") || f.includes("colírio")) return "Oftálmico";
    if (f.includes("inalat") || f.includes("spray nasal")) return "Inalatório";
    if (f.includes("supositório")) return "Retal";
    return "Oral";
};

// ==========================================
// SHARED CONTENT HELPERS
// ==========================================

interface BodyLayout {
    xOffset: number;
    pageWidth: number;
    margin: number;
    leftX: number;
    rightX: number;
    centerX: number;
    contentWidth: number;
}

const layoutFor = (xOffset: number, pageWidth: number, margin: number = 10): BodyLayout => ({
    xOffset,
    pageWidth,
    margin,
    leftX: xOffset + margin,
    rightX: xOffset + pageWidth - margin,
    centerX: xOffset + pageWidth / 2,
    contentWidth: pageWidth - margin * 2,
});

/**
 * Draws the document title + a thin divider. Returns the Y position after the divider.
 */
const drawDocumentTitle = (
    doc: jsPDF,
    layout: BodyLayout,
    title: string,
    yPos: number,
    options: { subtitle?: string; subtitle2?: string; color?: [number, number, number] } = {}
): number => {
    const color = options.color ?? [25, 25, 25];
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, layout.centerX, yPos + 4, { align: "center" });
    let nextY = yPos + 6;
    if (options.subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(110, 110, 110);
        doc.text(options.subtitle, layout.centerX, nextY + 3, { align: "center" });
        nextY += 3.5;
    }
    if (options.subtitle2) {
        doc.text(options.subtitle2, layout.centerX, nextY + 3, { align: "center" });
        nextY += 3.5;
    }
    doc.setTextColor(0, 0, 0);

    // Divider
    nextY += 3;
    doc.setLineWidth(0.4);
    doc.setDrawColor(40, 40, 40);
    doc.line(layout.leftX, nextY, layout.rightX, nextY);
    return nextY + 5;
};

/**
 * Draws doctor identification line.
 */
const drawDoctorBlock = (doc: jsPDF, layout: BodyLayout, data: PrescriptionData, yPos: number): number => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, layout.leftX, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(formatCrm(data.doctorCrm, data.doctorCrmState), layout.rightX, yPos, { align: "right" });

    let nextY = yPos + 4.5;
    if (data.doctorSpecialty) {
        doc.setFontSize(8);
        doc.setTextColor(95, 95, 95);
        const specialtyLabel = formatSpecialty(data.doctorSpecialty, data.doctorRqe);
        const specialty = data.doctorRqe
            ? `${specialtyLabel}  ·  RQE ${data.doctorRqe}`
            : specialtyLabel;
        doc.text(specialty, layout.rightX, nextY, { align: "right" });
        doc.setTextColor(0, 0, 0);
        nextY += 4;
    }
    if (data.doctorAddress) {
        doc.setFontSize(7.5);
        doc.setTextColor(110, 110, 110);
        const addrWrapped = doc.splitTextToSize(data.doctorAddress, layout.contentWidth);
        doc.text(addrWrapped[0], layout.leftX, nextY);
        if (data.doctorPhone) {
            doc.text(formatBrazilianPhone(data.doctorPhone), layout.rightX, nextY, { align: "right" });
        }
        doc.setTextColor(0, 0, 0);
        nextY += 3.6;
    }
    return nextY;
};

/**
 * Slim patient block for the basic prescription (no header repetition + no issue date).
 * One line only: Paciente NAME · BIRTHDATE · CPF — no convênio, address, gender, etc.
 * Issue date is moved to the signature footer.
 */
const drawPatientBlockSlim = (doc: jsPDF, layout: BodyLayout, data: PrescriptionData, yPos: number): number => {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Paciente", layout.leftX, yPos);
    const labelW = doc.getTextWidth("Paciente") + 3;

    doc.setFont("helvetica", "normal");
    const parts: string[] = [data.patientName];
    const bd = formatBirthDate(data.patientBirthDate);
    if (bd) parts.push(bd);
    if (data.patientCpf) parts.push(`CPF ${data.patientCpf}`);
    const text = parts.join("  ·  ");
    const wrapped = doc.splitTextToSize(text, layout.contentWidth - labelW);
    doc.text(wrapped[0], layout.leftX + labelW, yPos);

    let nextY = yPos + 5;
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(layout.leftX, nextY, layout.rightX, nextY);
    return nextY + 5;
};

const PT_BR_MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const formatPtBrLongDate = (d: Date): string =>
    `${d.getDate()} de ${PT_BR_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;

/**
 * Footer for the basic prescription: signature anchored to the right, date+city on the left at
 * the same baseline as the signature line. No validity disclaimer, no institutional bottom band.
 */
const drawBasicSignatureFooter = (
    doc: jsPDF,
    layout: BodyLayout,
    data: PrescriptionData,
    options: { pageHeight?: number; signatureOffset?: number; viaLabel?: string } = {}
) => {
    const pageHeight = options.pageHeight ?? 210;
    const signatureY = pageHeight - (options.signatureOffset ?? 32);

    // Signature block anchored to the right half
    const sigHalfWidth = Math.min(40, (layout.contentWidth / 2) - 4);
    const sigCenter = layout.rightX - sigHalfWidth;

    doc.setLineWidth(0.3);
    doc.setDrawColor(40, 40, 40);
    doc.line(sigCenter - sigHalfWidth, signatureY, sigCenter + sigHalfWidth, signatureY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.doctorName, sigCenter, signatureY + 4.5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(formatCrm(data.doctorCrm, data.doctorCrmState), sigCenter, signatureY + 9, { align: "center" });
    doc.setFontSize(7);
    doc.text("Assinatura e carimbo", sigCenter, signatureY + 13, { align: "center" });

    // City prefix + blank date fields — doctor fills the date manually
    const cityPrefix = data.doctorCity ? `${data.doctorCity}, ` : "";
    const blankDate = `${cityPrefix}_____ / _____ / __________`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(blankDate, layout.leftX, signatureY);

    if (options.viaLabel) {
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        doc.text(options.viaLabel, layout.rightX, pageHeight - 8, { align: "right" });
        doc.setTextColor(0, 0, 0);
    }
};

/**
 * Compact doctor block (2 lines): name+CRM, then specialty/RQE/address (left) + phone (right).
 */
const drawDoctorBlockCompact = (doc: jsPDF, layout: BodyLayout, data: PrescriptionData, yPos: number): number => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${data.doctorName}`, layout.leftX, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(formatCrm(data.doctorCrm, data.doctorCrmState), layout.rightX, yPos, { align: "right" });

    let nextY = yPos + 4;

    const leftBits: string[] = [];
    if (data.doctorSpecialty) {
        const sp = formatSpecialty(data.doctorSpecialty, data.doctorRqe);
        leftBits.push(data.doctorRqe ? `${sp} · RQE ${data.doctorRqe}` : sp);
    }
    if (data.doctorAddress) {
        const addr = data.doctorAddress.length > 40
            ? data.doctorAddress.slice(0, 37) + "..."
            : data.doctorAddress;
        leftBits.push(addr);
    }

    doc.setFontSize(7.5);
    doc.setTextColor(95, 95, 95);
    if (leftBits.length) {
        doc.text(leftBits.join("  ·  "), layout.leftX, nextY);
    }
    if (data.doctorPhone) {
        doc.text(formatBrazilianPhone(data.doctorPhone), layout.rightX, nextY, { align: "right" });
    }
    doc.setTextColor(0, 0, 0);
    return nextY + 4;
};

/**
 * Compact patient block (2 lines): name+date, then DN/CPF/sex/insurance/address all on one line.
 */
const drawPatientBlockCompact = (doc: jsPDF, layout: BodyLayout, data: PrescriptionData, yPos: number): number => {
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente", layout.leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, layout.leftX + 18, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Data", layout.rightX - 25, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, layout.rightX, yPos, { align: "right" });

    let nextY = yPos + 4;

    const bits: string[] = [];
    const bd = formatBirthDate(data.patientBirthDate);
    if (bd) bits.push(`DN ${bd}`);
    if (data.patientCpf) bits.push(`CPF ${data.patientCpf}`);
    if (data.patientGender) bits.push(`Sexo ${data.patientGender}`);
    if (data.patientAddress) {
        const addr = data.patientAddress.length > 45
            ? data.patientAddress.slice(0, 42) + "..."
            : data.patientAddress;
        bits.push(addr);
    }
    if (data.patientInsurance) bits.push(data.patientInsurance);

    doc.setFontSize(7.5);
    doc.setTextColor(95, 95, 95);
    if (bits.length) {
        const text = bits.join(" · ");
        const wrapped = doc.splitTextToSize(text, layout.contentWidth);
        doc.text(wrapped[0], layout.leftX, nextY);
    }
    doc.setTextColor(0, 0, 0);
    nextY += 4;

    nextY += 1.5;
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(layout.leftX, nextY, layout.rightX, nextY);
    return nextY + 4;
};

/**
 * Draws patient identification block (name + date + secondary line).
 */
const drawPatientBlock = (doc: jsPDF, layout: BodyLayout, data: PrescriptionData, yPos: number): number => {
    const dateStr = format(data.issueDate, "dd/MM/yyyy", { locale: ptBR });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente", layout.leftX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.patientName, layout.leftX + 18, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Data", layout.rightX - 25, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, layout.rightX, yPos, { align: "right" });

    let nextY = yPos + 4.5;

    // Secondary identification line
    doc.setFontSize(8);
    doc.setTextColor(95, 95, 95);
    const bits: string[] = [];
    const bd = formatBirthDate(data.patientBirthDate);
    if (bd) bits.push(`DN ${bd}`);
    if (data.patientCpf) bits.push(`CPF ${data.patientCpf}`);
    if (data.patientGender) bits.push(`Sexo ${data.patientGender}`);
    if (data.patientInsurance) bits.push(data.patientInsurance);
    if (bits.length) {
        doc.text(bits.join("    ·    "), layout.leftX, nextY);
        nextY += 4;
    }

    if (data.patientAddress) {
        const addr = data.patientAddress.length > 110
            ? data.patientAddress.slice(0, 107) + "..."
            : data.patientAddress;
        const wrapped = doc.splitTextToSize(addr, layout.contentWidth);
        doc.text(wrapped, layout.leftX, nextY);
        nextY += wrapped.length * 3.5;
    }

    doc.setTextColor(0, 0, 0);

    // Subtle divider
    nextY += 3;
    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(layout.leftX, nextY, layout.rightX, nextY);
    return nextY + 5;
};

/**
 * Draws the medications list. Returns updated Y.
 */
const drawMedicationsBlock = (
    doc: jsPDF,
    layout: BodyLayout,
    data: PrescriptionData,
    startY: number
): number => {
    let yPos = startY;

    data.medications.forEach((med, index) => {
        const baseLeft = layout.leftX;
        const textLeft = baseLeft + 7;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);

        const medName = cleanTextForPDF(med.name).toUpperCase();
        doc.text(`${index + 1}.`, baseLeft, yPos);
        const nameWrapped = doc.splitTextToSize(medName, layout.contentWidth - 45);
        doc.text(nameWrapped, textLeft, yPos);
        const nameLineCount = nameWrapped.length;

        // DCB / Marca tag right after the name
        const tagX = textLeft + doc.getTextWidth(nameWrapped[nameWrapped.length - 1] || medName) + 2;
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        if (med.isGeneric === true) {
            doc.setTextColor(60, 110, 60);
            doc.text("(DCB)", tagX, yPos - 0.6);
        } else if (med.isGeneric === false) {
            doc.setTextColor(120, 90, 30);
            doc.text("(comercial)", tagX, yPos - 0.6);
        }
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        if (med.quantity) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const qty = data.isControlledRender
                ? (quantityWithExtenso(med.quantity) || med.quantity)
                : med.quantity;
            doc.text(qty, layout.rightX, yPos, { align: "right" });
        }

        yPos += nameLineCount * 4.5 + 0.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(45, 45, 45);

        const route = med.route || resolveRouteOfAdministration(med.format)
            || (data.isControlledRender ? "Oral" : null);

        const posBits: string[] = [];
        if (med.dosage) posBits.push(expandFormatName(med.dosage));
        if (route) posBits.push(`via ${route.toLowerCase()}`);
        if (med.frequency) posBits.push(med.frequency);
        const posologia = posBits.join("  ·  ");

        const isContinuous = med.continuous === true || (med.continuous === undefined && !!data.isContinuousUse);

        if (posologia) {
            const wrapped = doc.splitTextToSize(posologia, layout.contentWidth - 30);
            doc.text(wrapped, textLeft, yPos);

            if (isContinuous) {
                doc.setFontSize(8);
                doc.setTextColor(110, 110, 110);
                doc.text("Uso contínuo", layout.rightX, yPos, { align: "right" });
            }

            yPos += wrapped.length * 3.7;
        } else if (isContinuous) {
            doc.setFontSize(8);
            doc.setTextColor(110, 110, 110);
            doc.text("Uso contínuo", layout.rightX, yPos, { align: "right" });
            yPos += 3.7;
        }

        if (med.notes) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(110, 110, 110);
            const wrapped = doc.splitTextToSize(`Obs.: ${med.notes}`, layout.contentWidth - 10);
            doc.text(wrapped, textLeft, yPos + 1);
            yPos += wrapped.length * 3.5;
            doc.setFont("helvetica", "normal");
        }

        yPos += 6;
        doc.setTextColor(0, 0, 0);
    });

    if (data.observations && !data.observations.toLowerCase().includes("renovação de medicamentos")) {
        yPos += 3;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(90, 90, 90);
        const lines = doc.splitTextToSize(`Observações: ${data.observations}`, layout.contentWidth);
        doc.text(lines, layout.leftX, yPos);
        yPos += lines.length * 3.5;
        doc.setTextColor(0, 0, 0);
    }

    return yPos;
};

/**
 * Draws signature block at the bottom plus validity footer.
 */
const drawSignatureFooter = (
    doc: jsPDF,
    layout: BodyLayout,
    data: PrescriptionData,
    options: {
        pageHeight?: number;
        signatureOffset?: number;
        footerOffset?: number;
        viaLabel?: string;
    } = {}
) => {
    const pageHeight = options.pageHeight ?? 210;
    const signatureY = pageHeight - (options.signatureOffset ?? 45);
    const footerY = pageHeight - (options.footerOffset ?? 15);

    doc.setLineWidth(0.3);
    doc.setDrawColor(40, 40, 40);
    doc.line(layout.centerX - 40, signatureY, layout.centerX + 40, signatureY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.doctorName, layout.centerX, signatureY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(formatCrm(data.doctorCrm, data.doctorCrmState), layout.centerX, signatureY + 10, { align: "center" });
    doc.setFontSize(7);
    doc.text("Assinatura e carimbo", layout.centerX, signatureY + 14, { align: "center" });

    doc.setTextColor(110, 110, 110);
    doc.setFontSize(7);
    const validityText = data.validityText
        || (data.isContinuousUse
            ? "Receita de uso contínuo — sujeita ao critério da farmácia/drogaria."
            : "Sem prazo legal de validade — sujeita ao critério da farmácia/drogaria.");
    doc.text(validityText, layout.leftX, footerY);
    if (options.viaLabel) {
        doc.text(options.viaLabel, layout.rightX, footerY, { align: "right" });
    }
    doc.setTextColor(0, 0, 0);
};

// Brand palette for controlled prescription chrome (black-on-white, ink-saving)
const BRAND_INK = { r: 33, g: 33, b: 33 };

/** Compact pill-shaped section header (filled black, white text — small accent area). */
const drawPillLabel = (
    doc: jsPDF,
    centerX: number,
    y: number,
    label: string,
    options: { fontSize?: number; paddingX?: number; height?: number } = {}
) => {
    const fontSize = options.fontSize ?? 6.5;
    const padX = options.paddingX ?? 6;
    const h = options.height ?? 5;
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    const textW = doc.getTextWidth(label);
    const pillW = textW + padX * 2;
    const pillX = centerX - pillW / 2;

    doc.setFillColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    if (typeof (doc as any).roundedRect === "function") {
        (doc as any).roundedRect(pillX, y, pillW, h, h / 2, h / 2, "F");
    } else {
        doc.rect(pillX, y, pillW, h, "F");
    }
    doc.setTextColor(255, 255, 255);
    doc.text(label, centerX, y + h - 1.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
};

/**
 * Doctor identification box for controlled prescriptions.
 * Layout: logo on the left, name + specialty + contact in the middle column,
 * CRM and RQE prominently right-aligned (both bold) to give them stamp-like emphasis.
 */
const drawEmitenteBox = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: PrescriptionData
) => {
    const logo = data.clinicHeaderAssets?.logo;

    doc.setDrawColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    doc.setLineWidth(0.4);
    doc.rect(x, y, width, height, "S");
    drawPillLabel(doc, x + width / 2, y - 2.5, "Identificação do emitente");

    const logoSize = 14;
    const logoX = x + 4;
    const logoY = y + (height - logoSize) / 2;
    let infoLeftX = x + 4;
    if (logo) {
        let w = logoSize;
        let h = w / logo.aspect;
        if (h > logoSize) { h = logoSize; w = h * logo.aspect; }
        doc.addImage(logo.dataUrl, "PNG", logoX, logoY + (logoSize - h) / 2, w, h);
        infoLeftX = logoX + logoSize + 5;
    }

    const rightEdge = x + width - 4;
    const crmStr = formatCrm(data.doctorCrm, data.doctorCrmState);

    // Line 1: Name (left, bold) + CRM (right, bold — same prominence)
    let infoY = y + 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    const crmW = doc.getTextWidth(crmStr);
    const nameMaxW = rightEdge - infoLeftX - crmW - 5;
    const nameWrapped = doc.splitTextToSize(`Dr(a). ${data.doctorName}`, nameMaxW);
    doc.text(nameWrapped[0], infoLeftX, infoY);
    doc.text(crmStr, rightEdge, infoY, { align: "right" });
    infoY += 5;

    // Line 2: Specialty (left, gray) + RQE (right, bold — second emphasis)
    if (data.doctorSpecialty) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(95, 95, 95);
        const sp = formatSpecialty(data.doctorSpecialty, data.doctorRqe);
        doc.text(sp, infoLeftX, infoY);
    }
    if (data.doctorRqe) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
        doc.text(`RQE ${data.doctorRqe}`, rightEdge, infoY, { align: "right" });
    }
    if (data.doctorSpecialty || data.doctorRqe) infoY += 4.5;

    // Line 3: Phone · Address (tertiary)
    const bits: string[] = [];
    if (data.doctorPhone) bits.push(formatBrazilianPhone(data.doctorPhone));
    if (data.doctorAddress) {
        const addr = data.doctorAddress.length > 60 ? data.doctorAddress.slice(0, 57) + "..." : data.doctorAddress;
        bits.push(addr);
    }
    if (bits.length) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(bits.join("  ·  "), infoLeftX, infoY);
    }
    doc.setTextColor(0, 0, 0);
};

/** Outlined panel showing which via this is (1ª retenção, 2ª paciente) — no fill. */
const drawViaInfoPanel = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    currentVia: 1 | 2
) => {
    doc.setDrawColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    doc.setLineWidth(0.4);
    doc.rect(x, y, width, height, "S");

    doc.setTextColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${currentVia}ª Via`, x + width / 2, y + height / 2 - 2.5, { align: "center" });

    doc.setFontSize(6.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const lines = currentVia === 1
        ? ["Retenção da Farmácia", "ou Drogaria"]
        : ["Orientação ao", "Paciente"];
    doc.text(lines[0], x + width / 2, y + height / 2 + 2.5, { align: "center" });
    doc.text(lines[1], x + width / 2, y + height / 2 + 5.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
};

/** Label + inline value + underline (Paciente/Endereço rows on controlled prescriptions). */
const drawLabeledFillLine = (
    doc: jsPDF,
    layout: BodyLayout,
    yPos: number,
    label: string,
    value: string,
    spacing: number = 5.5
): number => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(label, layout.leftX, yPos);
    const labelW = doc.getTextWidth(label) + 4;

    doc.setFontSize(9);
    doc.setTextColor(33, 33, 33);
    if (value) {
        const wrapped = doc.splitTextToSize(value, layout.contentWidth - labelW);
        doc.text(wrapped[0], layout.leftX + labelW, yPos);
    }
    const lineY = yPos + 1.2;
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.line(layout.leftX, lineY, layout.rightX, lineY);
    doc.setTextColor(0, 0, 0);
    return yPos + spacing;
};

/** Underlined inline field used inside the buyer ID box. */
const drawInlineFillField = (
    doc: jsPDF,
    label: string,
    labelX: number,
    labelOffset: number,
    lineEndX: number,
    y: number
) => {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(95, 95, 95);
    doc.text(label, labelX, y);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    doc.line(labelX + labelOffset, y + 0.5, lineEndX, y + 0.5);
    doc.setTextColor(0, 0, 0);
};

/**
 * Bottom regulatory section for controlled prescriptions:
 *   row 1 — date (left) + signature/stamp (right)
 *   row 2 — Identificação do Comprador + Identificação do Fornecedor boxes
 */
const drawControlledRegulatorySection = (
    doc: jsPDF,
    layout: BodyLayout,
    data: PrescriptionData,
    pageHeight: number,
    options: { startY?: number } = {}
) => {
    const gap = 3;
    const colW = (layout.contentWidth - gap) / 2;
    const leftX = layout.leftX;
    const rightX = layout.leftX + colW + gap;

    const topH = 18;
    const labelGap = 4;
    const bottomBoxH = 42;
    const totalH = topH + labelGap + bottomBoxH + 4;
    // Bottom padding 10mm — leaves printer-safe area; pulls section up so boxes aren't clipped
    const startY = options.startY ?? (pageHeight - totalH - 10);

    // Row 1: date (left) + signature (right) — outlined only, no fill
    doc.setDrawColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    doc.setLineWidth(0.3);
    doc.rect(leftX, startY, colW, topH, "S");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const cityPrefix = data.doctorCity ? `${data.doctorCity},` : "";
    if (cityPrefix) doc.text(cityPrefix, leftX + 4, startY + 4);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("____ / ____ / ________", leftX + colW / 2, startY + 13, { align: "center" });

    doc.rect(rightX, startY, colW, topH, "S");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Carimbo e assinatura", rightX + 4, startY + 4);
    doc.setTextColor(0, 0, 0);

    // Pill labels above the boxes
    const labelY = startY + topH + labelGap;
    drawPillLabel(doc, leftX + colW / 2, labelY, "Identificação do comprador");
    drawPillLabel(doc, rightX + colW / 2, labelY, "Identificação do fornecedor");

    // Row 2: buyer / pharmacy boxes — outlined only
    const boxY = labelY + 3.2;
    doc.setDrawColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    doc.setLineWidth(0.3);
    doc.rect(leftX, boxY, colW, bottomBoxH, "S");

    let cY = boxY + 7;
    drawInlineFillField(doc, "Nome:", leftX + 3, 12, leftX + colW - 3, cY);
    cY += 5.5;
    drawInlineFillField(doc, "Ident.:", leftX + 3, 11, leftX + colW * 0.5, cY);
    drawInlineFillField(doc, "Órg. Emissor:", leftX + colW * 0.5 + 2, 22, leftX + colW - 3, cY);
    cY += 5.5;
    drawInlineFillField(doc, "End.:", leftX + 3, 10, leftX + colW - 3, cY);
    cY += 5.5;
    drawInlineFillField(doc, "Cidade:", leftX + 3, 13, leftX + colW * 0.7, cY);
    drawInlineFillField(doc, "UF:", leftX + colW * 0.7 + 2, 8, leftX + colW - 3, cY);
    cY += 5.5;
    drawInlineFillField(doc, "Telefone:", leftX + 3, 15, leftX + colW - 3, cY);

    // Fornecedor — outlined box, signature line at bottom
    doc.rect(rightX, boxY, colW, bottomBoxH, "S");
    const fY = boxY + bottomBoxH - 6;
    doc.setDrawColor(140, 140, 140);
    doc.setLineWidth(0.2);
    doc.line(rightX + 3, fY - 0.5, rightX + colW * 0.6, fY - 0.5);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(95, 95, 95);
    doc.text("Assinatura do Farmacêutico", rightX + 4, fY + 2.5);
    doc.text("Data ___/___/____", rightX + colW - 27, fY + 2.5);
    doc.setTextColor(0, 0, 0);
};

// ==========================================
// GENERATORS
// ==========================================

const PAGE_HEIGHT_LANDSCAPE = 210;

const generateBasicPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    xOffset: number,
    config: { title: string; subtitle?: string }
) => {
    const layout = layoutFor(xOffset, 148.5);
    const identity = buildIdentity(data);
    const headerEndY = drawDocumentHeader(
        doc,
        data.clinicHeader ?? null,
        data.clinicHeaderAssets ?? {},
        {
            xOffset,
            pageWidth: layout.pageWidth,
            marginX: layout.margin,
            topMargin: 8,
            identity,
        }
    );

    // Subtle watermark
    drawDocumentWatermark(doc, {
        xOffset,
        pageWidth: layout.pageWidth,
        pageHeight: PAGE_HEIGHT_LANDSCAPE,
        assets: data.clinicHeaderAssets ?? {},
    });

    let yPos = drawDocumentTitle(doc, layout, config.title, headerEndY, {
        subtitle: config.subtitle,
    });
    yPos = drawPatientBlockSlim(doc, layout, data, yPos);
    yPos = drawMedicationsBlock(doc, layout, data, yPos);

    drawBasicSignatureFooter(doc, layout, data, {
        signatureOffset: 32,
        viaLabel: xOffset > 0 ? "2ª via" : "1ª via",
    });
};

const generateControlledPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    xOffset: number,
    config: { title: string }
) => {
    const VIA_W = 148.5;
    const VIA_H = PAGE_HEIGHT_LANDSCAPE;
    const layout = layoutFor(xOffset, VIA_W, 8);
    const viaNumber: 1 | 2 = xOffset === 0 ? 1 : 2;

    drawDocumentWatermark(doc, {
        xOffset,
        pageWidth: VIA_W,
        pageHeight: VIA_H,
        assets: data.clinicHeaderAssets ?? {},
    });

    // Title centered at the top
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(BRAND_INK.r, BRAND_INK.g, BRAND_INK.b);
    doc.text(config.title, layout.centerX, 9, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Header row: Emitente box (left) + Via panel (right)
    const headerY = 16;
    const headerH = 26;
    const viaW = 30;
    const emitW = layout.contentWidth - viaW - 2;
    drawEmitenteBox(doc, layout.leftX, headerY, emitW, headerH, data);
    drawViaInfoPanel(doc, layout.leftX + emitW + 2, headerY, viaW, headerH, viaNumber);
    let yPos = headerY + headerH + 5;

    // Paciente + Endereço fill-in lines
    yPos = drawLabeledFillLine(doc, layout, yPos, "Paciente", data.patientName);
    yPos += 1;
    yPos = drawLabeledFillLine(doc, layout, yPos, "Endereço", data.patientAddress ?? "");
    yPos += 4;

    // Medications
    const controlledData: PrescriptionData = { ...data, isControlledRender: true };
    yPos = drawMedicationsBlock(doc, layout, controlledData, yPos);

    if (controlledData.cid) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`CID-10: ${controlledData.cid}`, layout.leftX, yPos + 2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
    }

    drawControlledRegulatorySection(doc, layout, data, VIA_H);
};

// ==========================================
/**
 * Generates a single prescription via inside the user's letterhead PDF.
 * Used when the clinic uploaded a full-page letterhead — the PDF becomes the
 * frame and content is rendered inside the AI-identified body bbox.
 * Renders one via at a given xOffset/pageWidth/pageHeight slot.
 */
/**
 * Hybrid controlled prescription for letterhead mode: uses the letterhead's
 * top band (cabeçalho only) and falls back to VitaView's traditional controlled
 * layout for the body + footer (with the regulatory buyer/pharmacy boxes).
 * Standard via slot 148.5 x 210 (landscape 2-via).
 */
const generateLetterheadControlledPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    xOffset: number,
    config: { title: string; subtitle: string }
) => {
    const VIA_WIDTH = 148.5;
    const VIA_HEIGHT = 210;
    const layout = layoutFor(xOffset, VIA_WIDTH);
    const header = data.clinicHeader;
    const assets = data.clinicHeaderAssets ?? {};

    // Header band: show only the branded portion of the letterhead (logo + name + CRM).
    // The AI bbox.top marks where the BODY begins; pre-printed labels ("PACIENTE:", "DATA:",
    // dashed lines) sit just above it. Using ~62% of bbox.top as a heuristic gets us the
    // branded section without dragging in those labels.
    const headerBandHeightMm = header?.bodyBbox
        ? Math.max(22, Math.min(header.bodyBbox.top * VIA_HEIGHT * 0.62, 55))
        : 30;

    if (assets.image) {
        doc.addImage(assets.image.dataUrl, "PNG", xOffset, 0, VIA_WIDTH, VIA_HEIGHT);
        doc.setFillColor(255, 255, 255);
        doc.rect(xOffset, headerBandHeightMm, VIA_WIDTH, VIA_HEIGHT - headerBandHeightMm, "F");
    }

    drawDocumentWatermark(doc, {
        xOffset,
        pageWidth: VIA_WIDTH,
        pageHeight: VIA_HEIGHT,
        assets,
    });

    let yPos = headerBandHeightMm + 3;
    yPos = drawDocumentTitle(doc, layout, config.title, yPos, {
        subtitle: config.subtitle,
        subtitle2: xOffset > 0 ? "2ª via – paciente" : "1ª via – retenção da farmácia",
    });

    const controlledData: PrescriptionData = { ...data, isControlledRender: true };
    yPos = drawDoctorBlockCompact(doc, layout, controlledData, yPos);
    yPos += 2;
    yPos = drawPatientBlockCompact(doc, layout, controlledData, yPos);
    yPos = drawMedicationsBlock(doc, layout, controlledData, yPos);

    if (controlledData.cid) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`CID-10: ${controlledData.cid}`, layout.leftX, yPos + 2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
    }

    // Same regulatory bottom section used by the standard controlled prescription
    drawControlledRegulatorySection(doc, layout, controlledData, 210);
};

const drawLetterheadControlledFooter = (
    doc: jsPDF,
    layout: BodyLayout,
    data: PrescriptionData,
    contentBottomY: number,
    yAfterContent: number
) => {
    // Compact footer geometry: validity 3mm from bottom, then boxes (24mm), then signature (16mm)
    const VALIDITY_INSET = 3;
    const GAP_BOXES = 4;
    const BOXES_HEIGHT = 24;
    const SIGNATURE_TOTAL = 16;
    const FOOTER_HEIGHT = VALIDITY_INSET + GAP_BOXES + BOXES_HEIGHT + GAP_BOXES + SIGNATURE_TOTAL;
    const footerStartY = contentBottomY - FOOTER_HEIGHT;

    // Anchor signature below medications; if overflow, accept a slight push down
    const signatureY = Math.max(yAfterContent + 6, footerStartY + SIGNATURE_TOTAL);
    const boxesY = signatureY + GAP_BOXES;
    const validityY = boxesY + BOXES_HEIGHT + GAP_BOXES + 2;

    // Signature
    doc.setLineWidth(0.3);
    doc.setDrawColor(40, 40, 40);
    doc.line(layout.centerX - 40, signatureY, layout.centerX + 40, signatureY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.doctorName, layout.centerX, signatureY + 4.5, { align: "center" });
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(formatCrm(data.doctorCrm, data.doctorCrmState), layout.centerX, signatureY + 9, { align: "center" });
    doc.setFontSize(6.5);
    doc.text("Assinatura e carimbo", layout.centerX, signatureY + 12.5, { align: "center" });
    doc.setTextColor(0, 0, 0);

    const gap = 4;
    const boxWidth = (layout.contentWidth - gap) / 2;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.rect(layout.leftX, boxesY, boxWidth, BOXES_HEIGHT, "S");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", layout.leftX + 2.5, boxesY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Nome: _________________________", layout.leftX + 2.5, boxesY + 8);
    doc.text("RG: ___________  Órgão: ________", layout.leftX + 2.5, boxesY + 12.5);
    doc.text("Endereço: ______________________", layout.leftX + 2.5, boxesY + 17);
    doc.text("Telefone: _______________________", layout.leftX + 2.5, boxesY + 21.5);

    const box2X = layout.leftX + boxWidth + gap;
    doc.setTextColor(0, 0, 0);
    doc.rect(box2X, boxesY, boxWidth, BOXES_HEIGHT, "S");
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DA FARMÁCIA / DROGARIA", box2X + 2.5, boxesY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Razão social: __________________", box2X + 2.5, boxesY + 8);
    doc.text("CNPJ: _________________________", box2X + 2.5, boxesY + 12);
    doc.text("Farmacêutico: __________________", box2X + 2.5, boxesY + 16);
    doc.text("CRF: __________  Data: __/__/____", box2X + 2.5, boxesY + 20);

    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    const finalValidityY = Math.min(validityY, contentBottomY - 1);
    doc.text(
        data.validityText || "Válido por 30 dias a partir da data de emissão.",
        layout.leftX,
        finalValidityY
    );
    if (data.prescriptionNumber) {
        doc.text(`Nº ${data.prescriptionNumber}`, layout.rightX, finalValidityY, { align: "right" });
    }
    doc.setTextColor(0, 0, 0);
};

/**
 * Renders inside a pre-printed physical paper: the paper already has the doctor's
 * letterhead, signature line, regulatory boxes, etc. The system draws ONLY the
 * content (patient, date, medications, CID) inside the configured margins. No
 * header, footer, watermark, signature, or boxes — the physical paper has them.
 */
const generatePreprintedPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    cfg: PreprintedConfig,
    config: { title: string; subtitle?: string; controlled: boolean }
) => {
    const pageWidth = cfg.paperWidthMm;
    const pageHeight = cfg.paperHeightMm;
    const layout: BodyLayout = {
        xOffset: 0,
        pageWidth,
        margin: cfg.leftMm,
        leftX: cfg.leftMm,
        rightX: pageWidth - cfg.rightMm,
        centerX: pageWidth / 2,
        contentWidth: pageWidth - cfg.leftMm - cfg.rightMm,
    };

    let yPos = cfg.topMm;

    // Minimal title (single line, no divider) — keeps a clean reference but doesn't waste space
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(config.title, layout.centerX, yPos, { align: "center" });
    yPos += 4;
    if (config.subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        doc.text(config.subtitle, layout.centerX, yPos, { align: "center" });
        yPos += 3.5;
    }
    yPos += 2;
    doc.setTextColor(0, 0, 0);

    const contentData: PrescriptionData = { ...data, isControlledRender: config.controlled };
    yPos = drawDoctorBlockCompact(doc, layout, contentData, yPos);
    yPos += 1.5;
    yPos = drawPatientBlockCompact(doc, layout, contentData, yPos);
    yPos = drawMedicationsBlock(doc, layout, contentData, yPos);

    if (config.controlled && contentData.cid) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`CID-10: ${contentData.cid}`, layout.leftX, yPos + 2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
    }
};

const generateLetterheadPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    config: {
        title: string;
        subtitle?: string;
        controlled: boolean;
        xOffset?: number;
        pageWidth?: number;
        pageHeight?: number;
        viaLabel?: string;
    }
) => {
    const xOffset = config.xOffset ?? 0;
    const pageWidth = config.pageWidth ?? 210;
    const pageHeight = config.pageHeight ?? 297;
    const area = drawLetterheadBackground(
        doc,
        data.clinicHeader ?? null,
        data.clinicHeaderAssets ?? {},
        { xOffset, pageWidth, pageHeight }
    );
    if (!area) return; // safety, should not happen since we check upstream

    const layout: BodyLayout = {
        xOffset,
        pageWidth,
        margin: area.contentX - xOffset,
        leftX: area.contentX,
        rightX: area.contentX + area.contentWidth,
        centerX: area.contentX + area.contentWidth / 2,
        contentWidth: area.contentWidth,
    };

    let yPos = area.contentY + 2;
    const contentBottomY = area.contentY + area.contentHeight;

    // Title
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, layout.centerX, yPos + 5, { align: "center" });
    yPos += 7;
    if (config.subtitle) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(110, 110, 110);
        doc.text(config.subtitle, layout.centerX, yPos + 3, { align: "center" });
        yPos += 4;
    }
    yPos += 6;

    const contentData: PrescriptionData = { ...data, isControlledRender: config.controlled };

    yPos = drawDoctorBlock(doc, layout, contentData, yPos);
    yPos += 2;
    yPos = drawPatientBlock(doc, layout, contentData, yPos);
    yPos = drawMedicationsBlock(doc, layout, contentData, yPos);

    if (config.controlled && contentData.cid) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`CID-10: ${contentData.cid}`, layout.leftX, yPos + 2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        yPos += 6;
    }

    if (config.controlled) {
        drawLetterheadControlledFooter(doc, layout, data, contentBottomY, yPos);
        return;
    }

    // Non-controlled: signature anchored below medications, near the bottom of the body area
    const SIG_RESERVE = 22;
    const signatureY = Math.max(yPos + 8, contentBottomY - SIG_RESERVE);

    doc.setLineWidth(0.3);
    doc.setDrawColor(40, 40, 40);
    doc.line(layout.centerX - 40, signatureY, layout.centerX + 40, signatureY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.doctorName, layout.centerX, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(formatCrm(data.doctorCrm, data.doctorCrmState), layout.centerX, signatureY + 9.5, { align: "center" });
    doc.setFontSize(6.5);
    doc.text("Assinatura e carimbo", layout.centerX, signatureY + 13, { align: "center" });
    doc.setTextColor(0, 0, 0);
};

// ==========================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO DE RECEITA
// ==========================================
export const generatePrescriptionPDF = async (
    data: PrescriptionData,
    targetWindow: Window | null = null
) => {
    // Load clinic header if not already preloaded by caller.
    let header = data.clinicHeader ?? null;
    let assets = data.clinicHeaderAssets ?? {};
    if (!header) {
        const result = await fetchAndPreloadClinicHeader();
        header = result.header;
        assets = result.assets;
    }
    const enrich = (d: PrescriptionData): PrescriptionData => ({
        ...d,
        clinicHeader: header,
        clinicHeaderAssets: assets,
    });

    const groups: { [key: string]: typeof data.medications } = {
        padrao: [], especial: [], A: [], B1: [], B2: [], C: [], C1: [],
    };

    data.medications.forEach((med) => {
        const declared = med.prescriptionType && med.prescriptionType !== 'common'
            ? med.prescriptionType
            : null;
        const type = declared || inferTypeFromName(med.name);
        if (groups[type]) {
            groups[type].push(med);
        } else {
            groups.padrao.push(med);
        }
    });

    const typeOrder: Array<keyof typeof groups> = ["padrao", "especial", "A", "B1", "B2", "C", "C1"];
    const typesWithMeds = typeOrder.filter((t) => groups[t].length > 0);

    if (typesWithMeds.length === 0) {
        console.warn("Nenhum medicamento para gerar receita");
        return;
    }

    // Pre-printed mode: doctor prints into a physical paper that already has the
    // letterhead, signature line, regulatory boxes. We generate a blank PDF and
    // only place the content within the configured margins.
    if (isPreprintedMode(header) && header?.preprinted) {
        const cfg = header.preprinted;
        const doc = new jsPDF({
            unit: "mm",
            format: [cfg.paperWidthMm, cfg.paperHeightMm],
            orientation: cfg.orientation,
        });
        let isFirstPage = true;

        typesWithMeds.forEach((type) => {
            const groupData = enrich({ ...data, medications: groups[type] });
            const config = (() => {
                switch (type) {
                    case "padrao": return { title: "RECEITUÁRIO", subtitle: undefined, controlled: false };
                    case "A": return { title: "RECEITUÁRIO", subtitle: "Cópia paciente — Notificação A (opioides)", controlled: false };
                    case "B1": return { title: "RECEITUÁRIO", subtitle: "Cópia paciente — Notificação B1 (psicotrópicos)", controlled: false };
                    case "B2": return { title: "RECEITUÁRIO", subtitle: "Cópia paciente — Notificação B2 (anorexígenos)", controlled: false };
                    case "especial": return { title: "RECEITA DE CONTROLE ESPECIAL", subtitle: "Antimicrobianos", controlled: true };
                    case "C": return { title: "RECEITA DE CONTROLE ESPECIAL", subtitle: "Retinoides / imunossupressores", controlled: true };
                    case "C1": return { title: "RECEITA DE CONTROLE ESPECIAL", subtitle: "Antidepressivos / antipsicóticos", controlled: true };
                }
                return { title: "RECEITUÁRIO", subtitle: undefined, controlled: false };
            })();

            // Controlled prescriptions normally need 2 vias; in preprinted mode that means 2 sheets.
            const sheets = config.controlled ? 2 : 1;
            for (let i = 0; i < sheets; i++) {
                if (!isFirstPage) doc.addPage();
                isFirstPage = false;
                const sheetSubtitle = config.controlled
                    ? `${config.subtitle ?? ""}${config.subtitle ? " · " : ""}${i === 0 ? "1ª via — farmácia" : "2ª via — paciente"}`
                    : config.subtitle;
                generatePreprintedPrescription(doc, groupData, cfg, {
                    title: config.title,
                    subtitle: sheetSubtitle || undefined,
                    controlled: config.controlled,
                });
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        if (targetWindow) targetWindow.location.href = pdfUrl;
        else window.open(pdfUrl, "_blank");
        return;
    }

    // When a full-page letterhead is active, render in landscape A4 with 2 vias side-by-side.
    // Each via is a 148.5x210 slot — the letterhead PDF is drawn scaled into each slot,
    // and content is placed inside the AI-identified body bbox of that slot.
    if (isLetterheadMode(header)) {
        const doc = new jsPDF({ format: "a4", orientation: "landscape" });
        let isFirstPage = true;
        const VIA_WIDTH = 148.5;
        const VIA_HEIGHT = 210;

        typesWithMeds.forEach((type) => {
            if (!isFirstPage) doc.addPage();
            isFirstPage = false;

            const groupData = enrich({ ...data, medications: groups[type] });
            const config = (() => {
                switch (type) {
                    case "padrao": return { title: "RECEITUÁRIO", subtitle: undefined, controlled: false };
                    case "A": return { title: "RECEITUÁRIO", subtitle: "Cópia paciente — Notificação A (opioides)", controlled: false };
                    case "B1": return { title: "RECEITUÁRIO", subtitle: "Cópia paciente — Notificação B1 (psicotrópicos)", controlled: false };
                    case "B2": return { title: "RECEITUÁRIO", subtitle: "Cópia paciente — Notificação B2 (anorexígenos)", controlled: false };
                    case "especial": return { title: "RECEITA DE CONTROLE ESPECIAL", subtitle: "Antimicrobianos — 2 vias", controlled: true };
                    case "C": return { title: "RECEITA DE CONTROLE ESPECIAL", subtitle: "Retinoides / imunossupressores", controlled: true };
                    case "C1": return { title: "RECEITA DE CONTROLE ESPECIAL", subtitle: "Antidepressivos / antipsicóticos", controlled: true };
                }
                return { title: "RECEITUÁRIO", subtitle: undefined, controlled: false };
            })();

            // Thin cut line between vias
            doc.setLineWidth(0.1);
            doc.setDrawColor(180, 180, 180);
            doc.line(VIA_WIDTH, 8, VIA_WIDTH, 202);

            [0, VIA_WIDTH].forEach((xOffset, idx) => {
                const viaLabel = idx === 0 ? "1ª via" : "2ª via";

                // Controlled prescriptions in letterhead mode use a hybrid layout:
                // letterhead's header band on top, VitaView's traditional controlled
                // footer (buyer/pharmacy boxes + validity) at the bottom. This avoids
                // the letterhead artwork interfering with regulatory layout.
                if (config.controlled) {
                    const validityByType: Record<string, string> = {
                        especial: "Válido por 10 dias a partir da data de emissão.",
                        C: "Válido por 30 dias a partir da data de emissão.",
                        C1: "Válido por 30 dias a partir da data de emissão.",
                    };
                    generateLetterheadControlledPrescription(doc, {
                        ...groupData,
                        validityText: validityByType[type] || "Válido por 30 dias a partir da data de emissão.",
                    }, xOffset, {
                        title: config.title,
                        subtitle: config.subtitle ?? "",
                    });
                    return;
                }

                const subtitle = config.subtitle
                    ? `${config.subtitle} · ${viaLabel}`
                    : viaLabel;
                generateLetterheadPrescription(doc, groupData, {
                    title: config.title,
                    subtitle,
                    controlled: false,
                    xOffset,
                    pageWidth: VIA_WIDTH,
                    pageHeight: VIA_HEIGHT,
                });
            });
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        if (targetWindow) targetWindow.location.href = pdfUrl;
        else window.open(pdfUrl, "_blank");
        return;
    }

    const doc = new jsPDF({ format: "a4", orientation: "landscape" });
    let isFirstPage = true;

    typesWithMeds.forEach((type) => {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        const groupData = enrich({ ...data, medications: groups[type] });
        const offsets = [0, 148.5];

        // Thin cut line between vias
        doc.setLineWidth(0.1);
        doc.setDrawColor(180, 180, 180);
        doc.line(148.5, 8, 148.5, 202);

        offsets.forEach((xOffset) => {
            switch (type) {
                case "padrao": {
                    generateBasicPrescription(
                        doc,
                        groupData,
                        xOffset,
                        { title: "RECEITUÁRIO" }
                    );
                    break;
                }
                case "A":
                    generateBasicPrescription(doc, {
                        ...groupData,
                        validityText: "Cópia para o paciente · receita oficial preenchida em formulário próprio.",
                    }, xOffset, {
                        title: "RECEITUÁRIO",
                        subtitle: "Cópia paciente — Notificação A (opioides)",
                    });
                    break;
                case "B1":
                    generateBasicPrescription(doc, {
                        ...groupData,
                        validityText: "Cópia para o paciente · receita oficial preenchida em formulário próprio.",
                    }, xOffset, {
                        title: "RECEITUÁRIO",
                        subtitle: "Cópia paciente — Notificação B1 (psicotrópicos)",
                    });
                    break;
                case "B2":
                    generateBasicPrescription(doc, {
                        ...groupData,
                        validityText: "Cópia para o paciente · receita oficial preenchida em formulário próprio.",
                    }, xOffset, {
                        title: "RECEITUÁRIO",
                        subtitle: "Cópia paciente — Notificação B2 (anorexígenos)",
                    });
                    break;
                case "especial":
                case "C":
                case "C1":
                    generateControlledPrescription(doc, groupData, xOffset, {
                        title: "Receituário de controle especial",
                    });
                    break;
            }
        });
    });

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    if (targetWindow) {
        targetWindow.location.href = pdfUrl;
    } else {
        window.open(pdfUrl, "_blank");
    }
};

// Note: certificates/atestados live in lib/certificate-pdf.ts.
