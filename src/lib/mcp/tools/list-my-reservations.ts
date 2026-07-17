import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

// This module is bundled into a Deno edge function at build time; `process.env`
// is provided by Deno at runtime. Declare it here so the app's TS config
// (no @types/node) still typechecks.
declare const process: { env: Record<string, string | undefined> };

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_reservations",
  title: "List my reservations",
  description:
    "List the signed-in user's Kitesurf Passion reservations (id, session, participants, skill level, status, dates).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "Not authenticated" }],
        isError: true,
      };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("reservations")
      .select(
        "id, participants, skill_level, status, notes, created_at, updated_at, session_id, sessions ( starts_at, ends_at, discipline, location )",
      )
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false });

    if (error) {
      return {
        content: [{ type: "text", text: error.message }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { reservations: data ?? [] },
    };
  },
});