import Papa from "papaparse";
import { importTransactionSchema } from "./validations";
import type { Transaction } from "@/types";

export interface ParsedRow {
  raw: Record<string, string>;
  data?: {
    title: string;
    amount: number;
    type: "income" | "expense";
    occurred_on: string;
    category?: string;
    description?: string;
    tags: string[];
  };
  error?: string;
  isDuplicate?: boolean;
}

const FIELD_ALIASES: Record<string, string[]> = {
  title: ["title", "name", "description", "payee", "memo"],
  amount: ["amount", "value", "total", "price"],
  type: ["type", "kind", "direction"],
  occurred_on: ["occurred_on", "date", "transaction date", "posted"],
  category: ["category", "cat"],
  tags: ["tags", "labels"],
};

function pick(row: Record<string, string>, field: string): string | undefined {
  const keys = Object.keys(row);
  for (const alias of FIELD_ALIASES[field] ?? [field]) {
    const k = keys.find((key) => key.trim().toLowerCase() === alias);
    if (k && row[k] != null && row[k] !== "") return row[k];
  }
  return undefined;
}

function normalizeType(v: string | undefined, amount: number): "income" | "expense" {
  if (v) {
    const lower = v.toLowerCase();
    if (["income", "credit", "in", "deposit"].includes(lower)) return "income";
    if (["expense", "debit", "out", "withdrawal"].includes(lower)) return "expense";
  }
  return amount < 0 ? "expense" : "income";
}

/** Detect duplicates against existing transactions by date+amount+title. */
function dupKey(title: string, amount: number, date: string) {
  return `${title.trim().toLowerCase()}|${amount.toFixed(2)}|${date}`;
}

export function parseTransactionsCsv(csv: string, existing: Transaction[] = []): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const existingKeys = new Set(
    existing.map((t) => dupKey(t.title, Number(t.amount), t.occurred_on))
  );

  return result.data.map((raw): ParsedRow => {
    const rawAmount = pick(raw, "amount") ?? "";
    const numeric = parseFloat(rawAmount.replace(/[^0-9.-]/g, ""));
    const type = normalizeType(pick(raw, "type"), numeric);
    const candidate = {
      title: pick(raw, "title") ?? "",
      amount: Math.abs(numeric),
      type,
      occurred_on: pick(raw, "occurred_on") ?? "",
      category: pick(raw, "category"),
      description: pick(raw, "title"),
      tags: pick(raw, "tags") ?? "",
    };

    const parsed = importTransactionSchema.safeParse(candidate);
    if (!parsed.success) {
      return { raw, error: parsed.error.issues.map((i) => i.message).join("; ") };
    }

    const key = dupKey(parsed.data.title, parsed.data.amount, parsed.data.occurred_on);
    return {
      raw,
      data: {
        title: parsed.data.title,
        amount: parsed.data.amount,
        type: parsed.data.type,
        occurred_on: parsed.data.occurred_on,
        category: parsed.data.category,
        description: parsed.data.description,
        tags: parsed.data.tags ? parsed.data.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      },
      isDuplicate: existingKeys.has(key),
    };
  });
}
