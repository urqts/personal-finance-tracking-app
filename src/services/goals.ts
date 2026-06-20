import { createClient } from "@/lib/supabase/client";
import type { SavingsGoal } from "@/types";
import type { SavingsGoalInput } from "@/lib/validations";
import { toError } from "@/lib/utils";

export async function listGoals(): Promise<SavingsGoal[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("savings_goals").select("*").order("created_at", { ascending: false });
  if (error) throw toError(error);
  return data ?? [];
}

export async function createGoal(input: SavingsGoalInput, userId: string): Promise<SavingsGoal> {
  const supabase = createClient();
  const { data, error } = await supabase.from("savings_goals").insert({ ...input, user_id: userId }).select().single();
  if (error) throw toError(error);
  return data;
}

export async function updateGoal(id: string, input: Partial<SavingsGoalInput> & { is_completed?: boolean }): Promise<SavingsGoal> {
  const supabase = createClient();
  const { data, error } = await supabase.from("savings_goals").update(input).eq("id", id).select().single();
  if (error) throw toError(error);
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw toError(error);
}
