import { describe, it, expect } from "vitest";
import { transactionSchema, budgetSchema, subscriptionSchema } from "@/lib/validations";

describe("transactionSchema", () => {
  it("accepts a valid expense", () => {
    const r = transactionSchema.safeParse({ title: "Lunch", amount: 12.5, type: "expense", occurred_on: "2026-01-01", tags: [], is_recurring: false, recurrence: "none" });
    expect(r.success).toBe(true);
  });
  it("rejects non-positive amounts", () => {
    const r = transactionSchema.safeParse({ title: "x", amount: 0, type: "expense", occurred_on: "2026-01-01" });
    expect(r.success).toBe(false);
  });
  it("requires a recurrence interval when recurring", () => {
    const r = transactionSchema.safeParse({ title: "x", amount: 5, type: "expense", occurred_on: "2026-01-01", is_recurring: true, recurrence: "none" });
    expect(r.success).toBe(false);
  });
});

describe("budgetSchema", () => {
  it("requires a positive amount", () => {
    expect(budgetSchema.safeParse({ name: "B", amount: -1, period: "monthly", start_date: "2026-01-01" }).success).toBe(false);
  });
});

describe("subscriptionSchema", () => {
  it("requires a renewal date", () => {
    expect(subscriptionSchema.safeParse({ name: "Netflix", cost: 10, billing_cycle: "monthly", next_renewal: "" }).success).toBe(false);
  });
});
