import { describe, expect, it } from "vitest";
import { creditMaintenanceTone } from "./types";

describe("creditMaintenanceTone", () => {
  it("mappe ok -> ok", () => expect(creditMaintenanceTone("ok")).toBe("ok"));
  it("mappe warning -> warn", () => expect(creditMaintenanceTone("warning")).toBe("warn"));
  it("mappe danger -> danger", () => expect(creditMaintenanceTone("danger")).toBe("danger"));
});
