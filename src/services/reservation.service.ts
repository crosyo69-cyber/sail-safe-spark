import { createApiClient } from "./_shared/api";
import type { Result } from "./_shared/result";

const api = createApiClient({ scope: "reservation" });

export interface DailyAvailabilityParams {
  from: string;
  to: string;
  activity?: string | null;
}

export const reservationService = {
  /** Availability of the dynamic daily groups between two ISO dates. */
  getDailyAvailability: (p: DailyAvailabilityParams): Promise<Result<unknown>> =>
    api.rpc("get_daily_availability", {
      p_from: p.from,
      p_to: p.to,
      ...(p.activity ? { p_activity: p.activity } : {}),
    }),

  /** Book a day using a package/wallet code. */
  bookDailyWithCode: (args: Record<string, unknown>) =>
    api.rpc("book_daily_with_code", args, { retries: 1 }),

  bookStage100Glisse: (args: Record<string, unknown>) =>
    api.rpc("book_stage_100_glisse", args, { retries: 1 }),

  cancelBookingWithCode: (args: Record<string, unknown>) =>
    api.rpc("cancel_booking_with_code", args, { retries: 1 }),

  /** Waitlist */
  joinWaitlist: (args: Record<string, unknown>) =>
    api.rpc("join_waitlist", args, { retries: 1 }),
  getWaitlistOffer: (args: Record<string, unknown>) => api.rpc("get_waitlist_offer", args),
  confirmWaitlistOffer: (args: Record<string, unknown>) =>
    api.rpc("confirm_waitlist_offer", args, { retries: 1 }),

  /** Admin */
  listDailyGroups: (args: Record<string, unknown>) => api.rpc("admin_list_daily_groups", args),
  updateDailyGroup: (args: Record<string, unknown>) =>
    api.rpc("admin_update_daily_group", args, { retries: 1 }),
  cancelDailyGroup: (args: Record<string, unknown>) =>
    api.rpc("admin_cancel_daily_group", args, { retries: 1 }),
  cancelDay: (args: Record<string, unknown>) => api.rpc("admin_cancel_day", args, { retries: 1 }),
  cancelGroupAndRecredit: (args: Record<string, unknown>) =>
    api.rpc("admin_cancel_group_and_recredit", args, { retries: 1 }),
  cancelAndRecredit: (args: Record<string, unknown>) =>
    api.rpc("admin_cancel_and_recredit", args, { retries: 1 }),
  removeGroupMember: (args: Record<string, unknown>) =>
    api.rpc("admin_remove_group_member", args, { retries: 1 }),
  rescheduleBooking: (args: Record<string, unknown>) =>
    api.rpc("admin_reschedule_booking", args, { retries: 1 }),
};

export type ReservationService = typeof reservationService;