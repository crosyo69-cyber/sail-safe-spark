import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminWeatherRules } from "@/hooks/admin/useAdminWeatherRules";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WeatherRuleCard } from "@/components/admin/weather-rules/WeatherRuleCard";
import { formatKnots, WEATHER_RULE_LABEL } from "@/features/weather-rules/types";

const AdminReglesMeteo = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const c = useAdminWeatherRules(isAdmin);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Accès réservé aux administrateurs.</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Règles météo | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        <h1 className="text-3xl font-display font-bold mb-1">Règles météo par activité</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Seuils en nœuds, valeurs égales incluses. Un champ vide signifie « non applicable ». Ces réglages ne décident jamais du maintien ou de l'annulation d'un cours.
        </p>
        {c.loading && <Loader2 className="w-6 h-6 animate-spin" />}
        {c.loadError && <p className="text-destructive">Impossible de charger les règles : {c.loadError}</p>}
        <div className="grid gap-6 md:grid-cols-2">
          {c.rules.map((r) => (
            <WeatherRuleCard
              key={r.activity}
              rule={r}
              draft={c.draft?.activity === r.activity ? c.draft : null}
              errors={c.draft?.activity === r.activity ? c.errors : []}
              disabled={c.saving || (!!c.draft && c.draft.activity !== r.activity)}
              onEdit={() => c.startEdit(r)}
              onChange={c.setDraft}
              onCancel={c.cancelEdit}
              onSave={c.requestSave}
            />
          ))}
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!c.pending} onOpenChange={(o) => !o && c.closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la règle {c.pending && WEATHER_RULE_LABEL[c.pending.activity]}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {c.pending ? (
                <ul className="text-sm space-y-1">
                  <li>Vent minimum : {formatKnots(c.pending.min_wind_kn)}</li>
                  <li>Vent maximum : {formatKnots(c.pending.max_wind_kn)}</li>
                  <li>Rafales maximum : {formatKnots(c.pending.max_gust_kn)}</li>
                  <li>État : {c.pending.enabled ? "activée" : "désactivée"}</li>
                  <li>Motif : « {c.pending.reason} »</li>
                </ul>
              ) : <span />}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={c.saving}>Retour</AlertDialogCancel>
            <AlertDialogAction disabled={c.saving} onClick={(e) => { e.preventDefault(); void c.confirmSave(); }}>
              {c.saving ? "Enregistrement…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReglesMeteo;
