/** Domaine "Mon espace" : types du module (ni React, ni réseau). */

export interface Booking {
  id: string;
  daily_group_id: string | null;
  session_id: string | null;
  status: string;
  date: string;
  activity: string;
  created_at: string;
}

export interface PackageInfo {
  id: string;
  package_code: string;
  first_name: string;
  last_name: string;
  email: string;
  activity: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  status: string;
  expires_at: string;
  deposit_amount: number | null;
  bookings: Booking[];
}

export interface CreditHistoryEntry {
  id: string;
  delta: number;
  kind: string;
  reason: string | null;
  balance_after: number;
  created_at: string;
  is_weather: boolean;
}

export interface WalletEntry {
  package_code: string;
  activity: string;
  package_type: string;
  purchased: number;
  consumed: number;
  recredited: number;
  remaining: number;
  total_sessions: number;
}

export interface CreditEntry {
  id: string;
  activity: string;
  origin: string;
  status: string;
  expires_at: string;
}

export interface ReminderPrefs {
  remind_30: boolean;
  remind_7: boolean;
  remind_0: boolean;
}

export interface PackageFlags {
  packageExpired: boolean;
  packageInactive: boolean;
  noCredits: boolean;
  canBook: boolean;
}
