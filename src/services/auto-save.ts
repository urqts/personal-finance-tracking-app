import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/utils";
import { startOfMonth, subMonths, format, parseISO, isBefore } from "date-fns";
import { monthRemaining } from "@/lib/analytics";
import { depositToJar, listJars } from "@/services/jars";
import { listAllTransactions } from "@/services/transactions";
import type { AutoSaveSettings } from "@/types";
import type { AutoSaveInput } from "@/lib/validations";

export async function getAutoSaveSettings(): Promise<AutoSaveSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("auto_save_settings").select("*").maybeSingle();
  if (error) throw toError(error);
  return data;
}

export async function upsertAutoSaveSettings(userId: string, input: AutoSaveInput): Promise<AutoSaveSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("auto_save_settings")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw toError(error);
  return data;
}

export interface AutoSaveResult {
  ran: boolean;
  amount?: number;
  monthLabel?: string;
  reason?: "disabled" | "no-jar" | "already-run" | "no-surplus";
}

function computeAmount(remaining: number, s: AutoSaveSettings): number {
  if (s.mode === "percentage") return Math.max(0, (remaining * Number(s.percentage)) / 100);
  if (s.mode === "fixed") return Math.min(Number(s.fixed_amount), remaining);
  return remaining; // full
}

/**
 * Runs auto-save for the most recently *ended* month if it's due and the month
 * had a positive remaining balance. Idempotent via last_run_month.
 */
export async function runAutoSaveIfDue(userId: string, now = new Date()): Promise<AutoSaveResult> {
  const settings = await getAutoSaveSettings();
  if (!settings || !settings.is_enabled) return { ran: false, reason: "disabled" };
  if (!settings.jar_id) return { ran: false, reason: "no-jar" };

  const prevMonth = startOfMonth(subMonths(now, 1));
  const monthLabel = format(prevMonth, "MMMM yyyy");

  // Already processed this (or a later) month?
  if (settings.last_run_month && !isBefore(parseISO(settings.last_run_month), prevMonth)) {
    return { ran: false, reason: "already-run" };
  }

  const transactions = await listAllTransactions();
  const remaining = monthRemaining(transactions, prevMonth);

  const supabase = createClient();
  const markProcessed = () =>
    supabase.from("auto_save_settings")
      .update({ last_run_month: format(prevMonth, "yyyy-MM-dd") })
      .eq("user_id", userId);

  if (remaining <= 0) {
    await markProcessed();
    return { ran: false, reason: "no-surplus", monthLabel };
  }

  const amount = Number(computeAmount(remaining, settings).toFixed(2));
  if (amount <= 0) {
    await markProcessed();
    return { ran: false, reason: "no-surplus", monthLabel };
  }

  const jars = await listJars();
  const jar = jars.find((j) => j.id === settings.jar_id);
  if (!jar) {
    await markProcessed();
    return { ran: false, reason: "no-jar" };
  }

  await depositToJar(jar, amount, `Auto-save for ${monthLabel}`, userId);
  await markProcessed();
  return { ran: true, amount, monthLabel };
}
