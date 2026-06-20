import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/utils";
import type { JarCategory } from "@/types";
import type { JarCategoryInput } from "@/lib/validations";

export async function listJarCategories(): Promise<JarCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("jar_categories").select("*").order("name");
  if (error) throw toError(error);
  return data ?? [];
}

export async function createJarCategory(input: JarCategoryInput, userId: string): Promise<JarCategory> {
  const supabase = createClient();
  const { data, error } = await supabase.from("jar_categories").insert({ ...input, user_id: userId }).select().single();
  if (error) throw toError(error);
  return data;
}

export async function updateJarCategory(id: string, input: Partial<JarCategoryInput>): Promise<JarCategory> {
  const supabase = createClient();
  const { data, error } = await supabase.from("jar_categories").update(input).eq("id", id).select().single();
  if (error) throw toError(error);
  return data;
}

export async function deleteJarCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("jar_categories").delete().eq("id", id);
  if (error) throw toError(error);
}
