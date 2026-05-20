import jsPDF from "jspdf";
import { PRESCRIPTION_TYPES, PrescriptionTypeKey } from "@/constants/special-prescription-types";
import {
    drawDocumentHeader,
    drawVitaViewFooterMark,
    fetchAndPreloadClinicHeader,
} from "./document-header";

interface SpecialPrescriptionData {
    selectedType: PrescriptionTypeKey;
    patientName: string;
    doctorName: string;
    doctorCrm: string;
    prescriptionItem: {
        name?: string;
        dosage?: string;
        frequency?: string;
        quantity?: string;
        notes?: string;
    };
}

export async function generateSpecialPrescriptionPDF({
    selectedType,
    patientName,
    doctorName,
    doctorCrm,
    prescriptionItem,
}: SpecialPrescriptionData) {
    const selectedTypeInfo = PRESCRIPTION_TYPES[selectedType];
    const { header, assets } = await fetchAndPreloadClinicHeader();

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    const headerEndY = drawDocumentHeader(doc, header, assets, {
        xOffset: 0,
        pageWidth,
        marginX: margin,
        topMargin: 8,
        showVitaViewMark: false,
    });

    // Title
    let yPos = headerEndY + 3;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`RECEITUÁRIO ${selectedTypeInfo.name.toUpperCase()}`, pageWidth / 2, yPos + 3, { align: "center" });
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(selectedTypeInfo.description, pageWidth / 2, yPos + 3, { align: "center" });
    yPos += 4;
    doc.text(`Validade: ${selectedTypeInfo.validity}`, pageWidth / 2, yPos + 3, { align: "center" });
    yPos += 7;
    doc.setLineWidth(0.4);
    doc.setDrawColor(40, 40, 40);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;

    // Emitter
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO EMITENTE", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nome: ${doctorName || "Profissional"}`, margin, yPos);
    yPos += 4;
    doc.text(`CRM: ${doctorCrm || "___________"}`, margin, yPos);
    yPos += 8;

    // Patient
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO PACIENTE", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${patientName}`, margin, yPos);
    yPos += 4;
    doc.text(`Endereço: ___________________________________`, margin, yPos);
    yPos += 4;
    doc.text(`Cidade/UF: _____________`, margin, yPos);
    yPos += 8;

    // Prescription
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIÇÃO", margin, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const prescText = `${prescriptionItem.name} - ${prescriptionItem.dosage}`;
    doc.text(prescText, margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.text(`Quantidade: ${prescriptionItem.quantity}`, margin, yPos);
    yPos += 4;
    doc.text(`Posologia: ${prescriptionItem.frequency}`, margin, yPos);
    yPos += 4;

    if (prescriptionItem.notes) {
        doc.text(`Obs: ${prescriptionItem.notes}`, margin, yPos);
        yPos += 4;
    }

    yPos += 10;
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
    doc.text(`Data: ${dateStr}`, margin, yPos);
    yPos += 15;

    doc.setDrawColor(40, 40, 40);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Assinatura e carimbo do prescritor", pageWidth / 2, yPos, { align: "center" });

    yPos += 10;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("Modelo para controle interno — a receita física oficial deve ser emitida em formulário apropriado.", pageWidth / 2, yPos, { align: "center", maxWidth: pageWidth - margin * 2 });

    drawVitaViewFooterMark(doc, 0, pageWidth, doc.internal.pageSize.getHeight());

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
}
