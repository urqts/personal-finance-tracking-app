"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/shared/icon";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import type { SavingJar } from "@/types";

export function JarsProgress({ jars, currency, locale }: { jars: SavingJar[]; currency: string; locale: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Saving Jars</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link href="/jars">View all</Link></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {jars.length === 0 ? (
          <EmptyState icon="piggy-bank" title="No jars yet" description="Create a jar to start saving." />
        ) : (
          jars.slice(0, 4).map((j) => {
            const pct = j.target_amount > 0 ? Math.min((Number(j.current_amount) / Number(j.target_amount)) * 100, 100) : 0;
            return (
              <div key={j.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Icon name={j.icon} className="h-3.5 w-3.5" style={{ color: j.color }} />
                    {j.name}
                  </span>
                  <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} indicatorClassName="bg-emerald-500" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(Number(j.current_amount), currency, locale)}</span>
                  <span>{formatCurrency(Number(j.target_amount), currency, locale)}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
