"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useFinanceData } from "@/hooks/use-finance-data";
import { usePreferences } from "@/hooks/use-preferences";
import { useUser } from "@/hooks/use-user";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { createBudget, updateBudget, deleteBudget } from "@/services/budgets";
import { inMonth } from "@/lib/analytics";
import { formatCurrency, toDateInput } from "@/lib/format";
import type { Budget } from "@/types";

export default function BudgetsPage() {
  const { data, loading, reload } = useFinanceData();
  const { currency, locale } = usePreferences();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const spent = useMemo(
    () => data.transactions.filter((t) => t.type === "expense" && inMonth(t)).reduce((a, t) => a + Number(t.amount), 0),
    [data.transactions]
  );

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { name: "", period: "monthly", amount: 0, start_date: toDateInput(new Date()), is_active: true },
  });

  function openNew() { setEditing(null); form.reset({ name: "", period: "monthly", amount: 0, start_date: toDateInput(new Date()), is_active: true }); setOpen(true); }
  function openEdit(b: Budget) { setEditing(b); form.reset({ name: b.name, period: b.period, amount: Number(b.amount), start_date: toDateInput(b.start_date), is_active: b.is_active }); setOpen(true); }

  async function onSubmit(v: BudgetInput) {
    if (!user) return;
    try {
      if (editing) await updateBudget(editing.id, v); else await createBudget(v, user.id);
      toast.success(editing ? "Budget updated" : "Budget created");
      setOpen(false); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function remove(id: string) { try { await deleteBudget(id); toast.success("Deleted"); reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }

  return (
    <>
      <Topbar title="Budgets" />
      <main className="space-y-6 p-4 md:p-8">
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">Spent this month: <span className="font-medium text-foreground">{formatCurrency(spent, currency, locale)}</span></p>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New budget</Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : data.budgets.length === 0 ? (
          <EmptyState icon="wallet" title="No budgets yet" description="Create a budget to cap your monthly spending." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> New budget</Button>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.budgets.map((b) => {
              const limit = Number(b.amount);
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const over = spent > limit;
              const remaining = limit - spent;
              return (
                <Card key={b.id}>
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{b.name}</CardTitle>
                      <p className="text-xs capitalize text-muted-foreground">{b.period} · {b.is_active ? "active" : "inactive"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-semibold">{formatCurrency(limit, currency, locale)}</span>
                      {over ? <Badge variant="destructive">Over</Badge> : <Badge variant="success">{pct.toFixed(0)}%</Badge>}
                    </div>
                    <Progress value={pct} indicatorClassName={over ? "bg-destructive" : "bg-emerald-500"} />
                    <p className="text-xs text-muted-foreground">{over ? `${formatCurrency(Math.abs(remaining), currency, locale)} over budget` : `${formatCurrency(remaining, currency, locale)} remaining`}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit budget" : "New budget"}</DialogTitle><DialogDescription>Set a spending limit for a period and track it against your expenses.</DialogDescription></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} placeholder="e.g. Monthly Essentials" />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" {...form.register("amount")} />{form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}</div>
              <div className="space-y-1.5"><Label>Period</Label>
                <Select value={form.watch("period")} onValueChange={(v) => form.setValue("period", v as BudgetInput["period"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Start date</Label><Input type="date" {...form.register("start_date")} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
