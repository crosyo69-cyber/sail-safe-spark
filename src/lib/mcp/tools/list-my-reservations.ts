import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

// This module is bundled into a Deno edge function at build time; `process.env`
// is provided by Deno at runtime. Declare it here so the app's TS config
// (no @types/node) still typechecks.
declare const process: { env: Record<string, string | undefined> };

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const SCHEDULE_NOTICE =
  "Les horaires seront communiqués la veille par téléphone en fonction des conditions météorologiques.";

function formatDateFR(iso: string): string {
  // iso au format YYYY-MM-DD
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(dt);
  } catch {
    return iso;
  }
}

export default defineTool({
  name: "list_my_reservations",
  title: "List my reservations",
  description:
    "Liste les réservations Kitesurf Passion de l'utilisateur connecté : activité, date, nombre de participants, statut. Les horaires ne sont pas planifiés à l'avance : ils sont communiqués la veille par téléphone selon les conditions météorologiques.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "Not authenticated" }],
        isError: true,
      };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    // Toutes les réservations (nouvelles + historiques après backfill) sont
    // rattachées à un daily_group.
    const [resvRes, pkgRes] = await Promise.all([
      sb
        .from("reservations")
        .select(
          `id, participants, skill_level, status, notes, created_at,
           daily_group_id,
           daily_groups ( date, activity )`,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      sb
        .from("package_bookings")
        .select(
          `id, status, booking_kind, created_at,
           daily_group_id,
           daily_groups ( date, activity ),
           client_packages!inner ( id, user_id, package_code, activity )`,
        )
        .eq("client_packages.user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (resvRes.error) {
      return { content: [{ type: "text", text: resvRes.error.message }], isError: true };
    }
    if (pkgRes.error) {
      return { content: [{ type: "text", text: pkgRes.error.message }], isError: true };
    }

    type Item = {
      id: string;
      kind: "reservation" | "package_booking";
      activity: string;
      activity_label: string;
      date: string | null;
      date_label: string | null;
      participants: number;
      status: string;
      package_code?: string | null;
    };

    const items: Item[] = [];

    for (const r of (resvRes.data ?? []) as any[]) {
      const dg = r.daily_groups;
      const date: string | null = dg?.date ?? null;
      const activity: string = dg?.activity ?? "kitesurf";
      items.push({
        id: r.id,
        kind: "reservation",
        activity,
        activity_label: ACTIVITY_LABEL[activity] ?? activity,
        date,
        date_label: date ? formatDateFR(date) : null,
        participants: r.participants ?? 1,
        status: r.status,
      });
    }

    for (const b of (pkgRes.data ?? []) as any[]) {
      const dg = b.daily_groups;
      const date: string | null = dg?.date ?? null;
      const activity: string =
        dg?.activity ?? b.client_packages?.activity ?? "kitesurf";
      items.push({
        id: b.id,
        kind: "package_booking",
        activity,
        activity_label: ACTIVITY_LABEL[activity] ?? activity,
        date,
        date_label: date ? formatDateFR(date) : null,
        participants: 1,
        status: b.status,
        package_code: b.client_packages?.package_code ?? null,
      });
    }

    // Tri : à venir d'abord (par date croissante), puis passées (par date décroissante)
    const today = new Date().toISOString().slice(0, 10);
    items.sort((a, b) => {
      const aFuture = (a.date ?? "") >= today;
      const bFuture = (b.date ?? "") >= today;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      if (aFuture) return (a.date ?? "").localeCompare(b.date ?? "");
      return (b.date ?? "").localeCompare(a.date ?? "");
    });

    // Rendu texte lisible pour l'agent
    const lines: string[] = [];
    if (items.length === 0) {
      lines.push("Aucune réservation trouvée pour ce compte.");
    } else {
      lines.push(`${items.length} réservation(s) :`);
      for (const it of items) {
        const kindLabel = it.kind === "package_booking" ? "Pack" : "Réservation";
        const dateLabel = it.date_label ?? "date inconnue";
        const extra = it.package_code ? ` (code ${it.package_code})` : "";
        lines.push(
          `- ${kindLabel} — ${it.activity_label} — ${dateLabel}${extra} — ${it.participants} participant(s) — statut ${it.status}`,
        );
      }
      lines.push("");
      lines.push(SCHEDULE_NOTICE);
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
      structuredContent: {
        reservations: items,
        schedule_notice: SCHEDULE_NOTICE,
      },
    };
  },
});