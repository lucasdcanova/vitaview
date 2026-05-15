import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ANAMNESIS_TEMPLATE_OPTIONS,
  DEFAULT_ANAMNESIS_TEMPLATE_ID,
  getAnamnesisTemplate,
  isAnamnesisTemplateId,
  type AnamnesisTemplateConfig,
  type AnamnesisTemplateId,
  type AnamnesisTemplateOption,
} from "@shared/anamnesis-templates";

const QUERY_KEY = ["/api/anamnesis-templates"] as const;

export interface AnamnesisTemplateRow {
  id: number;
  userId: number;
  baseTemplateId: string | null;
  label: string;
  structure: string;
  freeForm: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AnamnesisTemplateSource = "builtin" | "override" | "custom";

export interface ResolvedAnamnesisTemplate {
  /** ID que vai pro backend: 'em-branco' | 'clinica-geral' | ... | 'custom-<n>' */
  key: string;
  label: string;
  description: string;
  structure: string;
  freeForm: boolean;
  placeholderExample: string;
  source: AnamnesisTemplateSource;
  /** Para overrides/custom: o ID numérico no banco */
  rowId: number | null;
  /** Para overrides: o ID do template built-in que foi sobrescrito */
  baseTemplateId: AnamnesisTemplateId | null;
}

interface CreatePayload {
  label: string;
  structure: string;
  baseTemplateId?: AnamnesisTemplateId | null;
  freeForm?: boolean;
}

interface UpdatePayload {
  id: number;
  label?: string;
  structure?: string;
  freeForm?: boolean;
}

function builtinToResolved(option: AnamnesisTemplateOption): ResolvedAnamnesisTemplate {
  const tpl = getAnamnesisTemplate(option.id);
  return {
    key: option.id,
    label: option.label,
    description: option.description,
    structure: tpl.structure,
    freeForm: tpl.freeForm ?? false,
    placeholderExample: tpl.placeholderExample,
    source: "builtin",
    rowId: null,
    baseTemplateId: null,
  };
}

function overrideToResolved(row: AnamnesisTemplateRow, baseId: AnamnesisTemplateId): ResolvedAnamnesisTemplate {
  const base = getAnamnesisTemplate(baseId);
  return {
    key: baseId,
    label: row.label,
    description: base.description,
    structure: row.structure,
    freeForm: row.freeForm,
    placeholderExample: base.placeholderExample,
    source: "override",
    rowId: row.id,
    baseTemplateId: baseId,
  };
}

function customToResolved(row: AnamnesisTemplateRow): ResolvedAnamnesisTemplate {
  return {
    key: `custom-${row.id}`,
    label: row.label,
    description: "Padrão personalizado",
    structure: row.structure,
    freeForm: row.freeForm,
    placeholderExample: "",
    source: "custom",
    rowId: row.id,
    baseTemplateId: null,
  };
}

export function useAnamnesisTemplates() {
  const queryClient = useQueryClient();

  const query = useQuery<AnamnesisTemplateRow[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/anamnesis-templates");
      return await res.json();
    },
    staleTime: 60_000,
  });

  const rows = query.data ?? [];

  const resolved = useMemo<ResolvedAnamnesisTemplate[]>(() => {
    const overridesByBase = new Map<AnamnesisTemplateId, AnamnesisTemplateRow>();
    const customs: AnamnesisTemplateRow[] = [];

    for (const row of rows) {
      if (row.baseTemplateId && isAnamnesisTemplateId(row.baseTemplateId)) {
        overridesByBase.set(row.baseTemplateId, row);
      } else {
        customs.push(row);
      }
    }

    const builtins = ANAMNESIS_TEMPLATE_OPTIONS.map((option) => {
      const override = overridesByBase.get(option.id);
      return override ? overrideToResolved(override, option.id) : builtinToResolved(option);
    });

    const customList = customs
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
      .map(customToResolved);

    return [...builtins, ...customList];
  }, [rows]);

  const resolveByKey = (key: string | null | undefined): ResolvedAnamnesisTemplate => {
    if (!key) return resolved[0] ?? builtinToResolved(ANAMNESIS_TEMPLATE_OPTIONS[0]);
    return (
      resolved.find((t) => t.key === key) ??
      resolved.find((t) => t.key === DEFAULT_ANAMNESIS_TEMPLATE_ID) ??
      builtinToResolved(ANAMNESIS_TEMPLATE_OPTIONS[0])
    );
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreatePayload): Promise<AnamnesisTemplateRow> => {
      const res = await apiRequest("POST", "/api/anamnesis-templates", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdatePayload): Promise<AnamnesisTemplateRow> => {
      const { id, ...rest } = payload;
      const res = await apiRequest("PUT", `/api/anamnesis-templates/${id}`, rest);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/anamnesis-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    templates: resolved,
    rows,
    isLoading: query.isLoading,
    resolveByKey,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
