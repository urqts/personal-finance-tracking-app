"use client";

import { useMemo, useState } from "react";
import { Plus, Upload, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { ImportDialog } from "@/components/transactions/import-dialog";
import { ExportMenu } from "@/components/transactions/export-menu";
import { useFinanceData } from "@/hooks/use-finance-data";
import { usePreferences } from "@/hooks/use-preferences";
import { useFilterStore } from "@/stores/filter-store";
import { bulkDelete, bulkUpdateCategory } from "@/services/transactions";
import { PAGE_SIZE } from "@/lib/constants";
import type { TransactionWithCategory } from "@/types";

export default function TransactionsPage() {
  const { data, loading, reload } = useFinanceData();
  const { currency, locale } = usePreferences();
  const { filters, sort, page, setPage } = useFilterStore();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let rows = [...data.transactions];
    if (filters.type && filters.type !== "all") rows = rows.filter((t) => t.type === filters.type);
    if (filters.categoryIds?.length) rows = rows.filter((t) => t.category_id && filters.categoryIds!.includes(t.category_id));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q) || (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)));
    }
    if (filters.dateFrom) rows = rows.filter((t) => t.occurred_on >= filters.dateFrom!);
    if (filters.dateTo) rows = rows.filter((t) => t.occurred_on <= filters.dateTo!);
    rows.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.field === "amount") return (Number(a.amount) - Number(b.amount)) * dir;
      if (sort.field === "title") return a.title.localeCompare(b.title) * dir;
      return (a.occurred_on < b.occurred_on ? -1 : 1) * dir;
    });
    return rows;
  }, [data.transactions, filters, sort]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  async function handleBulkDelete() {
    try { await bulkDelete(selected); toast.success(`Deleted ${selected.length}`); setSelected([]); reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function handleBulkCategory(categoryId: string) {
    try { await bulkUpdateCategory(selected, categoryId); toast.success("Category updated"); setSelected([]); reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <>
      <Topbar title="Transactions" />
      <main className="space-y-4 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{filtered.length} transactions</p>
          <div className="flex items-center gap-2">
            <ExportMenu data={data} currency={currency} />
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Import</Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </div>

        <TransactionFilters categories={data.categories} />

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-secondary/40 p-2 text-sm">
            <span className="px-2 font-medium">{selected.length} selected</span>
            <Select onValueChange={handleBulkCategory}>
              <SelectTrigger className="h-8 w-[180px]"><Tag className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="Set category" /></SelectTrigger>
              <SelectContent>{data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="arrow-left-right" title="No transactions found" description="Adjust filters or add your first transaction." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add transaction</Button>} />
        ) : (
          <>
            <TransactionTable transactions={pageRows} currency={currency} locale={locale} selected={selected} onSelect={setSelected} onEdit={(t) => { setEditing(t); setFormOpen(true); }} onChanged={reload} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} categories={data.categories} transaction={editing} onSaved={reload} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} categories={data.categories} existing={data.transactions} onImported={reload} />
    </>
  );
}
