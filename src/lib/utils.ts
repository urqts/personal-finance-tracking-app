import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalises errors (including Supabase/Postgrest plain-object errors, which are
 * NOT Error instances) into a real Error with a human-friendly message.
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: string; details?: string; hint?: string };
    const code = e.code;
    if (code === "23505") return new Error("That already exists — try a different name.");
    if (code === "23503") return new Error("A related record is missing.");
    if (code === "23514") return new Error("One of the values isn't allowed.");
    if (code === "42501" || (e.message ?? "").toLowerCase().includes("row-level security")) {
      return new Error("You don't have permission to do that. Try signing in again.");
    }
    return new Error(e.message || e.details || e.hint || "Something went wrong.");
  }
  return new Error("Something went wrong.");
}
