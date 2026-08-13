import { createApiClient } from "./_shared/api";
import type { Result } from "./_shared/result";
import type { Database } from "@/integrations/supabase/types";

const api = createApiClient({ scope: "reservation" });

type Fn = Database["public"]["Functions"];
export type ActivityType = Database["public"]["Enums"]["activity_type"];

/**
 * Contract mirror of the real Postgres functions (verified against the
 * generated Supabase types + migrations). Do NOT invent parameters here:
 * every signature below matches `public.<fn>` exactly.
 */
export const reservationService = {
  /**
   * public.get_daily_availability(p_date date) -> json
   * One day at a time — there is no range overload in the database.
   */
  getDailyAvailability: (args: Fn["get_daily_availability"]["Args"]): Promise<Result<unknown>> =>
    api.rpc("get_daily_availability", args),

  /** public.book_daily_with_code(p_code text, p_date date) -> json */
  bookDailyWithCode: (args: Fn["book_daily_with_code"]["Args"]) =>
    api.rpc("book_daily_with_code", args, { retries: 1 }),

  /** public.book_stage_100_glisse(p_code text, p_start_date date) -> json */
  bookStage100Glisse: (args: Fn["book_stage_100_glisse"]["Args"]) =>
    api.rpc("book_stage_100_glisse", args, { retries: 1 }),

  /** public.cancel_booking_with_code(p_booking_id uuid, p_code text) -> json */
  cancelBookingWithCode: (args: Fn["cancel_booking_with_code"]["Args"]) =>
    api.rpc("cancel_booking_with_code", args, { retries: 1 }),

  /** Waitlist */
  joinWaitlist: (args: Fn["join_waitlist"]["Args"]) =>
    api.rpc("join_waitlist", args, { retries: 1 }),
  getWaitlistOffer: (args: Fn["get_waitlist_offer"]["Args"]) =>
    api.rpc("get_waitlist_offer", args),
  confirmWaitlistOffer: (args: Fn["confirm_waitlist_offer"]["Args"]) =>
    api.rpc("confirm_waitlist_offer", args, { retries: 1 }),

  /** Admin */
  listDailyGroups: (args: Fn["admin_list_daily_groups"]["Args"]) =>
    api.rpc("admin_list_daily_groups", args),
  listDailyGroupsRange: (args: Fn["admin_list_daily_groups_range"]["Args"]) =>
    api.rpc("admin_list_daily_groups_range", args),
  updateDailyGroup: (args: Fn["admin_update_daily_group"]["Args"]) =>
    api.rpc("admin_update_daily_group", args, { retries: 1 }),
  cancelDailyGroup: (args: Fn["admin_cancel_daily_group"]["Args"]) =>
    api.rpc("admin_cancel_daily_group", args, { retries: 1 }),
  cancelDay: (args: Fn["admin_cancel_day"]["Args"]) =>
    api.rpc("admin_cancel_day", args, { retries: 1 }),
  cancelGroupAndRecredit: (args: Fn["admin_cancel_group_and_recredit"]["Args"]) =>
    api.rpc("admin_cancel_group_and_recredit", args, { retries: 1 }),
  cancelAndRecredit: (args: Fn["admin_cancel_and_recredit"]["Args"]) =>
    api.rpc("admin_cancel_and_recredit", args, { retries: 1 }),
  removeGroupMember: (args: Fn["admin_remove_group_member"]["Args"]) =>
    api.rpc("admin_remove_group_member", args, { retries: 1 }),
  rescheduleBooking: (args: Fn["admin_reschedule_booking"]["Args"]) =>
    api.rpc("admin_reschedule_booking", args, { retries: 1 }),
};

export type ReservationService = typeof reservationService;
