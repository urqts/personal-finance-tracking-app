import { create } from "zustand";
import type { TransactionFilters, SortField, SortDir } from "@/types";

interface FilterState {
  filters: TransactionFilters;
  sort: { field: SortField; dir: SortDir };
  page: number;
  setFilters: (f: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  setSort: (field: SortField) => void;
  setPage: (page: number) => void;
}

const defaultFilters: TransactionFilters = { type: "all", search: "" };

export const useFilterStore = create<FilterState>((set) => ({
  filters: defaultFilters,
  sort: { field: "occurred_on", dir: "desc" },
  page: 0,
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f }, page: 0 })),
  resetFilters: () => set({ filters: defaultFilters, page: 0 }),
  setSort: (field) =>
    set((s) => ({
      sort: {
        field,
        dir: s.sort.field === field && s.sort.dir === "desc" ? "asc" : "desc",
      },
      page: 0,
    })),
  setPage: (page) => set({ page }),
}));
