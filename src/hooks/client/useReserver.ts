import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useReservations } from "@/hooks/services/useReservations";
import { toParisDateOnly } from "@/lib/booking-dates";
import { ACTIVITIES, DEFAULT_KITE_CAPACITY, DEFAULT_STAGE_CAPACITY, DEFAULT_WING_CAPACITY, STAGE_DAYS } from "@/features/reservation/constants";
import { setPendingCode } from "@/features/mon-espace/session-storage";
import { SESSION_EXPIRED_MESSAGE, useClientSession } from "@/hooks/client/useClientSession";


import { mapDailyBookingError, mapStageBookingError } from "@/features/reservation/error-mapping";
import type {
  Activity,
  DailyAvailabilityRaw,
  DayAvailability,
  RpcResult,
  StageDayPreview,
} from "@/features/reservation/types";

const toDayAvailability = (date: string, raw: DailyAvailabilityRaw | null): DayAvailability => ({
  date,
  kite: {
    places: raw?.kitesurf?.places_restantes ?? (raw?.kitesurf?.capacite_potentielle ?? DEFAULT_KITE_CAPACITY),
    groupes: raw?.kitesurf?.groupes ?? 0,
  },
  wing: {
    places: raw?.wingfoil?.places_restantes ?? (raw?.wingfoil?.capacite_potentielle ?? DEFAULT_WING_CAPACITY),
    groupes: raw?.wingfoil?.groupes ?? 0,
  },
});

/**
 * Hook métier de la page /reserver.
 * ISO-COMPORTEMENT : mêmes RPC, mêmes paramètres, mêmes messages, mêmes états.
 */
export const useReserver = () => {
  const navigate = useNavigate();
  const { useAvailability } = useReservations();

  const [activity, setActivity] = useState<Activity>("kitesurf");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [code, setCode] = useState("");
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const dateStr = selectedDate ? toParisDateOnly(selectedDate) : "";
  const availabilityQuery = useAvailability(dateStr, !!dateStr);


  const availability: DayAvailability | null = useMemo(() => {
    if (!dateStr) return null;
    if (!availabilityQuery.isSuccess && !availabilityQuery.isError) return null;
    return toDayAvailability(dateStr, (availabilityQuery.data as DailyAvailabilityRaw) ?? null);
  }, [dateStr, availabilityQuery.isSuccess, availabilityQuery.isError, availabilityQuery.data]);

  const loading = !!dateStr && availabilityQuery.isFetching;

  const activityAvail = availability
    ? activity === "wingfoil"
      ? availability.wing
      : availability.kite
    : null;
  const activityUsesGroups = activity === "kitesurf" || activity === "wingfoil";
  const isFull = !!activityAvail && activityUsesGroups && activityAvail.places <= 0;

  /**
   * LOT C-2.2-D : la réservation par simple code client n'existe plus.
   * On oriente le client vers le parcours sécurisé (code + code de sécurité e-mail).
   * Le code n'est jamais placé dans l'URL : il transite par sessionStorage.
   */
  const handleBookWithCode = () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Saisissez votre code de pack ci-dessous, ou achetez un pack.");
      return;
    }
    setPendingCode(clean);
    toast.info("Vérification de sécurité requise : un code vous sera envoyé par e-mail.");
    navigate("/mon-espace");
  };

  return {
    activities: ACTIVITIES,
    activity,
    setActivity,
    selectedDate,
    setSelectedDate,
    code,
    setCode,
    waitlistOpen,
    setWaitlistOpen,
    availability,
    activityAvail,
    activityUsesGroups,
    isFull,
    loading,
    booking: false,
    handleBookWithCode,
    goToSpace: (c: string) => {
      setPendingCode(c);
      navigate("/mon-espace");
    },
  };

};

/**
 * Hook métier du panneau Stage 100% Glisse (5 jours consécutifs).
 * LOT C-2 F1 : la réservation exige une session OTP validée. Sans session,
 * on oriente vers le parcours sécurisé (le code transite par sessionStorage).
 */
export const useStageBooking = (code: string, onBooked: (code: string) => void) => {
  const navigate = useNavigate();
  const session = useClientSession();
  const { useAvailabilityDays, useBookStageWithSession } = useReservations();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const bookStage = useBookStageWithSession();

  const dates = useMemo(() => {
    if (!startDate) return [];
    return Array.from({ length: STAGE_DAYS }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return toParisDateOnly(d);
    });
  }, [startDate]);

  const daysQuery = useAvailabilityDays(dates, dates.length > 0);

  const preview: StageDayPreview[] = useMemo(() => {
    if (!dates.length || !daysQuery.data) return [];
    return dates.map((date, i) => {
      const stage = ((daysQuery.data as (DailyAvailabilityRaw | null)[])[i] ?? {})?.stage_100_glisse;
      return {
        date,
        places: stage?.places_restantes ?? DEFAULT_STAGE_CAPACITY,
        groupes: stage?.groupes ?? 0,
      };
    });
  }, [dates, daysQuery.data]);

  const handleStageBook = async () => {
    const clean = code.trim().toUpperCase();
    if (!session.hasSession) {
      if (!clean) return toast.error("Saisissez votre code de pack Stage 100% Glisse.");
      setPendingCode(clean);
      toast.info("Vérification de sécurité requise : un code vous sera envoyé par e-mail.");
      navigate("/mon-espace");
      return;
    }
    if (!startDate) return toast.error("Choisissez une date de début.");
    let res: RpcResult;
    try {
      res = (await bookStage.mutateAsync({
        p_session_token: session.token,
        p_start_date: toParisDateOnly(startDate),
      })) as RpcResult;
    } catch (error) {
      return toast.error("Erreur : " + (error as Error).message);
    }
    if (!res?.ok) {
      if (res?.error === "session_invalid") {
        session.dropSession();
        return toast.error(SESSION_EXPIRED_MESSAGE);
      }
      return toast.error(mapStageBookingError(res?.error));
    }
    toast.success("Stage 100% Glisse réservé sur 5 jours consécutifs !");
    onBooked(clean);
  };

  return {
    startDate,
    setStartDate,
    preview,
    anyFull: preview.some((p) => p.places <= 0 && p.groupes > 0),
    submitting: bookStage.isPending,
    hasSession: session.hasSession,
    handleStageBook,
  };
};

