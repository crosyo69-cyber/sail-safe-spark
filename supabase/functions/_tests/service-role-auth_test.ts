import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractBearerToken,
  isServiceRoleRequest,
  isServiceRoleToken,
} from "../_shared/service-role-auth.ts";

const VALID_SECRET = "internal-service-secret-for-test";
const FORGED_JWT = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.";

Deno.test("internal auth rejects absent, invalid, forged, incorrect, almost-correct and empty credentials", () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", VALID_SECRET);

  assertEquals(isServiceRoleToken(""), false);
  assertEquals(isServiceRoleToken("not.a.jwt"), false);
  assertEquals(isServiceRoleToken(FORGED_JWT), false);
  assertEquals(isServiceRoleToken("wrong-secret"), false);
  assertEquals(isServiceRoleToken(`${VALID_SECRET}x`), false);
  assertEquals(isServiceRoleToken(VALID_SECRET), true);
});

Deno.test("internal auth extracts Bearer values and accepts only the exact secret", () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", VALID_SECRET);

  const valid = new Request("https://example.test", {
    headers: { Authorization: `Bearer ${VALID_SECRET}` },
  });
  const forged = new Request("https://example.test", {
    headers: { Authorization: `Bearer ${FORGED_JWT}` },
  });
  const absent = new Request("https://example.test");

  assertEquals(extractBearerToken(valid), VALID_SECRET);
  assert(isServiceRoleRequest(valid));
  assertEquals(isServiceRoleRequest(forged), false);
  assertEquals(isServiceRoleRequest(absent), false);
});
