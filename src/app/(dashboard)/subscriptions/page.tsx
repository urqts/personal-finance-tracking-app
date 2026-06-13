"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations";
import { createSubscription, updateSubscription, deleteSubscription } from "@/services/subscriptions";
import { subscriptionMonthlyTotal, monthlyEquivalent } from "@/lib/analytics";
import { formatCurrency, formatDate, toDateInput } from "@/lib/format";
import { BILLING_CYCLES } from "@/lib/constants";
import type { Subscription } from "@/types";

export default function SubscriptionsPage() {
  const { data, loading, reload } = useFinanceData();
  const { currency, locale } = usePreferences();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const monthlyTotal = useMemo(() => subscriptionMonthlyTotal(data.subscriptions), [data.subscriptions]);
  const upcoming = useMemo(
    () => [...data.subscriptions].filter((s) => s.is_active).sort((a, b) => a.next_renewal.localeCompare(b.next_renewal)).slice(0, 5),
    [data.subscriptions]
  );

  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { name: "", cost: 0, billing_cycle: "monthly", next_renewal: toDateInput(new Date()), is_active: true },
  });

  function openNew() { setEditing(null); form.reset({ name: "", cost: 0, billing_cycle: "monthly", next_renewal: toDateInput(new Date()), is_active: true }); setOpen(true); }
  function openEdit(s: Subscription) { setEditing(s); form.reset({ name: s.name, cost: Number(s.cost), billing_cycle: s.billing_cycle, next_renewal: toDateInput(s.next_renewal), is_active: s.is_active }); setOpen(true); }

  async function onSubmit(v: SubscriptionInput) {
    if (!user) return;
    try {
      if (editing) await updateSubscription(editing.id, v); else await createSubscription(v, user.id);
      toast.success(editing ? "Updated" : "Subscription added"); setOpen(false); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function remove(id: string) { try { await deleteSubscription(id); toast.success("Deleted"); reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }

  return (
    <>
      <Topbar title="Subscriptions" />
      <main className="space-y-6 p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Monthly total</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(monthlyTotal, currency, locale)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Yearly total</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(monthlyTotal * 12, currency, locale)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Active subscriptions</p><p className="mt-1 text-2xl font-semibold">{data.subscriptions.filter((s) => s.is_active).length}</p></CardContent></Card>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Upcoming renewals</h3>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Add subscription</Button>
        </div>

        {upcoming.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {upcoming.map((s) => {
              const days = differenceInCalendarDays(parseISO(s.next_renewal), new Date());
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{s.name}</span>
                  <Badge variant={days <= 3 ? "warning" : "secondary"}>{days <= 0 ? "due" : `${days}d`}</Badge>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : data.subscriptions.length === 0 ? (
          <EmptyState icon="credit-card" title="No subscriptions" description="Track Netflix, Spotify and more." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add subscription</Button>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.subscriptions.map((s) => (
              <Card key={s.id} className={s.is_active ? "" : "opacity-60"}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div><CardTitle className="text-base">{s.name}</CardTitle><p className="text-xs capitalize text-muted-foreground">{s.billing_cycle}</p></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{formatCurrency(Number(s.cost), currency, locale)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(monthlyEquivalent(Number(s.cost), s.billing_cycle), currency, locale)}/mo · renews {formatDate(s.next_renewal)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit subscription" : "Add subscription"}</DialogTitle><DialogDescription>Track a recurring payment, its cost and next renewal.</DialogDescription></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} placeholder="e.g. Netflix" />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Cost</Label><Input type="number" step="0.01" {...form.register("cost")} />{form.formState.errors.cost && <p className="text-xs text-destructive">{form.formState.errors.cost.message}</p>}</div>
              <div className="space-y-1.5"><Label>Billing cycle</Label>
                <Select value={form.watch("billing_cycle")} onValueChange={(v) => form.setValue("billing_cycle", v as SubscriptionInput["billing_cycle"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BILLING_CYCLES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Next renewal</Label><Input type="date" {...form.register("next_renewal")} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save" : "Add"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
