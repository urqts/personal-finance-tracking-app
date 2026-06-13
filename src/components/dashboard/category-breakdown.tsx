"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import type { CategoryBreakdownPoint } from "@/types";

export function CategoryBreakdownChart({ data, currency, locale }: { data: CategoryBreakdownPoint[]; currency: string; locale: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState icon="pie-chart" title="No expenses yet" description="Add a transaction to see your breakdown." />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {data.map((d) => <Cell key={d.categoryId} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency, locale)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid w-full grid-cols-1 gap-1.5">
              {data.slice(0, 5).map((d) => (
                <div key={d.categoryId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-muted-foreground">{d.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
