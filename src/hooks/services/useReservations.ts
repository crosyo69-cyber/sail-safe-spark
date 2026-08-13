import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservationService } from "@/services/reservation.service";
import { unwrap } from "@/services/_shared/result";
import type { Database } from "@/integrations/supabase/types";

type Fn = Database["public"]["Functions"];

export const reservationKeys = {
  all: ["reservations"] as const,
  /** One key per day — mirrors `get_daily_availability(p_date)`. */
  availability: (date: string) => [...reservationKeys.all, "availability", date] as const,
  adminGroups: (date: string) => [...reservationKeys.all, "admin-groups", date] as const,
  adminGroupsRange: (start: string, end: string) =>
    [...reservationKeys.all, "admin-groups-range", start, end] as const,
};

export const useReservations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: reservationKeys.all });

  return {
    invalidate,
    service: reservationService,

    /** `public.get_daily_availability(p_date date)` — single day only. */
    useAvailability: (date: string, enabled = true) =>
      useQuery({
        queryKey: reservationKeys.availability(date),
        enabled: enabled && !!date,
        queryFn: async () =>
          unwrap(await reservationService.getDailyAvailability({ p_date: date })),
      }),

    useAdminGroups: (args: Fn["admin_list_daily_groups"]["Args"], enabled = true) =>
      useQuery({
        queryKey: reservationKeys.adminGroups(args.p_date),
        enabled,
        queryFn: async () => unwrap(await reservationService.listDailyGroups(args)),
      }),

    useAdminGroupsRange: (args: Fn["admin_list_daily_groups_range"]["Args"], enabled = true) =>
      useQuery({
        queryKey: reservationKeys.adminGroupsRange(args.p_start, args.p_end),
        enabled,
        queryFn: async () => unwrap(await reservationService.listDailyGroupsRange(args)),
      }),

    useBookDaily: () =>
      useMutation({
        mutationFn: async (args: Fn["book_daily_with_code"]["Args"]) =>
          unwrap(await reservationService.bookDailyWithCode(args)),
        onSuccess: invalidate,
      }),

    useCancelBooking: () =>
      useMutation({
        mutationFn: async (args: Fn["cancel_booking_with_code"]["Args"]) =>
          unwrap(await reservationService.cancelBookingWithCode(args)),
        onSuccess: invalidate,
      }),

    useJoinWaitlist: () =>
      useMutation({
        mutationFn: async (args: Fn["join_waitlist"]["Args"]) =>
          unwrap(await reservationService.joinWaitlist(args)),
      }),

    /** Admin — daily groups management. */
    useUpdateDailyGroup: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_update_daily_group"]["Args"]) =>
          unwrap(await reservationService.updateDailyGroup(args)),
        onSuccess: invalidate,
      }),

    useCancelDailyGroup: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_cancel_daily_group"]["Args"]) =>
          unwrap(await reservationService.cancelDailyGroup(args)),
        onSuccess: invalidate,
      }),

    useCancelGroupAndRecredit: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_cancel_group_and_recredit"]["Args"]) =>
          unwrap(await reservationService.cancelGroupAndRecredit(args)),
        onSuccess: invalidate,
      }),

    useCancelAndRecredit: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_cancel_and_recredit"]["Args"]) =>
          unwrap(await reservationService.cancelAndRecredit(args)),
        onSuccess: invalidate,
      }),

    useCancelDay: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_cancel_day"]["Args"]) =>
          unwrap(await reservationService.cancelDay(args)),
        onSuccess: invalidate,
      }),

    useRemoveGroupMember: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_remove_group_member"]["Args"]) =>
          unwrap(await reservationService.removeGroupMember(args)),
        onSuccess: invalidate,
      }),

    useRescheduleBooking: () =>
      useMutation({
        mutationFn: async (args: Fn["admin_reschedule_booking"]["Args"]) =>
          unwrap(await reservationService.rescheduleBooking(args)),
        onSuccess: invalidate,
      }),
  };
};
