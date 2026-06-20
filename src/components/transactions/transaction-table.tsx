"use client";
import { useState } from "react";
import { ArrowUpDown, MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/shared/icon";
import { formatCurrency, formatDate } from "@/lib/format";
import { useFilterStore } from "@/stores/filter-store";
import { deleteTransaction, duplicateTransaction } from "@/services/transactions";
import { useUser } from "@/hooks/use-user";
import type { TransactionWithCategory, SortField } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  transactions: TransactionWithCategory[];
  currency: string; locale: string;
  selected: string[];
  onSelect: (ids: string[]) => void;
  onEdit: (t: TransactionWithCategory) => void;
  onChanged: () => void;
}

export function TransactionTable({ transactions, currency, locale, selected, onSelect, onEdit, onChanged }: Props) {
  const { sort, setSort } = useFilterStore();
  const { user } = useUser();
  const [busy, setBusy] = useState<string | null>(null);
  const allChecked = transactions.length > 0 && selected.length === transactions.length;

  function toggleAll() {
    onSelect(allChecked ? [] : transactions.map((t) => t.id));
  }
  function toggleOne(id: string) {
    onSelect(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  async function remove(id: string) {
    setBusy(id);
    try { await deleteTransaction(id); toast.success("Deleted"); onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }
  async function duplicate(t: TransactionWithCategory) {
    if (!user) return;
    try { await duplicateTransaction(t, user.id); toast.success("Duplicated"); onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const SortHead = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <TableHead className={className}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort(field)}>
        {label} <ArrowUpDown className={cn("h-3 w-3", sort.field === field ? "opacity-100" : "opacity-40")} />
      </button>
    </TableHead>
  );

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></TableHead>
            <SortHead field="title" label="Transaction" />
            <TableHead>Category</TableHead>
            <TableHead>Tags</TableHead>
            <SortHead field="occurred_on" label="Date" />
            <SortHead field="amount" label="Amount" className="text-right" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id} data-state={selected.includes(t.id) ? "selected" : undefined} className={busy === t.id ? "opacity-50" : ""}>
              <TableCell><Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggleOne(t.id)} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: (t.category?.color ?? "#94a3b8") + "22", color: t.category?.color ?? "#94a3b8" }}>
                    <Icon name={t.category?.icon ?? "circle"} />
                  </span>
                  <div>
                    <p className="font-medium">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  </div>
                  {t.is_transfer && <Badge variant="secondary" className="ml-1">Transfer</Badge>}
                  {t.is_recurring && <Badge variant="outline" className="ml-1">Recurring</Badge>}
                </div>
              </TableCell>
              <TableCell><span className="text-sm text-muted-foreground">{t.category?.name ?? "Uncategorized"}</span></TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(t.tags ?? []).slice(0, 2).map((tag) => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(t.occurred_on)}</TableCell>
              <TableCell className={cn("text-right font-semibold", t.type === "income" ? "text-emerald-500" : "")}>
                {t.type === "income" ? "+" : "−"}{formatCurrency(Number(t.amount), currency, locale)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(t)}><Pencil /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(t)}><Copy /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(t.id)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
