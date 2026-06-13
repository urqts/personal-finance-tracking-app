import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "@/types";
import type { SubscriptionInput } from "@/lib/validations";

export async function listSubscriptions(): Promise<Subscription[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("subscriptions").select("*").order("next_renewal");
  if (error) throw error;
  return data ?? [];
}

export async function createSubscription(input: SubscriptionInput, userId: string): Promise<Subscription> {
  const supabase = createClient();
  const { data, error } = await supabase.from("subscriptions").insert({ ...input, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateSubscription(id: string, input: Partial<SubscriptionInput>): Promise<Subscription> {
  const supabase = createClient();
  const { data, error } = await supabase.from("subscriptions").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}
