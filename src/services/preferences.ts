import { createClient } from "@/lib/supabase/client";
import type { UserPreferences, Profile } from "@/types";
import type { PreferencesInput } from "@/lib/validations";

export async function getPreferences(): Promise<UserPreferences | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("user_preferences").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePreferences(userId: string, input: Partial<PreferencesInput>): Promise<UserPreferences> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, input: { full_name?: string }): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").update(input).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}
