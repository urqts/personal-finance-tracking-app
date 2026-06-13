import { describe, it, expect } from "vitest";
import {
  computeSummary, monthlyEquivalent, subscriptionMonthlyTotal,
  categoryBreakdown, financialHealthScore, averageMonthlySpending,
} from "@/lib/analytics";
import type { Transaction, TransactionWithCategory, Subscription, Category } from "@/types";

const today = new Date().toISOString().slice(0, 10);

function tx(p: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(), user_id: "u", category_id: null, title: "t", description: null,
    notes: null, amount: 0, type: "expense", tags: [], occurred_on: today, is_recurring: false,
    recurrence: "none", recurrence_end: null, parent_id: null, created_at: today, updated_at: today,
    ...p,
  };
}

describe("computeSummary", () => {
  it("computes balance, savings rate and budget utilization", () => {
    const txns = [tx({ type: "income", amount: 1000 }), tx({ type: "expense", amount: 400 })];
    const s = computeSummary(txns, 800);
    expect(s.totalBalance).toBe(600);
    expect(s.monthlyIncome).toBe(1000);
    expect(s.monthlyExpenses).toBe(400);
    expect(s.savingsRate).toBeCloseTo(60);
    expect(s.budgetUtilization).toBeCloseTo(50);
  });

  it("handles zero income gracefully", () => {
    const s = computeSummary([tx({ type: "expense", amount: 100 })], 0);
    expect(s.savingsRate).toBe(0);
    expect(s.budgetUtilization).toBe(0);
  });
});

describe("monthlyEquivalent", () => {
  it("normalises billing cycles to a monthly amount", () => {
    expect(monthlyEquivalent(12, "yearly")).toBeCloseTo(1);
    expect(monthlyEquivalent(30, "quarterly")).toBeCloseTo(10);
    expect(monthlyEquivalent(10, "monthly")).toBe(10);
  });
});

describe("subscriptionMonthlyTotal", () => {
  it("sums only active subscriptions", () => {
    const subs = [
      { id: "1", user_id: "u", category_id: null, name: "A", cost: 10, billing_cycle: "monthly", next_renewal: today, is_active: true, color: "#000", icon: "x", created_at: today, updated_at: today },
      { id: "2", user_id: "u", category_id: null, name: "B", cost: 120, billing_cycle: "yearly", next_renewal: today, is_active: true, color: "#000", icon: "x", created_at: today, updated_at: today },
      { id: "3", user_id: "u", category_id: null, name: "C", cost: 99, billing_cycle: "monthly", next_renewal: today, is_active: false, color: "#000", icon: "x", created_at: today, updated_at: today },
    ] as Subscription[];
    expect(subscriptionMonthlyTotal(subs)).toBeCloseTo(20);
  });
});

describe("categoryBreakdown", () => {
  it("aggregates and computes percentages", () => {
    const cat = (name: string, color: string): Category => ({ id: name, user_id: "u", name, type: "expense", color, icon: "x", is_default: false, created_at: today, updated_at: today });
    const txns: TransactionWithCategory[] = [
      { ...tx({ amount: 75 }), category: cat("Food", "#f00") },
      { ...tx({ amount: 25 }), category: cat("Food", "#f00") },
      { ...tx({ amount: 100 }), category: cat("Travel", "#00f") },
    ];
    const out = categoryBreakdown(txns, "expense");
    expect(out[0].value).toBe(100);
    expect(out.find((c) => c.name === "Food")?.percentage).toBeCloseTo(50);
  });
});

describe("financialHealthScore", () => {
  it("returns a 0-100 score with a label", () => {
    const r = financialHealthScore({ savingsRate: 80, budgetUtilization: 50, goalProgress: 90 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(typeof r.label).toBe("string");
  });
});

describe("averageMonthlySpending", () => {
  it("returns 0 with no data", () => {
    expect(averageMonthlySpending([], 6)).toBe(0);
  });
});
