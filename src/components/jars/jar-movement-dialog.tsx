"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { jarMovementSchema, type JarMovementInput } from "@/lib/validations";
import { depositToJar, withdrawFromJar, listJarTransactions } from "@/services/jars";
import { useUser } from "@/hooks/use-user";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SavingJar, JarTransaction } from "@/types";

export function JarMovementDialog({ open, onOpenChange, jar, mode, currency, locale, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; jar: SavingJar | null;
  mode: "deposit" | "withdraw"; currency: string; locale: string; onDone: () => void;
}) {
  const { user } = useUser();
  const [history, setHistory] = useState<JarTransaction[]>([]);
  const form = useForm<JarMovementInput>({ resolver: zodResolver(jarMovementSchema), defaultValues: { amount: 0, note: "" } });

  useEffect(() => {
    if (open && jar) {
      form.reset({ amount: 0, note: "" });
      listJarTransactions(jar.id).then(setHistory).catch(() => setHistory([]));
    }
  }, [open, jar, form]);

  async function onSubmit(values: JarMovementInput) {
    if (!user || !jar) return;
    try {
      if (mode === "deposit") await depositToJar(jar, values.amount, values.note ?? "", user.id);
      else await withdrawFromJar(jar, values.amount, values.note ?? "", user.id);
      toast.success(mode === "deposit" ? "Deposited" : "Withdrawn");
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const isDeposit = mode === "deposit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDeposit ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
            {isDeposit ? "Deposit to" : "Withdraw from"} {jar?.name}
          </DialogTitle>
          <DialogDescription>
            {isDeposit ? "Adds an expense to your ledger and grows this jar." : "Returns money to your balance as income."}
            {jar && ` Current balance: ${formatCurrency(Number(jar.current_amount), currency, locale)}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" autoFocus {...form.register("amount")} />
            {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input placeholder="e.g. Monthly contribution" {...form.register("note")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isDeposit ? "Deposit" : "Withdraw"}</Button>
          </DialogFooter>
        </form>

        {history.length > 0 && (
          <div className="mt-2 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Recent activity</p>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {history.slice(0, 8).map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(h.created_at)}{h.note ? ` · ${h.note}` : ""}</span>
                  <span className={h.type === "deposit" ? "font-medium text-emerald-500" : "font-medium text-rose-500"}>
                    {h.type === "deposit" ? "+" : "−"}{formatCurrency(Number(h.amount), currency, locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
