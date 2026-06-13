"use client";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadExcel, type ExportKind } from "@/lib/excel";
import type { FinanceData } from "@/hooks/use-finance-data";

const OPTIONS: { kind: ExportKind; label: string }[] = [
  { kind: "transactions", label: "Transactions" },
  { kind: "budgets", label: "Budgets" },
  { kind: "goals", label: "Savings Goals" },
  { kind: "subscriptions", label: "Subscriptions" },
  { kind: "analytics", label: "Analytics Report" },
  { kind: "full", label: "Full Data Export" },
];

export function ExportMenu({ data, currency }: { data: FinanceData; currency: string }) {
  async function run(kind: ExportKind) {
    try {
      await downloadExcel(kind, {
        transactions: data.transactions,
        budgets: data.budgets,
        goals: data.goals,
        subscriptions: data.subscriptions,
        currency,
      });
      toast.success("Export ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export to Excel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((o) => <DropdownMenuItem key={o.kind} onClick={() => run(o.kind)}>{o.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
