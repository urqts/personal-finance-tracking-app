import type { TransactionType, RecurrenceInterval, BillingCycle } from "@/types";

export const APP_NAME = "Fintrack";
export const PAGE_SIZE = 25;

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export const RECURRENCE_OPTIONS: { value: RecurrenceInterval; label: string }[] = [
  { value: "none", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const BILLING_CYCLES: { value: BillingCycle; label: string; perMonth: number }[] = [
  { value: "weekly", label: "Weekly", perMonth: 52 / 12 },
  { value: "monthly", label: "Monthly", perMonth: 1 },
  { value: "quarterly", label: "Quarterly", perMonth: 1 / 3 },
  { value: "yearly", label: "Yearly", perMonth: 1 / 12 },
];

export const CATEGORY_COLORS = [
  "#6366f1", "#22c55e", "#f97316", "#3b82f6", "#ec4899", "#ef4444",
  "#8b5cf6", "#06b6d4", "#0ea5e9", "#f43f5e", "#84cc16", "#14b8a6",
  "#a855f7", "#eab308", "#64748b",
];

export const CATEGORY_ICONS = [
  "circle", "wallet", "briefcase", "trending-up", "gift", "utensils",
  "car", "shopping-bag", "receipt", "clapperboard", "heart-pulse",
  "graduation-cap", "plane", "credit-card", "home", "dumbbell",
  "coffee", "smartphone", "gamepad-2", "piggy-bank",
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/transactions", label: "Transactions", icon: "arrow-left-right" },
  { href: "/budgets", label: "Budgets", icon: "wallet" },
  { href: "/goals", label: "Savings Goals", icon: "target" },
  { href: "/jars", label: "Saving Jars", icon: "piggy-bank" },
  { href: "/subscriptions", label: "Subscriptions", icon: "credit-card" },
  { href: "/analytics", label: "Analytics", icon: "bar-chart-3" },
  { href: "/categories", label: "Categories", icon: "tags" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "THB", "SGD"];

export const JAR_CATEGORIES: { value: import("@/types").JarCategory; label: string; color: string; icon: string }[] = [
  { value: "emergency", label: "Emergency", color: "#ef4444", icon: "shield" },
  { value: "travel", label: "Travel", color: "#0ea5e9", icon: "plane" },
  { value: "home", label: "Home", color: "#f97316", icon: "home" },
  { value: "education", label: "Education", color: "#6366f1", icon: "graduation-cap" },
  { value: "gadgets", label: "Gadgets", color: "#8b5cf6", icon: "smartphone" },
  { value: "vehicle", label: "Vehicle", color: "#14b8a6", icon: "car" },
  { value: "health", label: "Health", color: "#06b6d4", icon: "heart-pulse" },
  { value: "gifts", label: "Gifts", color: "#ec4899", icon: "gift" },
  { value: "other", label: "Other", color: "#64748b", icon: "piggy-bank" },
];
