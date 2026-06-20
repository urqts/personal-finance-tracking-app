"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import type { Budget, Transaction } from "@/types";
import { inMonth } from "@/lib/analytics";

export function BudgetProgress({ budgets, transactions, currency, locale }: {
  budgets: Budget[]; transactions: Transaction[]; currency: string; locale: string;
}) {
  const monthExpenses = transactions.filter((t) => t.type === "expense" && !t.is_transfer && inMonth(t));
  const spent = monthExpenses.reduce((a, t) => a + Number(t.amount), 0);

  return (
    <Card>
      <CardHeader><CardTitle>Budget Progress</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {budgets.filter((b) => b.is_active).length === 0 ? (
          <EmptyState icon="wallet" title="No active budgets" description="Create a budget to track your spending." />
        ) : (
          budgets.filter((b) => b.is_active).map((b) => {
            const limit = Number(b.amount);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            return (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.name}</span>
                  {over ? <Badge variant="destructive">Over budget</Badge> : <Badge variant="success">On track</Badge>}
                </div>
                <Progress value={pct} indicatorClassName={over ? "bg-destructive" : "bg-emerald-500"} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(spent, currency, locale)} spent</span>
                  <span>{formatCurrency(limit, currency, locale)} limit</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
