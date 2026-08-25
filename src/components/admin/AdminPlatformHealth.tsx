import { useAnalytics } from "@/hooks/services/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Activity, Database, Clock, Inbox, ShieldCheck, Coins } from "lucide-react";
import {
  creditMaintenanceTone,
  type PlatformHealthData,
} from "@/features/admin-health/types";

const Metric = ({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "ok" | "warn" | "danger" }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p
      className={
        "mt-1 text-2xl font-bold " +
        (tone === "ok" ? "text-primary" : tone === "warn" ? "text-accent" : tone === "danger" ? "text-destructive" : "text-foreground")
      }
    >
      {value}
    </p>
  </div>
);

const AdminPlatformHealth = () => {
  const { usePlatformHealth } = useAnalytics();
  const { data: raw, isLoading, isFetching, error, refetch } = usePlatformHealth();
  const data = (raw ?? null) as PlatformHealthData | null;
  const loading = isLoading || isFetching;
  const load = () => void refetch();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Erreur de chargement : {(error as Error).message}</p>;
  }

  if (!data) return null;

  const queueTotal = Object.entries(data.queues)
    .filter(([name]) => !name.endsWith("_dlq"))
    .reduce((sum, [, n]) => sum + Number(n || 0), 0);
  const dlqTotal = Object.entries(data.queues)
    .filter(([name]) => name.endsWith("_dlq"))
    .reduce((sum, [, n]) => sum + Number(n || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Santé de la plateforme
          </h2>
          <p className="text-sm text-muted-foreground">
            Dernière mesure : {new Date(data.generated_at).toLocaleString("fr-FR")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="min-h-[44px]">
          <RefreshCw className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Stockage
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Metric label="Taille base" value={data.database_size} />
          <Metric label="Journaux cron" value={data.cron.log_size} />
          <Metric label="Lignes de journaux" value={data.cron.log_rows.toLocaleString("fr-FR")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Tâches planifiées (24 h)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Metric label="Jobs actifs" value={`${data.cron.active_jobs}/${data.cron.total_jobs}`} />
          <Metric label="Exécutions" value={data.cron.runs_24h} />
          <Metric label="Échecs" value={data.cron.failures_24h} tone={data.cron.failures_24h > 0 ? "danger" : "ok"} />
          <Metric
            label="Secrets en clair"
            value={data.cron.plaintext_secret_jobs}
            tone={data.cron.plaintext_secret_jobs > 0 ? "danger" : "ok"}
          />
        </CardContent>
      </Card>

      {data.credit_maintenance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4" /> Maintenance crédits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <Metric
                label="Statut"
                value={
                  data.credit_maintenance.status === "ok"
                    ? "OK"
                    : data.credit_maintenance.status === "warning"
                      ? "Vigilance"
                      : "Critique"
                }
                tone={creditMaintenanceTone(data.credit_maintenance.status)}
              />
              <Metric
                label="Dernier succès"
                value={
                  data.credit_maintenance.last_success_at
                    ? new Date(data.credit_maintenance.last_success_at).toLocaleString("fr-FR")
                    : "Inconnu"
                }
              />
              <Metric
                label="Heures écoulées"
                value={
                  data.credit_maintenance.hours_since_last_success === null
                    ? "—"
                    : `${data.credit_maintenance.hours_since_last_success} h`
                }
                tone={creditMaintenanceTone(data.credit_maintenance.status)}
              />
              <Metric
                label="Crédits périmés en attente"
                value={data.credit_maintenance.expired_available_count}
                tone={data.credit_maintenance.expired_available_count > 0 ? "danger" : "ok"}
              />
            </div>
            <p className="text-sm text-muted-foreground">{data.credit_maintenance.message}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" /> Files d'attente & emails (24 h)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Metric label="En file" value={queueTotal} tone={queueTotal > 50 ? "warn" : "ok"} />
          <Metric label="DLQ" value={dlqTotal} tone={dlqTotal > 0 ? "danger" : "ok"} />
          <Metric label="Emails envoyés" value={data.emails.sent_24h} />
          <Metric
            label="Taux d'erreur"
            value={`${data.emails.error_rate_pct}%`}
            tone={data.emails.error_rate_pct > 5 ? "danger" : "ok"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Détail des files
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(data.queues).map(([name, n]) => (
            <Badge key={name} variant={Number(n) > 0 && name.endsWith("_dlq") ? "destructive" : "secondary"}>
              {name} : {String(n)}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlatformHealth;
