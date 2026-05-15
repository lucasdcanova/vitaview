import {
  getAnamnesisTemplate,
  isAnamnesisTemplateId,
  type AnamnesisTemplateConfig,
} from "@shared/anamnesis-templates";
import type { AnamnesisTemplateRow } from "@shared/schema";
import { storage } from "../storage";
import logger from "../logger";

const CUSTOM_PREFIX = "custom-";

const FALLBACK_SPECIALTY_INSTRUCTIONS = `REPRODUZA A ESTRUTURA ACIMA EXATAMENTE COMO ESTÁ, mantendo os marcadores, a ordem das linhas e a separação em parágrafos. Preencha as lacunas com os dados ditados pelo profissional. NÃO use markdown (sem negrito, sem cabeçalhos com #, sem listas com hífen ou asteriscos além das já presentes no modelo). Quando um campo não for citado, mantenha o rótulo com a lacuna em branco — não escreva "não informado" nem variações.`;

function configFromRow(row: AnamnesisTemplateRow): AnamnesisTemplateConfig {
  const base = row.baseTemplateId ? getAnamnesisTemplate(row.baseTemplateId) : null;
  const isFreeForm = row.freeForm || (base?.freeForm ?? false);

  return {
    id: (row.baseTemplateId ?? `${CUSTOM_PREFIX}${row.id}`) as AnamnesisTemplateConfig["id"],
    label: row.label,
    shortLabel: row.label,
    description: row.label,
    systemRoleDescription:
      base?.systemRoleDescription ??
      "Você é um(a) profissional de saúde experiente em documentação clínica.",
    structure: row.structure,
    specialtyInstructions: base?.specialtyInstructions ?? FALLBACK_SPECIALTY_INSTRUCTIONS,
    placeholderExample: base?.placeholderExample ?? "",
    freeForm: isFreeForm,
  };
}

export async function resolveAnamnesisTemplate(
  rawId: unknown,
  userId?: number,
): Promise<AnamnesisTemplateConfig> {
  // Custom template referenciado por "custom-<id>"
  if (typeof rawId === "string" && rawId.startsWith(CUSTOM_PREFIX) && userId) {
    const numericId = Number.parseInt(rawId.slice(CUSTOM_PREFIX.length), 10);
    if (Number.isFinite(numericId)) {
      try {
        const row = await storage.getAnamnesisTemplateById(numericId, userId);
        if (row) return configFromRow(row);
      } catch (error) {
        logger.warn("[AnamnesisTemplate] Falha ao buscar custom template", { userId, numericId, error });
      }
    }
  }

  // Built-in com possível override do usuário
  if (typeof rawId === "string" && isAnamnesisTemplateId(rawId) && userId) {
    try {
      const override = await storage.getAnamnesisTemplateOverride(userId, rawId);
      if (override) return configFromRow(override);
    } catch (error) {
      logger.warn("[AnamnesisTemplate] Falha ao buscar override", { userId, rawId, error });
    }
  }

  return getAnamnesisTemplate(rawId);
}
