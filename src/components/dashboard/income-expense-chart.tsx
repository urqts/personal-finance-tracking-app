"use client";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact, formatCurrency } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/types";

export function IncomeExpenseChart({ data, currency, locale }: { data: MonthlyTrendPoint[]; currency: string; locale: string }) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickFormatter={(v) => formatCompact(v, currency, locale)} tickLine={false} axisLine={false} fontSize={12} width={56} />
            <Tooltip
              formatter={(v: number, n) => [formatCurrency(v, currency, locale), n === "income" ? "Income" : "Expenses"]}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#inc)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
