import { useRef, useState } from "react";
import { usePayments } from "@/hooks/services/usePayments";
import { newIdempotencyKey } from "@/services/_shared/api";
import type { CreateCheckoutBody } from "@/services/payment.service";

/**
 * Hook métier du paiement d'acompte Stripe.
 *
 * RÈGLE ABSOLUE (Safari/iOS) : `window.open("about:blank")` est déclenché
 * SYNCHRONEMENT par le composant, AVANT tout await / mutation. Le hook reçoit
 * la fenêtre déjà ouverte et ne l'ouvre jamais lui-même.
 *
 * IDEMPOTENCE (P0-1) : une clé `Idempotency-Key` est générée par INTENTION de
 * paiement. Tant que l'utilisateur ne modifie pas les paramètres de sa
 * commande (activité, date, participants, séances, téléphone, nom), la MÊME
 * clé est réutilisée — y compris lors d'un retry réseau ou d'un double clic —
 * de sorte que Stripe renvoie la même Checkout Session. Toute modification du
 * panier = nouvelle intention = nouvelle clé.
 */
export const useDepositCheckout = () => {
  const { useCreateCheckout } = usePayments();
  const createCheckout = useCreateCheckout();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const intentRef = useRef<{ signature: string; key: string } | null>(null);

  const keyForIntent = (activityId: string, body: CreateCheckoutBody): string => {
    const signature = JSON.stringify([
      activityId,
      body.activityName,
      body.participants,
      body.preferredDate,
      body.phone,
      body.customerName,
      body.totalSessions ?? null,
    ]);
    if (intentRef.current?.signature === signature) return intentRef.current.key;
    const key = newIdempotencyKey();
    intentRef.current = { signature, key };
    return key;
  };

  const start = async (
    activityId: string,
    body: CreateCheckoutBody,
    stripeWindow: Window | null,
    onError: () => void,
  ) => {
    setLoadingId(activityId);
    try {
      const idempotencyKey = keyForIntent(activityId, body);
      const data = (await createCheckout.mutateAsync({ body, idempotencyKey })) as
        | { url?: string }
        | null;
      if (data?.url) {
        if (stripeWindow && !stripeWindow.closed) {
          stripeWindow.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } else {
        stripeWindow?.close();
        throw new Error("Aucune URL de paiement reçue");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      onError();
    } finally {
      setLoadingId(null);
    }
  };

  return { loadingId, start };
};
