import type { Database, TransactionType, RecurrenceInterval, BillingCycle, BudgetPeriod, JarMovement } from "./database";

type T = Database["public"]["Tables"];

export type Profile = T["profiles"]["Row"];
export type UserPreferences = T["user_preferences"]["Row"];
export type Category = T["categories"]["Row"];
export type Transaction = T["transactions"]["Row"];
export type Budget = T["budgets"]["Row"];
export type BudgetCategory = T["budget_categories"]["Row"];
export type SavingsGoal = T["savings_goals"]["Row"];
export type JarCategory = T["jar_categories"]["Row"];
export type SavingJar = T["saving_jars"]["Row"];
export type JarTransaction = T["jar_transactions"]["Row"];
export type SavingJarWithCategory = SavingJar & { category: JarCategory | null };
export type Subscription = T["subscriptions"]["Row"];
export type Report = T["reports"]["Row"];
export type AuditLog = T["audit_logs"]["Row"];

export type { TransactionType, RecurrenceInterval, BillingCycle, BudgetPeriod, JarMovement };

export interface JarCategorySummary {
  categoryId: string;
  label: string;
  color: string;
  jarCount: number;
  saved: number;
  target: number;
  percentage: number;
}

/** Transaction joined with its category (used in tables/lists). */
export type TransactionWithCategory = Transaction & { category: Category | null };

export interface TransactionFilters {
  search?: string;
  type?: TransactionType | "all";
  categoryIds?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export type SortField = "occurred_on" | "amount" | "title";
export type SortDir = "asc" | "desc";

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  budgetUtilization: number;
}

export interface MonthlyTrendPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdownPoint {
  categoryId: string;
  name: string;
  color: string;
  value: number;
  percentage: number;
}
