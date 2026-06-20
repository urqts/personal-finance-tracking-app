"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Tags } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { JarForm } from "@/components/jars/jar-form";
import { JarCategoryManager } from "@/components/jars/jar-category-manager";
import { AutoSaveCard } from "@/components/jars/auto-save-card";
import { JarMovementDialog } from "@/components/jars/jar-movement-dialog";
import { CategorySummary } from "@/components/jars/category-summary";
import { useFinanceData } from "@/hooks/use-finance-data";
import { usePreferences } from "@/hooks/use-preferences";
import { deleteJar } from "@/services/jars";
import { jarCategorySummaries, totalSaved } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import type { SavingJarWithCategory } from "@/types";

export default function JarsPage() {
  const { data, loading, reload } = useFinanceData();
  const { currency, locale } = usePreferences();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingJarWithCategory | null>(null);
  const [moveJar, setMoveJar] = useState<SavingJarWithCategory | null>(null);
  const [moveMode, setMoveMode] = useState<"deposit" | "withdraw">("deposit");
  const [manageOpen, setManageOpen] = useState(false);

  const summaries = useMemo(() => jarCategorySummaries(data.jars), [data.jars]);
  const saved = useMemo(() => totalSaved(data.jars), [data.jars]);
  const targetTotal = useMemo(() => data.jars.reduce((a, j) => a + Number(j.target_amount), 0), [data.jars]);

  function openMovement(jar: SavingJarWithCategory, mode: "deposit" | "withdraw") {
    setMoveJar(jar); setMoveMode(mode);
  }
  async function remove(id: string) {
    try { await deleteJar(id); toast.success("Jar deleted"); reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <>
      <Topbar title="Saving Jars" />
      <main className="space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Total saved</p>
              <p className="text-2xl font-semibold">{formatCurrency(saved, currency, locale)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Across targets</p>
              <p className="text-2xl font-semibold">{formatCurrency(targetTotal, currency, locale)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}><Tags className="h-4 w-4" /> Categories</Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New jar</Button>
          </div>
        </div>

        {!loading && <AutoSaveCard jars={data.jars} onRan={reload} />}

        {!loading && summaries.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">By category</h3>
            <CategorySummary summaries={summaries} currency={currency} locale={locale} />
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Your jars</h3>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)}</div>
          ) : data.jars.length === 0 ? (
            <EmptyState icon="piggy-bank" title="No saving jars yet" description="Create a jar, set a target, and start depositing toward your goals." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New jar</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.jars.map((jar) => {
                const pct = jar.target_amount > 0 ? Math.min((Number(jar.current_amount) / Number(jar.target_amount)) * 100, 100) : 0;
                const done = Number(jar.current_amount) >= Number(jar.target_amount);
                return (
                  <Card key={jar.id} className={done ? "border-emerald-500/40" : ""}>
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: jar.color + "22", color: jar.color }}>
                          <Icon name={jar.icon} className="h-5 w-5" />
                        </span>
                        <div>
                          <CardTitle className="text-base">{jar.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{jar.category?.name ?? "Uncategorized"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(jar); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(jar.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-semibold">{formatCurrency(Number(jar.current_amount), currency, locale)}</span>
                        <span className="text-sm text-muted-foreground">/ {formatCurrency(Number(jar.target_amount), currency, locale)}</span>
                      </div>
                      <Progress value={pct} indicatorClassName={done ? "bg-emerald-500" : undefined} />
                      <div className="flex items-center justify-between">
                        {done ? <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Funded</Badge> : <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% saved</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => openMovement(jar, "deposit")}><ArrowDownToLine className="h-4 w-4" /> Deposit</Button>
                        <Button variant="outline" size="sm" disabled={Number(jar.current_amount) <= 0} onClick={() => openMovement(jar, "withdraw")}><ArrowUpFromLine className="h-4 w-4" /> Withdraw</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <JarForm open={formOpen} onOpenChange={setFormOpen} jar={editing} categories={data.jarCategories} onSaved={reload} />
      <JarMovementDialog
        open={!!moveJar}
        onOpenChange={(o) => { if (!o) setMoveJar(null); }}
        jar={moveJar}
        mode={moveMode}
        currency={currency}
        locale={locale}
        onDone={reload}
      />
      <JarCategoryManager open={manageOpen} onOpenChange={setManageOpen} categories={data.jarCategories} onChanged={reload} />
    </>
  );
}
