// Generated-style Supabase types. Keep in sync with supabase/migrations.
export type TransactionType = "income" | "expense";
export type RecurrenceInterval = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type BudgetPeriod = "monthly" | "yearly";
export type JarCategory = "emergency" | "travel" | "home" | "education" | "gadgets" | "vehicle" | "health" | "gifts" | "other";
export type JarMovement = "deposit" | "withdraw";

type Timestamps = { created_at: string; updated_at: string };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string | null; avatar_url: string | null } & Timestamps;
        Insert: { id: string; email: string; full_name?: string | null; avatar_url?: string | null };
        Update: Partial<{ email: string; full_name: string | null; avatar_url: string | null }>;
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string; currency: string; locale: string; theme: string;
          week_start: number; monthly_income_target: number | null;
        } & Timestamps;
        Insert: { user_id: string } & Partial<{ currency: string; locale: string; theme: string; week_start: number; monthly_income_target: number | null }>;
        Update: Partial<{ currency: string; locale: string; theme: string; week_start: number; monthly_income_target: number | null }>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string; user_id: string; name: string; type: TransactionType;
          color: string; icon: string; is_default: boolean;
        } & Timestamps;
        Insert: { user_id: string; name: string; type: TransactionType } & Partial<{ color: string; icon: string; is_default: boolean }>;
        Update: Partial<{ name: string; type: TransactionType; color: string; icon: string }>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string; user_id: string; category_id: string | null; title: string;
          description: string | null; notes: string | null; amount: number;
          type: TransactionType; tags: string[]; occurred_on: string;
          is_recurring: boolean; recurrence: RecurrenceInterval;
          recurrence_end: string | null; parent_id: string | null;
        } & Timestamps;
        Insert: {
          user_id: string; title: string; amount: number; type: TransactionType;
        } & Partial<{
          category_id: string | null; description: string | null; notes: string | null;
          tags: string[]; occurred_on: string; is_recurring: boolean;
          recurrence: RecurrenceInterval; recurrence_end: string | null; parent_id: string | null;
        }>;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string; user_id: string; name: string; period: BudgetPeriod;
          amount: number; start_date: string; is_active: boolean;
        } & Timestamps;
        Insert: { user_id: string; name: string; amount: number } & Partial<{ period: BudgetPeriod; start_date: string; is_active: boolean }>;
        Update: Partial<{ name: string; period: BudgetPeriod; amount: number; start_date: string; is_active: boolean }>;
        Relationships: [];
      };
      budget_categories: {
        Row: { id: string; budget_id: string; category_id: string; user_id: string; amount: number; created_at: string };
        Insert: { budget_id: string; category_id: string; user_id: string; amount: number };
        Update: Partial<{ amount: number; category_id: string }>;
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string; user_id: string; name: string; target_amount: number;
          current_amount: number; target_date: string | null; color: string;
          icon: string; is_completed: boolean;
        } & Timestamps;
        Insert: { user_id: string; name: string; target_amount: number } & Partial<{ current_amount: number; target_date: string | null; color: string; icon: string; is_completed: boolean }>;
        Update: Partial<{ name: string; target_amount: number; current_amount: number; target_date: string | null; color: string; icon: string; is_completed: boolean }>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string; user_id: string; category_id: string | null; name: string;
          cost: number; billing_cycle: BillingCycle; next_renewal: string;
          is_active: boolean; color: string; icon: string;
        } & Timestamps;
        Insert: { user_id: string; name: string; cost: number; next_renewal: string } & Partial<{ category_id: string | null; billing_cycle: BillingCycle; is_active: boolean; color: string; icon: string }>;
        Update: Partial<{ name: string; cost: number; billing_cycle: BillingCycle; next_renewal: string; is_active: boolean; color: string; icon: string; category_id: string | null }>;
        Relationships: [];
      };
      reports: {
        Row: { id: string; user_id: string; name: string; kind: string; params: Record<string, unknown>; created_at: string };
        Insert: { user_id: string; name: string; kind: string; params?: Record<string, unknown> };
        Update: Partial<{ name: string; kind: string; params: Record<string, unknown> }>;
        Relationships: [];
      };
      audit_logs: {
        Row: { id: string; user_id: string; action: string; entity: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string };
        Insert: { user_id: string; action: string; entity: string; entity_id?: string | null; metadata?: Record<string, unknown> };
        Update: never;
        Relationships: [];
      };
      saving_jars: {
        Row: {
          id: string; user_id: string; name: string; category: JarCategory;
          target_amount: number; current_amount: number; color: string;
          icon: string; is_completed: boolean;
        } & Timestamps;
        Insert: { user_id: string; name: string; target_amount: number } & Partial<{ category: JarCategory; current_amount: number; color: string; icon: string; is_completed: boolean }>;
        Update: Partial<{ name: string; category: JarCategory; target_amount: number; current_amount: number; color: string; icon: string; is_completed: boolean }>;
        Relationships: [];
      };
      jar_transactions: {
        Row: {
          id: string; jar_id: string; user_id: string; type: JarMovement;
          amount: number; note: string | null; transaction_id: string | null; created_at: string;
        };
        Insert: { jar_id: string; user_id: string; type: JarMovement; amount: number } & Partial<{ note: string | null; transaction_id: string | null }>;
        Update: Partial<{ note: string | null; transaction_id: string | null }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
    Enums: {
      transaction_type: TransactionType;
      recurrence_interval: RecurrenceInterval;
      billing_cycle: BillingCycle;
      budget_period: BudgetPeriod;
      jar_category: JarCategory;
      jar_movement: JarMovement;
    };
  };
}
