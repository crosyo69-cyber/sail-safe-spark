import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useReservations } from "@/hooks/services/useReservations";
import { toParisDateOnly } from "@/lib/booking-dates";
import { ACTIVITIES, DEFAULT_KITE_CAPACITY, DEFAULT_STAGE_CAPACITY, DEFAULT_WING_CAPACITY, STAGE_DAYS } from "@/features/reservation/constants";
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

  const handleBookWithCode = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Saisissez votre code de pack ci-dessous, ou achetez un pack.");
      return;
    }
    if (!selectedDate) {
      toast.error("Choisissez une date.");
      return;
    }
    let res: RpcResult;
    try {
      res = (await bookDaily.mutateAsync({
        p_code: clean,
        p_date: toParisDateOnly(selectedDate),
      })) as RpcResult;
    } catch (error) {
      return toast.error("Erreur : " + (error as Error).message);
    }
    if (!res?.ok) {
      return toast.error(mapDailyBookingError(res?.error));
    }
    toast.success("Journée réservée ✅ — horaire communiqué la veille selon les conditions météo.");
    navigate(`/mon-espace/${clean}`);
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
    booking: bookDaily.isPending,
    handleBookWithCode,
    goToSpace: (c: string) => navigate(`/mon-espace/${c}`),
  };
};

/** Hook métier du panneau Stage 100% Glisse (5 jours consécutifs). */
export const useStageBooking = (code: string, onBooked: (code: string) => void) => {
  const { useAvailabilityDays, useBookStage100Glisse } = useReservations();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const bookStage = useBookStage100Glisse();

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
    if (!clean) return toast.error("Saisissez votre code de pack Stage 100% Glisse.");
    if (!startDate) return toast.error("Choisissez une date de début.");
    let res: RpcResult;
    try {
      res = (await bookStage.mutateAsync({
        p_code: clean,
        p_start_date: toParisDateOnly(startDate),
      })) as RpcResult;
    } catch (error) {
      return toast.error("Erreur : " + (error as Error).message);
    }
    if (!res?.ok) {
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
    handleStageBook,
  };
};
