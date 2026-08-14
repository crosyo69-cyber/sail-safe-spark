import { useState } from "react";
import { usePayments } from "@/hooks/services/usePayments";
import type { CreateCheckoutBody } from "@/services/payment.service";

/**
 * Hook métier du paiement d'acompte Stripe.
 *
 * RÈGLE ABSOLUE (Safari/iOS) : `window.open("about:blank")` est déclenché
 * SYNCHRONEMENT par le composant, AVANT tout await / mutation. Le hook reçoit
 * la fenêtre déjà ouverte et ne l'ouvre jamais lui-même.
 *
 * IDEMPOTENCE : aucune clé n'est envoyée (audit A4 — `create-checkout` ne lit
 * ni ne transmet `Idempotency-Key`). Aucun retry non plus.
 */
export const useDepositCheckout = () => {
  const { useCreateCheckout } = usePayments();
  const createCheckout = useCreateCheckout();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const start = async (
    activityId: string,
    body: CreateCheckoutBody,
    stripeWindow: Window | null,
    onError: () => void,
  ) => {
    setLoadingId(activityId);
    try {
      const data = (await createCheckout.mutateAsync(body)) as { url?: string } | null;
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
