import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";
import type { CategoryInput } from "@/lib/validations";

export async function listCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(input: CategoryInput, userId: string): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").insert({ ...input, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
