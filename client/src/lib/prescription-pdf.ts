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
 * Generates a single prescription page inside the user's letterhead PDF.
 * Used when the clinic uploaded a full-page letterhead — the PDF becomes the
 * entire template and content is rendered inside the AI-identified body bbox.
 */
const generateLetterheadPrescription = (
    doc: jsPDF,
    data: PrescriptionData,
    config: { title: string; subtitle?: string; controlled: boolean }
) => {
    const pageWidth = 210;
    const pageHeight = 297;
    const area = drawLetterheadBackground(
        doc,
        data.clinicHeader ?? null,
        data.clinicHeaderAssets ?? {},
        { xOffset: 0, pageWidth, pageHeight }
    );
    if (!area) return; // safety, should not happen since we check upstream

    const layout: BodyLayout = {
        xOffset: 0,
        pageWidth,
        margin: area.contentX,
        leftX: area.contentX,
        rightX: area.contentX + area.contentWidth,
        centerX: area.contentX + area.contentWidth / 2,
        contentWidth: area.contentWidth,
    };

    let yPos = area.contentY + 2;

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

    // Signature anchored near the bottom of the body area
    const contentBottomY = area.contentY + area.contentHeight;
    const signatureY = Math.min(Math.max(yPos + 10, contentBottomY - 28), contentBottomY - 12);

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

    if (config.controlled && data.prescriptionNumber) {
        doc.setFontSize(6.5);
        doc.setTextColor(110, 110, 110);
        doc.text(`Nº ${data.prescriptionNumber}`, layout.rightX, contentBottomY - 2, { align: "right" });
    }
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

    // When a full-page letterhead is active, switch to portrait single-via mode:
    // the doctor's PDF design is the entire frame and the content goes inside the body bbox.
    if (isLetterheadMode(header)) {
        const doc = new jsPDF({ format: "a4", orientation: "portrait" });
        let isFirstPage = true;

        typesWithMeds.forEach((type) => {
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

            // For controlled prescriptions we still emit 2 vias — but each on its own page
            const copies = config.controlled ? 2 : 1;
            for (let i = 0; i < copies; i++) {
                if (!isFirstPage) doc.addPage();
                isFirstPage = false;
                const copySubtitle = config.controlled
                    ? `${config.subtitle ?? ""}${config.subtitle ? " · " : ""}${i === 0 ? "1ª via – retenção da farmácia" : "2ª via – paciente"}`
                    : config.subtitle;
                generateLetterheadPrescription(doc, groupData, {
                    title: config.title,
                    subtitle: copySubtitle,
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
