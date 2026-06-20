import { z } from "zod";

export const transactionTypeSchema = z.enum(["income", "expense"]);
export const recurrenceSchema = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);
export const billingCycleSchema = z.enum(["weekly", "monthly", "quarterly", "yearly"]);
export const budgetPeriodSchema = z.enum(["monthly", "yearly"]);

export const transactionSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(120),
    description: z.string().max(500).optional().or(z.literal("")),
    notes: z.string().max(1000).optional().or(z.literal("")),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    type: transactionTypeSchema,
    category_id: z.string().uuid().nullable().optional(),
    tags: z.array(z.string().min(1)).max(20).default([]),
    occurred_on: z.string().min(1, "Date is required"),
    is_recurring: z.boolean().default(false),
    recurrence: recurrenceSchema.default("none"),
    recurrence_end: z.string().nullable().optional(),
  })
  .refine((d) => !d.is_recurring || d.recurrence !== "none", {
    message: "Choose a recurrence interval for recurring transactions",
    path: ["recurrence"],
  });

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  type: transactionTypeSchema,
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Invalid color"),
  icon: z.string().min(1),
});

export const budgetSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  period: budgetPeriodSchema.default("monthly"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  start_date: z.string().min(1),
  is_active: z.boolean().default(true),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  target_amount: z.coerce.number().positive("Target must be greater than 0"),
  current_amount: z.coerce.number().min(0).default(0),
  target_date: z.string().nullable().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#10b981"),
  icon: z.string().default("target"),
});

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  billing_cycle: billingCycleSchema.default("monthly"),
  next_renewal: z.string().min(1, "Renewal date is required"),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const preferencesSchema = z.object({
  currency: z.string().length(3),
  locale: z.string().min(2),
  theme: z.enum(["light", "dark", "system"]),
  week_start: z.coerce.number().min(0).max(6),
  monthly_income_target: z.coerce.number().min(0).nullable().optional(),
});

export const importTransactionSchema = z.object({
  title: z.string().min(1),
  amount: z.coerce.number().positive(),
  type: transactionTypeSchema,
  occurred_on: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;

export const jarSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  category_id: z.string().uuid("Select a category"),
  target_amount: z.coerce.number().positive("Target must be greater than 0"),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#6366f1"),
  icon: z.string().default("piggy-bank"),
});

export const jarMovementSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().max(200).optional().or(z.literal("")),
});

export type JarInput = z.infer<typeof jarSchema>;
export type JarMovementInput = z.infer<typeof jarMovementSchema>;
