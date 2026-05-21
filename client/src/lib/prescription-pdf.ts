import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    drawDocumentFooter,
    drawDocumentHeader,
    drawDocumentWatermark,
    drawLetterheadBackground,
    fetchAndPreloadClinicHeader,
    formatCrm,
    isLetterheadMode,
    type ClinicHeaderForPdf,
    type DocumentIdentity,
    type PreloadedHeaderAssets,
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
            doc.text(data.doctorPhone, layout.rightX, nextY, { align: "right" });
        }
        doc.setTextColor(0, 0, 0);
        nextY += 3.6;
    }
    return nextY;
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

    if (data.isContinuousUse) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setDrawColor(40, 40, 40);
        doc.rect(layout.leftX, yPos - 3, 3, 3, "S");
        doc.text("X", layout.leftX + 0.7, yPos - 0.5);
        doc.text("Uso contínuo", layout.leftX + 5, yPos);
        yPos += 7;
    }

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

        const posBits: string[] = [];
        if (med.dosage) posBits.push(med.dosage);
        if (med.frequency) posBits.push(med.frequency);
        if (data.isContinuousUse) posBits.push("Uso contínuo");
        const posologia = posBits.join("  ·  ");

        if (posologia) {
            const wrapped = doc.splitTextToSize(posologia, layout.contentWidth - 30);
            doc.text(wrapped, textLeft, yPos);
            yPos += wrapped.length * 3.7;
        }

        const route = med.route || resolveRouteOfAdministration(med.format)
            || (data.isControlledRender ? "Oral" : null);
        if (route) {
            doc.setFontSize(8);
            doc.setTextColor(110, 110, 110);
            doc.text(`Via ${route.toLowerCase()}`, layout.rightX, yPos - 1, { align: "right" });
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

/**
 * Draws the buyer / dispensing pharmacist boxes (controlled prescriptions).
 */
const drawControlledFooter = (doc: jsPDF, layout: BodyLayout, data: PrescriptionData) => {
    const pageHeight = 210;
    const signatureY = pageHeight - 80;
    const boxesY = pageHeight - 55;
    const validityY = pageHeight - 18;

    // Signature
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
    doc.setTextColor(0, 0, 0);

    const boxWidth = 62;
    const boxHeight = 35;

    // Buyer box (left)
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.rect(layout.leftX, boxesY, boxWidth, boxHeight, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", layout.leftX + 3, boxesY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Nome: __________________________", layout.leftX + 3, boxesY + 12);
    doc.text("RG: ____________  Órgão: _________", layout.leftX + 3, boxesY + 18);
    doc.text("Endereço: _______________________", layout.leftX + 3, boxesY + 24);
    doc.text("Telefone: _______________________", layout.leftX + 3, boxesY + 30);

    // Pharmacy box (right) — RDC 20/2011 nomenclatura
    const box2X = layout.rightX - boxWidth;
    doc.setTextColor(0, 0, 0);
    doc.rect(box2X, boxesY, boxWidth, boxHeight, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DA FARMÁCIA / DROGARIA", box2X + 3, boxesY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Razão social: ___________________", box2X + 3, boxesY + 11);
    doc.text("CNPJ: __________________________", box2X + 3, boxesY + 16);
    doc.text("Endereço: ______________________", box2X + 3, boxesY + 21);
    doc.text("Farmacêutico: __________________", box2X + 3, boxesY + 26);
    doc.text("CRF: ____________  Data: __/__/____", box2X + 3, boxesY + 31);

    // Validity + prescription number on the same baseline
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(
        data.validityText || "Válido por 30 dias a partir da data de emissão.",
        layout.leftX,
        validityY
    );
    if (data.prescriptionNumber) {
        doc.text(`Nº ${data.prescriptionNumber}`, layout.rightX, validityY, { align: "right" });
    }
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
    yPos = drawDoctorBlock(doc, layout, data, yPos);
    yPos += 3;
    yPos = drawPatientBlock(doc, layout, data, yPos);
    yPos = drawMedicationsBlock(doc, layout, data, yPos);

    drawSignatureFooter(doc, layout, data, {
        signatureOffset: 50,
        footerOffset: 22,
        viaLabel: xOffset > 0 ? "2ª via" : "1ª via",
    });

    drawDocumentFooter(doc, data.clinicHeader ?? null, {
        xOffset,
        pageWidth: layout.pageWidth,
        pageHeight: PAGE_HEIGHT_LANDSCAPE,
        marginX: layout.margin,
        identity,
    });
};

const generateControlledPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    xOffset: number,
    config: { title: string; subtitle: string }
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

    drawDocumentWatermark(doc, {
        xOffset,
        pageWidth: layout.pageWidth,
        pageHeight: PAGE_HEIGHT_LANDSCAPE,
        assets: data.clinicHeaderAssets ?? {},
    });

    let yPos = drawDocumentTitle(doc, layout, config.title, headerEndY, {
        subtitle: config.subtitle,
        subtitle2: "1ª via – retenção da farmácia",
    });
    const controlledData: PrescriptionData = { ...data, isControlledRender: true };
    yPos = drawDoctorBlock(doc, layout, controlledData, yPos);
    yPos += 3;
    yPos = drawPatientBlock(doc, layout, controlledData, yPos);
    yPos = drawMedicationsBlock(doc, layout, controlledData, yPos);

    if (controlledData.cid) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`CID-10: ${controlledData.cid}`, layout.leftX, yPos + 2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
    }

    drawControlledFooter(doc, layout, controlledData);

    drawDocumentFooter(doc, data.clinicHeader ?? null, {
        xOffset,
        pageWidth: layout.pageWidth,
        pageHeight: PAGE_HEIGHT_LANDSCAPE,
        marginX: layout.margin,
        identity,
    });
};

// ==========================================
/**
 * Generates a single prescription via inside the user's letterhead PDF.
 * Used when the clinic uploaded a full-page letterhead — the PDF becomes the
 * frame and content is rendered inside the AI-identified body bbox.
 * Renders one via at a given xOffset/pageWidth/pageHeight slot.
 */
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
                const subtitle = config.subtitle
                    ? `${config.subtitle} · ${viaLabel}`
                    : viaLabel;
                generateLetterheadPrescription(doc, groupData, {
                    title: config.title,
                    subtitle,
                    controlled: config.controlled,
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
                    generateControlledPrescription(doc, {
                        ...groupData,
                        validityText: "Válido por 10 dias a partir da data de emissão.",
                    }, xOffset, {
                        title: "RECEITA DE CONTROLE ESPECIAL",
                        subtitle: "Antimicrobianos — 2 vias",
                    });
                    break;
                case "C":
                    generateControlledPrescription(doc, {
                        ...groupData,
                        validityText: "Válido por 30 dias a partir da data de emissão.",
                    }, xOffset, {
                        title: "RECEITA DE CONTROLE ESPECIAL",
                        subtitle: "Retinoides / imunossupressores — Lista C",
                    });
                    break;
                case "C1":
                    generateControlledPrescription(doc, {
                        ...groupData,
                        validityText: "Válido por 30 dias a partir da data de emissão.",
                    }, xOffset, {
                        title: "RECEITA DE CONTROLE ESPECIAL",
                        subtitle: "Antidepressivos / antipsicóticos — Lista C1",
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
