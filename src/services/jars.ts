import { createClient } from "@/lib/supabase/client";
import type { SavingJar, JarTransaction } from "@/types";
import type { JarInput } from "@/lib/validations";

export async function listJars(): Promise<SavingJar[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saving_jars").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listJarTransactions(jarId: string): Promise<JarTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jar_transactions")
    .select("*")
    .eq("jar_id", jarId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createJar(input: JarInput, userId: string): Promise<SavingJar> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saving_jars").insert({ ...input, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateJar(id: string, input: Partial<JarInput>): Promise<SavingJar> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saving_jars").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJar(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("saving_jars").delete().eq("id", id);
  if (error) throw error;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Deposit into a jar. Also posts an expense transaction to the main ledger
 * (money moved out of spendable balance into savings) and links the two.
 */
export async function depositToJar(jar: SavingJar, amount: number, note: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      title: `Deposit to ${jar.name}`,
      description: note || null,
      amount,
      type: "expense",
      category_id: null,
      tags: ["saving-jar", jar.category],
      occurred_on: today(),
    })
    .select("id")
    .single();
  if (txErr) throw txErr;

  const { error } = await supabase.from("jar_transactions").insert({
    jar_id: jar.id,
    user_id: userId,
    type: "deposit",
    amount,
    note: note || null,
    transaction_id: tx?.id ?? null,
  });
  if (error) throw error;
}

/**
 * Withdraw from a jar. Also posts an income transaction to the main ledger
 * (money returned to spendable balance).
 */
export async function withdrawFromJar(jar: SavingJar, amount: number, note: string, userId: string): Promise<void> {
  if (amount > Number(jar.current_amount)) {
    throw new Error("Cannot withdraw more than the jar balance");
  }
  const supabase = createClient();
  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      title: `Withdraw from ${jar.name}`,
      description: note || null,
      amount,
      type: "income",
      category_id: null,
      tags: ["saving-jar", jar.category],
      occurred_on: today(),
    })
    .select("id")
    .single();
  if (txErr) throw txErr;

  const { error } = await supabase.from("jar_transactions").insert({
    jar_id: jar.id,
    user_id: userId,
    type: "withdraw",
    amount,
    note: note || null,
    transaction_id: tx?.id ?? null,
  });
  if (error) throw error;
}
