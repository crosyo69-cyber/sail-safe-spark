/** Types du module Santé plateforme (admin, lecture seule). */

export interface CreditMaintenanceHealth {
  status: "ok" | "warning" | "danger";
  last_success_at: string | null;
  hours_since_last_success: number | null;
  expired_available_count: number;
  job_active: boolean;
  last_run_failed: boolean;
  history_truncated: boolean;
  message: string;
}

export interface PlatformHealthData {
  generated_at: string;
  database_size: string;
  cron: {
    active_jobs: number;
    total_jobs: number;
    plaintext_secret_jobs: number;
    runs_24h: number;
    failures_24h: number;
    log_size: string;
    log_rows: number;
  };
  queues: Record<string, number>;
  emails: {
    sent_24h: number;
    failed_24h: number;
    dlq_24h: number;
    rate_limited_24h: number;
    error_rate_pct: number;
  };
  credit_maintenance?: CreditMaintenanceHealth;
}

/** Mappe le statut de la sonde vers le `tone` du composant Metric. */
export const creditMaintenanceTone = (
  status: CreditMaintenanceHealth["status"],
): "ok" | "warn" | "danger" =>
  status === "ok" ? "ok" : status === "warning" ? "warn" : "danger";
