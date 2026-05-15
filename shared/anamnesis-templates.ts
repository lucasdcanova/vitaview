export type AnamnesisTemplateId =
  | "clinica-geral"
  | "odontologia"
  | "puericultura"
  | "pre-natal";

export interface AnamnesisTemplateOption {
  id: AnamnesisTemplateId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface AnamnesisTemplateConfig extends AnamnesisTemplateOption {
  systemRoleDescription: string;
  structure: string;
  specialtyInstructions: string;
  placeholderExample: string;
}

const ANAMNESIS_TEMPLATES_RECORD: Record<AnamnesisTemplateId, AnamnesisTemplateConfig> = {
  "clinica-geral": {
    id: "clinica-geral",
    label: "Clínica geral",
    shortLabel: "Clínica geral",
    description: "Modelo SOAP padrão para consultas clínicas gerais.",
    systemRoleDescription:
      "Você é um médico clínico geral com vasta experiência em documentação clínica.",
    structure: `- **Identificação**: Dados básicos do paciente (APENAS se mencionados)
- **Queixa Principal (QP)**: Motivo da consulta em palavras do paciente
- **História da Doença Atual (HDA)**: Evolução cronológica dos sintomas
- **Interrogatório Sintomatológico**: APENAS sintomas positivos
- **História Patológica Pregressa (HPP)**: APENAS se relatada
- **História Familiar (HF)**: APENAS se relatada
- **História Social (HS)**: OMITIR se não houver dados
- **Medicamentos em Uso**: APENAS medicamentos citados
- **Alergias**: APENAS se houver relato
- **Exame Físico**: APENAS achados mencionados
- **Impressão Diagnóstica**: Hipóteses diagnósticas
- **Conduta**: Plano terapêutico e orientações`,
    specialtyInstructions:
      "Use terminologia clínica geral. Diferencie hipótese diagnóstica de diagnóstico estabelecido no campo notes.",
    placeholderExample:
      "Ex.: Paciente em acompanhamento por hipertensão controlada com losartana 50mg...",
  },

  odontologia: {
    id: "odontologia",
    label: "Odontologia",
    shortLabel: "Odontologia",
    description: "Anamnese odontológica com exame intraoral, oclusão e plano de tratamento.",
    systemRoleDescription:
      "Você é um cirurgião-dentista experiente em documentação odontológica clínica.",
    structure: `- **Identificação**: Dados básicos do paciente (APENAS se mencionados)
- **Queixa Principal Odontológica**: Motivo da consulta em palavras do paciente
- **História da Doença Atual (HDA)**: Início, duração, característica e intensidade da dor; fatores de melhora/piora
- **História Médica Pregressa**: Comorbidades sistêmicas relevantes (diabetes, hipertensão, distúrbios de coagulação, gestação)
- **História Odontológica Pregressa**: Tratamentos anteriores, traumatismos, cirurgias odontológicas, ortodontia
- **Higiene Bucal e Hábitos**: Frequência de escovação, uso de fio dental, enxaguante, bruxismo/apertamento, onicofagia
- **Hábitos Sociais**: Tabagismo, etilismo, consumo cariogênico
- **Medicamentos em Uso**: APENAS medicamentos citados
- **Alergias**: Especialmente anestésicos, látex, AINEs e antibióticos
- **Exame Extraoral**: Inspeção de face, ATM (estalido, dor, limitação), linfonodos, musculatura mastigatória
- **Exame Intraoral**: Mucosa, língua, soalho bucal, palato, orofaringe, glândulas salivares
- **Achados Dentais / Odontograma**: Dentes acometidos pelo número (FDI ou Universal), lesões de cárie, restaurações, ausências, mobilidade
- **Avaliação Periodontal**: Higiene, sangramento à sondagem, presença de cálculo, bolsas, recessões
- **Oclusão**: Classificação de Angle, mordida (cruzada, aberta, profunda), interferências
- **Exames Complementares**: Radiografias periapicais, bitewing, panorâmica, tomografias mencionadas
- **Diagnóstico Odontológico**: Hipóteses diagnósticas dos achados (ex.: cárie dentinária no 26, pulpite irreversível, periodontite estágio II)
- **Plano de Tratamento**: Etapas terapêuticas em ordem de prioridade
- **Conduta Imediata**: Prescrições, orientações, próximos passos e retorno`,
    specialtyInstructions: `Use nomenclatura dental por número (notação FDI 11-48 ou Universal 1-32) sempre que o dente for citado.
Em diagnósticos odontológicos, prefira termos como: cárie dentinária, pulpite reversível/irreversível, necrose pulpar, periapical aguda/crônica, gengivite, periodontite (estágio e grau quando possível), DTM (disfunção temporomandibular), bruxismo.
Em medicações de prescrição odontológica habitual (amoxicilina, clindamicina, ibuprofeno, dipirona, paracetamol, clorexidina 0,12%), registre dose e duração quando mencionadas.
Quando o profissional descrever um procedimento realizado em consulta, descreva-o em "Conduta Imediata" com técnica e materiais quando ditos.`,
    placeholderExample:
      "Ex.: Paciente refere dor espontânea no dente 36 há 3 dias, piora ao frio, sem melhora com analgésico...",
  },

  puericultura: {
    id: "puericultura",
    label: "Puericultura",
    shortLabel: "Puericultura",
    description: "Consulta pediátrica preventiva com crescimento, desenvolvimento, vacinação e alimentação.",
    systemRoleDescription:
      "Você é um(a) pediatra experiente em acompanhamento de puericultura e documentação clínica pediátrica.",
    structure: `- **Identificação**: Nome, idade exata em anos/meses/dias quando aplicável, sexo
- **Motivo da Consulta**: Consulta de rotina de puericultura ou queixa específica
- **História da Doença Atual (HDA)**: APENAS se houver queixa aguda
- **Antecedentes Gestacionais**: Pré-natal (nº de consultas, intercorrências), uso de medicações, infecções, sorologias maternas
- **Antecedentes do Parto**: Tipo de parto, idade gestacional, peso e comprimento ao nascer, Apgar
- **Antecedentes Neonatais**: Internação em UTIN/UCIN, icterícia, triagens neonatais (pezinho, orelhinha, olhinho, coraçãozinho, linguinha)
- **Aleitamento e Alimentação**: Aleitamento materno exclusivo até quando, fórmula, introdução alimentar, alimentação atual
- **Eliminações**: Diurese e padrão de evacuações
- **Sono**: Padrão, número de despertares, local
- **Desenvolvimento Neuropsicomotor (DNPM)**: Marcos atingidos para a idade (sustento cefálico, sentar, engatinhar, andar, primeiras palavras, frases)
- **Vacinação**: Esquema vacinal em dia conforme PNI ou pendências; vacinas privadas relevantes
- **Antecedentes Patológicos**: Internações, cirurgias, alergias, doenças prévias
- **História Familiar**: Doenças relevantes em pais e irmãos
- **Antecedentes Sociais**: Composição familiar, creche, cuidador principal, exposição a tabagismo passivo
- **Exame Físico**: Peso, estatura, perímetro cefálico, IMC quando aplicável, percentis/escore-Z; estado geral, hidratação, corado, ativo, reativo; segmentar (cabeça e pescoço, ACV, AR, abdome, genitália, extremidades, pele, neurológico)
- **Avaliação de Crescimento e Desenvolvimento**: Adequação para a idade conforme curvas da OMS; classificação de DNPM (adequado/com atraso)
- **Impressão**: Lactente/criança hígido(a) ou em acompanhamento de condição específica
- **Conduta**: Orientações de alimentação, sono, segurança, prevenção de acidentes; suplementação (vitamina D, ferro); vacinas a aplicar; retorno`,
    specialtyInstructions: `Sempre que a idade for mencionada, registre em anos e meses (ou em meses e dias para lactentes < 2 anos).
Em "Exame Físico", quando peso, altura, perímetro cefálico ou IMC forem citados, registre o valor exato e indique o percentil/escore-Z quando o profissional mencionar.
Para vacinação, use a nomenclatura do calendário do PNI (BCG, hepatite B, pentavalente, VIP, VOP, pneumo 10, meningo C, rotavírus, tríplice viral, varicela, hepatite A, DTP, HPV).
Em DNPM, organize por domínio (motor grosseiro, motor fino, linguagem, social) quando dados suficientes existirem.
Inclua orientações antecipatórias (anticipatory guidance) na Conduta quando o profissional ditar — ex.: introdução alimentar, prevenção de acidentes, exposição a telas.`,
    placeholderExample:
      "Ex.: Lactente de 6 meses em consulta de rotina, aleitamento materno exclusivo, ganho ponderal adequado...",
  },

  "pre-natal": {
    id: "pre-natal",
    label: "Pré-natal obstétrico",
    shortLabel: "Pré-natal",
    description: "Consulta obstétrica com idade gestacional, paridade, exames e conduta.",
    systemRoleDescription:
      "Você é um(a) obstetra experiente em acompanhamento pré-natal e documentação clínica obstétrica.",
    structure: `- **Identificação**: Nome, idade, profissão (se mencionada)
- **Motivo da Consulta**: Consulta pré-natal de rotina, intercorrência ou retorno de exames
- **História da Doença Atual (HDA)**: Sintomas atuais, movimentação fetal (a partir de ~20 semanas), perdas vaginais, contrações
- **Antecedentes Ginecológicos**: Menarca, ciclos, sexarca, métodos contraceptivos prévios, IST prévias, último colpocitológico
- **Antecedentes Obstétricos**: Paridade (G_P_A_), gestações anteriores com tipo de parto, idade gestacional, peso ao nascer, intercorrências
- **Gestação Atual**: DUM, idade gestacional (IG) atual, DPP (Naegele), gestação planejada/desejada, início do pré-natal, tipagem ABO/Rh, sorologias
- **Intercorrências da Gestação**: Sangramentos, hipertensão, diabetes gestacional, infecções, hospitalizações
- **Antecedentes Patológicos**: Comorbidades prévias (HAS, DM, tireoidopatias, trombofilias, cardiopatias)
- **Medicamentos em Uso e Suplementação**: Ácido fólico, sulfato ferroso, polivitamínico, demais prescrições
- **Alergias**: Especialmente medicamentos e látex
- **História Familiar**: HAS, DM, pré-eclâmpsia, doenças genéticas, gemelaridade
- **História Social**: Tabagismo, álcool, drogas ilícitas, situação conjugal e suporte familiar
- **Exame Físico**: PA, peso atual, ganho ponderal acumulado, IMC pré-gestacional; ausculta cardiopulmonar; edema de MMII; exame obstétrico (altura uterina, BCF, dinâmica uterina, apresentação fetal quando aplicável); toque vaginal se indicado
- **Exames Complementares**: Sorologias (HIV, VDRL, hepatite B/C, toxoplasmose, rubéola, CMV), hemograma, glicemia/TTOG, urocultura, USG obstétrica (IG, vitalidade, anatomia, crescimento)
- **Vacinação**: dTpa, hepatite B, influenza, COVID-19 quando indicado
- **Avaliação / Impressão**: Gestação tópica única (ou múltipla), idade gestacional, classificação de risco (habitual / alto risco) com justificativa
- **Conduta**: Prescrições, suplementação, solicitação de exames, orientações (sinais de alerta, atividade física, alimentação, atividade sexual), agendamento de retorno`,
    specialtyInstructions: `Sempre que IG (idade gestacional) for mencionada, registre em semanas e dias (ex.: "24s 3d").
Quando DUM for citada, calcule e mencione a DPP pela regra de Naegele apenas se o profissional não tiver dito a DPP; caso contrário, use a DPP ditada.
Paridade deve sempre seguir o formato G_P_A_ (gestações, partos, abortos); detalhe partos vaginais/cesárea quando informado.
Em "Exame Físico", registre AU (altura uterina) em cm e BCF em bpm quando ditos. Para PA, registre o valor exato citado.
Identifique fatores de risco obstétrico (idade > 35, HAS crônica, DM prévio, pré-eclâmpsia anterior, prematuridade prévia) e cite-os na "Avaliação / Impressão" quando presentes.
Em "Conduta", inclua orientações sobre sinais de alerta obstétrico (sangramento, perda de líquido, redução de movimentação fetal, cefaleia/escotomas, dor abdominal intensa) quando o profissional ditar.`,
    placeholderExample:
      "Ex.: Gestante G2P1A0, IG 24s 3d pela DUM, em pré-natal de risco habitual, refere movimentação fetal presente...",
  },
};

export const ANAMNESIS_TEMPLATE_IDS = Object.keys(
  ANAMNESIS_TEMPLATES_RECORD
) as AnamnesisTemplateId[];

export const ANAMNESIS_TEMPLATE_OPTIONS: AnamnesisTemplateOption[] = ANAMNESIS_TEMPLATE_IDS.map(
  (id) => {
    const tpl = ANAMNESIS_TEMPLATES_RECORD[id];
    return {
      id: tpl.id,
      label: tpl.label,
      shortLabel: tpl.shortLabel,
      description: tpl.description,
    };
  }
);

export const DEFAULT_ANAMNESIS_TEMPLATE_ID: AnamnesisTemplateId = "clinica-geral";

export function isAnamnesisTemplateId(value: unknown): value is AnamnesisTemplateId {
  return typeof value === "string" && value in ANAMNESIS_TEMPLATES_RECORD;
}

export function normalizeAnamnesisTemplateId(value: unknown): AnamnesisTemplateId {
  return isAnamnesisTemplateId(value) ? value : DEFAULT_ANAMNESIS_TEMPLATE_ID;
}

export function getAnamnesisTemplate(value: unknown): AnamnesisTemplateConfig {
  return ANAMNESIS_TEMPLATES_RECORD[normalizeAnamnesisTemplateId(value)];
}
