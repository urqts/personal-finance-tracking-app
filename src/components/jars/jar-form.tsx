"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { jarSchema, type JarInput } from "@/lib/validations";
import { JAR_CATEGORIES } from "@/lib/constants";
import { createJar, updateJar } from "@/services/jars";
import { useUser } from "@/hooks/use-user";
import type { SavingJar, JarCategory } from "@/types";

export function JarForm({ open, onOpenChange, jar, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; jar?: SavingJar | null; onSaved: () => void;
}) {
  const { user } = useUser();
  const editing = !!jar;
  const form = useForm<JarInput>({
    resolver: zodResolver(jarSchema),
    defaultValues: { name: "", category: "other", target_amount: 0, color: "#6366f1", icon: "piggy-bank" },
  });

  useEffect(() => {
    if (open) {
      if (jar) form.reset({ name: jar.name, category: jar.category, target_amount: Number(jar.target_amount), color: jar.color, icon: jar.icon });
      else form.reset({ name: "", category: "other", target_amount: 0, color: "#6366f1", icon: "piggy-bank" });
    }
  }, [open, jar, form]);

  function onCategoryChange(v: string) {
    const cat = JAR_CATEGORIES.find((c) => c.value === v);
    form.setValue("category", v as JarCategory);
    if (cat && !editing) { form.setValue("color", cat.color); form.setValue("icon", cat.icon); }
  }

  async function onSubmit(values: JarInput) {
    if (!user) return;
    try {
      if (editing && jar) await updateJar(jar.id, values);
      else await createJar(values, user.id);
      toast.success(editing ? "Jar updated" : "Jar created");
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
          <DialogTitle>{editing ? "Edit jar" : "New saving jar"}</DialogTitle>
          <DialogDescription>Set a target and a category, then deposit toward your goal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="e.g. Japan Trip" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.watch("category")} onValueChange={onCategoryChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JAR_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target amount</Label>
              <Input type="number" step="0.01" {...form.register("target_amount")} />
              {form.formState.errors.target_amount && <p className="text-xs text-destructive">{form.formState.errors.target_amount.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Input type="color" className="h-9 p-1" {...form.register("color")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Save" : "Create jar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
