import { useState } from "react";
import { toast } from "sonner";
import { useUpdateWeatherRule, useWeatherRulesQuery } from "@/hooks/services/useWeatherRules";
import {
  toDraft, validateDraft, WEATHER_RULE_LABEL,
  type WeatherRule, type WeatherRuleDraft, type WeatherRuleUpdate,
} from "@/features/weather-rules/types";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const useAdminWeatherRules = (enabled: boolean) => {
  const query = useWeatherRulesQuery(enabled);
  const update = useUpdateWeatherRule();

  const [draft, setDraft] = useState<WeatherRuleDraft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState<WeatherRuleUpdate | null>(null);

  const startEdit = (r: WeatherRule) => { setDraft(toDraft(r)); setErrors([]); };
  const cancelEdit = () => { setDraft(null); setErrors([]); setPending(null); };

  /** Étape 1 : validation locale puis demande de confirmation. */
  const requestSave = () => {
    if (!draft) return;
    const v = validateDraft(draft);
    if (v.ok === false) { setErrors(v.errors); return; }
    setErrors([]);
    setPending(v.value);
  };

  /** Étape 2 : enregistrement confirmé. Aucun succès annoncé si le serveur refuse. */
  const confirmSave = async () => {
    if (!pending) return;
    try {
      await update.mutateAsync(pending);
      toast.success(`Règle ${WEATHER_RULE_LABEL[pending.activity]} enregistrée`);
      cancelEdit();
    } catch (e) {
      setPending(null);
      setErrors([msg(e)]);
      toast.error("Enregistrement refusé : " + msg(e));
    }
  };

  return {
    rules: query.data ?? [],
    loading: query.isLoading,
    loadError: query.error ? msg(query.error) : null,
    draft, setDraft, errors, pending, saving: update.isPending,
    startEdit, cancelEdit, requestSave, confirmSave,
    closeConfirm: () => setPending(null),
  };
};
