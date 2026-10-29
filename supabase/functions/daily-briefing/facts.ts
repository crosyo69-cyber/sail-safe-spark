import { eur } from "./briefing-utils.ts";

type Row = { participants?: number | null; status?: string | null; client_activity?: string | null };
type Notif = { severity?: string | null; title?: string | null; created_at?: string | null };

export interface FactsInput {
  day: string;
  stripe: { ok: true; count: number; gross: number; refunded: number; truncated: boolean } | { ok: false; error: string };
  reservations: Row[] | null; // null = unavailable
  packs: number | null;
  notifs: { count: number | null; oldest: string | null; newest: string | null; sample: Notif[] } | null;
  actions: string[] | null;
  waitlist: number | null;
  groupsToday: number | null;
}

const UNAVAILABLE = "indisponible";

/** Two clearly separated blocks: what happened during the period vs current backlog. */
export function buildFacts(i: FactsInput) {
  const r = i.reservations;
  return {
    pendant_la_periode: {
      jour: i.day,
      ventes_stripe: i.stripe.ok
        ? { paiements: i.stripe.count, encaisse: eur(i.stripe.gross), rembourse: eur(i.stripe.refunded), incomplet: i.stripe.truncated }
        : UNAVAILABLE,
      reservations: r === null ? UNAVAILABLE : {
        nouvelles: r.length,
        confirmees: r.filter((x) => x.status === "confirmed").length,
        annulees: r.filter((x) => x.status === "cancelled").length,
        participants: r.filter((x) => x.status !== "cancelled").reduce((a, x) => a + (x.participants || 1), 0),
      },
      packs_achetes: i.packs ?? UNAVAILABLE,
    },
    stock_actuel_ne_decrit_pas_la_veille: {
      alertes_non_lues: i.notifs === null || i.notifs.count === null ? UNAVAILABLE : {
        nombre: i.notifs.count,
        plus_ancienne: i.notifs.oldest,
        plus_recente: i.notifs.newest,
      },
      actions_a_valider: i.actions ?? UNAVAILABLE,
      liste_attente: i.waitlist ?? UNAVAILABLE,
      groupes_aujourdhui: i.groupsToday ?? UNAVAILABLE,
    },
  };
}
export type Facts = ReturnType<typeof buildFacts>;

export const AI_INSTRUCTIONS = [
  "Tu rédiges le briefing matinal du gérant d'une école de kitesurf à Hyères. Français, vouvoiement, 5 à 8 phrases courtes, factuel.",
  "Les données ont deux blocs : « pendant_la_periode » (la veille uniquement) et « stock_actuel_ne_decrit_pas_la_veille » (backlog, peut être ancien).",
  "Une alerte non lue ne prouve jamais une réservation, un paiement ou un événement de la veille : ne cite jamais le titre d'une alerte comme un événement de la veille.",
  "Si pendant_la_periode.reservations.nouvelles vaut 0, écris explicitement « 0 réservation » pour la veille.",
  "Ne confonds jamais le nombre d'alertes non lues avec un nombre de réservations ; présente-le comme un stock à traiter.",
  "Si une donnée vaut « indisponible », dis qu'elle est indisponible, sans l'estimer. N'invente rien.",
  "Termine par 1 à 3 actions prioritaires.",
].join(" ");

/** Rejects AI text that contradicts the period facts (e.g. new bookings when there were none). */
export function aiTextIsSafe(text: string, f: Facts): boolean {
  const t = text.toLowerCase();
  const res = f.pendant_la_periode.reservations;
  const positiveCount = /\b[1-9]\d* (nouvelles? )?r[ée]servations?/.test(t);
  if (res === UNAVAILABLE) return !positiveCount;
  if (res.nouvelles === 0) {
    const saysZero = /\b0 (nouvelles? )?r[ée]servations?|aucune (nouvelle )?r[ée]servation/.test(t);
    const stripped = t.replace(/\b0 (nouvelles? )?r[ée]servations?|aucune (nouvelle )?r[ée]servation/g, "");
    const mentionsNew = /nouvelles? r[ée]servations?/.test(stripped);
    return saysZero && !positiveCount && !mentionsNew;
  }
  return true;
}

/** Deterministic summary used when AI is not requested, fails, or is rejected. */
export function fallbackSummary(f: Facts): string {
  const p = f.pendant_la_periode, s = f.stock_actuel_ne_decrit_pas_la_veille;
  const st = p.ventes_stripe === UNAVAILABLE ? "Paiements Stripe : indisponibles." : `Paiements Stripe : ${p.ventes_stripe.paiements}, ${p.ventes_stripe.encaisse} encaissés, ${p.ventes_stripe.rembourse} remboursés.`;
  const rs = p.reservations === UNAVAILABLE ? "Réservations : indisponibles." : `${p.reservations.nouvelles} réservation(s) créée(s) (${p.reservations.participants} participant(s)).`;
  const pk = p.packs_achetes === UNAVAILABLE ? "Packs : indisponibles." : `${p.packs_achetes} pack(s) acheté(s).`;
  const al = s.alertes_non_lues === UNAVAILABLE ? "Alertes non lues : indisponibles." : `Stock actuel : ${s.alertes_non_lues.nombre} alerte(s) non lue(s), toutes dates confondues.`;
  return `Veille (${p.jour}) — ${st} ${rs} ${pk}\n${al}`;
}
