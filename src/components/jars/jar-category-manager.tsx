"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/shared/icon";
import { jarCategorySchema, type JarCategoryInput } from "@/lib/validations";
import { createJarCategory, updateJarCategory, deleteJarCategory } from "@/services/jar-categories";
import { useUser } from "@/hooks/use-user";
import { CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JarCategory } from "@/types";

export function JarCategoryManager({ open, onOpenChange, categories, onChanged }: {
  open: boolean; onOpenChange: (o: boolean) => void; categories: JarCategory[]; onChanged: () => void;
}) {
  const { user } = useUser();
  const [editing, setEditing] = useState<JarCategory | null>(null);
  const form = useForm<JarCategoryInput>({
    resolver: zodResolver(jarCategorySchema),
    defaultValues: { name: "", color: "#6366f1", icon: "piggy-bank" },
  });

  function startNew() { setEditing(null); form.reset({ name: "", color: "#6366f1", icon: "piggy-bank" }); }
  function startEdit(c: JarCategory) { setEditing(c); form.reset({ name: c.name, color: c.color, icon: c.icon }); }

  async function onSubmit(v: JarCategoryInput) {
    if (!user) return;
    try {
      if (editing) await updateJarCategory(editing.id, v); else await createJarCategory(v, user.id);
      toast.success(editing ? "Category updated" : "Category created");
      startNew(); onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function remove(id: string) {
    try { await deleteJarCategory(id); toast.success("Deleted"); if (editing?.id === id) startNew(); onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Jar categories</DialogTitle>
          <DialogDescription>Categories used only by your saving jars — separate from transaction categories.</DialogDescription>
        </DialogHeader>

        <div className="max-h-52 space-y-1.5 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No jar categories yet.</p>
          ) : categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border p-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: c.color + "22", color: c.color }}><Icon name={c.icon} /></span>
              <span className="flex-1 text-sm font-medium">{c.name}</span>
              {c.is_default && <Badge variant="secondary" className="font-normal">Default</Badge>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">{editing ? `Edit "${editing.name}"` : "Add a category"}</p>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Wedding" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input type="color" className="h-9 w-16 p-1" {...form.register("color")} />
            </div>
          </div>
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
          <DialogFooter>
            {editing && <Button type="button" variant="outline" onClick={startNew}>New</Button>}
            <Button type="submit">{editing ? "Save changes" : "Add category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
