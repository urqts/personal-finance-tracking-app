"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import type { TransactionWithCategory } from "@/types";
import { cn } from "@/lib/utils";

export function RecentTransactions({ transactions, currency, locale }: {
  transactions: TransactionWithCategory[]; currency: string; locale: string;
}) {
  const recent = [...transactions].slice(0, 6);
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Transactions</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link href="/transactions">View all</Link></Button>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <EmptyState icon="arrow-left-right" title="No transactions yet" />
        ) : (
          <div className="divide-y">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: (t.category?.color ?? "#94a3b8") + "22", color: t.category?.color ?? "#94a3b8" }}>
                  <Icon name={t.category?.icon ?? "circle"} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.category?.name ?? "Uncategorized"} · {formatDate(t.occurred_on)}</p>
                </div>
                <span className={cn("text-sm font-semibold", t.type === "income" ? "text-emerald-500" : "text-foreground")}>
                  {t.type === "income" ? "+" : "−"}{formatCurrency(Number(t.amount), currency, locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
