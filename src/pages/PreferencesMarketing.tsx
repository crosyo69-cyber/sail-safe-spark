import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { marketingService } from "@/services/marketing.service";
import { settle } from "@/services/_shared/result";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { useClientSession } from "@/hooks/client/useClientSession";
import { setPendingCode } from "@/features/mon-espace/session-storage";

const ACTIVITIES = [
  { key: "kitesurf", label: "Kitesurf" },
  { key: "wingfoil", label: "Wingfoil" },
  { key: "pumpfoil", label: "Pumpfoil" },
  { key: "foil_tracte", label: "Foil tracté" },
  { key: "stage_100_glisse", label: "Stage 100 % Glisse" },
];

const TOPICS = [
  { key: "weather", label: "Alertes météo (vent favorable)" },
  { key: "promotions", label: "Promotions et offres spéciales" },
  { key: "news", label: "Nouveautés de l'école" },
  { key: "events", label: "Événements et sorties" },
];

/**
 * LOT C-2 F2 : le package_code n'est plus une autorisation.
 * Deux accès légitimes seulement :
 *  - le token marketing personnel (lien présent dans les e-mails) ;
 *  - la session OTP « Mon espace » (sessionStorage, jamais dans l'URL).
 */
const PreferencesMarketing = () => {
  const { token: tokenParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = useClientSession();
  const token = tokenParam || searchParams.get("token") || "";

  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  const applyPayload = (result: Record<string, unknown> | null) => {
    if (!result || result.found !== true) {
      toast.error("Lien invalide ou expiré.");
      return;
    }
    setEmail(String(result.email ?? ""));
    setFirstName((result.first_name as string) ?? null);
    setConsent(Boolean(result.consent));
    setActivities(Array.isArray(result.activities) ? (result.activities as string[]) : []);
    setTopics(Array.isArray(result.topics) ? (result.topics as string[]) : []);
    setLoaded(true);
  };

  const load = useCallback(async (tok: string, sessionToken: string) => {
    if (!tok && !sessionToken) return;
    setLoading(true);
    const { data, error } = settle(
      sessionToken
        ? await marketingService.getPreferencesBySession(sessionToken)
        : await marketingService.getPreferences({ p_token: tok }),
    );
    setLoading(false);
    if (error) {
      toast.error("Lien invalide ou expiré.");
      return;
    }
    applyPayload(data as Record<string, unknown> | null);
  }, []);

  useEffect(() => {
    if (token || session.token) load(token, session.token);
  }, [token, session.token, load]);

  /** Saisie d'un code pack : on bascule vers la vérification e-mail. */
  const goToSecureFlow = () => {
    const clean = codeInput.trim().toUpperCase();
    if (clean.length < 3) return;
    setPendingCode(clean);
    toast.info("Vérification de sécurité requise : un code vous sera envoyé par e-mail.");
    navigate("/mon-espace");
  };

  const toggle = (list: string[], setList: (v: string[]) => void, key: string) =>
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const save = async () => {
    setSaving(true);
    const { data, error } = settle(
      session.token
        ? await marketingService.savePreferencesBySession({
            p_session_token: session.token,
            p_consent: consent,
            p_activities: consent ? activities : [],
            p_topics: consent ? topics : [],
          })
        : await marketingService.savePreferences({
            p_consent: consent,
            p_activities: consent ? activities : [],
            p_topics: consent ? topics : [],
            p_token: token || null,
          }),
    );
    setSaving(false);

    const result = data as Record<string, unknown> | null;
    if (error || !result || result.success !== true) {
      toast.error("Impossible d'enregistrer vos préférences.");
      return;
    }
    if (!consent) {
      setActivities([]);
      setTopics([]);
    }
    toast.success("Vos préférences ont bien été enregistrées.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Préférences marketing | KiteSurf Passion Hyères</title>
        <meta
          name="description"
          content="Gérez vos préférences de communication KiteSurf Passion à Hyères : activités, alertes météo, promotions, nouveautés et événements."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="flex-1 container max-w-3xl py-10 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Centre de préférences</h1>
        <p className="text-muted-foreground mb-8">
          Choisissez précisément ce que vous souhaitez recevoir de la part de KiteSurf Passion.
          Vous pouvez modifier ou retirer votre accord à tout moment.
        </p>

        {!loaded && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" /> Accéder à mes préférences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Saisissez le code de votre pack (reçu par email) ou utilisez le lien personnel
                présent en bas de nos emails.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Label htmlFor="code" className="sr-only">
                  Code de pack
                </Label>
                <Input
                  id="code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ex. KSP-2026-XXXX"
                  className="min-h-[44px]"
                />
                <Button
                  onClick={goToSecureFlow}
                  disabled={loading || codeInput.trim().length < 3}
                  className="min-h-[44px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loaded && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                {firstName ? `Bonjour ${firstName}` : "Vos préférences"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{email}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-md border p-4">
                <Label htmlFor="consent" className="text-sm font-normal cursor-pointer">
                  <span className="font-semibold block mb-1">
                    Je souhaite recevoir les informations de KiteSurf Passion
                  </span>
                  <span className="text-muted-foreground">
                    Sans cet accord, nous ne vous enverrons que les emails liés à vos réservations.
                  </span>
                </Label>
                <Switch id="consent" checked={consent} onCheckedChange={setConsent} />
              </div>

              <div className={consent ? "" : "opacity-50 pointer-events-none"}>
                <h2 className="font-semibold mb-3">Activités qui m'intéressent</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ACTIVITIES.map((a) => (
                    <label
                      key={a.key}
                      htmlFor={`act-${a.key}`}
                      className="flex items-center gap-3 rounded-md border p-3 min-h-[44px] cursor-pointer"
                    >
                      <Checkbox
                        id={`act-${a.key}`}
                        checked={activities.includes(a.key)}
                        onCheckedChange={() => toggle(activities, setActivities, a.key)}
                      />
                      <span className="text-sm">{a.label}</span>
                    </label>
                  ))}
                </div>

                <Separator className="my-6" />

                <h2 className="font-semibold mb-3">Types d'informations</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {TOPICS.map((t) => (
                    <label
                      key={t.key}
                      htmlFor={`topic-${t.key}`}
                      className="flex items-center gap-3 rounded-md border p-3 min-h-[44px] cursor-pointer"
                    >
                      <Checkbox
                        id={`topic-${t.key}`}
                        checked={topics.includes(t.key)}
                        onCheckedChange={() => toggle(topics, setTopics, t.key)}
                      />
                      <span className="text-sm">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Conformément au RGPD, vous pouvez retirer votre accord à tout moment. Voir notre{" "}
                  <Link to="/politique-confidentialite" className="underline">
                    politique de confidentialité
                  </Link>
                  .
                </p>
                <Button onClick={save} disabled={saving} className="min-h-[44px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer mes préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8">
          <Link
            to="/mon-espace"
            className="text-sm text-muted-foreground inline-flex items-center gap-2 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à mon espace
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PreferencesMarketing;
