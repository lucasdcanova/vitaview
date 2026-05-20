/**
 * Converts numbers (1-999) to their Portuguese spelling.
 * Used to write quantities by extenso on controlled prescriptions, as required
 * by ANVISA RDC 20/2011 (Receita de Controle Especial).
 */

const ONES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const TEENS = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

export function numberToPtBr(num: number): string {
    if (!Number.isFinite(num) || num < 0) return "";
    if (num === 0) return "zero";
    if (num === 100) return "cem";
    if (num < 10) return ONES[num];
    if (num < 20) return TEENS[num - 10];
    if (num < 100) {
        const t = Math.floor(num / 10);
        const o = num % 10;
        return o === 0 ? TENS[t] : `${TENS[t]} e ${ONES[o]}`;
    }
    if (num < 1000) {
        const h = Math.floor(num / 100);
        const rest = num % 100;
        if (rest === 0) return HUNDREDS[h];
        return `${HUNDREDS[h]} e ${numberToPtBr(rest)}`;
    }
    return String(num);
}

/**
 * Extracts the leading integer and remaining unit from a free-form quantity
 * string like "30 comprimidos" → { value: 30, unit: "comprimidos" }.
 * Returns null when the string doesn't start with a number.
 */
export function parseQuantity(raw?: string | null): { value: number; unit: string } | null {
    if (!raw) return null;
    const match = raw.trim().match(/^(\d+)\s*(.*)$/);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    if (!Number.isFinite(value)) return null;
    const unit = (match[2] || "").trim();
    return { value, unit };
}

/**
 * Returns a string with the number written both in digits and by extenso, for
 * controlled prescriptions: "30 (trinta) comprimidos".
 */
export function quantityWithExtenso(raw?: string | null): string | null {
    const parsed = parseQuantity(raw);
    if (!parsed) return raw || null;
    const extenso = numberToPtBr(parsed.value);
    if (!extenso) return raw || null;
    return parsed.unit
        ? `${parsed.value} (${extenso}) ${parsed.unit}`
        : `${parsed.value} (${extenso})`;
}
