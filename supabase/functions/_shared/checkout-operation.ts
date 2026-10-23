import { resolveActivityEnum, parseParticipants, parseStageParticipants } from "../create-checkout/participants.ts";

export type CheckoutOperation = "dated_reservation" | "pack_purchase" | "stage";
export function resolveCheckoutOperation(activity: string, raw: unknown, participants: unknown, sessions: unknown) {
  const activityEnum = resolveActivityEnum(activity);
  if (!activityEnum) throw new Error("Activité inconnue.");
  const stage = activityEnum === "stage_100_glisse";
  const count = stage ? parseStageParticipants(participants) : parseParticipants(participants);
  if (count === null) throw new Error("Nombre de participants invalide.");
  // Old callers with a multi-session selection are deliberately rejected:
  // only an explicit operation may activate the new pack fulfillment.
  const operation: CheckoutOperation = stage ? "stage" : raw === undefined ? "dated_reservation" : raw as CheckoutOperation;
  if (stage && raw !== undefined && raw !== "stage") throw new Error("Le Stage conserve son parcours dédié.");
  if (!["dated_reservation", "pack_purchase", "stage"].includes(operation)) throw new Error("Type d'achat invalide.");
  if (!stage && operation === "stage") throw new Error("Activité incompatible avec un Stage.");
  const n = sessions === undefined ? 1 : Number(sessions);
  let quantity = count;
  let totalSessions = 1;
  if (operation === "pack_purchase") {
    const key = activity.toLowerCase().trim();
    const allowed = key === "cours à la carte" ? [3, 5, 10] : key === "cours wingfoil" ? [3, 5] : [];
    if (count !== 1 || !Number.isInteger(n) || !allowed.includes(n)) throw new Error("Un pack est individuel : choisissez un nombre de séances autorisé.");
    quantity = totalSessions = n;
  } else if (stage) {
    quantity = count;
    totalSessions = 5;
  } else if (raw === undefined && sessions !== undefined && n !== 1 && n !== count) {
    throw new Error("Veuillez préciser réservation datée ou achat de pack.");
  }
  return { operation, count, quantity, totalSessions, activityEnum, expectedAmountCents: quantity * (stage ? 25000 : 5000) };
}

export function confirmedPayment(session: { amount_total?: unknown; currency?: unknown; payment_status?: unknown }) {
  if (session.payment_status !== "paid" || session.currency !== "eur" ||
      typeof session.amount_total !== "number" || !Number.isSafeInteger(session.amount_total) || session.amount_total < 1) {
    throw new Error("Paiement non confirmé en euros ou montant invalide.");
  }
  return session.amount_total;
}