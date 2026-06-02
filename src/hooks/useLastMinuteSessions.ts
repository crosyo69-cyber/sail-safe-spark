import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LastMinuteSession {
  id: string;
  date: string;
  time_slot: "morning" | "early_afternoon" | "late_afternoon";
  activity: string;
  max_participants: number;
  status: string;
  notes: string | null;
  weather_condition: string | null;
  weather_note: string | null;
  last_minute_label: "fire" | "wind" | null;
  published_at: string | null;
  taken: number;
  remaining: number;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

async function fetchLastMinute(): Promise<LastMinuteSession[]> {
  const today = todayStr();
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id,date,time_slot,activity,max_participants,status,notes,weather_condition,weather_note,last_minute_label,published_at,is_last_minute")
    .eq("is_last_minute", true)
    .gte("date", today)
    .order("date", { ascending: true });
  if (error || !sessions) return [];

  const ids = sessions.map((s) => s.id);
  if (ids.length === 0) return [];

  const [{ data: res }, { data: pkg }] = await Promise.all([
    supabase.from("reservations").select("session_id,participants,status").in("session_id", ids),
    supabase.from("package_bookings").select("session_id,status").in("session_id", ids),
  ]);

  const counts = new Map<string, number>();
  (res || []).forEach((r: any) => {
    if (r.status !== "cancelled")
      counts.set(r.session_id, (counts.get(r.session_id) || 0) + (r.participants || 1));
  });
  (pkg || []).forEach((b: any) => {
    if (b.status === "confirmed")
      counts.set(b.session_id, (counts.get(b.session_id) || 0) + 1);
  });

  return sessions.map((s: any) => {
    const taken = counts.get(s.id) || 0;
    return { ...s, taken, remaining: Math.max(0, s.max_participants - taken) };
  });
}

export function useLastMinuteSessions(opts?: { weekOnly?: boolean }) {
  const [data, setData] = useState<LastMinuteSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const reload = async () => {
      const list = await fetchLastMinute();
      if (active) {
        setData(list);
        setLoading(false);
      }
    };
    reload();

    const channel = supabase
      .channel("last-minute-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "package_bookings" }, reload)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  let filtered = data;
  if (opts?.weekOnly) {
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const limit = in7.toISOString().slice(0, 10);
    filtered = data.filter((s) => s.date <= limit);
  }
  return { sessions: filtered, loading };
}