"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { JarCategorySummary } from "@/types";

export function CategorySummary({ summaries, currency, locale }: {
  summaries: JarCategorySummary[]; currency: string; locale: string;
}) {
  if (summaries.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summaries.map((s) => (
        <Card key={s.category}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="text-xs text-muted-foreground">{s.jarCount} jar{s.jarCount > 1 ? "s" : ""}</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(s.saved, currency, locale)}</p>
            <Progress value={Math.min(s.percentage, 100)} indicatorClassName="bg-emerald-500" />
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(s.target, currency, locale)} target · {s.percentage.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
