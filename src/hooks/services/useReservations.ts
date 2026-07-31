import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservationService } from "@/services/reservation.service";
import { unwrap } from "@/services/_shared/result";

export const reservationKeys = {
  all: ["reservations"] as const,
  availability: (from: string, to: string, activity?: string | null) =>
    [...reservationKeys.all, "availability", from, to, activity ?? "all"] as const,
  adminGroups: (args: Record<string, unknown>) =>
    [...reservationKeys.all, "admin-groups", args] as const,
};

export const useReservations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: reservationKeys.all });

  return {
    invalidate,
    service: reservationService,

    useAvailability: (from: string, to: string, activity?: string | null, enabled = true) =>
      useQuery({
        queryKey: reservationKeys.availability(from, to, activity),
        enabled: enabled && !!from && !!to,
        queryFn: async () =>
          unwrap(await reservationService.getDailyAvailability({ from, to, activity })),
      }),

    useAdminGroups: (args: Record<string, unknown>, enabled = true) =>
      useQuery({
        queryKey: reservationKeys.adminGroups(args),
        enabled,
        queryFn: async () => unwrap(await reservationService.listDailyGroups(args)),
      }),

    useBookDaily: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await reservationService.bookDailyWithCode(args)),
        onSuccess: invalidate,
      }),

    useCancelBooking: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await reservationService.cancelBookingWithCode(args)),
        onSuccess: invalidate,
      }),

    useJoinWaitlist: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await reservationService.joinWaitlist(args)),
      }),
  };
};