import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getSchoolInfo from "./tools/get-school-info";
import listMyReservations from "./tools/list-my-reservations";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud
// proxy). Build it from VITE_SUPABASE_PROJECT_ID so it stays import-safe.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kitesurf-passion-mcp",
  title: "Kitesurf Passion",
  version: "0.1.0",
  instructions:
    "Tools for Kitesurf Passion (école de kitesurf & wingfoil à Hyères, France). Use `get_school_info` for public school details and `list_my_reservations` to read the signed-in user's bookings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getSchoolInfo, listMyReservations],
});