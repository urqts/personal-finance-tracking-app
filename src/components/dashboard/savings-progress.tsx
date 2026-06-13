"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import type { SavingsGoal } from "@/types";

export function SavingsProgress({ goals, currency, locale }: { goals: SavingsGoal[]; currency: string; locale: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>Savings Goals</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <EmptyState icon="target" title="No goals yet" description="Set a savings goal to start tracking." />
        ) : (
          goals.slice(0, 4).map((g) => {
            const pct = g.target_amount > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
            return (
              <div key={g.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} indicatorClassName="bg-emerald-500" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(Number(g.current_amount), currency, locale)}</span>
                  <span>{formatCurrency(Number(g.target_amount), currency, locale)}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
