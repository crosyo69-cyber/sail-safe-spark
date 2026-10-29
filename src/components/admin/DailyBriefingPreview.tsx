import { useState } from "react";
import { assistantService, type DailyBriefingPreview as Preview } from "@/services/assistant.service";
import { settle } from "@/services/_shared/result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Send } from "lucide-react";

export const DailyBriefingPreview = () => {
  const [data, setData] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // The AI is only called on explicit request; its text is kept until the page is reloaded.
  const load = async (withAI: boolean) => {
    setLoading(true); setError(null);
    const res = settle(await assistantService.dailyBriefingPreview(withAI));
    if (res.error || !res.data) setError("Aperçu indisponible pour le moment.");
    else setData((prev) => (!withAI && prev?.ai_requested ? { ...res.data!, ai_text: prev.ai_text, ai_requested: true, ai_rejected: prev.ai_rejected } : res.data));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Briefing du jour</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => load(false)} disabled={loading} className="min-h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Préparer l'aperçu"}
          </Button>
          {data && !data.ai_requested && (
            <Button size="sm" variant="secondary" onClick={() => load(true)} disabled={loading} className="min-h-11">Rédiger avec l'IA</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">Mode test : aucun e-mail n'est envoyé depuis cet écran.</p>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {data && (
          <>
            <div className="grid gap-1">
              <p><span className="text-muted-foreground">Destinataire :</span> {data.recipient}</p>
              <p><span className="text-muted-foreground">Période :</span> {data.period.label} (heure de Paris)</p>
              {data.already_sent_today && <p className="text-muted-foreground">Un briefing a déjà été envoyé aujourd'hui.</p>}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2"><span className="font-medium">Chiffres</span><Badge variant="outline">Données réelles</Badge></div>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{JSON.stringify(data.facts, null, 2)}</pre>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2"><span className="font-medium">Texte rédigé</span><Badge variant="secondary">{data.ai_text ? "IA — non envoyé" : "Résumé sans IA — non envoyé"}</Badge></div>
              {data.ai_rejected && <p className="mb-1 text-muted-foreground">Le texte de l'IA contredisait les chiffres de la veille : il a été écarté.</p>}
              <p className="whitespace-pre-line rounded-md border p-3">{data.ai_text ?? data.fallback_text}</p>
            </div>
          </>
        )}
        <Button disabled className="min-h-11 gap-2" title="Envoi réel non activé">
          <Send className="h-4 w-4" /> Envoyer (non activé)
        </Button>
      </CardContent>
    </Card>
  );
};
