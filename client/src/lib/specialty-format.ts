/**
 * Formata a especialidade médica respeitando a Resolução CFM 1.974/2011:
 *
 * - Médico SEM RQE só pode declarar a "área de atuação" (sufixo -gia / -ia).
 *   Ex.: "Oftalmologia", "Cardiologia", "Pediatria".
 * - Médico COM RQE pode se intitular especialista (sufixo -gista / -ista).
 *   Ex.: "Oftalmologista", "Cardiologista", "Pediatra".
 *
 * Anunciar-se como especialista sem possuir RQE é exercício irregular da
 * especialidade — esta função evita que o sistema emita documentos que
 * descumprem o código de ética médica.
 */

/**
 * Mapeamento explícito de especialidades irregulares (não derivam do simples
 * troca -ia → -ista). Compostas e formas tradicionais ficam aqui.
 */
const SPECIALTY_TITLE_MAP: Record<string, string> = {
    "Alergia e Imunologia": "Alergista e Imunologista",
    "Cirurgia Geral": "Cirurgião Geral",
    "Cirurgia Plástica": "Cirurgião Plástico",
    "Cirurgia Cardiovascular": "Cirurgião Cardiovascular",
    "Cirurgia Pediátrica": "Cirurgião Pediátrico",
    "Cirurgia Torácica": "Cirurgião Torácico",
    "Cirurgia Vascular": "Cirurgião Vascular",
    "Cirurgia da Mão": "Cirurgião da Mão",
    "Cirurgia de Cabeça e Pescoço": "Cirurgião de Cabeça e Pescoço",
    "Clínica Médica": "Clínico (Clínica Médica)",
    "Endocrinologia e Metabologia": "Endocrinologista",
    "Geriatria": "Geriatra",
    "Ginecologia e Obstetrícia": "Ginecologista e Obstetra",
    "Hematologia e Hemoterapia": "Hematologista",
    "Medicina de Família e Comunidade": "Médico de Família e Comunidade",
    "Medicina do Trabalho": "Médico do Trabalho",
    "Medicina Esportiva": "Médico Esportivo",
    "Medicina Intensiva": "Intensivista",
    "Medicina Nuclear": "Médico Nuclear",
    "Medicina Preventiva e Social": "Médico Preventivista",
    "Medicina Física e Reabilitação": "Fisiatra",
    "Obstetrícia": "Obstetra",
    "Ortopedia e Traumatologia": "Ortopedista",
    "Pediatria": "Pediatra",
    "Psiquiatria": "Psiquiatra",
    "Radiologia e Diagnóstico por Imagem": "Radiologista",
};

/**
 * Returns the textual representation of the specialty for a document.
 * - With RQE → especialista title (e.g. "Oftalmologista")
 * - Without RQE → "Área de atuação: <área>" to make legal status explicit
 */
export function formatSpecialty(
    specialty?: string | null,
    rqe?: string | null,
    options: { prefixWhenNoRqe?: boolean } = {}
): string {
    if (!specialty) return "";
    const trimmed = specialty.trim();
    const hasRqe = !!(rqe && rqe.trim());

    // "Clínico geral" is the default for doctors without residency — it is not a
    // CFM-recognized specialty nor an "área de atuação", so render plainly.
    if (/^cl[ií]nico\s+geral$/i.test(trimmed)) return "Clínico geral";

    if (!hasRqe) {
        if (options.prefixWhenNoRqe === false) return trimmed;
        return `Área de atuação: ${trimmed}`;
    }

    // Specialist title
    if (SPECIALTY_TITLE_MAP[trimmed]) return SPECIALTY_TITLE_MAP[trimmed];

    // Generic suffix rules (most cases)
    if (/logia$/i.test(trimmed)) return trimmed.replace(/logia$/i, "logista");
    if (/grafia$/i.test(trimmed)) return trimmed.replace(/grafia$/i, "grafista");
    if (/ia$/i.test(trimmed)) return trimmed.replace(/ia$/i, "ista");

    return trimmed;
}
