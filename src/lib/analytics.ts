import { format, parseISO, startOfMonth, subMonths, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import type {
  Transaction, TransactionWithCategory, Category, Subscription,
  DashboardSummary, MonthlyTrendPoint, CategoryBreakdownPoint, BillingCycle,
  SavingJar, JarCategorySummary, JarCategory,
} from "@/types";
import { BILLING_CYCLES } from "./constants";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function monthlyEquivalent(cost: number, cycle: BillingCycle): number {
  const c = BILLING_CYCLES.find((b) => b.value === cycle);
  return cost * (c?.perMonth ?? 1);
}

export function inMonth(tx: Transaction, ref = new Date()): boolean {
  const d = parseISO(tx.occurred_on);
  const start = startOfMonth(ref);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
  return isWithinInterval(d, { start, end });
}

export function computeSummary(
  txns: Transaction[],
  monthlyBudgetTotal: number,
  ref = new Date()
): DashboardSummary {
  const income = sum(txns.filter((t) => t.type === "income").map((t) => Number(t.amount)));
  const expenses = sum(txns.filter((t) => t.type === "expense").map((t) => Number(t.amount)));
  const totalBalance = income - expenses;

  const monthTx = txns.filter((t) => inMonth(t, ref));
  const monthlyIncome = sum(monthTx.filter((t) => t.type === "income").map((t) => Number(t.amount)));
  const monthlyExpenses = sum(monthTx.filter((t) => t.type === "expense").map((t) => Number(t.amount)));

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const budgetUtilization = monthlyBudgetTotal > 0 ? (monthlyExpenses / monthlyBudgetTotal) * 100 : 0;

  return { totalBalance, monthlyIncome, monthlyExpenses, savingsRate, budgetUtilization };
}

export function monthlyTrend(txns: Transaction[], months = 6, ref = new Date()): MonthlyTrendPoint[] {
  const points: MonthlyTrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = startOfMonth(subMonths(ref, i));
    const monthTx = txns.filter((t) => {
      const d = parseISO(t.occurred_on);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    });
    const income = sum(monthTx.filter((t) => t.type === "income").map((t) => Number(t.amount)));
    const expenses = sum(monthTx.filter((t) => t.type === "expense").map((t) => Number(t.amount)));
    points.push({ month: format(m, "MMM"), income, expenses, net: income - expenses });
  }
  return points;
}

export function categoryBreakdown(
  txns: TransactionWithCategory[],
  type: "income" | "expense" = "expense"
): CategoryBreakdownPoint[] {
  const map = new Map<string, CategoryBreakdownPoint>();
  for (const t of txns.filter((x) => x.type === type)) {
    const id = t.category?.id ?? "uncategorized";
    const existing = map.get(id);
    const amount = Number(t.amount);
    if (existing) existing.value += amount;
    else
      map.set(id, {
        categoryId: id,
        name: t.category?.name ?? "Uncategorized",
        color: t.category?.color ?? "#94a3b8",
        value: amount,
        percentage: 0,
      });
  }
  const total = sum([...map.values()].map((v) => v.value));
  const arr = [...map.values()].sort((a, b) => b.value - a.value);
  arr.forEach((p) => (p.percentage = total > 0 ? (p.value / total) * 100 : 0));
  return arr;
}

export function topCategories(txns: TransactionWithCategory[], n = 5): CategoryBreakdownPoint[] {
  return categoryBreakdown(txns, "expense").slice(0, n);
}

export function averageMonthlySpending(txns: Transaction[], months = 6, ref = new Date()): number {
  const trend = monthlyTrend(txns, months, ref);
  return trend.length ? sum(trend.map((t) => t.expenses)) / trend.length : 0;
}

export function subscriptionMonthlyTotal(subs: Subscription[]): number {
  return sum(subs.filter((s) => s.is_active).map((s) => monthlyEquivalent(Number(s.cost), s.billing_cycle)));
}

export function yearlyTotals(txns: Transaction[], ref = new Date()) {
  const start = startOfYear(ref);
  const end = endOfYear(ref);
  const yearTx = txns.filter((t) => isWithinInterval(parseISO(t.occurred_on), { start, end }));
  const income = sum(yearTx.filter((t) => t.type === "income").map((t) => Number(t.amount)));
  const expenses = sum(yearTx.filter((t) => t.type === "expense").map((t) => Number(t.amount)));
  return { income, expenses, net: income - expenses };
}

/** Simple 0-100 financial-health score based on savings rate, budget adherence and goal progress. */
export function financialHealthScore(opts: {
  savingsRate: number;
  budgetUtilization: number;
  goalProgress: number;
}): { score: number; label: string } {
  const savings = Math.max(0, Math.min(100, opts.savingsRate)) * 0.4;
  const budget = Math.max(0, 100 - Math.max(0, opts.budgetUtilization - 100)) * 0.3;
  const goals = Math.max(0, Math.min(100, opts.goalProgress)) * 0.3;
  const score = Math.round(savings + Math.min(30, budget * 0.3) + goals);
  const clamped = Math.max(0, Math.min(100, score));
  const label = clamped >= 75 ? "Excellent" : clamped >= 50 ? "Good" : clamped >= 30 ? "Fair" : "Needs work";
  return { score: clamped, label };
}


const JAR_LABELS: Record<JarCategory, { label: string; color: string }> = {
  emergency: { label: "Emergency", color: "#ef4444" },
  travel: { label: "Travel", color: "#0ea5e9" },
  home: { label: "Home", color: "#f97316" },
  education: { label: "Education", color: "#6366f1" },
  gadgets: { label: "Gadgets", color: "#8b5cf6" },
  vehicle: { label: "Vehicle", color: "#14b8a6" },
  health: { label: "Health", color: "#06b6d4" },
  gifts: { label: "Gifts", color: "#ec4899" },
  other: { label: "Other", color: "#64748b" },
};

export function jarCategorySummaries(jars: SavingJar[]): JarCategorySummary[] {
  const map = new Map<JarCategory, JarCategorySummary>();
  for (const jar of jars) {
    const meta = JAR_LABELS[jar.category];
    const existing = map.get(jar.category);
    if (existing) {
      existing.jarCount += 1;
      existing.saved += Number(jar.current_amount);
      existing.target += Number(jar.target_amount);
    } else {
      map.set(jar.category, {
        category: jar.category,
        label: meta.label,
        color: meta.color,
        jarCount: 1,
        saved: Number(jar.current_amount),
        target: Number(jar.target_amount),
        percentage: 0,
      });
    }
  }
  const arr = [...map.values()];
  arr.forEach((s) => (s.percentage = s.target > 0 ? (s.saved / s.target) * 100 : 0));
  return arr.sort((a, b) => b.saved - a.saved);
}

export function totalSaved(jars: SavingJar[]): number {
  return sum(jars.map((j) => Number(j.current_amount)));
}

export function jarsOverallProgress(jars: SavingJar[]): number {
  if (jars.length === 0) return 0;
  return (sum(jars.map((j) => (j.target_amount > 0 ? Math.min(Number(j.current_amount) / Number(j.target_amount), 1) : 0))) / jars.length) * 100;
}
