"use client";

import { useEffect, useState } from "react";
import { Sparkles, Play } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { getAutoSaveSettings, upsertAutoSaveSettings, runAutoSaveIfDue } from "@/services/auto-save";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePreferences } from "@/hooks/use-preferences";
import type { SavingJarWithCategory, AutoSaveMode } from "@/types";

export function AutoSaveCard({ jars, onRan }: { jars: SavingJarWithCategory[]; onRan: () => void }) {
  const { user } = useUser();
  const { currency, locale } = usePreferences();
  const [enabled, setEnabled] = useState(false);
  const [jarId, setJarId] = useState<string | null>(null);
  const [mode, setMode] = useState<AutoSaveMode>("full");
  const [percentage, setPercentage] = useState(100);
  const [fixed, setFixed] = useState(0);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAutoSaveSettings().then((s) => {
      if (s) {
        setEnabled(s.is_enabled); setJarId(s.jar_id); setMode(s.mode);
        setPercentage(Number(s.percentage)); setFixed(Number(s.fixed_amount)); setLastRun(s.last_run_month);
      }
    }).catch(() => {});
  }, []);

  async function save() {
    if (!user) return;
    if (enabled && !jarId) { toast.error("Pick a jar to auto-save into."); return; }
    setSaving(true);
    try {
      await upsertAutoSaveSettings(user.id, { is_enabled: enabled, jar_id: jarId, mode, percentage, fixed_amount: fixed });
      toast.success("Auto-save settings saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function runNow() {
    if (!user) return;
    setSaving(true);
    try {
      await upsertAutoSaveSettings(user.id, { is_enabled: enabled, jar_id: jarId, mode, percentage, fixed_amount: fixed });
      const r = await runAutoSaveIfDue(user.id);
      if (r.ran && r.amount) { toast.success(`Auto-saved ${formatCurrency(r.amount, currency, locale)} for ${r.monthLabel}.`); onRan(); }
      else if (r.reason === "already-run") toast.message("Already auto-saved for last month.");
      else if (r.reason === "no-surplus") toast.message(`No surplus to save for ${r.monthLabel ?? "last month"}.`);
      else if (r.reason === "no-jar") toast.error("Pick a jar first.");
      else toast.message("Auto-save is disabled.");
      const s = await getAutoSaveSettings();
      setLastRun(s?.last_run_month ?? null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> Auto-Save</CardTitle>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          At the end of each month, move last month&apos;s remaining balance (income − expenses) into a jar. Skipped if the balance is zero or negative.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Save into jar</Label>
            <Select value={jarId ?? undefined} onValueChange={setJarId} disabled={!enabled}>
              <SelectTrigger><SelectValue placeholder="Select a jar" /></SelectTrigger>
              <SelectContent>
                {jars.length === 0
                  ? <SelectItem value="none" disabled>Create a jar first</SelectItem>
                  : jars.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>How much</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as AutoSaveMode)} disabled={!enabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">All of it (100%)</SelectItem>
                <SelectItem value="percentage">A percentage</SelectItem>
                <SelectItem value="fixed">A fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "percentage" && (
          <div className="space-y-1.5">
            <Label>Percentage of remaining balance</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="100" step="1" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))} disabled={!enabled} className="w-32" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}
        {mode === "fixed" && (
          <div className="space-y-1.5">
            <Label>Fixed amount (capped at the remaining balance)</Label>
            <Input type="number" min="0" step="0.01" value={fixed} onChange={(e) => setFixed(Number(e.target.value))} disabled={!enabled} className="w-40" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {lastRun ? `Last run for ${formatDate(lastRun, "MMMM yyyy")}` : "Hasn't run yet"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runNow} disabled={saving || !enabled}><Play className="h-4 w-4" /> Run now</Button>
            <Button size="sm" onClick={save} disabled={saving}>Save settings</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
