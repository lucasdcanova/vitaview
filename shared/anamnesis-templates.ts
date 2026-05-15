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
    description: "Evolução odontológica com antecedentes, exame intra/extraoral, oclusão e procedimento.",
    systemRoleDescription:
      "Você é um(a) cirurgião(ã)-dentista experiente em documentação clínica odontológica.",
    structure: `# Comorbidades
# Nega tabagismo e etilismo
# Nega alergias (anestésicos, AINEs, ATB, látex) / Alergias:
# Nega MUC / Em uso de:
# Tratamentos odontológicos prévios:
# Higiene oral: escovação x/dia, fio dental sim/não, enxaguante sim/não
# Hábitos: nega bruxismo e apertamento / Bruxismo noturno/diurno, onicofagia
# Última visita ao dentista:

Subjetivo
Queixa principal:
HDA: dor espontânea/provocada, intensidade x/10, duração, fator desencadeante (frio/calor/doce/mastigação), melhora com analgésico sim/não, irradiação

Objetivo
Extraoral
Face simétrica, sem alterações
ATM sem estalido, sem dor à palpação, abertura bucal preservada
Linfonodos cervicais não palpáveis
Musculatura mastigatória sem dor à palpação

Intraoral
Mucosa jugal, labial e palatina sem alterações
Língua e soalho bucal sem alterações
Orofaringe sem alterações
Glândulas salivares com fluxo preservado

Achados dentais
Dente XX:

Periodontal
Higiene: boa/regular/ruim | Biofilme: ausente/presente | Cálculo: ausente/presente | Sangramento à sondagem: ausente/presente | Recessões:

Oclusão
Classe de Angle: I/II/III | Mordida: normal/cruzada/aberta/profunda | Interferências:

Exames complementares
Radiografias (periapical/bitewing/panorâmica/CBCT):

Impressão
Hipótese diagnóstica:

Conduta
Procedimento realizado:
Anestesia: lidocaína 2% c/ epinefrina 1:100.000 — x tubete(s)
Material utilizado:
Prescrições:
Orientações: higiene oral, controle de biofilme, dieta, evitar mastigação no lado afetado por x horas
Plano de tratamento (etapas):
Retorno:`,
    specialtyInstructions: `REPRODUZA A ESTRUTURA ACIMA EXATAMENTE COMO ESTÁ, mantendo a ordem das linhas, os marcadores "#" e a separação em parágrafos. NÃO use markdown (sem negrito, sem cabeçalhos com # do markdown, sem listas com hífen ou asteriscos).

Os "#" no início das linhas do cabeçalho são marcadores fixos da evolução — preserve-os.

Regras de preenchimento de cada item:
- "# Comorbidades": liste as comorbidades sistêmicas citadas após o rótulo (ex.: "# Comorbidades: HAS, DM2 em uso de metformina"). Atenção especial a condições que alteram o manejo odontológico: diabetes, hipertensão, distúrbios de coagulação, gestação, uso de bifosfonatos/anticoagulantes, imunossupressão. Se nenhuma, deixe "# Sem comorbidades relevantes".
- "# Nega tabagismo e etilismo": se NEGAR ambos, mantenha a linha. Se relatar algum, reescreva com o dado positivo (ex.: "# Tabagista 10 anos-maço, etilismo social").
- "# Nega alergias (anestésicos, AINEs, ATB, látex) / Alergias:": se NEGAR, mantenha "# Nega alergias (anestésicos, AINEs, ATB, látex)". Se houver alergia, escreva "# Alergias: <substância> — <reação>" (ex.: "# Alergias: penicilina — rash cutâneo").
- "# Nega MUC / Em uso de:": MUC = medicação de uso contínuo. Se NEGAR, deixe "# Nega MUC". Se em uso, escreva "# Em uso de: <medicações com dose e posologia>", destacando anticoagulantes, bifosfonatos e imunossupressores.
- "# Tratamentos odontológicos prévios:": liste tratamentos relevantes (restaurações, endodontia, exodontia, ortodontia, implante, próteses). Se nenhum citado, deixe o rótulo em branco.
- "# Higiene oral": substitua os marcadores pelos dados ditados (ex.: "# Higiene oral: escovação 3x/dia, fio dental sim, enxaguante não").
- "# Hábitos: nega bruxismo e apertamento / Bruxismo noturno/diurno, onicofagia": mantenha a negativa default se o paciente negar. Se houver hábitos parafuncionais, reescreva com a descrição (ex.: "# Hábitos: bruxismo noturno, uso de placa miorrelaxante").
- "# Última visita ao dentista:": registre a data ou o tempo relatado.

Subjetivo:
- "Queixa principal": frase curta com a queixa em palavras do paciente.
- "HDA": substitua os marcadores "x/10", "espontânea/provocada", "frio/calor/doce/mastigação", "sim/não" pelos dados específicos do caso. Remova marcadores não aplicáveis. Se a consulta é de rotina/preventiva, registre "Consulta de rotina, sem queixas".

Objetivo (Extraoral, Intraoral, Achados dentais, Periodontal, Oclusão, Exames complementares):
- Mantenha as frases default das seções Extraoral e Intraoral quando o profissional confirmar normalidade ou não comentar alterações. Se houver alteração, substitua a frase específica.
- Em "Achados dentais", liste cada dente envolvido com NUMERAÇÃO DENTAL (notação FDI 11-48 ou Universal 1-32) e o achado: cárie (oclusal, mesial, distal, vestibular, lingual), restauração (resina, amálgama, ionômero), endodontia prévia, ausência, mobilidade, fratura, lesão periapical. Pode haver várias linhas "Dente XX: ..." conforme necessário.
- Em "Periodontal", substitua cada "a/b/c" pela opção apropriada. Se mediu profundidade de sondagem (PS), nível de inserção clínica (NIC) ou índice de sangramento, acrescente os valores.
- Em "Oclusão", escolha a Classe de Angle, o tipo de mordida e descreva interferências quando houver.
- Em "Exames complementares", registre os exames de imagem realizados ou solicitados e principais achados.

Impressão:
- Use diagnósticos odontológicos precisos: cárie dentinária, pulpite reversível/irreversível, necrose pulpar, periodontite apical aguda/crônica, abscesso periapical, gengivite, periodontite (estágio I-IV e grau A-C quando possível), DTM, bruxismo, recessão gengival, perda dentária parcial, etc. Sempre associe ao(s) dente(s) acometido(s).

Conduta:
- "Procedimento realizado": descreva o procedimento clínico em uma frase (ex.: "Restauração em resina composta classe I no 26 com isolamento absoluto"; "Tartarectomia supragengival com ultrassom em todos os quadrantes"; "Pulpectomia de urgência no 36").
- "Anestesia": preencha tipo, concentração, vasoconstritor e número de tubetes. Remova a linha se nenhum procedimento anestésico foi feito.
- "Material utilizado": liste materiais relevantes (resina A2/A3, ionômero, amálgama, hidróxido de cálcio, cimento provisório). Remova a linha se não aplicável.
- "Prescrições": medicações com dose, intervalo e duração. Use prescrições odontológicas habituais (amoxicilina 500mg 8/8h por 7d; clindamicina 300mg 8/8h por 7d; ibuprofeno 600mg 8/8h por 3d; dipirona 1g se dor; paracetamol 750mg 6/6h se dor; clorexidina 0,12% bochecho 2x/dia por 7d).
- "Orientações": ajuste conforme o procedimento (evitar mastigação no lado tratado, dieta líquida/pastosa fria, compressa fria, não cuspir, escovação suave).
- "Plano de tratamento (etapas)": numere as etapas terapêuticas em ordem de prioridade quando o profissional ditar (1. controle de placa e raspagem; 2. tratamento das cáries; 3. reabilitação protética; etc.).
- "Retorno": data, intervalo (ex.: "Retorno em 7 dias para remoção de sutura") ou condição.`,
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
    description: "Pré-natal com cabeçalho de antecedentes/risco, exame obstétrico e conduta.",
    systemRoleDescription:
      "Você é um(a) obstetra experiente em acompanhamento pré-natal e documentação clínica obstétrica.",
    structure: `# G0P0A0
# IG xxs+xxd (US xx/xx/xx com xxs+xxd)
# TS
- Coombs indireto mais recente se Rh negativo
# Sorologias: xx/xx/xx todas NR, toxo imune.
# Patologias atuais ou prévias
# Nega alergia
# Nega tabagismo e etilismo
# Nega cirurgias prévias
# Vacinação: Hep B xx doses, dTpa (20s), Influenza e COVID-19
# Em uso de: ácido fólico (até 12s), SF 3cp/d e cálcio 2cp/d

# IMC pré-gestacional
# Ingesta cálcio (meta 1g Ca/dia)
# Dentista: em acompanhamento / aguarda
# Risco TPPT (colo uterino com US de 18 a 22s)
# Risco PE (cálculo de 11 a 13+6 ou FR)
# Risco AF: afrodescendência ou anemia não investigada no 1o trimestre
# Risco tireoidopatia: FR
# CP: última coleta
# Via parto:

Subjetivo
Paciente vem para consulta pré-natal com IG xx+xs. Nega secreção vaginal patológica, perda liquida e/ou sangramento vaginal. Nega disúria e demais queixas urinárias. Nega sinais premonitórios de eclampsia como cefaleia intensa, turvação visual, epigastralgia e/ou edema. Refere movimentação fetal habitual. Sem demais queixas.

Objetivo
PA xx/xx mmHg
Peso xx,x Kg | Alt xx cm | IMC
AU: xx cm | BCF xx | MF +

Exames complementares
US
LAC

Impressão
Gestação xº TRIM

Conduta
Orientações gerais
Manter cálcio + SF até 3 meses após o parto
Oriento sobre sinais de alerta (sangramento vaginal, dor abdominal intensa, corrimento esverdeado/amarelado, perda de líquido vaginal, diminuição da movimentação fetal, sinais de trabalho de parto e sintomas de pré-eclâmpsia) e a buscar atendimento se necessário.
Oriento alimentação saudável, o não consumo de bebidas alcoólicas, precaução no uso de medicamentos e medidas de prevenção de toxoplasmose
Oriento sinais de trabalho de parto;
Oriento sobre a consulta de puerpério e a consulta precoce do RN`,
    specialtyInstructions: `REPRODUZA A ESTRUTURA ACIMA EXATAMENTE COMO ESTÁ, mantendo a ordem das linhas, os marcadores "#" e "-", a separação em parágrafos e as linhas em branco entre seções. NÃO use markdown (sem negrito, sem cabeçalhos com # do markdown, sem listas com hífen ou asteriscos além das já presentes no modelo).

Os "#" no início das linhas são marcadores fixos da anamnese — preserve-os. O "-" da linha "Coombs indireto" também é parte do modelo.

Preencha as lacunas com "xx", "/", "+" e similares com os dados ditados pelo profissional. Quando um campo não foi citado, mantenha a lacuna em branco com o rótulo — não escreva "não informado" nem variações.

Regras de cabeçalho (linhas com "#"):
- "# G0P0A0": preencha a paridade ditada no formato G_P_A_ (gestações, partos, abortos). Se houver detalhamento (cesárea, vaginal, ectópica), acrescente após (ex.: "# G3P1A1 (1 PN, 1 abortamento espontâneo 1o trim)").
- "# IG xxs+xxd (US xx/xx/xx com xxs+xxd)": informe a IG atual em semanas+dias e, entre parênteses, a USG de referência (data e IG do exame). Se não houver USG de referência, mantenha apenas "# IG xxs+xxd" sem o parêntese.
- "# TS" + "- Coombs indireto mais recente se Rh negativo": preencha "# TS: <tipagem>". Mantenha a linha do Coombs apenas se o tipo for Rh negativo; remova-a se Rh positivo.
- "# Sorologias: xx/xx/xx todas NR, toxo imune.": preencha a data da coleta e o status (NR = não reagentes; toxo imune/suscetível/aguda).
- "# Patologias atuais ou prévias": liste as patologias citadas após o rótulo. Se não houver, deixe "# Sem patologias prévias relevantes".
- "# Nega alergia", "# Nega tabagismo e etilismo", "# Nega cirurgias prévias": mantenha a negativa default se o paciente negar; se positivo, reescreva a linha com o dado (ex.: "# Alergia: dipirona — rash cutâneo"; "# Tabagista 5 maços-ano, nega etilismo"; "# Cirurgias prévias: cesárea em 2021").
- "# Vacinação: Hep B xx doses, dTpa (20s), Influenza e COVID-19": preencha o número de doses recebidas e marque as vacinas já feitas. Vacinas pendentes podem ser registradas como "pendente" entre parênteses.
- "# Em uso de: ácido fólico (até 12s), SF 3cp/d e cálcio 2cp/d": ajuste a lista conforme as medicações em uso. Ácido fólico só permanece se IG ≤ 12 semanas; remova após. Inclua outras medicações se citadas.

Bloco de risco (segundo grupo de "#"):
- "# IMC pré-gestacional": preencha o valor numérico e a classificação (baixo peso, eutrófica, sobrepeso, obesidade).
- "# Ingesta cálcio (meta 1g Ca/dia)": registre a ingesta estimada e se atinge a meta (ex.: "# Ingesta cálcio ~700 mg/d — abaixo da meta, orientado complemento").
- "# Dentista: em acompanhamento / aguarda": escolha uma das opções e remova a outra.
- "# Risco TPPT (colo uterino com US de 18 a 22s)": registre o resultado da medida de colo no US morfológico ou se está pendente.
- "# Risco PE (cálculo de 11 a 13+6 ou FR)": registre o cálculo de risco do 1º trimestre quando disponível ou liste fatores de risco (FR).
- "# Risco AF": registre se há afrodescendência ou anemia não investigada no 1º trimestre.
- "# Risco tireoidopatia: FR": registre fatores de risco para tireoidopatia ou TSH/T4L se solicitados.
- "# CP: última coleta": data e resultado do colpocitológico mais recente.
- "# Via parto:": preferência/indicação para via de parto (vaginal, cesárea com indicação, indefinida).

Subjetivo: mantenha a frase default como base e ajuste apenas o necessário — substitua "xx+xs" pela IG atual e modifique as negativas para refletir queixas reais. Se o paciente referir alguma queixa, troque "Nega ..." pela descrição da queixa.

Objetivo: preencha PA em mmHg, peso em kg, altura em cm, IMC calculado, AU em cm, BCF em bpm e MF (+ presente / − ausente). Mantenha os rótulos mesmo se algum dado não foi citado.

Exames complementares: liste USG e exames laboratoriais (LAC = laboratorial) ditados. Se nada foi citado, mantenha "US" e "LAC" como rótulos em branco.

Impressão: indique o trimestre ("Gestação 1º/2º/3º TRIM"), classificação de risco (habitual ou alto risco com justificativa) e gestação tópica única/múltipla quando aplicável.

Conduta: mantenha as orientações default que se aplicarem; adicione/remova conforme o ditado. "Manter cálcio + SF até 3 meses após o parto" pode ser ajustado se a conduta for diferente.

Sempre que IG for mencionada, registre em semanas+dias (ex.: "24s+3d" ou "24+3s").`,
    placeholderExample:
      "Ex.: Gestante G2P1A0, IG 24s+3d pela DUM, em pré-natal de risco habitual, refere movimentação fetal presente...",
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
