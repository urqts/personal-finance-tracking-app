"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, PiggyBank } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useFinanceData } from "@/hooks/use-finance-data";
import { usePreferences } from "@/hooks/use-preferences";
import { useUser } from "@/hooks/use-user";
import { savingsGoalSchema, type SavingsGoalInput } from "@/lib/validations";
import { createGoal, updateGoal, deleteGoal } from "@/services/goals";
import { formatCurrency, formatDate, toDateInput } from "@/lib/format";
import type { SavingsGoal } from "@/types";

export default function GoalsPage() {
  const { data, loading, reload } = useFinanceData();
  const { currency, locale } = usePreferences();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);

  const form = useForm<SavingsGoalInput>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: { name: "", target_amount: 0, current_amount: 0, target_date: "", color: "#10b981", icon: "target" },
  });

  function openNew() { setEditing(null); form.reset({ name: "", target_amount: 0, current_amount: 0, target_date: "", color: "#10b981", icon: "target" }); setOpen(true); }
  function openEdit(g: SavingsGoal) { setEditing(g); form.reset({ name: g.name, target_amount: Number(g.target_amount), current_amount: Number(g.current_amount), target_date: g.target_date ? toDateInput(g.target_date) : "", color: g.color, icon: g.icon }); setOpen(true); }

  async function onSubmit(v: SavingsGoalInput) {
    if (!user) return;
    const payload = { ...v, target_date: v.target_date || null };
    try {
      if (editing) await updateGoal(editing.id, payload); else await createGoal(payload, user.id);
      toast.success(editing ? "Goal updated" : "Goal created"); setOpen(false); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function toggleComplete(g: SavingsGoal) { try { await updateGoal(g.id, { is_completed: !g.is_completed }); reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }
  async function remove(id: string) { try { await deleteGoal(id); toast.success("Deleted"); reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }

  return (
    <>
      <Topbar title="Savings Goals" />
      <main className="space-y-6 p-4 md:p-8">
        <div className="flex justify-end"><Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New goal</Button></div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
        ) : data.goals.length === 0 ? (
          <EmptyState icon="target" title="No savings goals" description="Set a target and track your progress over time." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> New goal</Button>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.goals.map((g) => {
              const pct = g.target_amount > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
              return (
                <Card key={g.id} className={g.is_completed ? "border-emerald-500/40" : ""}>
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: g.color + "22", color: g.color }}><PiggyBank className="h-5 w-5" /></span>
                      <div><CardTitle className="text-base">{g.name}</CardTitle>{g.target_date && <p className="text-xs text-muted-foreground">by {formatDate(g.target_date)}</p>}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-semibold">{formatCurrency(Number(g.current_amount), currency, locale)}</span>
                      <span className="text-sm text-muted-foreground">/ {formatCurrency(Number(g.target_amount), currency, locale)}</span>
                    </div>
                    <Progress value={pct} indicatorClassName="bg-emerald-500" />
                    <div className="flex items-center justify-between">
                      {g.is_completed ? <Badge variant="success">Completed</Badge> : <span className="text-xs text-muted-foreground">{pct.toFixed(0)}% saved</span>}
                      <Button variant="ghost" size="sm" onClick={() => toggleComplete(g)}><Check className="h-4 w-4" /> {g.is_completed ? "Reopen" : "Mark done"}</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle><DialogDescription>Set a savings target and an optional deadline.</DialogDescription></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} placeholder="e.g. Emergency Fund" />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Target</Label><Input type="number" step="0.01" {...form.register("target_amount")} />{form.formState.errors.target_amount && <p className="text-xs text-destructive">{form.formState.errors.target_amount.message}</p>}</div>
              <div className="space-y-1.5"><Label>Saved so far</Label><Input type="number" step="0.01" {...form.register("current_amount")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Target date</Label><Input type="date" {...form.register("target_date")} /></div>
              <div className="space-y-1.5"><Label>Color</Label><Input type="color" className="h-9 p-1" {...form.register("color")} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
