import { addDays, addWeeks, addMonths, addYears, isAfter, parseISO, formatISO } from "date-fns";
import type { Transaction, RecurrenceInterval } from "@/types";

function next(date: Date, interval: RecurrenceInterval): Date {
  switch (interval) {
    case "daily": return addDays(date, 1);
    case "weekly": return addWeeks(date, 1);
    case "monthly": return addMonths(date, 1);
    case "yearly": return addYears(date, 1);
    default: return date;
  }
}

/**
 * Given a recurring template transaction, produce the occurrence dates that
 * should exist between its start and `until` (default: today), excluding the
 * original. Used to materialise future/past recurring instances.
 */
export function occurrencesFor(tx: Transaction, until = new Date()): string[] {
  if (!tx.is_recurring || tx.recurrence === "none") return [];
  const end = tx.recurrence_end ? parseISO(tx.recurrence_end) : until;
  const stop = isAfter(end, until) ? until : end;

  const dates: string[] = [];
  let cursor = next(parseISO(tx.occurred_on), tx.recurrence);
  let guard = 0;
  while (!isAfter(cursor, stop) && guard < 1000) {
    dates.push(formatISO(cursor, { representation: "date" }));
    cursor = next(cursor, tx.recurrence);
    guard++;
  }
  return dates;
}

export function buildOccurrences(tx: Transaction, until = new Date()) {
  return occurrencesFor(tx, until).map((occurred_on) => ({
    user_id: tx.user_id,
    title: tx.title,
    description: tx.description,
    notes: tx.notes,
    amount: tx.amount,
    type: tx.type,
    category_id: tx.category_id,
    tags: tx.tags,
    occurred_on,
    is_recurring: false,
    recurrence: "none" as const,
    parent_id: tx.id,
  }));
}
