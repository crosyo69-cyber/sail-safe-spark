/* eslint-disable @typescript-eslint/no-explicit-any -- transport layer bridges untyped Supabase generics */
import { createApiClient } from "./_shared/api";
import type { EmailLog } from "@/features/admin-email-queue/types";

const api = createApiClient({ scope: "email-queue" });

/** Supervision de la file d'e-mails (email_send_log) et renvoi DLQ. */
export const emailQueueService = {
  listLogs: (hours: number) => {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    return api.query<EmailLog[]>("email_send_log.list", (db) =>
      (db.from("email_send_log") as any)
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
    );
  },

  retryDlq: (messageId: string, queue: "auth_emails" | "transactional_emails") =>
    api.invoke<{ error?: string }>(
      "retry-dlq-email",
      { message_id: messageId, queue },
      { retries: 1 },
    ),
};

export type EmailQueueService = typeof emailQueueService;