import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useCredits } from "@/hooks/services/useCredits";
import { useReservations } from "@/hooks/services/useReservations";
import { parisStartOfTomorrow, toParisDateOnly } from "@/lib/booking-dates";
import {
  BOOKING_ERRORS,
  CANCEL_ERRORS,
  DEFAULT_REMINDERS,
  activityTitle,
  bookedDatesOf,
  confirmedBookings,
  groupCapacity,
  packageFlags,
  type CreditEntry,
  type CreditHistoryEntry,
  type PackageInfo,
  type ReminderPrefs,
  type WalletEntry,
} from "@/features/mon-espace/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are untyped JSON */

export const useMonEspace = () => {
  const { code: codeParam } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [codeInput, setCodeInput] = useState(codeParam || "");
  const [activeCode, setActiveCode] = useState(codeParam?.trim().toUpperCase() || "");
  const [busyAction, setBusyAction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reminders, setReminders] = useState<ReminderPrefs>(DEFAULT_REMINDERS);
  const [notFound, setNotFound] = useState(false);

  const credits = useCredits();
  const reservations = useReservations();

  const packageQuery = credits.usePackage(activeCode);
  const historyQuery = credits.useHistory(activeCode);
  const walletQuery = credits.useWallet(activeCode);
  const remindersQuery = credits.useReminders(activeCode);
  const setRemindersMutation = credits.useSetReminders();
  const bookDaily = reservations.useBookDaily();
  const cancelBooking = reservations.useCancelBooking();

  const pkg = (notFound ? null : (packageQuery.data as PackageInfo | null)) ?? null;
  const history = (historyQuery.data as CreditHistoryEntry[] | null) || [];
  const wallet = ((walletQuery.data as any)?.wallet as WalletEntry[]) || [];
  const creditList = ((walletQuery.data as any)?.credits as CreditEntry[]) || [];

  /* Erreur / code inconnu : mêmes messages qu'avant. */
  useEffect(() => {
    if (packageQuery.isError) toast.error("Erreur de chargement");
  }, [packageQuery.isError]);

  useEffect(() => {
    if (packageQuery.isSuccess && !packageQuery.data) {
      setNotFound(true);
      toast.error("Code introuvable");
    }
  }, [packageQuery.isSuccess, packageQuery.data]);

  /* Synchronise l'URL avec le code chargé. */
  useEffect(() => {
    if (pkg && codeParam !== pkg.package_code) {
      navigate(`/mon-espace/${pkg.package_code}`, { replace: true });
    }
  }, [pkg, codeParam, navigate]);

  useEffect(() => {
    if (remindersQuery.data) setReminders(remindersQuery.data as unknown as ReminderPrefs);
  }, [remindersQuery.data]);

  const submitCode = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setNotFound(false);
    setActiveCode(code);
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
        p_code: pkg.package_code,
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

  const handleBook = async () => {
    if (!pkg || !selectedDate) return;
    const dateStr = toParisDateOnly(selectedDate);
    if (bookedDates.has(dateStr)) {
      toast.error("Vous avez déjà réservé cette date");
      return;
    }
    setBusyAction(true);
    try {
      const res: any = await bookDaily.mutateAsync({ p_code: pkg.package_code, p_date: dateStr });
      if (!res?.ok) {
        toast.error(BOOKING_ERRORS[res?.error] || "Réservation impossible");
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
        p_code: pkg.package_code,
        p_booking_id: bookingId,
      });
      if (!res?.ok) {
        toast.error(CANCEL_ERRORS[res?.error] || "Annulation impossible");
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

  const exit = () => {
    setActiveCode("");
    setCodeInput("");
    setNotFound(false);
    navigate("/mon-espace");
  };

  return {
    codeInput,
    setCodeInput,
    submitCode,
    loading: packageQuery.isFetching,
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
    exit,
    activityLabel: activityTitle(pkg),
    capacity: groupCapacity(pkg),
    ...flags,
  };
};

export type MonEspaceController = ReturnType<typeof useMonEspace>;