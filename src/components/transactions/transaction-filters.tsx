"use client";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterStore } from "@/stores/filter-store";
import type { Category } from "@/types";

export function TransactionFilters({ categories }: { categories: Category[] }) {
  const { filters, setFilters, resetFilters } = useFilterStore();
  const active = filters.search || (filters.type && filters.type !== "all") || filters.categoryIds?.length || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search transactions…" value={filters.search ?? ""} onChange={(e) => setFilters({ search: e.target.value })} />
      </div>

      <Select value={filters.type ?? "all"} onValueChange={(v) => setFilters({ type: v as typeof filters.type })}>
        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.categoryIds?.[0] ?? "all"} onValueChange={(v) => setFilters({ categoryIds: v === "all" ? [] : [v] })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input type="date" className="w-[150px]" value={filters.dateFrom ?? ""} onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })} />
      <Input type="date" className="w-[150px]" value={filters.dateTo ?? ""} onChange={(e) => setFilters({ dateTo: e.target.value || undefined })} />

      {active ? (
        <Button variant="ghost" size="sm" onClick={resetFilters}><X className="h-4 w-4" /> Clear</Button>
      ) : null}
    </div>
  );
}
