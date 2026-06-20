"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { runAutoSaveIfDue } from "@/services/auto-save";
import { formatCurrency } from "@/lib/format";
import { usePreferences } from "@/hooks/use-preferences";

/** Invisible: runs month-end auto-save once per app load when due. */
export function AutoSaveRunner() {
  const { user } = useUser();
  const { currency, locale } = usePreferences();
  const done = useRef(false);

  useEffect(() => {
    if (!user || done.current) return;
    done.current = true;
    runAutoSaveIfDue(user.id)
      .then((r) => {
        if (r.ran && r.amount) {
          toast.success(`Auto-saved ${formatCurrency(r.amount, currency, locale)} to your jar for ${r.monthLabel}.`);
        }
      })
      .catch(() => {
        // silent — surfaced in the Auto-Save card if misconfigured
      });
  }, [user, currency, locale]);

  return null;
}
