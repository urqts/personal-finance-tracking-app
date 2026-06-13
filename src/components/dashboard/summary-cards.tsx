"use client";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DashboardSummary } from "@/types";
import { cn } from "@/lib/utils";

export function SummaryCards({ summary, currency, locale }: { summary: DashboardSummary; currency: string; locale: string }) {
  const fmt = (v: number) => formatCurrency(v, currency, locale);
  const cards = [
    { label: "Total Balance", value: fmt(summary.totalBalance), icon: Wallet, tone: summary.totalBalance >= 0 ? "text-emerald-500" : "text-destructive" },
    { label: "Monthly Income", value: fmt(summary.monthlyIncome), icon: ArrowUpRight, tone: "text-emerald-500" },
    { label: "Monthly Expenses", value: fmt(summary.monthlyExpenses), icon: ArrowDownRight, tone: "text-rose-500" },
    { label: "Savings Rate", value: formatPercent(summary.savingsRate), icon: PiggyBank, tone: summary.savingsRate >= 20 ? "text-emerald-500" : "text-amber-500" },
    { label: "Budget Used", value: formatPercent(summary.budgetUtilization), icon: Gauge, tone: summary.budgetUtilization > 100 ? "text-destructive" : "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.tone)} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
