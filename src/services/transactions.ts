import { createClient } from "@/lib/supabase/client";
import type {
  Transaction, TransactionWithCategory, TransactionFilters, SortField, SortDir,
} from "@/types";
import type { Database } from "@/types/database";

type TxInsert = Database["public"]["Tables"]["transactions"]["Insert"];
import type { TransactionInput } from "@/lib/validations";
import { toError } from "@/lib/utils";

const TABLE = "transactions";
const SELECT = "*, category:categories(*)";

export async function listTransactions(opts?: {
  filters?: TransactionFilters;
  sort?: { field: SortField; dir: SortDir };
  page?: number;
  pageSize?: number;
}): Promise<{ data: TransactionWithCategory[]; count: number }> {
  const supabase = createClient();
  const { filters, sort, page = 0, pageSize = 25 } = opts ?? {};
  let query = supabase.from(TABLE).select(SELECT, { count: "exact" });

  if (filters?.type && filters.type !== "all") query = query.eq("type", filters.type);
  if (filters?.categoryIds?.length) query = query.in("category_id", filters.categoryIds);
  if (filters?.tags?.length) query = query.overlaps("tags", filters.tags);
  if (filters?.dateFrom) query = query.gte("occurred_on", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("occurred_on", filters.dateTo);
  if (filters?.amountMin != null) query = query.gte("amount", filters.amountMin);
  if (filters?.amountMax != null) query = query.lte("amount", filters.amountMax);
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

  const field = sort?.field ?? "occurred_on";
  query = query.order(field, { ascending: sort?.dir === "asc" }).order("created_at", { ascending: false });
  query = query.range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw toError(error);
  return { data: (data as unknown as TransactionWithCategory[]) ?? [], count: count ?? 0 };
}

export async function listAllTransactions(): Promise<TransactionWithCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from(TABLE).select(SELECT).order("occurred_on", { ascending: false });
  if (error) throw toError(error);
  return (data as unknown as TransactionWithCategory[]) ?? [];
}

export async function createTransaction(input: TransactionInput, userId: string): Promise<Transaction> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...normalize(input), user_id: userId })
    .select()
    .single();
  if (error) throw toError(error);
  return data as Transaction;
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  const supabase = createClient();
  const { data, error } = await supabase.from(TABLE).update(normalize(input)).eq("id", id).select().single();
  if (error) throw toError(error);
  return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw toError(error);
}

export async function bulkDelete(ids: string[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).delete().in("id", ids);
  if (error) throw toError(error);
}

export async function bulkUpdateCategory(ids: string[], categoryId: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).update({ category_id: categoryId }).in("id", ids);
  if (error) throw toError(error);
}

export async function duplicateTransaction(tx: Transaction, userId: string): Promise<Transaction> {
  const supabase = createClient();
  const { id, created_at, updated_at, ...rest } = tx;
  void id; void created_at; void updated_at;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...rest, user_id: userId, title: `${tx.title} (copy)` })
    .select()
    .single();
  if (error) throw toError(error);
  return data as Transaction;
}

export async function bulkInsert(rows: TxInsert[]): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.from(TABLE).insert(rows).select("id");
  if (error) throw toError(error);
  return data?.length ?? 0;
}

function normalize(input: TransactionInput) {
  return {
    title: input.title,
    description: input.description || null,
    notes: input.notes || null,
    amount: input.amount,
    type: input.type,
    category_id: input.category_id || null,
    tags: input.tags ?? [],
    occurred_on: input.occurred_on,
    is_recurring: input.is_recurring,
    recurrence: input.recurrence,
    recurrence_end: input.recurrence_end || null,
  };
}
