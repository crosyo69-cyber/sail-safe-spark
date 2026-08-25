import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useClientSpace } from "@/hooks/services/useClientSpace";
import { SESSION_EXPIRED_MESSAGE, useClientSession } from "@/hooks/client/useClientSession";
import { takePendingCode } from "@/features/mon-espace/session-storage";
import { parisStartOfTomorrow, toParisDateOnly } from "@/lib/booking-dates";
import { BOOKING_ERRORS, CANCEL_ERRORS, DEFAULT_REMINDERS } from "@/features/mon-espace/constants";
import {
  activityTitle,
  bookedDatesOf,
  confirmedBookings,
  groupCapacity,
  packageFlags,
} from "@/features/mon-espace/helpers";
import type {
  CreditEntry,
  CreditHistoryEntry,
  PackageInfo,
  ReminderPrefs,
  WalletEntry,
} from "@/features/mon-espace/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are untyped JSON */

export type MonEspaceStep = "code" | "otp" | "space";

export const useMonEspace = () => {
  const navigate = useNavigate();
  const session = useClientSession();

  const [codeInput, setCodeInput] = useState(() => takePendingCode());
  const [pendingCode, setPendingCodeState] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [busyAction, setBusyAction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reminders, setReminders] = useState<ReminderPrefs>(DEFAULT_REMINDERS);

  const clientSpace = useClientSpace();
  const token = session.token;

  const packageQuery = clientSpace.usePackage(token);
  const historyQuery = clientSpace.useHistory(token);
  const walletQuery = clientSpace.useWallet(token);
  const remindersQuery = clientSpace.useReminders(token);
  const setRemindersMutation = clientSpace.useSetReminders();
  const bookDaily = clientSpace.useBookDaily();
  const cancelBooking = clientSpace.useCancelBooking();

  const pkg = (packageQuery.data as PackageInfo | null) ?? null;
  const history = (historyQuery.data as CreditHistoryEntry[] | null) || [];
  const wallet = ((walletQuery.data as any)?.wallet as WalletEntry[]) || [];
  const creditList = ((walletQuery.data as any)?.credits as CreditEntry[]) || [];

  useEffect(() => {
    if (packageQuery.isError) toast.error("Erreur de chargement");
  }, [packageQuery.isError]);

  /* Session refusée par le serveur : retour à la vérification. */
  useEffect(() => {
    if (token && packageQuery.isSuccess && !packageQuery.data) {
      session.dropSession();
      toast.error(SESSION_EXPIRED_MESSAGE);
    }
  }, [token, packageQuery.isSuccess, packageQuery.data, session]);

  useEffect(() => {
    if (remindersQuery.data) setReminders(remindersQuery.data as unknown as ReminderPrefs);
  }, [remindersQuery.data]);

  /* Étape 1 : demande du code de sécurité. Réponse serveur toujours uniforme. */
  const submitCode = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    const sent = await session.sendCode(code);
    if (!sent) return;
    setPendingCodeState(code);
    setOtpInput("");
  };

  const resendCode = async () => {
    if (!pendingCode) return;
    const sent = await session.sendCode(pendingCode);
    if (sent) toast.success("Si votre code client est valide, un nouveau code vient d'être envoyé.");
  };

  /* Étape 2 : vérification serveur du code de sécurité. */
  const submitOtp = async () => {
    if (!pendingCode || otpInput.length !== 6) return;
    const ok = await session.verify(pendingCode, otpInput);
    if (!ok) {
      setOtpInput("");
      return;
    }
    setPendingCodeState("");
    setOtpInput("");
  };

  const backToCode = () => {
    setPendingCodeState("");
    setOtpInput("");
  };

  const refresh = async () => {
    await Promise.all([
      packageQuery.refetch(),
      historyQuery.refetch(),
      walletQuery.refetch(),
      remindersQuery.refetch(),
    ]);
  };

  const updateReminders = async (next: ReminderPrefs) => {
    if (!pkg) return;
    const prev = reminders;
    setReminders(next);
    try {
      const data: any = await setRemindersMutation.mutateAsync({
        p_session_token: token,
        p_remind_30: next.remind_30,
        p_remind_7: next.remind_7,
        p_remind_0: next.remind_0,
      });
      if (!data?.ok) throw new Error("ko");
      toast.success("Préférences de rappel enregistrées");
    } catch {
      setReminders(prev);
      toast.error("Impossible d'enregistrer vos préférences");
    }
  };

  const bookedDates = useMemo(() => bookedDatesOf(pkg), [pkg]);
  const flags = useMemo(() => packageFlags(pkg), [pkg]);

  const handleSessionError = (error?: string) => {
    if (error === "session_invalid") {
      session.dropSession();
      toast.error(SESSION_EXPIRED_MESSAGE);
      return true;
    }
    return false;
  };

  const handleBook = async () => {
    if (!pkg || !selectedDate) return;
    const dateStr = toParisDateOnly(selectedDate);
    if (bookedDates.has(dateStr)) {
      toast.error("Vous avez déjà réservé cette date");
      return;
    }
    setBusyAction(true);
    try {
      const res: any = await bookDaily.mutateAsync({
        p_session_token: token,
        p_date: dateStr,
      });
      if (!res?.ok) {
        if (!handleSessionError(res?.error)) {
          toast.error(BOOKING_ERRORS[res?.error] || "Réservation impossible");
        }
        return;
      }
      toast.success("Journée réservée ✅ — horaire communiqué la veille");
      setSelectedDate(undefined);
      await refresh();
    } catch (e) {
      toast.error("Erreur : " + (e as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!pkg) return;
    setBusyAction(true);
    try {
      const res: any = await cancelBooking.mutateAsync({
        p_session_token: token,
        p_booking_id: bookingId,
      });
      if (!res?.ok) {
        if (!handleSessionError(res?.error)) {
          toast.error(CANCEL_ERRORS[res?.error] || "Annulation impossible");
        }
        return;
      }
      toast.success("Journée annulée");
      await refresh();
    } catch (e) {
      toast.error("Erreur : " + (e as Error).message);
    } finally {
      setBusyAction(false);
    }
  };

  const exit = async () => {
    await session.logout();
    setCodeInput("");
    setPendingCodeState("");
    setOtpInput("");
    navigate("/mon-espace");
  };

  const step: MonEspaceStep = session.hasSession ? "space" : pendingCode ? "otp" : "code";

  return {
    step,
    codeInput,
    setCodeInput,
    submitCode,
    otpInput,
    setOtpInput,
    submitOtp,
    resendCode,
    backToCode,
    sendingCode: session.sending,
    verifying: session.verifying,
    loading: session.sending || packageQuery.isFetching,
    pkg,
    history,
    wallet,
    credits: creditList,
    reminders,
    savingReminders: setRemindersMutation.isPending,
    updateReminders,
    bookings: confirmedBookings(pkg),
    bookedDates,
    selectedDate,
    setSelectedDate,
    tomorrow: parisStartOfTomorrow(),
    busyAction,
    handleBook,
    handleCancel,
    refresh,
    exit,
    activityLabel: activityTitle(pkg),
    capacity: groupCapacity(pkg),
    ...flags,
  };
};

export type MonEspaceController = ReturnType<typeof useMonEspace>;
