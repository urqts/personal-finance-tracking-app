import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercent, toDateInput } from "@/lib/format";

describe("format helpers", () => {
  it("formats currency", () => {
    expect(formatCurrency(1234.5, "USD", "en-US")).toContain("1,234.5");
  });
  it("formats percent", () => {
    expect(formatPercent(42.345)).toBe("42.3%");
  });
  it("formats date input", () => {
    expect(toDateInput("2026-06-13")).toBe("2026-06-13");
  });
});
