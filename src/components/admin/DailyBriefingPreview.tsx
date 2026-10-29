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

  const load = async () => {
    setLoading(true); setError(null);
    const res = settle(await assistantService.dailyBriefingPreview());
    if (res.error || !res.data) setError("Aperçu indisponible pour le moment.");
    else setData(res.data);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Briefing du jour</CardTitle>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="min-h-11">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Préparer l'aperçu"}
        </Button>
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
              <div className="mb-1 flex items-center gap-2"><span className="font-medium">Texte rédigé</span><Badge variant="secondary">IA — non envoyé</Badge></div>
              <p className="whitespace-pre-line rounded-md border p-3">{data.ai_text ?? "Le texte n'a pas pu être rédigé ; l'e-mail contiendrait seulement les chiffres."}</p>
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
