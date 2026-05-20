/**
 * Medicamentos adicionais (DCB) frequentemente prescritos no Brasil mas
 * ausentes da MEDICATION_DATABASE original. Organizados por categoria.
 *
 * Toda entrada usa o mesmo formato de MedicationInfo definido em
 * components/dialogs/medication-dialog.tsx. O campo `prescriptionType` é
 * sugerido como atalho — o classifier oficial em controlled-substances.ts
 * é a fonte da verdade em tempo de uso.
 */

import type { MedicationInfo } from "@/components/dialogs/medication-dialog";

export const MEDICATION_EXTENSIONS: MedicationInfo[] = [
    // ============================================================
    // CARDIOVASCULAR — NOAC (anticoagulantes orais diretos)
    // ============================================================
    {
        name: "Rivaroxabana",
        category: "Anticoagulante (NOAC)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30, indication: "Profilaxia TEV" },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15mg 2x/dia × 21d, depois 20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia com alimento", duration: 30, indication: "FA não-valvar / TVP / EP" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Apixabana",
        category: "Anticoagulante (NOAC)",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5mg 2x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 2x/dia", duration: 30, indication: "FA não-valvar" },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Dabigatrana",
        category: "Anticoagulante (NOAC)",
        route: "oral",
        presentations: [
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75-150mg 2x/dia", duration: 30 },
            { dosage: "110", unit: "mg", format: "Cápsula", commonDose: "110mg 2x/dia (idoso)", duration: 30 },
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Edoxabana",
        category: "Anticoagulante (NOAC)",
        route: "oral",
        presentations: [
            { dosage: "30", unit: "mg", format: "Comprimido", commonDose: "30mg 1x/dia", duration: 30 },
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // CARDIOVASCULAR — IECA / BRA adicionais
    // ============================================================
    {
        name: "Ramipril",
        category: "Anti-hipertensivo (IECA)",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5-10mg 1x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Lisinopril",
        category: "Anti-hipertensivo (IECA)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-40mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Olmesartana",
        category: "Anti-hipertensivo (BRA)",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Telmisartana",
        category: "Anti-hipertensivo (BRA)",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40-80mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Candesartana",
        category: "Anti-hipertensivo (BRA)",
        route: "oral",
        presentations: [
            { dosage: "8", unit: "mg", format: "Comprimido", commonDose: "8-32mg 1x/dia", duration: 30 },
            { dosage: "16", unit: "mg", format: "Comprimido", commonDose: "16mg 1x/dia", duration: 30 },
            { dosage: "32", unit: "mg", format: "Comprimido", commonDose: "32mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sacubitril + Valsartana",
        category: "Anti-hipertensivo / ICC (ARNI)",
        route: "oral",
        presentations: [
            { dosage: "24/26", unit: "mg", format: "Comprimido", commonDose: "1 comp 2x/dia", duration: 30 },
            { dosage: "49/51", unit: "mg", format: "Comprimido", commonDose: "1 comp 2x/dia", duration: 30 },
            { dosage: "97/103", unit: "mg", format: "Comprimido", commonDose: "1 comp 2x/dia", duration: 30, indication: "ICFER" },
        ],
        commonFrequencies: ["2x ao dia"],
    },

    // ============================================================
    // CARDIOVASCULAR — Bloqueadores de canal de cálcio adicionais
    // ============================================================
    {
        name: "Nifedipino",
        category: "Anti-hipertensivo (BCC)",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido retard", commonDose: "20mg 2x/dia", duration: 30 },
            { dosage: "30", unit: "mg", format: "Comprimido OROS", commonDose: "30-60mg 1x/dia", duration: 30 },
            { dosage: "60", unit: "mg", format: "Comprimido OROS", commonDose: "60mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Felodipino",
        category: "Anti-hipertensivo (BCC)",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Manidipino",
        category: "Anti-hipertensivo (BCC)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Lercanidipino",
        category: "Anti-hipertensivo (BCC)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Verapamil",
        category: "Anti-hipertensivo / antiarrítmico (BCC)",
        route: "oral",
        presentations: [
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80-120mg 3x/dia", duration: 30 },
            { dosage: "120", unit: "mg", format: "Comprimido SR", commonDose: "120-240mg 1x/dia", duration: 30 },
            { dosage: "240", unit: "mg", format: "Comprimido SR", commonDose: "240mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
    },
    {
        name: "Diltiazem",
        category: "Anti-hipertensivo / antiarrítmico (BCC)",
        route: "oral",
        presentations: [
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60mg 3-4x/dia", duration: 30 },
            { dosage: "90", unit: "mg", format: "Comprimido", commonDose: "90mg 2-3x/dia", duration: 30 },
            { dosage: "120", unit: "mg", format: "Cápsula SR", commonDose: "120-360mg 1x/dia", duration: 30 },
            { dosage: "180", unit: "mg", format: "Cápsula SR", commonDose: "180mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
    },

    // ============================================================
    // CARDIOVASCULAR — Beta-bloqueadores adicionais
    // ============================================================
    {
        name: "Nebivolol",
        category: "Anti-hipertensivo (Beta-bloqueador)",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Bisoprolol",
        category: "Anti-hipertensivo (Beta-bloqueador)",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5-10mg 1x/dia", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Carvedilol",
        category: "Anti-hipertensivo / ICC (Alfa+Beta-bloqueador)",
        route: "oral",
        presentations: [
            { dosage: "3.125", unit: "mg", format: "Comprimido", commonDose: "3,125mg 2x/dia (início)", duration: 30 },
            { dosage: "6.25", unit: "mg", format: "Comprimido", commonDose: "6,25mg 2x/dia", duration: 30 },
            { dosage: "12.5", unit: "mg", format: "Comprimido", commonDose: "12,5mg 2x/dia", duration: 30 },
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 2x/dia", duration: 30, indication: "ICFER alvo" },
        ],
        commonFrequencies: ["2x ao dia"],
    },

    // ============================================================
    // CARDIOVASCULAR — Antiarrítmicos
    // ============================================================
    {
        name: "Amiodarona",
        category: "Antiarrítmico",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg 1x/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Propafenona",
        category: "Antiarrítmico",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150mg 3x/dia", duration: 30 },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Sotalol",
        category: "Antiarrítmico",
        route: "oral",
        presentations: [
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 2x/dia", duration: 30 },
            { dosage: "160", unit: "mg", format: "Comprimido", commonDose: "160mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Ivabradina",
        category: "Antianginoso / Bradicardizante",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 2x/dia", duration: 30 },
            { dosage: "7.5", unit: "mg", format: "Comprimido", commonDose: "7,5mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },

    // ============================================================
    // CARDIOVASCULAR — Estatinas e hipolipemiantes adicionais
    // ============================================================
    {
        name: "Pitavastatina",
        category: "Hipolipemiante (Estatina)",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ezetimiba",
        category: "Hipolipemiante (inibidor absorção colesterol)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Fenofibrato",
        category: "Hipolipemiante (Fibrato)",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Cápsula", commonDose: "200mg 1x/dia", duration: 30, indication: "Hipertrigliceridemia" },
            { dosage: "250", unit: "mg", format: "Cápsula", commonDose: "250mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ciprofibrato",
        category: "Hipolipemiante (Fibrato)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Genfibrozila",
        category: "Hipolipemiante (Fibrato)",
        route: "oral",
        presentations: [
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600mg 2x/dia", duration: 30 },
            { dosage: "900", unit: "mg", format: "Comprimido", commonDose: "900mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },

    // ============================================================
    // ENDOCRINOLOGIA — SGLT2
    // ============================================================
    {
        name: "Dapagliflozina",
        category: "Antidiabético (SGLT2)",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-10mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30, indication: "DM2 / ICFER / DRC" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Empagliflozina",
        category: "Antidiabético (SGLT2)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 1x/dia", duration: 30, indication: "DM2" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Canagliflozina",
        category: "Antidiabético (SGLT2)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // ENDOCRINOLOGIA — GLP-1 / análogos
    // ============================================================
    {
        name: "Semaglutida",
        category: "Antidiabético (GLP-1)",
        route: "subcutâneo",
        presentations: [
            { dosage: "0.25", unit: "mg", format: "Caneta injetável", commonDose: "0,25mg SC 1x/semana (início)", duration: 30 },
            { dosage: "0.5", unit: "mg", format: "Caneta injetável", commonDose: "0,5mg SC 1x/semana", duration: 30 },
            { dosage: "1", unit: "mg", format: "Caneta injetável", commonDose: "1mg SC 1x/semana", duration: 30, indication: "DM2 / Obesidade" },
            { dosage: "2.4", unit: "mg", format: "Caneta injetável", commonDose: "2,4mg SC 1x/semana", duration: 30, indication: "Obesidade (Wegovy)" },
            { dosage: "3", unit: "mg", format: "Comprimido", commonDose: "3-14mg 1x/dia", duration: 30, indication: "DM2 oral (Rybelsus)" },
            { dosage: "7", unit: "mg", format: "Comprimido", commonDose: "7mg 1x/dia em jejum", duration: 30 },
            { dosage: "14", unit: "mg", format: "Comprimido", commonDose: "14mg 1x/dia em jejum", duration: 30 },
        ],
        commonFrequencies: ["1x por semana", "1x ao dia"],
    },
    {
        name: "Liraglutida",
        category: "Antidiabético (GLP-1)",
        route: "subcutâneo",
        presentations: [
            { dosage: "6", unit: "mg/mL", format: "Caneta injetável 3mL", commonDose: "0,6mg SC 1x/dia (início), titular até 1,8mg", duration: 30 },
            { dosage: "6", unit: "mg/mL", format: "Caneta Saxenda", commonDose: "3mg SC 1x/dia (obesidade)", duration: 30, indication: "Obesidade" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Dulaglutida",
        category: "Antidiabético (GLP-1)",
        route: "subcutâneo",
        presentations: [
            { dosage: "0.75", unit: "mg", format: "Caneta injetável", commonDose: "0,75mg SC 1x/semana", duration: 30 },
            { dosage: "1.5", unit: "mg", format: "Caneta injetável", commonDose: "1,5mg SC 1x/semana", duration: 30 },
            { dosage: "3", unit: "mg", format: "Caneta injetável", commonDose: "3mg SC 1x/semana", duration: 30 },
            { dosage: "4.5", unit: "mg", format: "Caneta injetável", commonDose: "4,5mg SC 1x/semana", duration: 30 },
        ],
        commonFrequencies: ["1x por semana"],
    },
    {
        name: "Tirzepatida",
        category: "Antidiabético (GIP/GLP-1)",
        route: "subcutâneo",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Caneta injetável", commonDose: "2,5mg SC 1x/semana (início)", duration: 30 },
            { dosage: "5", unit: "mg", format: "Caneta injetável", commonDose: "5mg SC 1x/semana", duration: 30 },
            { dosage: "7.5", unit: "mg", format: "Caneta injetável", commonDose: "7,5mg SC 1x/semana", duration: 30 },
            { dosage: "10", unit: "mg", format: "Caneta injetável", commonDose: "10mg SC 1x/semana", duration: 30 },
            { dosage: "12.5", unit: "mg", format: "Caneta injetável", commonDose: "12,5mg SC 1x/semana", duration: 30 },
            { dosage: "15", unit: "mg", format: "Caneta injetável", commonDose: "15mg SC 1x/semana", duration: 30, indication: "Mounjaro / Zepbound" },
        ],
        commonFrequencies: ["1x por semana"],
    },

    // ============================================================
    // ENDOCRINOLOGIA — DPP-4
    // ============================================================
    {
        name: "Sitagliptina",
        category: "Antidiabético (DPP-4)",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 1x/dia (TFG<30)", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 1x/dia (TFG 30-50)", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Vildagliptina",
        category: "Antidiabético (DPP-4)",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Linagliptina",
        category: "Antidiabético (DPP-4)",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Alogliptina",
        category: "Antidiabético (DPP-4)",
        route: "oral",
        presentations: [
            { dosage: "12.5", unit: "mg", format: "Comprimido", commonDose: "12,5mg 1x/dia", duration: 30 },
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // ENDOCRINOLOGIA — Insulinas adicionais
    // ============================================================
    {
        name: "Insulina glargina",
        category: "Insulina (basal análoga)",
        route: "subcutâneo",
        presentations: [
            { dosage: "100", unit: "UI/mL", format: "Caneta Lantus", commonDose: "10-20 UI SC ao deitar", duration: 30 },
            { dosage: "300", unit: "UI/mL", format: "Caneta Toujeo", commonDose: "Conforme glicemia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "à noite"],
    },
    {
        name: "Insulina detemir",
        category: "Insulina (basal análoga)",
        route: "subcutâneo",
        presentations: [
            { dosage: "100", unit: "UI/mL", format: "Caneta Levemir", commonDose: "Conforme glicemia", duration: 30 },
        ],
        commonFrequencies: ["1-2x ao dia"],
    },
    {
        name: "Insulina degludeca",
        category: "Insulina (basal ultralonga)",
        route: "subcutâneo",
        presentations: [
            { dosage: "100", unit: "UI/mL", format: "Caneta Tresiba", commonDose: "Conforme glicemia", duration: 30 },
            { dosage: "200", unit: "UI/mL", format: "Caneta Tresiba", commonDose: "Conforme glicemia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Insulina lispro",
        category: "Insulina (rápida análoga)",
        route: "subcutâneo",
        presentations: [
            { dosage: "100", unit: "UI/mL", format: "Caneta Humalog", commonDose: "Antes das refeições", duration: 30 },
        ],
        commonFrequencies: ["antes das refeições"],
    },
    {
        name: "Insulina asparte",
        category: "Insulina (rápida análoga)",
        route: "subcutâneo",
        presentations: [
            { dosage: "100", unit: "UI/mL", format: "Caneta Novorapid / Fiasp", commonDose: "Antes das refeições", duration: 30 },
        ],
        commonFrequencies: ["antes das refeições"],
    },
    {
        name: "Insulina glulisina",
        category: "Insulina (rápida análoga)",
        route: "subcutâneo",
        presentations: [
            { dosage: "100", unit: "UI/mL", format: "Caneta Apidra", commonDose: "Antes das refeições", duration: 30 },
        ],
        commonFrequencies: ["antes das refeições"],
    },

    // ============================================================
    // ENDOCRINOLOGIA — Tireoide / outros
    // ============================================================
    {
        name: "Liotironina",
        category: "Hormônio tireoidiano (T3)",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mcg", format: "Comprimido", commonDose: "Conforme TSH", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Metimazol",
        category: "Antitireoidiano",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5-30mg/dia divididas", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 2x/dia", duration: 30, indication: "Hipertireoidismo" },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia", "3x ao dia"],
    },
    {
        name: "Propiltiouracila",
        category: "Antitireoidiano",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia"],
    },

    // ============================================================
    // ANTIMICROBIANOS — Cefalosporinas e outros
    // ============================================================
    {
        name: "Cefadroxila",
        category: "Antibiótico (Cefalosporina 1ª)",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Cápsula", commonDose: "500mg 12/12h", duration: 7, indication: "ITU, faringite" },
            { dosage: "1", unit: "g", format: "Comprimido", commonDose: "1g 1x/dia", duration: 7 },
        ],
        commonFrequencies: ["1x ao dia", "12/12h"],
    },
    {
        name: "Cefuroxima",
        category: "Antibiótico (Cefalosporina 2ª)",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250mg 12/12h", duration: 7 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 12/12h", duration: 7 },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Cefpodoxima",
        category: "Antibiótico (Cefalosporina 3ª)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 12/12h", duration: 7 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 12/12h", duration: 7 },
        ],
        commonFrequencies: ["12/12h"],
        prescriptionType: 'especial',
    },
    {
        name: "Levofloxacino",
        category: "Antibiótico (Quinolona)",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250mg 1x/dia", duration: 7 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 1x/dia", duration: 7, indication: "PAC, ITU" },
            { dosage: "750", unit: "mg", format: "Comprimido", commonDose: "750mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Moxifloxacino",
        category: "Antibiótico (Quinolona)",
        route: "oral",
        presentations: [
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 1x/dia", duration: 7 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Norfloxacino",
        category: "Antibiótico (Quinolona)",
        route: "oral",
        presentations: [
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 12/12h", duration: 7, indication: "ITU" },
        ],
        commonFrequencies: ["12/12h"],
        prescriptionType: 'especial',
    },
    {
        name: "Doxiciclina",
        category: "Antibiótico (Tetraciclina)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 12/12h", duration: 7 },
        ],
        commonFrequencies: ["12/12h"],
        prescriptionType: 'especial',
    },
    {
        name: "Minociclina",
        category: "Antibiótico (Tetraciclina)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 12/12h", duration: 7, indication: "Acne, infecções de pele" },
        ],
        commonFrequencies: ["12/12h"],
        prescriptionType: 'especial',
    },
    {
        name: "Clindamicina",
        category: "Antibiótico (Lincosamida)",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150-300mg 6/6h", duration: 7 },
            { dosage: "300", unit: "mg", format: "Cápsula", commonDose: "300mg 8/8h", duration: 7 },
        ],
        commonFrequencies: ["6/6h", "8/8h"],
        prescriptionType: 'especial',
    },
    {
        name: "Metronidazol",
        category: "Antibiótico (Anaeróbios)",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250-500mg 8/8h", duration: 7 },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 8/8h", duration: 7 },
        ],
        commonFrequencies: ["8/8h"],
        prescriptionType: 'especial',
    },
    {
        name: "Nitrofurantoína",
        category: "Antibiótico (ITU)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 6/6h", duration: 5, indication: "ITU não complicada" },
        ],
        commonFrequencies: ["6/6h"],
        prescriptionType: 'especial',
    },
    {
        name: "Fosfomicina",
        category: "Antibiótico (ITU)",
        route: "oral",
        presentations: [
            { dosage: "3", unit: "g", format: "Sachê", commonDose: "3g dose única", duration: 1, indication: "ITU não complicada" },
        ],
        commonFrequencies: ["dose única"],
        prescriptionType: 'especial',
    },
    {
        name: "Sulfametoxazol + Trimetoprima",
        category: "Antibiótico (Sulfa)",
        route: "oral",
        presentations: [
            { dosage: "400/80", unit: "mg", format: "Comprimido", commonDose: "1-2 comp 12/12h", duration: 7 },
            { dosage: "800/160", unit: "mg", format: "Comprimido", commonDose: "1 comp 12/12h", duration: 7, indication: "ITU, pneumocistose" },
        ],
        commonFrequencies: ["12/12h"],
        prescriptionType: 'especial',
    },

    // ============================================================
    // ANTIMICROBIANOS — Antifúngicos
    // ============================================================
    {
        name: "Fluconazol",
        category: "Antifúngico (Azol)",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Cápsula", commonDose: "150mg dose única", duration: 1, indication: "Candidíase vulvovaginal" },
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 1x/dia", duration: 14 },
        ],
        commonFrequencies: ["dose única", "1x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Itraconazol",
        category: "Antifúngico (Azol)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100-200mg 1x/dia", duration: 7 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Cetoconazol",
        category: "Antifúngico (Azol)",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 1x/dia", duration: 14 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Terbinafina",
        category: "Antifúngico (Alilamina)",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250mg 1x/dia", duration: 42, indication: "Onicomicose" },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Griseofulvina",
        category: "Antifúngico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'especial',
    },

    // ============================================================
    // ANTIMICROBIANOS — Antivirais
    // ============================================================
    {
        name: "Aciclovir",
        category: "Antiviral",
        route: "oral",
        presentations: [
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 5x/dia × 5d", duration: 5, indication: "Herpes simples" },
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 3x/dia (supressivo)", duration: 30 },
            { dosage: "800", unit: "mg", format: "Comprimido", commonDose: "800mg 5x/dia × 7d", duration: 7, indication: "Herpes-zoster" },
        ],
        commonFrequencies: ["5x ao dia", "3x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Valaciclovir",
        category: "Antiviral",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 2x/dia × 5d", duration: 5, indication: "Herpes simples" },
            { dosage: "1000", unit: "mg", format: "Comprimido", commonDose: "1000mg 3x/dia × 7d", duration: 7, indication: "Herpes-zoster" },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        prescriptionType: 'especial',
    },
    {
        name: "Oseltamivir",
        category: "Antiviral (Influenza)",
        route: "oral",
        presentations: [
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "Conforme peso", duration: 5, isPediatric: true },
            { dosage: "75", unit: "mg", format: "Cápsula", commonDose: "75mg 2x/dia × 5d", duration: 5, indication: "Influenza" },
        ],
        commonFrequencies: ["2x ao dia"],
        prescriptionType: 'especial',
    },

    // ============================================================
    // PSIQUIATRIA — Antidepressivos adicionais
    // ============================================================
    {
        name: "Citalopram",
        category: "Antidepressivo (ISRS)",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Desvenlafaxina",
        category: "Antidepressivo (IRSN)",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Vortioxetina",
        category: "Antidepressivo",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Agomelatina",
        category: "Antidepressivo",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-50mg à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia (noite)"],
        prescriptionType: 'C1',
    },
    {
        name: "Tianeptina",
        category: "Antidepressivo",
        route: "oral",
        presentations: [
            { dosage: "12.5", unit: "mg", format: "Comprimido", commonDose: "12,5mg 3x/dia", duration: 30 },
        ],
        commonFrequencies: ["3x ao dia"],
        prescriptionType: 'C1',
    },

    // ============================================================
    // PSIQUIATRIA — Estabilizadores e outros
    // ============================================================
    {
        name: "Carbonato de lítio",
        category: "Estabilizador de humor",
        route: "oral",
        presentations: [
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 2-3x/dia (titular por litemia)", duration: 30 },
            { dosage: "450", unit: "mg", format: "Comprimido CR", commonDose: "450mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Lamotrigina",
        category: "Anticonvulsivante / estabilizador",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25mg 1x/dia (início)", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 1x/dia", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100-200mg/dia", duration: 30 },
            { dosage: "200", unit: "mg", format: "Comprimido", commonDose: "200mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Levetiracetam",
        category: "Anticonvulsivante",
        route: "oral",
        presentations: [
            { dosage: "250", unit: "mg", format: "Comprimido", commonDose: "250mg 2x/dia (início)", duration: 30 },
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 2x/dia", duration: 30 },
            { dosage: "750", unit: "mg", format: "Comprimido", commonDose: "750mg 2x/dia", duration: 30 },
            { dosage: "1000", unit: "mg", format: "Comprimido", commonDose: "1000mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Oxcarbazepina",
        category: "Anticonvulsivante",
        route: "oral",
        presentations: [
            { dosage: "300", unit: "mg", format: "Comprimido", commonDose: "300mg 2x/dia", duration: 30 },
            { dosage: "600", unit: "mg", format: "Comprimido", commonDose: "600mg 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
        prescriptionType: 'C1',
    },

    // ============================================================
    // PSIQUIATRIA — Antipsicóticos modernos
    // ============================================================
    {
        name: "Brexpiprazol",
        category: "Antipsicótico atípico",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Cariprazina",
        category: "Antipsicótico atípico",
        route: "oral",
        presentations: [
            { dosage: "1.5", unit: "mg", format: "Cápsula", commonDose: "1,5mg 1x/dia (início)", duration: 30 },
            { dosage: "3", unit: "mg", format: "Cápsula", commonDose: "3mg 1x/dia", duration: 30 },
            { dosage: "4.5", unit: "mg", format: "Cápsula", commonDose: "4,5mg 1x/dia", duration: 30 },
            { dosage: "6", unit: "mg", format: "Cápsula", commonDose: "6mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Lurasidona",
        category: "Antipsicótico atípico",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia com alimento", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },
    {
        name: "Paliperidona",
        category: "Antipsicótico atípico",
        route: "oral",
        presentations: [
            { dosage: "3", unit: "mg", format: "Comprimido OROS", commonDose: "3mg 1x/dia", duration: 30 },
            { dosage: "6", unit: "mg", format: "Comprimido OROS", commonDose: "6mg 1x/dia", duration: 30 },
            { dosage: "9", unit: "mg", format: "Comprimido OROS", commonDose: "9mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },

    // ============================================================
    // GINECOLOGIA — Anticoncepcionais e hormônios
    // ============================================================
    {
        name: "Drospirenona + Etinilestradiol",
        category: "Anticoncepcional combinado oral",
        route: "oral",
        presentations: [
            { dosage: "3/0.03", unit: "mg", format: "Comprimido", commonDose: "1 comp/dia × 21d, pausa 7d", duration: 28 },
            { dosage: "3/0.02", unit: "mg", format: "Comprimido (Yaz)", commonDose: "1 comp/dia regime 24+4", duration: 28 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Levonorgestrel + Etinilestradiol",
        category: "Anticoncepcional combinado oral",
        route: "oral",
        presentations: [
            { dosage: "0.15/0.03", unit: "mg", format: "Comprimido", commonDose: "1 comp/dia × 21d, pausa 7d", duration: 28 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Desogestrel",
        category: "Anticoncepcional progestágeno",
        route: "oral",
        presentations: [
            { dosage: "0.075", unit: "mg", format: "Comprimido (Cerazette)", commonDose: "1 comp/dia contínuo", duration: 28, indication: "Lactação" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Levonorgestrel 1.5mg",
        category: "Anticoncepcional de emergência",
        route: "oral",
        presentations: [
            { dosage: "1.5", unit: "mg", format: "Comprimido", commonDose: "1 comp dose única (até 72h)", duration: 1, indication: "Contracepção de emergência" },
        ],
        commonFrequencies: ["dose única"],
    },
    {
        name: "Acetato de medroxiprogesterona",
        category: "Progestágeno",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5-10mg/dia × 5-10d/ciclo", duration: 10 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg/dia × 10d", duration: 10 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Estradiol",
        category: "Terapia hormonal (estrogênio)",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30 },
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Tibolona",
        category: "Terapia hormonal (esteroide sintético)",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5mg 1x/dia", duration: 30, indication: "Climatério" },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // DERMATOLOGIA
    // ============================================================
    {
        name: "Isotretinoína",
        category: "Retinoide sistêmico",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Cápsula", commonDose: "0,5-1mg/kg/dia", duration: 30, indication: "Acne grave" },
            { dosage: "20", unit: "mg", format: "Cápsula", commonDose: "20-40mg/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
        prescriptionType: 'C',
    },
    {
        name: "Adapaleno",
        category: "Retinoide tópico",
        route: "tópico",
        presentations: [
            { dosage: "0.1", unit: "%", format: "Gel/Creme 30g", commonDose: "Aplicar à noite", duration: 60, indication: "Acne" },
            { dosage: "0.3", unit: "%", format: "Gel 30g", commonDose: "Aplicar à noite", duration: 60 },
        ],
        commonFrequencies: ["1x ao dia (noite)"],
    },
    {
        name: "Tretinoína",
        category: "Retinoide tópico",
        route: "tópico",
        presentations: [
            { dosage: "0.025", unit: "%", format: "Creme 20g", commonDose: "Aplicar à noite", duration: 60 },
            { dosage: "0.05", unit: "%", format: "Creme 20g", commonDose: "Aplicar à noite", duration: 60 },
        ],
        commonFrequencies: ["1x ao dia (noite)"],
    },
    {
        name: "Peróxido de benzoíla",
        category: "Acne tópico",
        route: "tópico",
        presentations: [
            { dosage: "2.5", unit: "%", format: "Gel 30g", commonDose: "Aplicar 1-2x/dia", duration: 60 },
            { dosage: "5", unit: "%", format: "Gel 30g", commonDose: "Aplicar 1-2x/dia", duration: 60 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Clindamicina tópica",
        category: "Antibiótico tópico (acne)",
        route: "tópico",
        presentations: [
            { dosage: "1", unit: "%", format: "Gel/Solução 30g", commonDose: "Aplicar 2x/dia", duration: 60 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Hidrocortisona tópica",
        category: "Corticoide tópico baixa potência",
        route: "tópico",
        presentations: [
            { dosage: "1", unit: "%", format: "Creme 30g", commonDose: "Aplicar 2x/dia", duration: 14 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Mometasona tópica",
        category: "Corticoide tópico média potência",
        route: "tópico",
        presentations: [
            { dosage: "0.1", unit: "%", format: "Creme/Pomada 20g", commonDose: "Aplicar 1x/dia", duration: 14 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Betametasona tópica",
        category: "Corticoide tópico alta potência",
        route: "tópico",
        presentations: [
            { dosage: "0.05", unit: "%", format: "Creme/Pomada 30g", commonDose: "Aplicar 1-2x/dia", duration: 14 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Clobetasol",
        category: "Corticoide tópico ultrapotente",
        route: "tópico",
        presentations: [
            { dosage: "0.05", unit: "%", format: "Creme/Pomada/Solução 30g", commonDose: "Aplicar 1-2x/dia × 14d", duration: 14 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Tacrolimo tópico",
        category: "Imunomodulador tópico",
        route: "tópico",
        presentations: [
            { dosage: "0.03", unit: "%", format: "Pomada 30g", commonDose: "Aplicar 2x/dia", duration: 30, indication: "Dermatite atópica pediátrica" },
            { dosage: "0.1", unit: "%", format: "Pomada 30g", commonDose: "Aplicar 2x/dia", duration: 30, indication: "Dermatite atópica adulto" },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Pimecrolimo",
        category: "Imunomodulador tópico",
        route: "tópico",
        presentations: [
            { dosage: "1", unit: "%", format: "Creme 30g", commonDose: "Aplicar 2x/dia", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Cetoconazol tópico",
        category: "Antifúngico tópico",
        route: "tópico",
        presentations: [
            { dosage: "2", unit: "%", format: "Shampoo 100mL", commonDose: "2x/semana × 4 sem", duration: 30 },
            { dosage: "2", unit: "%", format: "Creme 30g", commonDose: "Aplicar 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Permetrina",
        category: "Antiparasitário tópico",
        route: "tópico",
        presentations: [
            { dosage: "5", unit: "%", format: "Loção/Creme", commonDose: "Aplicar 1x, repetir em 7d", duration: 7, indication: "Escabiose" },
            { dosage: "1", unit: "%", format: "Loção", commonDose: "Aplicar 1x", duration: 1, indication: "Pediculose" },
        ],
        commonFrequencies: ["dose única", "1x ao dia"],
    },
    {
        name: "Minoxidil tópico",
        category: "Alopecia tópico",
        route: "tópico",
        presentations: [
            { dosage: "5", unit: "%", format: "Solução 60mL", commonDose: "1mL 2x/dia", duration: 60 },
        ],
        commonFrequencies: ["2x ao dia"],
    },
    {
        name: "Finasterida",
        category: "Inibidor 5-alfa-redutase",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30, indication: "Alopecia androgenética" },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30, indication: "HBP" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Dutasterida",
        category: "Inibidor 5-alfa-redutase",
        route: "oral",
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Cápsula", commonDose: "0,5mg 1x/dia", duration: 30, indication: "HBP" },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // OFTALMOLOGIA — Colírios
    // ============================================================
    {
        name: "Timolol colírio",
        category: "Antiglaucomatoso (beta-bloqueador)",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.25", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 12/12h", duration: 30 },
            { dosage: "0.5", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 12/12h", duration: 30 },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Latanoprosta colírio",
        category: "Antiglaucomatoso (análogo prostaglandina)",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.005", unit: "%", format: "Colírio 2,5mL", commonDose: "1 gota à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia (noite)"],
    },
    {
        name: "Bimatoprosta colírio",
        category: "Antiglaucomatoso",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.03", unit: "%", format: "Colírio 3mL", commonDose: "1 gota à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia (noite)"],
    },
    {
        name: "Brimonidina colírio",
        category: "Antiglaucomatoso (alfa-2)",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.2", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 8/8h", duration: 30 },
        ],
        commonFrequencies: ["8/8h"],
    },
    {
        name: "Dorzolamida colírio",
        category: "Antiglaucomatoso (inibidor anidrase carbônica)",
        route: "tópico ocular",
        presentations: [
            { dosage: "2", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 8/8h", duration: 30 },
        ],
        commonFrequencies: ["8/8h"],
    },
    {
        name: "Tobramicina colírio",
        category: "Antibiótico oftálmico",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.3", unit: "%", format: "Colírio 5mL", commonDose: "1-2 gotas 4/4h × 7d", duration: 7, indication: "Conjuntivite bacteriana" },
        ],
        commonFrequencies: ["4/4h", "6/6h"],
    },
    {
        name: "Ciprofloxacino colírio",
        category: "Antibiótico oftálmico",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.3", unit: "%", format: "Colírio 5mL", commonDose: "1-2 gotas 4/4h", duration: 7 },
        ],
        commonFrequencies: ["4/4h", "6/6h"],
    },
    {
        name: "Olopatadina colírio",
        category: "Anti-histamínico oftálmico",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.1", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 12/12h", duration: 30 },
            { dosage: "0.2", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "12/12h"],
    },
    {
        name: "Ketotifeno colírio",
        category: "Anti-histamínico oftálmico",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.025", unit: "%", format: "Colírio 5mL", commonDose: "1 gota 12/12h", duration: 30, indication: "Conjuntivite alérgica" },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Lágrima artificial (carmelose)",
        category: "Lubrificante ocular",
        route: "tópico ocular",
        presentations: [
            { dosage: "0.5", unit: "%", format: "Colírio 15mL", commonDose: "1 gota conforme necessário", duration: 30 },
        ],
        commonFrequencies: ["conforme necessário"],
    },

    // ============================================================
    // GASTROENTEROLOGIA
    // ============================================================
    {
        name: "Esomeprazol",
        category: "IBP",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20-40mg 1x/dia em jejum", duration: 30 },
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Lansoprazol",
        category: "IBP",
        route: "oral",
        presentations: [
            { dosage: "15", unit: "mg", format: "Cápsula", commonDose: "15mg 1x/dia", duration: 30 },
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "30mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Rabeprazol",
        category: "IBP",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sucralfato",
        category: "Protetor gástrico",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "g", format: "Comprimido/Suspensão", commonDose: "1g 4x/dia", duration: 30 },
        ],
        commonFrequencies: ["4x ao dia"],
    },
    {
        name: "Ondansetrona",
        category: "Antiemético (antagonista 5HT3)",
        route: "oral",
        presentations: [
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4-8mg 8/8h", duration: 5 },
            { dosage: "8", unit: "mg", format: "Comprimido", commonDose: "8mg 8/8h", duration: 5 },
        ],
        commonFrequencies: ["8/8h"],
    },
    {
        name: "Bromoprida",
        category: "Antiemético procinético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia", duration: 7 },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Domperidona",
        category: "Antiemético procinético",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia antes das refeições", duration: 7 },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Mesalazina",
        category: "Anti-inflamatório intestinal",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "1-1,5g 3x/dia", duration: 30, indication: "RCU / Crohn" },
            { dosage: "800", unit: "mg", format: "Comprimido", commonDose: "800mg 3x/dia", duration: 30 },
            { dosage: "1.2", unit: "g", format: "Comprimido MR", commonDose: "1,2-2,4g 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "3x ao dia"],
    },
    {
        name: "Loperamida",
        category: "Antidiarreico",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Cápsula", commonDose: "2mg após cada evacuação líquida (máx 16mg/dia)", duration: 3 },
        ],
        commonFrequencies: ["após evacuações"],
    },
    {
        name: "Loperamida + Simeticona",
        category: "Antidiarreico + antiflatulento",
        route: "oral",
        presentations: [
            { dosage: "2/125", unit: "mg", format: "Comprimido", commonDose: "1-2 comp após evacuações", duration: 3 },
        ],
        commonFrequencies: ["após evacuações"],
    },

    // ============================================================
    // PNEUMOLOGIA / ALERGIA
    // ============================================================
    {
        name: "Formoterol + Budesonida",
        category: "Broncodilatador + corticoide inalatório",
        route: "inalatório",
        presentations: [
            { dosage: "6/200", unit: "mcg", format: "Turbuhaler", commonDose: "1-2 inalações 12/12h", duration: 30 },
            { dosage: "6/100", unit: "mcg", format: "Turbuhaler", commonDose: "1-2 inalações 12/12h", duration: 30 },
            { dosage: "12/400", unit: "mcg", format: "Turbuhaler", commonDose: "1 inalação 12/12h", duration: 30 },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Salmeterol + Fluticasona",
        category: "Broncodilatador + corticoide inalatório",
        route: "inalatório",
        presentations: [
            { dosage: "25/125", unit: "mcg", format: "Aerossol Seretide", commonDose: "2 inalações 12/12h", duration: 30 },
            { dosage: "25/250", unit: "mcg", format: "Aerossol Seretide", commonDose: "2 inalações 12/12h", duration: 30 },
            { dosage: "50/250", unit: "mcg", format: "Diskus", commonDose: "1 inalação 12/12h", duration: 30 },
            { dosage: "50/500", unit: "mcg", format: "Diskus", commonDose: "1 inalação 12/12h", duration: 30 },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Vilanterol + Furoato de fluticasona",
        category: "LABA + corticoide inalatório (ICS/LABA)",
        route: "inalatório",
        presentations: [
            { dosage: "25/100", unit: "mcg", format: "Ellipta", commonDose: "1 inalação 1x/dia", duration: 30 },
            { dosage: "25/200", unit: "mcg", format: "Ellipta", commonDose: "1 inalação 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Tiotrópio",
        category: "Broncodilatador LAMA",
        route: "inalatório",
        presentations: [
            { dosage: "18", unit: "mcg", format: "Cápsula HandiHaler", commonDose: "1 inalação 1x/dia", duration: 30, indication: "DPOC" },
            { dosage: "2.5", unit: "mcg", format: "Respimat", commonDose: "2 inalações 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Indacaterol + Glicopirrônio",
        category: "LABA + LAMA",
        route: "inalatório",
        presentations: [
            { dosage: "110/50", unit: "mcg", format: "Breezhaler", commonDose: "1 cápsula 1x/dia", duration: 30, indication: "DPOC" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Montelucaste",
        category: "Antileucotrieno",
        route: "oral",
        presentations: [
            { dosage: "4", unit: "mg", format: "Comprimido mastigável", commonDose: "1x/dia à noite", duration: 30, isPediatric: true, indication: "Pediátrico 2-5 anos" },
            { dosage: "5", unit: "mg", format: "Comprimido mastigável", commonDose: "1x/dia à noite", duration: 30, indication: "Pediátrico 6-14 anos" },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia à noite", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia (noite)"],
    },
    {
        name: "Desloratadina",
        category: "Anti-histamínico (2ª geração)",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
            { dosage: "0.5", unit: "mg/mL", format: "Xarope 100mL", commonDose: "Pediátrico conforme peso", duration: 30, isPediatric: true },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Bilastina",
        category: "Anti-histamínico (2ª geração)",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia em jejum", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Ebastina",
        category: "Anti-histamínico (2ª geração)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Rupatadina",
        category: "Anti-histamínico (2ª geração)",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Fexofenadina",
        category: "Anti-histamínico (2ª geração)",
        route: "oral",
        presentations: [
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60mg 12/12h", duration: 30 },
            { dosage: "120", unit: "mg", format: "Comprimido", commonDose: "120mg 1x/dia", duration: 30 },
            { dosage: "180", unit: "mg", format: "Comprimido", commonDose: "180mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "12/12h"],
    },
    {
        name: "Mometasona nasal",
        category: "Corticoide nasal",
        route: "intranasal",
        presentations: [
            { dosage: "50", unit: "mcg/puff", format: "Spray 18g", commonDose: "2 jatos por narina 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Budesonida nasal",
        category: "Corticoide nasal",
        route: "intranasal",
        presentations: [
            { dosage: "32", unit: "mcg/puff", format: "Spray", commonDose: "2 jatos por narina 1-2x/dia", duration: 30 },
            { dosage: "64", unit: "mcg/puff", format: "Spray", commonDose: "1-2 jatos por narina 1-2x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "12/12h"],
    },
    {
        name: "Fluticasona nasal",
        category: "Corticoide nasal",
        route: "intranasal",
        presentations: [
            { dosage: "50", unit: "mcg/puff", format: "Spray", commonDose: "2 jatos por narina 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // ANALGÉSICOS / DOR
    // ============================================================
    {
        name: "Cetorolaco",
        category: "AINE",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 4/4-6/6h (máx 5d)", duration: 5 },
        ],
        commonFrequencies: ["4/4h", "6/6h"],
    },
    {
        name: "Etoricoxibe",
        category: "AINE (COX-2)",
        route: "oral",
        presentations: [
            { dosage: "60", unit: "mg", format: "Comprimido", commonDose: "60mg 1x/dia", duration: 7 },
            { dosage: "90", unit: "mg", format: "Comprimido", commonDose: "90mg 1x/dia", duration: 7 },
            { dosage: "120", unit: "mg", format: "Comprimido", commonDose: "120mg 1x/dia (até 8d)", duration: 8, indication: "Gota aguda" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Celecoxibe",
        category: "AINE (COX-2)",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Cápsula", commonDose: "100mg 12/12h", duration: 7 },
            { dosage: "200", unit: "mg", format: "Cápsula", commonDose: "200mg 1-2x/dia", duration: 7 },
        ],
        commonFrequencies: ["1x ao dia", "12/12h"],
    },
    {
        name: "Meloxicam",
        category: "AINE",
        route: "oral",
        presentations: [
            { dosage: "7.5", unit: "mg", format: "Comprimido", commonDose: "7,5mg 1x/dia", duration: 7 },
            { dosage: "15", unit: "mg", format: "Comprimido", commonDose: "15mg 1x/dia", duration: 7 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Nimesulida",
        category: "AINE",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 12/12h", duration: 5 },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Cetoprofeno",
        category: "AINE",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg", format: "Cápsula", commonDose: "50mg 6/6h", duration: 5 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 12/12h", duration: 5 },
            { dosage: "200", unit: "mg", format: "Comprimido SR", commonDose: "200mg 1x/dia", duration: 5 },
        ],
        commonFrequencies: ["1x ao dia", "12/12h", "6/6h"],
    },
    {
        name: "Dipirona + Cafeína + Adifenina",
        category: "Analgésico associado",
        route: "oral",
        presentations: [
            { dosage: "500/30/10", unit: "mg", format: "Comprimido", commonDose: "1-2 comp 4-6x/dia", duration: 5, indication: "Cólica" },
        ],
        commonFrequencies: ["4/4h", "6/6h"],
    },
    {
        name: "Ciclobenzaprina",
        category: "Relaxante muscular",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 3x/dia", duration: 5 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 3x/dia", duration: 5 },
        ],
        commonFrequencies: ["3x ao dia"],
    },
    {
        name: "Carisoprodol",
        category: "Relaxante muscular",
        route: "oral",
        presentations: [
            { dosage: "125", unit: "mg", format: "Comprimido", commonDose: "1-2 comp 4x/dia", duration: 5 },
            { dosage: "350", unit: "mg", format: "Comprimido", commonDose: "1 comp 4x/dia", duration: 5 },
        ],
        commonFrequencies: ["4x ao dia"],
    },
    {
        name: "Tizanidina",
        category: "Relaxante muscular",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 8/8h", duration: 7 },
            { dosage: "4", unit: "mg", format: "Comprimido", commonDose: "4mg 8/8h", duration: 7 },
        ],
        commonFrequencies: ["8/8h"],
    },
    {
        name: "Duloxetina (dor crônica)",
        category: "Antidepressivo (analgésico - dor neuropática)",
        route: "oral",
        presentations: [
            { dosage: "30", unit: "mg", format: "Cápsula", commonDose: "30mg 1x/dia (início)", duration: 30 },
            { dosage: "60", unit: "mg", format: "Cápsula", commonDose: "60mg 1x/dia", duration: 30, indication: "Fibromialgia, dor neuropática" },
        ],
        commonFrequencies: ["1x ao dia"],
        prescriptionType: 'C1',
    },

    // ============================================================
    // UROLOGIA
    // ============================================================
    {
        name: "Tansulosina",
        category: "Alfa-bloqueador uroseletivo",
        route: "oral",
        presentations: [
            { dosage: "0.4", unit: "mg", format: "Cápsula", commonDose: "0,4mg 1x/dia", duration: 30, indication: "HBP" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Alfuzosina",
        category: "Alfa-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "10", unit: "mg", format: "Comprimido SR", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Doxazosina",
        category: "Alfa-bloqueador",
        route: "oral",
        presentations: [
            { dosage: "2", unit: "mg", format: "Comprimido", commonDose: "2-4mg 1x/dia", duration: 30 },
            { dosage: "4", unit: "mg", format: "Comprimido SR", commonDose: "4mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sildenafila",
        category: "Disfunção erétil (iPDE5)",
        route: "oral",
        presentations: [
            { dosage: "25", unit: "mg", format: "Comprimido", commonDose: "25-100mg 1h antes da atividade", duration: 30 },
            { dosage: "50", unit: "mg", format: "Comprimido", commonDose: "50mg 1h antes da atividade", duration: 30 },
            { dosage: "100", unit: "mg", format: "Comprimido", commonDose: "100mg 1h antes da atividade", duration: 30 },
        ],
        commonFrequencies: ["conforme necessário"],
    },
    {
        name: "Tadalafila",
        category: "Disfunção erétil (iPDE5)",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5mg 1x/dia (uso diário)", duration: 30 },
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia (uso diário) ou conforme necessário", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10-20mg antes da atividade", duration: 30 },
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg antes da atividade", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia", "conforme necessário"],
    },
    {
        name: "Solifenacina",
        category: "Antimuscarínico (bexiga hiperativa)",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 30 },
            { dosage: "10", unit: "mg", format: "Comprimido", commonDose: "10mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // REUMATOLOGIA / OSTEOPOROSE
    // ============================================================
    {
        name: "Alendronato",
        category: "Bisfosfonato",
        route: "oral",
        presentations: [
            { dosage: "70", unit: "mg", format: "Comprimido", commonDose: "70mg 1x/semana em jejum", duration: 30 },
        ],
        commonFrequencies: ["1x por semana"],
    },
    {
        name: "Risedronato",
        category: "Bisfosfonato",
        route: "oral",
        presentations: [
            { dosage: "35", unit: "mg", format: "Comprimido", commonDose: "35mg 1x/semana em jejum", duration: 30 },
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150mg 1x/mês", duration: 30 },
        ],
        commonFrequencies: ["1x por semana", "1x por mês"],
    },
    {
        name: "Ibandronato",
        category: "Bisfosfonato",
        route: "oral",
        presentations: [
            { dosage: "150", unit: "mg", format: "Comprimido", commonDose: "150mg 1x/mês em jejum", duration: 30 },
        ],
        commonFrequencies: ["1x por mês"],
    },
    {
        name: "Denosumabe",
        category: "Anti-RANKL (osteoporose)",
        route: "subcutâneo",
        presentations: [
            { dosage: "60", unit: "mg", format: "Caneta Prolia", commonDose: "60mg SC 1x cada 6 meses", duration: 180 },
        ],
        commonFrequencies: ["cada 6 meses"],
    },
    {
        name: "Metotrexato",
        category: "DMARD",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "Conforme protocolo", duration: 30 },
        ],
        commonFrequencies: ["1x por semana"],
    },
    {
        name: "Leflunomida",
        category: "DMARD",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30, indication: "AR" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Hidroxicloroquina",
        category: "Antimalárico (DMARD)",
        route: "oral",
        presentations: [
            { dosage: "400", unit: "mg", format: "Comprimido", commonDose: "400mg 1x/dia", duration: 30, indication: "LES / AR" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sulfassalazina",
        category: "DMARD",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg", format: "Comprimido", commonDose: "500mg 2x/dia (início), titular", duration: 30 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Colchicina",
        category: "Antigotoso",
        route: "oral",
        presentations: [
            { dosage: "0.5", unit: "mg", format: "Comprimido", commonDose: "0,5mg 2-3x/dia", duration: 7 },
        ],
        commonFrequencies: ["2x ao dia", "3x ao dia"],
    },
    {
        name: "Febuxostate",
        category: "Anti-hiperuricêmico",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg", format: "Comprimido", commonDose: "40mg 1x/dia", duration: 30 },
            { dosage: "80", unit: "mg", format: "Comprimido", commonDose: "80mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // VITAMINAS / SUPLEMENTOS
    // ============================================================
    {
        name: "Colecalciferol (Vitamina D3)",
        category: "Vitamina",
        route: "oral",
        presentations: [
            { dosage: "1000", unit: "UI", format: "Comprimido/Gota", commonDose: "1000-2000 UI 1x/dia", duration: 90 },
            { dosage: "2000", unit: "UI", format: "Cápsula", commonDose: "2000 UI 1x/dia", duration: 90 },
            { dosage: "7000", unit: "UI", format: "Cápsula", commonDose: "7000 UI 1x/semana", duration: 90 },
            { dosage: "50000", unit: "UI", format: "Cápsula", commonDose: "50000 UI 1x/semana × 8 sem", duration: 56, indication: "Reposição rápida" },
        ],
        commonFrequencies: ["1x ao dia", "1x por semana"],
    },
    {
        name: "Cianocobalamina (Vitamina B12)",
        category: "Vitamina",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mcg", format: "Comprimido", commonDose: "500-1000mcg 1x/dia", duration: 30 },
            { dosage: "1000", unit: "mcg", format: "Comprimido sublingual", commonDose: "1000mcg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Hidroxocobalamina (B12 IM)",
        category: "Vitamina",
        route: "intramuscular",
        presentations: [
            { dosage: "5000", unit: "mcg", format: "Ampola", commonDose: "5000mcg IM 1x/semana × 4 sem, depois 1x/mês", duration: 30 },
        ],
        commonFrequencies: ["1x por semana", "1x por mês"],
    },
    {
        name: "Ácido fólico",
        category: "Vitamina",
        route: "oral",
        presentations: [
            { dosage: "5", unit: "mg", format: "Comprimido", commonDose: "5mg 1x/dia", duration: 90, indication: "Pré-natal / anemia megaloblástica" },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Sulfato ferroso",
        category: "Suplemento de ferro",
        route: "oral",
        presentations: [
            { dosage: "40", unit: "mg Fe", format: "Comprimido", commonDose: "1-2 comp/dia em jejum", duration: 90 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },
    {
        name: "Polimaltose férrica",
        category: "Suplemento de ferro",
        route: "oral",
        presentations: [
            { dosage: "100", unit: "mg Fe", format: "Comprimido", commonDose: "100-200mg 1x/dia", duration: 90 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Carbonato de cálcio + Vitamina D",
        category: "Suplemento de cálcio",
        route: "oral",
        presentations: [
            { dosage: "500/400", unit: "mg/UI", format: "Comprimido", commonDose: "1 comp 2x/dia", duration: 90 },
            { dosage: "600/400", unit: "mg/UI", format: "Comprimido", commonDose: "1 comp 2x/dia", duration: 90 },
        ],
        commonFrequencies: ["1x ao dia", "2x ao dia"],
    },

    // ============================================================
    // ONCOLOGIA / HEMATOLOGIA (mais comuns ambulatoriais)
    // ============================================================
    {
        name: "Tamoxifeno",
        category: "Antiestrogênico (oncologia)",
        route: "oral",
        presentations: [
            { dosage: "20", unit: "mg", format: "Comprimido", commonDose: "20mg 1x/dia", duration: 30, indication: "CA mama hormônio-dep." },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Anastrozol",
        category: "Inibidor de aromatase",
        route: "oral",
        presentations: [
            { dosage: "1", unit: "mg", format: "Comprimido", commonDose: "1mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },
    {
        name: "Letrozol",
        category: "Inibidor de aromatase",
        route: "oral",
        presentations: [
            { dosage: "2.5", unit: "mg", format: "Comprimido", commonDose: "2,5mg 1x/dia", duration: 30 },
        ],
        commonFrequencies: ["1x ao dia"],
    },

    // ============================================================
    // OTORRINO
    // ============================================================
    {
        name: "Pseudoefedrina + Loratadina",
        category: "Descongestionante + anti-histamínico",
        route: "oral",
        presentations: [
            { dosage: "120/5", unit: "mg", format: "Comprimido SR", commonDose: "1 comp 12/12h", duration: 7 },
        ],
        commonFrequencies: ["12/12h"],
    },
    {
        name: "Cipro-otológico (Ciprofloxacino otológico)",
        category: "Antibiótico otológico",
        route: "tópico otológico",
        presentations: [
            { dosage: "3", unit: "mg/mL", format: "Solução otológica", commonDose: "4 gotas 12/12h × 7d", duration: 7 },
        ],
        commonFrequencies: ["12/12h"],
    },

    // ============================================================
    // PEDIATRIA — formulações específicas
    // ============================================================
    {
        name: "Ibuprofeno (pediátrico)",
        category: "AINE pediátrico",
        route: "oral",
        presentations: [
            { dosage: "50", unit: "mg/mL", format: "Gotas 30mL", commonDose: "Conforme peso", duration: 5, isPediatric: true, dosePerKg: 10, frequency: 4 },
            { dosage: "100", unit: "mg/5mL", format: "Suspensão", commonDose: "Conforme peso", duration: 5, isPediatric: true },
        ],
        commonFrequencies: ["6/6h", "8/8h"],
    },
    {
        name: "Dipirona (pediátrica)",
        category: "Analgésico pediátrico",
        route: "oral",
        presentations: [
            { dosage: "500", unit: "mg/mL", format: "Gotas 20mL", commonDose: "1 gota/kg até 6/6h", duration: 3, isPediatric: true },
        ],
        commonFrequencies: ["6/6h"],
    },
    {
        name: "Vitamina A + D pediátrica",
        category: "Vitamina pediátrica",
        route: "oral",
        presentations: [
            { dosage: "Polivitamínico", unit: "", format: "Gotas", commonDose: "Conforme idade", duration: 90, isPediatric: true },
        ],
        commonFrequencies: ["1x ao dia"],
    },
];
