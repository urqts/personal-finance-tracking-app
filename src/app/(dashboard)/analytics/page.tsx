"use client";

import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceData } from "@/hooks/use-finance-data";
import { usePreferences } from "@/hooks/use-preferences";
import {
  monthlyTrend, topCategories, averageMonthlySpending, yearlyTotals,
  financialHealthScore, computeSummary, subscriptionMonthlyTotal,
} from "@/lib/analytics";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

export default function AnalyticsPage() {
  const { data, loading } = useFinanceData();
  const { currency, locale } = usePreferences();

  const trend = useMemo(() => monthlyTrend(data.transactions, 12), [data.transactions]);
  const top = useMemo(() => topCategories(data.transactions, 6), [data.transactions]);
  const avg = useMemo(() => averageMonthlySpending(data.transactions, 6), [data.transactions]);
  const year = useMemo(() => yearlyTotals(data.transactions), [data.transactions]);
  const monthlyBudget = useMemo(() => data.budgets.filter((b) => b.is_active && b.period === "monthly").reduce((a, b) => a + Number(b.amount), 0), [data.budgets]);
  const summary = useMemo(() => computeSummary(data.transactions, monthlyBudget), [data.transactions, monthlyBudget]);
  const goalProgress = useMemo(() => {
    if (data.goals.length === 0) return 0;
    return (data.goals.reduce((a, g) => a + (g.target_amount > 0 ? Math.min(Number(g.current_amount) / Number(g.target_amount), 1) : 0), 0) / data.goals.length) * 100;
  }, [data.goals]);
  const health = useMemo(() => financialHealthScore({ savingsRate: summary.savingsRate, budgetUtilization: summary.budgetUtilization, goalProgress }), [summary, goalProgress]);

  const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

  if (loading) {
    return (<><Topbar title="Analytics" /><main className="space-y-6 p-4 md:p-8"><div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-80" /></main></>);
  }

  return (
    <>
      <Topbar title="Analytics" />
      <main className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Avg monthly spending" value={formatCurrency(avg, currency, locale)} />
          <Stat label="This year net" value={formatCurrency(year.net, currency, locale)} sub={`${formatCurrency(year.income, currency, locale)} in · ${formatCurrency(year.expenses, currency, locale)} out`} />
          <Stat label="Savings rate" value={formatPercent(summary.savingsRate)} />
          <Stat label="Subscriptions / mo" value={formatCurrency(subscriptionMonthlyTotal(data.subscriptions), currency, locale)} />
        </div>

        <Card>
          <CardHeader><CardTitle>Financial Health</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="text-center">
              <p className="text-5xl font-semibold">{health.score}</p>
              <Badge variant={health.score >= 75 ? "success" : health.score >= 50 ? "secondary" : "warning"} className="mt-1">{health.label}</Badge>
            </div>
            <div className="flex-1 space-y-3">
              <Metric label="Savings rate" pct={Math.max(0, Math.min(100, summary.savingsRate))} />
              <Metric label="Budget adherence" pct={Math.max(0, 100 - Math.max(0, summary.budgetUtilization - 100))} />
              <Metric label="Goal progress" pct={goalProgress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Income & Expense Trend (12 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => formatCompact(v, currency, locale)} tickLine={false} axisLine={false} fontSize={12} width={56} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency, locale)} contentStyle={tip} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Top Spending Categories</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={top} layout="vertical" margin={{ left: 20, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatCompact(v, currency, locale)} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={90} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency, locale)} contentStyle={tip} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>{top.map((d) => <Cell key={d.categoryId} fill={d.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Net Cash Flow</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trend.slice(-6)} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => formatCompact(v, currency, locale)} tickLine={false} axisLine={false} fontSize={12} width={56} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency, locale)} contentStyle={tip} />
                  <Bar dataKey="net" radius={[6, 6, 0, 0]}>{trend.slice(-6).map((d, i) => <Cell key={i} fill={d.net >= 0 ? "#10b981" : "#f43f5e"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p>{sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}</CardContent></Card>;
}
function Metric({ label, pct }: { label: string; pct: number }) {
  return <div className="space-y-1"><div className="flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">{pct.toFixed(0)}%</span></div><Progress value={pct} /></div>;
}
