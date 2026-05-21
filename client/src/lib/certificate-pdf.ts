import jsPDF from "jspdf";
import {
    drawDocumentFooter,
    drawDocumentHeader,
    drawDocumentWatermark,
    drawLetterheadBackground,
    fetchAndPreloadClinicHeader,
    formatCrm,
    isLetterheadMode,
    isPreprintedMode,
    type ClinicHeaderForPdf,
    type DocumentIdentity,
    type PreloadedHeaderAssets,
} from "./document-header";
import { formatSpecialty } from "./specialty-format";

export interface CertificateData {
    type: "afastamento" | "comparecimento" | "acompanhamento" | "aptidao" | "laudo";
    doctorName: string;
    doctorCrm: string;
    doctorCrmState?: string;
    doctorSpecialty?: string;
    doctorRqe?: string;
    doctorAddress?: string;
    doctorPhone?: string;
    patientName: string;
    patientDoc?: string;
    issueDate: string | Date;
    daysOff?: number | string;
    cid?: string;
    city?: string;
    startTime?: string;
    endTime?: string;
    customText?: string;
    clinicHeader?: ClinicHeaderForPdf | null;
    clinicHeaderAssets?: PreloadedHeaderAssets;
}

const cleanTextForPDF = (text: string): string => {
    if (!text) return "";
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\uD800-\uDFFF].|[☀-➿]/g, "").trim();
};

const numberToText = (num: number | string): string => {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return "";
    const ones = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const tens = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return tens[ten] + (one ? " e " + ones[one] : "");
    }
    return n.toString();
};

export const generateCertificateText = (data: CertificateData): string => {
    if (data.customText) return data.customText;
    const patientName = cleanTextForPDF(data.patientName);
    const patientDoc = data.patientDoc ? cleanTextForPDF(data.patientDoc) : "________________";
    const days = data.daysOff ? data.daysOff.toString() : "0";
    const daysInt = parseInt(days);
    const daysExt = numberToText(daysInt);
    const dayLabel = daysInt === 1 ? "dia" : "dias";

    switch (data.type) {
        case "afastamento":
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, foi atendido(a) nesta data e necessita de ${days} (${daysExt}) ${dayLabel} de afastamento de suas atividades laborais/escolares a partir desta data, por motivo de doença.`;
        case "comparecimento":
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, compareceu a este serviço para atendimento médico/exames nesta data, no período das ${data.startTime || "____"} às ${data.endTime || "____"} horas.`;
        case "acompanhamento":
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, compareceu a este serviço nesta data, como acompanhante de paciente sob meus cuidados.`;
        case "aptidao":
            return `Atesto para os devidos fins que o(a) Sr(a). ${patientName}, portador(a) do documento nº ${patientDoc}, foi examinado(a) por mim nesta data e encontra-se APTO(A) para a prática de atividades físicas.`;
        case "laudo":
            return "";
        default:
            return "";
    }
};

const buildIdentity = (data: CertificateData): DocumentIdentity => ({
    doctorName: data.doctorName,
    doctorCrm: data.doctorCrm,
    doctorCrmState: data.doctorCrmState,
    doctorSpecialty: data.doctorSpecialty,
    doctorRqe: data.doctorRqe,
    doctorAddress: data.doctorAddress,
    doctorPhone: data.doctorPhone,
});

export const generateCertificatePDF = async (data: CertificateData): Promise<Blob> => {
    let header = data.clinicHeader ?? null;
    let assets = data.clinicHeaderAssets ?? {};
    if (!header) {
        const result = await fetchAndPreloadClinicHeader();
        header = result.header;
        assets = result.assets;
    }

    // Preprinted mode: blank PDF sized to the doctor's physical paper; content only inside margins.
    if (isPreprintedMode(header) && header?.preprinted) {
        const cfg = header.preprinted;
        const doc = new jsPDF({ unit: "mm", format: [cfg.paperWidthMm, cfg.paperHeightMm], orientation: cfg.orientation });
        const contentLeft = cfg.leftMm;
        const contentRight = cfg.paperWidthMm - cfg.rightMm;
        const contentTop = cfg.topMm;
        const contentBottom = cfg.paperHeightMm - cfg.bottomMm;
        const contentWidth = contentRight - contentLeft;
        const centerX = (contentLeft + contentRight) / 2;

        let yPos = contentTop;
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(13);
        doc.setFont("times", "bold");
        const title = data.type === "laudo" ? "LAUDO MÉDICO" : "ATESTADO MÉDICO";
        doc.text(title, centerX, yPos + 4, { align: "center" });
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.setLineHeightFactor(1.5);
        const text = generateCertificateText(data);
        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, contentLeft, yPos, { align: "justify", maxWidth: contentWidth });
        yPos += splitText.length * 5 + 6;

        if (data.cid) {
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.text(`CID: ${cleanTextForPDF(data.cid)}`, contentLeft, yPos);
        }

        // Patient identification line — useful even with preprinted paper for traceability
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const id = `Paciente: ${cleanTextForPDF(data.patientName)}${data.patientDoc ? `  ·  Doc.: ${cleanTextForPDF(data.patientDoc)}` : ""}`;
        doc.text(id, contentLeft, contentBottom);

        return doc.output("blob");
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const pageHeight = 297;
    const identity = buildIdentity(data);
    const letterheadActive = isLetterheadMode(header);

    let margin: number;
    let contentWidth: number;
    let centerX: number;
    let yPos: number;
    let contentBottomY: number;

    if (letterheadActive) {
        const area = drawLetterheadBackground(doc, header, assets, { xOffset: 0, pageWidth, pageHeight })!;
        // Use the body bbox as our drawing canvas — the letterhead provides its own header/footer/watermark.
        // A safety inset prevents accidental overlap with pre-printed labels on the letterhead
        // (e.g., "PACIENTE:", "DATA:") that the AI bbox might not have fully excluded.
        const SAFETY_INSET_TOP = 14;
        const SAFETY_INSET_BOTTOM = 8;
        const SAFETY_INSET_X = 4;
        margin = area.contentX + SAFETY_INSET_X;
        contentWidth = area.contentWidth - SAFETY_INSET_X * 2;
        centerX = area.contentX + area.contentWidth / 2;
        yPos = area.contentY + SAFETY_INSET_TOP;
        contentBottomY = area.contentY + area.contentHeight - SAFETY_INSET_BOTTOM;
    } else {
        margin = 20;
        contentWidth = pageWidth - margin * 2;
        centerX = pageWidth / 2;

        const headerEndY = drawDocumentHeader(doc, header, assets, {
            xOffset: 0,
            pageWidth,
            marginX: margin,
            topMargin: 12,
            identity,
        });
        drawDocumentWatermark(doc, { xOffset: 0, pageWidth, pageHeight, assets });
        yPos = headerEndY + 22;
        contentBottomY = pageHeight - 20;
    }
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.setFont("times", "bold");
    const title = data.type === "laudo" ? "LAUDO MÉDICO" : "ATESTADO MÉDICO";
    doc.text(title, centerX, yPos, { align: "center" });

    // Subtle underline under the title
    const titleWidth = doc.getTextWidth(title);
    yPos += 3;
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.4);
    doc.line(centerX - titleWidth / 2 - 4, yPos, centerX + titleWidth / 2 + 4, yPos);
    yPos += 22;

    // Body
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.setLineHeightFactor(1.7);

    const text = generateCertificateText(data);
    const splitText = doc.splitTextToSize(text, contentWidth);
    doc.text(splitText, margin, yPos, { align: "justify", maxWidth: contentWidth });
    yPos += splitText.length * 7.5 + 18;

    if (data.cid) {
        doc.setFont("times", "bold");
        doc.text(`CID: ${cleanTextForPDF(data.cid)}`, margin, yPos);
        yPos += 14;
    }

    // CID authorization
    if (data.cid) {
        if (yPos > 220) {
            doc.addPage();
            yPos = 40;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        const authText = `Eu, ${cleanTextForPDF(data.patientName).toUpperCase()}, autorizo o(a) Dr(a) ${cleanTextForPDF(data.doctorName).toUpperCase()} a registrar o diagnóstico codificado CID-10 neste atestado.`;
        const splitAuth = doc.splitTextToSize(authText, contentWidth - 40);
        doc.text(splitAuth, centerX, yPos, { align: "center", maxWidth: contentWidth - 40 });
        yPos += splitAuth.length * 5 + 14;

        doc.setLineWidth(0.4);
        doc.setDrawColor(80, 80, 80);
        doc.line(centerX - 40, yPos, centerX + 40, yPos);
        doc.setFontSize(8);
        doc.text("Assinatura do paciente", centerX, yPos + 4, { align: "center" });
        yPos += 18;
    }

    // Doctor signature — anchor near the bottom of the body area
    const signatureAnchor = contentBottomY - 30;
    let signatureY = Math.max(yPos + 10, signatureAnchor);
    if (signatureY > contentBottomY - 10) {
        doc.addPage();
        if (letterheadActive) {
            drawLetterheadBackground(doc, header, assets, { xOffset: 0, pageWidth, pageHeight });
        }
        signatureY = signatureAnchor;
    }

    doc.setLineWidth(0.4);
    doc.setDrawColor(40, 40, 40);
    doc.line(centerX - 45, signatureY, centerX + 45, signatureY);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(cleanTextForPDF(data.doctorName), centerX, signatureY + 6, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(formatCrm(cleanTextForPDF(data.doctorCrm), data.doctorCrmState), centerX, signatureY + 11, { align: "center" });
    if (data.doctorSpecialty) {
        const specialty = formatSpecialty(data.doctorSpecialty, data.doctorRqe);
        const sp = data.doctorRqe ? `${specialty}  ·  RQE ${data.doctorRqe}` : specialty;
        doc.text(sp, centerX, signatureY + 15, { align: "center" });
    }
    doc.setFontSize(7);
    doc.text("Assinatura e carimbo", centerX, signatureY + 20, { align: "center" });

    if (!letterheadActive) {
        drawDocumentFooter(doc, header, {
            xOffset: 0,
            pageWidth,
            pageHeight,
            marginX: margin,
            identity,
        });
    }

    return doc.output("blob");
};
