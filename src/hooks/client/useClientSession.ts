/**
 * Session client « Mon espace » (second facteur OTP).
 * Unique point de vérité de l'authentification côté frontend :
 * aucun composant ne doit manipuler le jeton directement.
 */
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useClientSpace } from "@/hooks/services/useClientSpace";
import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken,
} from "@/features/mon-espace/session-storage";

const GENERIC_OTP_ERROR = "Code de sécurité incorrect ou expiré.";
export const SESSION_EXPIRED_MESSAGE =
  "Votre session a expiré. Veuillez recommencer la vérification.";

/* eslint-disable @typescript-eslint/no-explicit-any -- payloads RPC non typés */

export const useClientSession = () => {
  const clientSpace = useClientSpace();
  const [token, setToken] = useState<string>(() => readSessionToken());

  const requestOtp = clientSpace.useRequestOtp();
  const verifyOtp = clientSpace.useVerifyOtp();
  const revokeSession = clientSpace.useRevokeSession();

  /** Demande d'envoi du code de sécurité. Réponse serveur toujours uniforme. */
  const sendCode = useCallback(
    async (code: string): Promise<boolean> => {
      const clean = code.trim().toUpperCase();
      if (!clean) return false;
      try {
        await requestOtp.mutateAsync(clean);
        return true;
      } catch {
        toast.error("Service momentanément indisponible. Réessayez dans un instant.");
        return false;
      }
    },
    [requestOtp],
  );

  /** Vérification du code de sécurité : crée la session côté serveur. */
  const verify = useCallback(
    async (code: string, otp: string): Promise<boolean> => {
      try {
        const res: any = await verifyOtp.mutateAsync({
          code: code.trim().toUpperCase(),
          otp: otp.trim(),
        });
        if (!res?.ok || !res?.session_token) {
          toast.error(GENERIC_OTP_ERROR);
          return false;
        }
        writeSessionToken(res.session_token);
        setToken(res.session_token);
        return true;
      } catch {
        toast.error(GENERIC_OTP_ERROR);
        return false;
      }
    },
    [verifyOtp],
  );

  /** Purge locale (expiration serveur, erreur d'authentification). */
  const dropSession = useCallback(() => {
    clearSessionToken();
    setToken("");
    clientSpace.clear();
  }, [clientSpace]);

  /** Déconnexion explicite : révocation serveur puis purge locale. */
  const logout = useCallback(async () => {
    const current = readSessionToken();
    if (current) {
      try {
        await revokeSession.mutateAsync(current);
      } catch {
        /* la purge locale reste prioritaire */
      }
    }
    dropSession();
  }, [revokeSession, dropSession]);

  return {
    token,
    hasSession: !!token,
    sendCode,
    verify,
    logout,
    dropSession,
    sending: requestOtp.isPending,
    verifying: verifyOtp.isPending,
  };
};
