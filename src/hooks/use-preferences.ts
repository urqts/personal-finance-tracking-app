"use client";

import { useEffect, useState } from "react";
import { getPreferences } from "@/services/preferences";
import type { UserPreferences } from "@/types";

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs).catch(() => setPrefs(null));
  }, []);

  return {
    prefs,
    currency: prefs?.currency ?? "USD",
    locale: prefs?.locale ?? "en-US",
  };
}
