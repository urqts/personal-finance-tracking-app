"use client";

import { useCallback, useEffect, useState } from "react";
import { listAllTransactions } from "@/services/transactions";
import { listCategories } from "@/services/categories";
import { listBudgets } from "@/services/budgets";
import { listGoals } from "@/services/goals";
import { listJars } from "@/services/jars";
import { listJarCategories } from "@/services/jar-categories";
import { listSubscriptions } from "@/services/subscriptions";
import type { TransactionWithCategory, Category, Budget, SavingsGoal, SavingJarWithCategory, JarCategory, Subscription } from "@/types";

export interface FinanceData {
  transactions: TransactionWithCategory[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  jars: SavingJarWithCategory[];
  jarCategories: JarCategory[];
  subscriptions: Subscription[];
}

const empty: FinanceData = { transactions: [], categories: [], budgets: [], goals: [], jars: [], jarCategories: [], subscriptions: [] };

function pick<T>(r: PromiseSettledResult<T[]>): T[] {
  return r.status === "fulfilled" ? r.value : [];
}

export function useFinanceData() {
  const [data, setData] = useState<FinanceData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    // Resilient: a single failing source (e.g. a table not migrated yet) must not
    // wipe out everything else — load each independently.
    const [transactions, categories, budgets, goals, jars, jarCategories, subscriptions] = await Promise.allSettled([
      listAllTransactions(),
      listCategories(),
      listBudgets(),
      listGoals(),
      listJars(),
      listJarCategories(),
      listSubscriptions(),
    ]);

    setData({
      transactions: pick(transactions),
      categories: pick(categories),
      budgets: pick(budgets),
      goals: pick(goals),
      jars: pick(jars),
      jarCategories: pick(jarCategories),
      subscriptions: pick(subscriptions),
    });

    const failures = [transactions, categories, budgets, goals, jars, jarCategories, subscriptions]
      .filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failures.length > 0) {
      const reason = failures[0].reason;
      setError(reason instanceof Error ? reason.message : "Some data could not be loaded.");
    } else {
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
