export type AnamnesisTemplateId =
  | "em-branco"
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
  freeForm?: boolean;
}

const ANAMNESIS_TEMPLATES_RECORD: Record<AnamnesisTemplateId, AnamnesisTemplateConfig> = {
  "em-branco": {
    id: "em-branco",
    label: "Em branco",
    shortLabel: "Em branco",
    description: "Sem padrão — texto da consulta sem qualquer estrutura.",
    systemRoleDescription:
      "Você é um(a) profissional de saúde experiente em documentação clínica.",
    structure: "",
    specialtyInstructions: "",
    placeholderExample: "",
    freeForm: true,
  },

  "clinica-geral": {
    id: "clinica-geral",
    label: "Clínica geral",
    shortLabel: "Clínica geral",
    description: "Modelo SOAP com cabeçalho de antecedentes e exame físico segmentar.",
    systemRoleDescription:
      "Você é um médico clínico geral com vasta experiência em documentação clínica.",
    structure: `# Comorbidades
# Nega tabagismo, etilismo e UDI
# Nega alergia medicamentosa / Alergias:
# Nega MUC / Em uso de:

Subjetivo

Objetivo
BEG, LOC, MUCAA
Ectoscopia:
Oroscopia:
Otoscopia:
Ap resp:
Ap card:
Abdome:
MMII:

Impressão

Conduta`,
    specialtyInstructions: `REPRODUZA A ESTRUTURA ACIMA EXATAMENTE COMO ESTÁ, mesmo que não haja dados em alguma seção — não omita linhas, não troque rótulos, não use markdown extra (sem negrito, sem cabeçalhos com #s do markdown).

Os "#" no início das primeiras linhas são marcadores fixos da anamnese — preserve-os.

Regras de preenchimento de cada item:
- "# Comorbidades": liste cada comorbidade citada após o rótulo (ex.: "# Comorbidades: HAS, DM2"). Se nenhuma foi citada, mantenha "# Comorbidades" sem complemento.
- "# Nega tabagismo, etilismo e UDI": se o paciente NEGAR todos, mantenha a linha como está. Se relatar algum, reescreva a linha com o dado positivo (ex.: "# Tabagista 10 anos-maço, etilismo social, nega UDI").
- "# Nega alergia medicamentosa / Alergias:": se NEGAR, deixe "# Nega alergia medicamentosa". Se houver alergia, escreva "# Alergias: <lista>".
- "# Nega MUC / Em uso de:": MUC = medicação de uso contínuo. Se NEGAR, deixe "# Nega MUC". Se em uso, escreva "# Em uso de: <medicações com dose e posologia>".

Seções SOAP:
- "Subjetivo": queixa principal e HDA do paciente em texto corrido (1–3 parágrafos curtos).
- "Objetivo": comece com "BEG, LOC, MUCAA" (mantenha a linha mesmo se não dito explicitamente) e preencha cada aparelho/segmento abaixo. Se um aparelho não foi examinado/comentado, mantenha o rótulo com "sem alterações" apenas se o profissional indicar normalidade; caso contrário, deixe o rótulo sem complemento.
- "Impressão": hipóteses diagnósticas em lista curta ou frase única, com CID-10 entre parênteses quando aplicável.
- "Conduta": numere as ações terapêuticas, prescrições, exames solicitados e retorno.

Não use bullets com hífen (-) nem asteriscos (*). Use apenas o formato literal acima.`,
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
    specialtyInstructions: `Omita seções sem dados — não inclua rótulos vazios nem comentários sobre ausência de informação.

Use nomenclatura dental por número (notação FDI 11-48 ou Universal 1-32) sempre que o dente for citado.
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
    description: "Consulta pediátrica preventiva com antecedentes, exame físico segmentar e orientações por idade.",
    systemRoleDescription:
      "Você é um(a) pediatra experiente em acompanhamento de puericultura e documentação clínica pediátrica.",
    structure: `Idade: dias
Nascimento em / / , parto cesárea/normal, sem intercorrências.
IG: S | Peso nascimento: g | Estatura: cm | PC: cm | Peso alta: g em / /
Triagem auditiva/olhinho/coração: normais/alterado
Teste do pezinho: normal/alterado
Vacinas BCG e hepatite B realizadas/não realizadas
Alimentação:
Aleitamento materno exclusivo, em livre demanda. Sem dificuldades. Pega adequada. Aleitamento misto mL de / horas, devido a

Sono:
Diurese/evacuações:
Suplementação:
Objetivo:
Peso:    g | Altura:   cm | PC:   cm | Ganho ponderal por dia:
Anictérico, afebril, acianótico.
Pele corada, elástica, íntegra
FAN normotensa | Cabeça simétrica, sem alterações
Ap Cardiovascular: ritmo regular, 2 tempos, bulhas normofonéticas, sem sopros
Ap Respiratório: MVRD, sem ruídos adventicios e sem esforço respiratório
Abdome: normotenso, ruídos hidroaéreos presentes, não palpo visceromegalias, sem fácies de dor à palpação, cicatriz umbilical sem infecção
Genitália masculina/feminina típica, compatível com idade, testículos em bolsa
Reflexos presentes: sucção (até 4-6m), preensão palmar (até 4m), preensão plantar (até 15m), Moro (até 3-6m) e marcha (até 2m)
Manobra de Barlow Ortolani negativa
Realiza os marcos de desenvolvimento neuropsicomotor para idade
Teste da cobertura e de Hirschberg (estrabismo) negativos/positivos   (aos 4m)

Avaliação:
Crescimento e desenvolvimento adequado/inadequado
Aleitamento materno sem/com dificuldades (até 12m)
Vacinas em dia/em atraso

Plano:
Oriento manter coto/cicatriz umbilical limpa e seca. (até 30d)
Oriento introdução alimentar / alimentação saudável e escovação dentária (a partir 6m)
Oriento próximas vacinas.
Incentivo/forneço informativos sobre cuidados com o bebê, aleitamento materno, estímulos ao desenvolvimento neuro psicomotor e prevenção de acidentes.
Prescrevo/mantenho vitamina D 400 UI até os 12 meses.
Prescrevo/Ajusto/Mantenho sulfato ferroso, x gotas por dia e prescrevo/mantenho vitamina D 400 UI até os 12 meses / ajusto/mantenho vitamina D para 600 UI até os 24 meses.
Converso sobre/prescrevo métodos contraceptivos maternos
Oriento próxima consulta aos 30 dias / 2 / 4 / 6 / 9 / 12 / 18 meses de vida.`,
    specialtyInstructions: `REPRODUZA A ESTRUTURA ACIMA EXATAMENTE COMO ESTÁ, mantendo a ordem, os rótulos e a quebra das linhas. NÃO use markdown (sem negrito, sem cabeçalhos com #, sem listas com hífen ou asteriscos).

Preencha cada lacuna com os dados ditados pelo profissional. Quando um campo não foi citado, mantenha o rótulo com a lacuna em branco — não escreva "não informado", "sem dados" ou variações.

Regras para os marcadores com barra (/), que indicam opções mutuamente excludentes:
- "parto cesárea/normal": escolha apenas a opção correta e remova a outra (ex.: "parto cesárea, sem intercorrências").
- "Triagem auditiva/olhinho/coração: normais/alterado": liste o resultado de cada triagem realizada; se todas normais, deixe "normais"; se alguma alterada, especifique qual ("olhinho alterado, demais normais").
- "Teste do pezinho: normal/alterado": deixe apenas a opção citada.
- "Vacinas BCG e hepatite B realizadas/não realizadas": mantenha somente a opção verdadeira.
- "Aleitamento materno exclusivo... / Aleitamento misto mL de / horas, devido a": preserve a linha do tipo de aleitamento informado e remova a outra. Se misto, preencha o volume, o intervalo em horas e o motivo. Se complementar/fórmula exclusiva, escreva como tal.
- "Genitália masculina/feminina típica, compatível com idade, testículos em bolsa": deixe apenas a forma compatível com o sexo. Em feminino, remova "testículos em bolsa".
- "negativos/positivos", "adequado/inadequado", "sem/com dificuldades", "em dia/em atraso", "Prescrevo/Ajusto/Mantenho", "Incentivo/forneço", "coto/cicatriz", "introdução alimentar / alimentação saudável", etc.: mantenha somente a opção correta para o caso.

Idade (primeira linha):
- Para lactentes < 30 dias, escreva em dias (ex.: "Idade: 15 dias").
- Entre 1 mês e 24 meses, escreva em meses e dias quando ditos (ex.: "Idade: 4 meses e 12 dias").
- Acima de 24 meses, escreva em anos e meses (ex.: "Idade: 3 anos e 2 meses").

Linhas condicionais por idade (marcadas entre parênteses no modelo, ex.: "(até 30d)", "(a partir 6m)", "(aos 4m)", "(até 12m)"):
- Mantenha a linha apenas se a idade da criança estiver dentro da janela indicada.
- Remova o marcador entre parênteses quando a linha for mantida (ex.: a linha sai como "Oriento manter coto/cicatriz umbilical limpa e seca." sem "(até 30d)").
- Se a idade for posterior à janela, remova a linha inteira.

Reflexos primitivos: mantenha na lista apenas os reflexos esperados para a idade conforme as janelas indicadas (sucção até 4-6m, preensão palmar até 4m, preensão plantar até 15m, Moro até 3-6m, marcha até 2m). Remova os parênteses ao manter o reflexo.

Suplementação e prescrição: utilize a opção apropriada (Prescrevo/Ajusto/Mantenho) conforme o profissional. Para sulfato ferroso, preencha o número de gotas. Vitamina D segue dose por idade (400 UI até 12m; 600 UI até 24m).

Exame físico: quando peso, altura, PC ou ganho ponderal forem citados, registre o valor exato. Se algum não for citado, mantenha o rótulo com a unidade ("Peso:    g") em branco.

Vacinas: use a nomenclatura do calendário do PNI (BCG, hepatite B, pentavalente, VIP, VOP, pneumo 10, meningo C, rotavírus, tríplice viral, varicela, hepatite A, DTP, HPV).`,
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
    specialtyInstructions: `Omita seções sem dados — não inclua rótulos vazios nem comentários sobre ausência de informação.

Sempre que IG (idade gestacional) for mencionada, registre em semanas e dias (ex.: "24s 3d").
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

export const DEFAULT_ANAMNESIS_TEMPLATE_ID: AnamnesisTemplateId = "em-branco";

export function isAnamnesisTemplateId(value: unknown): value is AnamnesisTemplateId {
  return typeof value === "string" && value in ANAMNESIS_TEMPLATES_RECORD;
}

export function normalizeAnamnesisTemplateId(value: unknown): AnamnesisTemplateId {
  return isAnamnesisTemplateId(value) ? value : DEFAULT_ANAMNESIS_TEMPLATE_ID;
}

export function getAnamnesisTemplate(value: unknown): AnamnesisTemplateConfig {
  return ANAMNESIS_TEMPLATES_RECORD[normalizeAnamnesisTemplateId(value)];
}
