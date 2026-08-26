import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "notifications" });

export interface AdminNotificationRow {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
}

/** Centre d'alertes admin — lecture et accusés de lecture. */
export const notificationsService = {
  list: (filter: "unread" | "all", limit = 200) =>
    api.query<AdminNotificationRow[]>("admin_notifications.list", (db) => {
      const q = db
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return filter === "unread" ? q.is("read_at", null) : q;
    }),

  markRead: (ids: string[]) =>
    api.query(
      "admin_notifications.mark_read",
      (db) =>
        db
          .from("admin_notifications")
          .update({ read_at: new Date().toISOString() })
          .in("id", ids),
      { retries: 1 },
    ),

  remove: (id: string) =>
    api.query(
      "admin_notifications.delete",
      (db) => db.from("admin_notifications").delete().eq("id", id),
      { retries: 1 },
    ),
};
