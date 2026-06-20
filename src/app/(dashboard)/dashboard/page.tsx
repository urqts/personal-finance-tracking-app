"use client";

import { useMemo } from "react";
import { Topbar } from "@/components/layout/topbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { JarsProgress } from "@/components/dashboard/jars-progress";
import { SavingsProgress } from "@/components/dashboard/savings-progress";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceData } from "@/hooks/use-finance-data";
import { usePreferences } from "@/hooks/use-preferences";
import { computeSummary, monthlyTrend, categoryBreakdown, inMonth } from "@/lib/analytics";

export default function DashboardPage() {
  const { data, loading } = useFinanceData();
  const { currency, locale } = usePreferences();

  const monthlyBudgetTotal = useMemo(
    () => data.budgets.filter((b) => b.is_active && b.period === "monthly").reduce((a, b) => a + Number(b.amount), 0),
    [data.budgets]
  );

  const summary = useMemo(() => computeSummary(data.transactions, monthlyBudgetTotal), [data.transactions, monthlyBudgetTotal]);
  const trend = useMemo(() => monthlyTrend(data.transactions, 6), [data.transactions]);
  const breakdown = useMemo(
    () => categoryBreakdown(data.transactions.filter((t) => inMonth(t)), "expense"),
    [data.transactions]
  );

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="space-y-6 p-4 md:p-8">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" />
            </div>
          </div>
        ) : (
          <>
            <SummaryCards summary={summary} currency={currency} locale={locale} />
            <div className="grid gap-6 lg:grid-cols-3">
              <IncomeExpenseChart data={trend} currency={currency} locale={locale} />
              <CategoryBreakdownChart data={breakdown} currency={currency} locale={locale} />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <RecentTransactions transactions={data.transactions} currency={currency} locale={locale} />
              <JarsProgress jars={data.jars} currency={currency} locale={locale} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <BudgetProgress budgets={data.budgets} transactions={data.transactions} currency={currency} locale={locale} />
              <SavingsProgress goals={data.goals} currency={currency} locale={locale} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
