"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { RECURRENCE_OPTIONS } from "@/lib/constants";
import { createTransaction, updateTransaction } from "@/services/transactions";
import { useUser } from "@/hooks/use-user";
import { toDateInput } from "@/lib/format";
import type { Category, TransactionWithCategory, TransactionType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategory | null;
  onSaved: () => void;
}

export function TransactionForm({ open, onOpenChange, categories, transaction, onSaved }: Props) {
  const { user } = useUser();
  const [tagsText, setTagsText] = useState("");
  const editing = !!transaction;

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: "", amount: 0, type: "expense", category_id: null, tags: [],
      occurred_on: toDateInput(new Date()), is_recurring: false, recurrence: "none",
      description: "", notes: "",
    },
  });

  const type = form.watch("type") as TransactionType;
  const isRecurring = form.watch("is_recurring");

  useEffect(() => {
    if (open) {
      if (transaction) {
        form.reset({
          title: transaction.title,
          amount: Number(transaction.amount),
          type: transaction.type,
          category_id: transaction.category_id,
          tags: transaction.tags ?? [],
          occurred_on: toDateInput(transaction.occurred_on),
          is_recurring: transaction.is_recurring,
          recurrence: transaction.recurrence,
          description: transaction.description ?? "",
          notes: transaction.notes ?? "",
        });
        setTagsText((transaction.tags ?? []).join(", "));
      } else {
        form.reset({
          title: "", amount: 0, type: "expense", category_id: null, tags: [],
          occurred_on: toDateInput(new Date()), is_recurring: false, recurrence: "none", description: "", notes: "",
        });
        setTagsText("");
      }
    }
  }, [open, transaction, form]);

  const filteredCats = categories.filter((c) => c.type === type);

  async function onSubmit(values: TransactionInput) {
    if (!user) return;
    const payload = { ...values, tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean) };
    try {
      if (editing && transaction) await updateTransaction(transaction.id, payload);
      else await createTransaction(payload, user.id);
      toast.success(editing ? "Transaction updated" : "Transaction added");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>Record income or an expense and categorise it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={type} onValueChange={(v) => { form.setValue("type", v as TransactionType); form.setValue("category_id", null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Amount" error={form.formState.errors.amount?.message}>
              <Input type="number" step="0.01" min="0" {...form.register("amount")} />
            </Field>
          </div>

          <Field label="Title" error={form.formState.errors.title?.message}>
            <Input placeholder="e.g. Grocery shopping" {...form.register("title")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.watch("category_id") ?? "none"} onValueChange={(v) => form.setValue("category_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date" error={form.formState.errors.occurred_on?.message}>
              <Input type="date" {...form.register("occurred_on")} />
            </Field>
          </div>

          <Field label="Tags (comma separated)">
            <Input placeholder="groceries, weekly" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
          </Field>

          <Field label="Description">
            <Input placeholder="Optional" {...form.register("description")} />
          </Field>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Recurring</Label>
              <p className="text-xs text-muted-foreground">Repeat this transaction automatically</p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={(c) => { form.setValue("is_recurring", c); if (!c) form.setValue("recurrence", "none"); }} />
          </div>

          {isRecurring && (
            <Field label="Frequency" error={form.formState.errors.recurrence?.message}>
              <Select value={form.watch("recurrence")} onValueChange={(v) => form.setValue("recurrence", v as TransactionInput["recurrence"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.filter((o) => o.value !== "none").map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Notes">
            <Textarea rows={2} placeholder="Optional notes" {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{editing ? "Save changes" : "Add transaction"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
