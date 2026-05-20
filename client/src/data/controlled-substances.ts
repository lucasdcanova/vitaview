/**
 * Substâncias sujeitas a controle especial — Portaria SVS/MS nº 344/1998
 * e atualizações posteriores. Listadas por DCB (Denominação Comum Brasileira).
 *
 * Mapeamento Lista 344 → tipo de receita usado no VitaView:
 *   A1, A2, A3  →  "A"   (Notificação Amarela)
 *   B1          →  "B1"  (Notificação Azul — psicotrópicos)
 *   B2          →  "B2"  (Notificação Azul — anorexígenos)
 *   C1          →  "C1"  (Receita de Controle Especial — 2 vias)
 *   C2          →  "C"   (Receita de Controle Especial + Termo — retinoides)
 *   C3          →  "C"   (Receita de Controle Especial + Termo — talidomida)
 *   C4          →  "C1"  (Receita de Controle Especial — antirretrovirais)
 *   C5          →  "C1"  (Receita de Controle Especial — anabolizantes)
 */

export type AnvisaList = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5';
export type PrescriptionType = 'padrao' | 'especial' | 'A' | 'B1' | 'B2' | 'C' | 'C1';

export interface ControlledSubstance {
    dcb: string;
    aliases?: string[];
    list: AnvisaList;
    category: string;
}

const ANVISA_TO_PRESCRIPTION: Record<AnvisaList, PrescriptionType> = {
    A1: 'A',
    A2: 'A',
    A3: 'A',
    B1: 'B1',
    B2: 'B2',
    C1: 'C1',
    C2: 'C',
    C3: 'C',
    C4: 'C1',
    C5: 'C1',
};

export const CONTROLLED_SUBSTANCES: ControlledSubstance[] = [
    // ===== LISTA A1 — Entorpecentes =====
    { dcb: 'Alfentanila', list: 'A1', category: 'Opioide' },
    { dcb: 'Anileridina', list: 'A1', category: 'Opioide' },
    { dcb: 'Buprenorfina', list: 'A1', category: 'Opioide' },
    { dcb: 'Cocaína', list: 'A1', category: 'Opioide' },
    { dcb: 'Diidrocodeína', list: 'A1', category: 'Opioide' },
    { dcb: 'Diidromorfina', list: 'A1', category: 'Opioide' },
    { dcb: 'Fentanila', aliases: ['Fentanil'], list: 'A1', category: 'Opioide' },
    { dcb: 'Heroína', list: 'A1', category: 'Opioide' },
    { dcb: 'Hidrocodona', list: 'A1', category: 'Opioide' },
    { dcb: 'Hidromorfona', list: 'A1', category: 'Opioide' },
    { dcb: 'Metadona', list: 'A1', category: 'Opioide' },
    { dcb: 'Morfina', list: 'A1', category: 'Opioide' },
    { dcb: 'Nalbufina', list: 'A1', category: 'Opioide' },
    { dcb: 'Oxicodona', list: 'A1', category: 'Opioide' },
    { dcb: 'Oximorfona', list: 'A1', category: 'Opioide' },
    { dcb: 'Petidina', list: 'A1', category: 'Opioide' },
    { dcb: 'Remifentanila', aliases: ['Remifentanil'], list: 'A1', category: 'Opioide' },
    { dcb: 'Sufentanila', aliases: ['Sufentanil'], list: 'A1', category: 'Opioide' },
    { dcb: 'Tapentadol', list: 'A1', category: 'Opioide' },

    // ===== LISTA A2 — Entorpecentes em concentrações específicas =====
    { dcb: 'Codeína', list: 'A2', category: 'Opioide' },
    { dcb: 'Difenoxilato', list: 'A2', category: 'Antidiarreico opioide' },
    { dcb: 'Difenoxina', list: 'A2', category: 'Antidiarreico opioide' },
    { dcb: 'Tramadol', list: 'A2', category: 'Opioide' },

    // ===== LISTA A3 — Psicotrópicos (estimulantes) =====
    { dcb: 'Anfepramona', aliases: ['Dietilpropiona'], list: 'A3', category: 'Anorexígeno (estimulante)' },
    { dcb: 'Anfetamina', list: 'A3', category: 'Estimulante' },
    { dcb: 'Dextroanfetamina', list: 'A3', category: 'Estimulante' },
    { dcb: 'Femproporex', list: 'A3', category: 'Anorexígeno (estimulante)' },
    { dcb: 'Lisdexanfetamina', aliases: ['Venvanse'], list: 'A3', category: 'Estimulante (TDAH)' },
    { dcb: 'Mazindol', list: 'A3', category: 'Anorexígeno' },
    { dcb: 'Metanfetamina', list: 'A3', category: 'Estimulante' },
    { dcb: 'Metilfenidato', aliases: ['Ritalina', 'Concerta'], list: 'A3', category: 'Estimulante (TDAH)' },

    // ===== LISTA B1 — Psicotrópicos (benzodiazepínicos, barbitúricos, hipnóticos) =====
    { dcb: 'Alprazolam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Bromazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Brotizolam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Clobazam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Clonazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Clorazepato dipotássico', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Clordiazepóxido', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Cloxazolam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Diazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Estazolam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Flunitrazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Flurazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Lorazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Midazolam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Nitrazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Oxazepam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Triazolam', list: 'B1', category: 'Benzodiazepínico' },
    { dcb: 'Zolpidem', list: 'B1', category: 'Hipnótico não-benzodiazepínico' },
    { dcb: 'Zopiclona', list: 'B1', category: 'Hipnótico não-benzodiazepínico' },
    { dcb: 'Eszopiclona', list: 'B1', category: 'Hipnótico não-benzodiazepínico' },
    { dcb: 'Zaleplon', list: 'B1', category: 'Hipnótico não-benzodiazepínico' },
    { dcb: 'Fenobarbital', list: 'B1', category: 'Barbitúrico' },
    { dcb: 'Pentobarbital', list: 'B1', category: 'Barbitúrico' },
    { dcb: 'Tiopental', list: 'B1', category: 'Barbitúrico' },
    { dcb: 'Meprobamato', list: 'B1', category: 'Ansiolítico' },
    { dcb: 'Suvorexanto', list: 'B1', category: 'Hipnótico (antagonista orexina)' },

    // ===== LISTA B2 — Psicotrópicos anorexígenos =====
    { dcb: 'Sibutramina', list: 'B2', category: 'Anorexígeno (inibidor recaptação)' },

    // ===== LISTA C1 — Outras substâncias sujeitas a controle especial =====
    // Antidepressivos
    { dcb: 'Agomelatina', list: 'C1', category: 'Antidepressivo' },
    { dcb: 'Amitriptilina', list: 'C1', category: 'Antidepressivo tricíclico' },
    { dcb: 'Bupropiona', list: 'C1', category: 'Antidepressivo (inibidor recaptação dopamina/noradrenalina)' },
    { dcb: 'Citalopram', list: 'C1', category: 'Antidepressivo (ISRS)' },
    { dcb: 'Clomipramina', list: 'C1', category: 'Antidepressivo tricíclico' },
    { dcb: 'Desvenlafaxina', list: 'C1', category: 'Antidepressivo (IRSN)' },
    { dcb: 'Doxepina', list: 'C1', category: 'Antidepressivo tricíclico' },
    { dcb: 'Duloxetina', list: 'C1', category: 'Antidepressivo (IRSN)' },
    { dcb: 'Escitalopram', list: 'C1', category: 'Antidepressivo (ISRS)' },
    { dcb: 'Fluoxetina', list: 'C1', category: 'Antidepressivo (ISRS)' },
    { dcb: 'Fluvoxamina', list: 'C1', category: 'Antidepressivo (ISRS)' },
    { dcb: 'Imipramina', list: 'C1', category: 'Antidepressivo tricíclico' },
    { dcb: 'Maprotilina', list: 'C1', category: 'Antidepressivo' },
    { dcb: 'Mianserina', list: 'C1', category: 'Antidepressivo' },
    { dcb: 'Mirtazapina', list: 'C1', category: 'Antidepressivo' },
    { dcb: 'Nortriptilina', list: 'C1', category: 'Antidepressivo tricíclico' },
    { dcb: 'Paroxetina', list: 'C1', category: 'Antidepressivo (ISRS)' },
    { dcb: 'Sertralina', list: 'C1', category: 'Antidepressivo (ISRS)' },
    { dcb: 'Tianeptina', list: 'C1', category: 'Antidepressivo' },
    { dcb: 'Trazodona', list: 'C1', category: 'Antidepressivo' },
    { dcb: 'Venlafaxina', list: 'C1', category: 'Antidepressivo (IRSN)' },
    { dcb: 'Vortioxetina', list: 'C1', category: 'Antidepressivo' },

    // Antipsicóticos
    { dcb: 'Amissulprida', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Aripiprazol', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Asenapina', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Brexpiprazol', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Cariprazina', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Clorpromazina', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Clozapina', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Flufenazina', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Haloperidol', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Levomepromazina', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Lurasidona', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Olanzapina', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Paliperidona', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Periciazina', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Pimozida', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Quetiapina', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Risperidona', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Sulpirida', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Tioridazina', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Trifluoperazina', list: 'C1', category: 'Antipsicótico típico' },
    { dcb: 'Ziprasidona', list: 'C1', category: 'Antipsicótico atípico' },
    { dcb: 'Zuclopentixol', list: 'C1', category: 'Antipsicótico típico' },

    // Anticonvulsivantes
    { dcb: 'Carbamazepina', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Etossuximida', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Felbamato', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Fenitoína', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Lacosamida', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Lamotrigina', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Levetiracetam', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Oxcarbazepina', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Perampanel', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Pregabalina', list: 'C1', category: 'Anticonvulsivante / dor neuropática' },
    { dcb: 'Primidona', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Topiramato', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Valproato de sódio', aliases: ['Ácido valpróico', 'Divalproato de sódio'], list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Vigabatrina', list: 'C1', category: 'Anticonvulsivante' },
    { dcb: 'Zonisamida', list: 'C1', category: 'Anticonvulsivante' },

    // Outros
    { dcb: 'Atomoxetina', list: 'C1', category: 'TDAH (não-estimulante)' },
    { dcb: 'Buspirona', list: 'C1', category: 'Ansiolítico' },
    { dcb: 'Donepezila', list: 'C1', category: 'Anti-Alzheimer' },
    { dcb: 'Galantamina', list: 'C1', category: 'Anti-Alzheimer' },
    { dcb: 'Rivastigmina', list: 'C1', category: 'Anti-Alzheimer' },
    { dcb: 'Memantina', list: 'C1', category: 'Anti-Alzheimer' },
    { dcb: 'Modafinila', aliases: ['Modafinil'], list: 'C1', category: 'Estimulante (não-anfetamínico)' },
    { dcb: 'Armodafinila', aliases: ['Armodafinil'], list: 'C1', category: 'Estimulante (não-anfetamínico)' },
    { dcb: 'Carbonato de lítio', aliases: ['Lítio'], list: 'C1', category: 'Estabilizador de humor' },

    // ===== LISTA C2 — Retinoides sistêmicos =====
    { dcb: 'Acitretina', list: 'C2', category: 'Retinoide sistêmico' },
    { dcb: 'Bexaroteno', list: 'C2', category: 'Retinoide sistêmico' },
    { dcb: 'Etretinato', list: 'C2', category: 'Retinoide sistêmico' },
    { dcb: 'Isotretinoína', list: 'C2', category: 'Retinoide sistêmico' },

    // ===== LISTA C3 — Imunossupressores =====
    { dcb: 'Talidomida', list: 'C3', category: 'Imunossupressor (com Termo)' },

    // ===== LISTA C5 — Anabolizantes =====
    { dcb: 'Cipionato de testosterona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Decanoato de nandrolona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Decanoato de testosterona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Estanozolol', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Fluoximesterona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Mesterolona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Metenolona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Nandrolona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Oxandrolona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Oximetolona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Testosterona', list: 'C5', category: 'Anabolizante' },
    { dcb: 'Undecilato de testosterona', list: 'C5', category: 'Anabolizante' },
];

/**
 * Antimicrobianos sob controle (RDC 20/2011) — receita de controle especial
 * branca em 2 vias. Lista por DCB.
 */
export const CONTROLLED_ANTIMICROBIALS: string[] = [
    // Beta-lactâmicos
    'Amoxicilina', 'Ampicilina', 'Penicilina G', 'Penicilina V', 'Piperacilina',
    'Cefalexina', 'Cefadroxila', 'Cefaclor', 'Cefuroxima', 'Cefoxitina', 'Cefotaxima',
    'Ceftriaxona', 'Ceftazidima', 'Cefepima', 'Cefpodoxima', 'Cefdinir', 'Cefditoreno',
    'Imipenem', 'Meropenem', 'Ertapenem', 'Doripenem', 'Aztreonam',
    // Macrolídeos
    'Azitromicina', 'Claritromicina', 'Eritromicina', 'Roxitromicina',
    // Quinolonas
    'Ciprofloxacino', 'Levofloxacino', 'Moxifloxacino', 'Norfloxacino', 'Ofloxacino', 'Gatifloxacino',
    // Aminoglicosídeos
    'Amicacina', 'Gentamicina', 'Tobramicina', 'Estreptomicina', 'Neomicina',
    // Tetraciclinas
    'Tetraciclina', 'Doxiciclina', 'Minociclina', 'Tigeciclina',
    // Sulfas
    'Sulfametoxazol', 'Sulfadiazina', 'Trimetoprima', 'Sulfametoxazol + Trimetoprima',
    // Outros antibacterianos
    'Cloranfenicol', 'Clindamicina', 'Lincomicina', 'Vancomicina', 'Teicoplanina',
    'Linezolida', 'Daptomicina', 'Metronidazol', 'Nitrofurantoína', 'Fosfomicina',
    'Rifampicina', 'Rifaximina', 'Isoniazida', 'Pirazinamida', 'Etambutol',
    // Antifúngicos
    'Fluconazol', 'Itraconazol', 'Voriconazol', 'Posaconazol', 'Cetoconazol',
    'Anfotericina B', 'Caspofungina', 'Micafungina', 'Anidulafungina', 'Terbinafina',
    'Griseofulvina', 'Nistatina (sistêmica)',
    // Antivirais
    'Aciclovir', 'Valaciclovir', 'Famciclovir', 'Ganciclovir', 'Valganciclovir',
    'Oseltamivir', 'Zanamivir', 'Baloxavir',
];

/**
 * Antirretrovirais (Lista C4 da Portaria 344/98) — receita de controle especial.
 */
export const ANTIRETROVIRALS: string[] = [
    'Abacavir', 'Atazanavir', 'Darunavir', 'Didanosina', 'Dolutegravir', 'Efavirenz',
    'Emtricitabina', 'Etravirina', 'Fosamprenavir', 'Indinavir', 'Lamivudina',
    'Lopinavir', 'Maraviroque', 'Nelfinavir', 'Nevirapina', 'Raltegravir', 'Ritonavir',
    'Saquinavir', 'Tenofovir', 'Tipranavir', 'Zidovudina', 'Bictegravir', 'Cabotegravir',
    'Doravirina', 'Rilpivirina',
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/**
 * Returns the prescription type for a given medication name by looking up its
 * DCB in the Anvisa controlled substance lists. Falls back to "padrao" for
 * unlisted substances and to "especial" for antimicrobials/antifungals/antivirals.
 */
export function classifyPrescriptionType(medicationName: string): PrescriptionType {
    if (!medicationName) return 'padrao';
    const target = norm(medicationName);

    // 1. Check controlled (Portaria 344/98)
    for (const substance of CONTROLLED_SUBSTANCES) {
        if (norm(substance.dcb) === target) return ANVISA_TO_PRESCRIPTION[substance.list];
        if (substance.aliases?.some(a => norm(a) === target)) return ANVISA_TO_PRESCRIPTION[substance.list];
        // also accept inputs that include the DCB as substring (e.g. "Cloridrato de Tramadol")
        if (target.includes(norm(substance.dcb))) return ANVISA_TO_PRESCRIPTION[substance.list];
    }

    // 2. Check antirretrovirais (C4)
    if (ANTIRETROVIRALS.some(a => norm(a) === target || target.includes(norm(a)))) {
        return 'C1';
    }

    // 3. Check antimicrobianos (RDC 20/2011) — receita branca 2 vias
    if (CONTROLLED_ANTIMICROBIALS.some(a => norm(a) === target || target.includes(norm(a)))) {
        return 'especial';
    }

    return 'padrao';
}

/**
 * Returns the Anvisa list label (e.g. "C1", "B1") for a medication name,
 * or null when the substance is not controlled.
 */
export function getAnvisaList(medicationName: string): AnvisaList | null {
    const target = norm(medicationName);
    for (const substance of CONTROLLED_SUBSTANCES) {
        if (norm(substance.dcb) === target) return substance.list;
        if (substance.aliases?.some(a => norm(a) === target)) return substance.list;
        if (target.includes(norm(substance.dcb))) return substance.list;
    }
    if (ANTIRETROVIRALS.some(a => norm(a) === target || target.includes(norm(a)))) return 'C4';
    return null;
}
