import { createClient } from "@/lib/supabase/client";
import type { Budget } from "@/types";
import type { BudgetInput } from "@/lib/validations";

export async function listBudgets(): Promise<Budget[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("budgets").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBudget(input: BudgetInput, userId: string): Promise<Budget> {
  const supabase = createClient();
  const { data, error } = await supabase.from("budgets").insert({ ...input, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
  const supabase = createClient();
  const { data, error } = await supabase.from("budgets").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
