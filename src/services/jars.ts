import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/utils";
import type { SavingJarWithCategory, JarTransaction } from "@/types";
import type { JarInput } from "@/lib/validations";

const SELECT = "*, category:jar_categories(*)";

export async function listJars(): Promise<SavingJarWithCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saving_jars").select(SELECT).order("created_at", { ascending: false });
  if (error) throw toError(error);
  return (data as unknown as SavingJarWithCategory[]) ?? [];
}

export async function listJarTransactions(jarId: string): Promise<JarTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jar_transactions")
    .select("*")
    .eq("jar_id", jarId)
    .order("created_at", { ascending: false });
  if (error) throw toError(error);
  return data ?? [];
}

export async function createJar(input: JarInput, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("saving_jars").insert({ ...input, user_id: userId });
  if (error) throw toError(error);
}

export async function updateJar(id: string, input: Partial<JarInput>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("saving_jars").update(input).eq("id", id);
  if (error) throw toError(error);
}

export async function deleteJar(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("saving_jars").delete().eq("id", id);
  if (error) throw toError(error);
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Deposit into a jar. Posts an expense transaction to the main ledger, tagged
 * and categorised with the jar's own category, then records the jar movement.
 */
export async function depositToJar(jar: SavingJarWithCategory, amount: number, note: string, userId: string): Promise<void> {
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
      tags: ["saving-jar"],
      is_transfer: true,
      occurred_on: today(),
    })
    .select("id")
    .single();
  if (txErr) throw toError(txErr);

  const { error } = await supabase.from("jar_transactions").insert({
    jar_id: jar.id,
    user_id: userId,
    type: "deposit",
    amount,
    note: note || null,
    transaction_id: tx?.id ?? null,
  });
  if (error) throw toError(error);
}

/** Withdraw from a jar. Posts an income transaction to the main ledger. */
export async function withdrawFromJar(jar: SavingJarWithCategory, amount: number, note: string, userId: string): Promise<void> {
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
      tags: ["saving-jar"],
      is_transfer: true,
      occurred_on: today(),
    })
    .select("id")
    .single();
  if (txErr) throw toError(txErr);

  const { error } = await supabase.from("jar_transactions").insert({
    jar_id: jar.id,
    user_id: userId,
    type: "withdraw",
    amount,
    note: note || null,
    transaction_id: tx?.id ?? null,
  });
  if (error) throw toError(error);
}
