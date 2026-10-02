import { useState } from "react";
import { toast } from "sonner";
import { useReservations } from "@/hooks/services/useReservations";
import { mapWaitlistOfferError } from "@/features/reservation/error-mapping";
import type { Activity, RpcResult } from "@/features/reservation/types";

/** Formulaire d'inscription à la liste d'attente (ISO-COMPORTEMENT). */
export const useJoinWaitlist = (
  date: string | null,
  activity: string,
  onDone: () => void,
) => {
  const { useJoinWaitlist: useJoinWaitlistMutation } = useReservations();
  const join = useJoinWaitlistMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [participants, setParticipants] = useState(1);

  const valid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    !!date;

  const submit = async () => {
    if (!valid || !date) return;
    let res: RpcResult;
    try {
      res = (await join.mutateAsync({
        p_date: date,
        p_activity: activity as Activity,
        p_first_name: firstName.trim().slice(0, 100),
        p_last_name: lastName.trim().slice(0, 100),
        p_email: email.trim().toLowerCase().slice(0, 255),
        p_phone: phone.trim().slice(0, 30) || null,
        p_participants: participants,
      })) as RpcResult;
    } catch (error) {
      return toast.error("Erreur : " + (error as Error).message);
    }
    if (!res?.ok) {
      return toast.error(
        res?.error === "rate_limited"
          ? "Trop de demandes. Merci de réessayer dans quelques minutes."
          : "Inscription impossible",
      );
    }
    // Réponse volontairement uniforme (D-2-FIX / R4) : ne jamais indiquer
    // à l'utilisateur qu'une inscription existait déjà.
    toast.success(
      "Votre demande a bien été prise en compte — nous vous préviendrons par email dès qu'une place se libère.",
    );

    onDone();
  };

  return {
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    phone, setPhone,
    participants, setParticipants,
    valid,
    busy: join.isPending,
    submit,
  };
};

export interface WaitlistOffer {
  id: string;
  date: string;
  activity: string;
  status: string;
  first_name: string;
  participants: number;
  offer_expires_at: string | null;
}

/** Page /liste-attente/{token} : lecture de l'offre + confirmation. */
export const useWaitlistOfferConfirmation = (token?: string) => {
  const { useWaitlistOffer, useConfirmWaitlistOffer } = useReservations();
  const offerQuery = useWaitlistOffer(token ?? "", !!token);
  const confirmMutation = useConfirmWaitlistOffer();
  const [confirmed, setConfirmed] = useState(false);

  const offer = (offerQuery.data as WaitlistOffer | null) || null;

  const handleConfirm = async () => {
    if (!token) return;
    let res: RpcResult;
    try {
      res = (await confirmMutation.mutateAsync({ p_token: token })) as RpcResult;
    } catch (error) {
      return toast.error("Erreur : " + (error as Error).message);
    }
    if (!res?.ok) return toast.error(mapWaitlistOfferError(res?.error));
    setConfirmed(true);
    toast.success("Place confirmée ✅");
  };

  return {
    offer,
    loading: !!token && offerQuery.isPending,
    busy: confirmMutation.isPending,
    confirmed,
    handleConfirm,
  };
};
