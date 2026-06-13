"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/shared/icon";
import { useFinanceData } from "@/hooks/use-finance-data";
import { useUser } from "@/hooks/use-user";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { createCategory, updateCategory, deleteCategory } from "@/services/categories";
import { CATEGORY_ICONS } from "@/lib/constants";
import type { Category, TransactionType } from "@/types";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const { data, loading, reload } = useFinanceData();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", type: "expense", color: "#6366f1", icon: "circle" },
  });

  function openNew() { setEditing(null); form.reset({ name: "", type: "expense", color: "#6366f1", icon: "circle" }); setOpen(true); }
  function openEdit(c: Category) { setEditing(c); form.reset({ name: c.name, type: c.type, color: c.color, icon: c.icon }); setOpen(true); }

  async function onSubmit(v: CategoryInput) {
    if (!user) return;
    try {
      if (editing) await updateCategory(editing.id, v); else await createCategory(v, user.id);
      toast.success(editing ? "Category updated" : "Category created"); setOpen(false); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function remove(id: string) { try { await deleteCategory(id); toast.success("Deleted"); reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }

  const groups: { type: TransactionType; label: string }[] = [{ type: "income", label: "Income" }, { type: "expense", label: "Expense" }];

  return (
    <>
      <Topbar title="Categories" />
      <main className="space-y-6 p-4 md:p-8">
        <div className="flex justify-end"><Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New category</Button></div>
        {loading ? <Skeleton className="h-60" /> : groups.map((g) => (
          <Card key={g.type}>
            <CardHeader><CardTitle className="text-base">{g.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.categories.filter((c) => c.type === g.type).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: c.color + "22", color: c.color }}><Icon name={c.icon} /></span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    {c.is_default && <Badge variant="secondary" className="font-normal">Default</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle><DialogDescription>Organise your transactions with a colour and an icon.</DialogDescription></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name</Label><Input {...form.register("name")} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as TransactionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Color</Label><Input type="color" className="h-9 p-1" {...form.register("color")} /></div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-1">
                {CATEGORY_ICONS.map((ic) => (
                  <button key={ic} type="button" onClick={() => form.setValue("icon", ic)} className={cn("flex h-9 items-center justify-center rounded-md border", form.watch("icon") === ic ? "border-primary bg-secondary" : "")}>
                    <Icon name={ic} />
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
