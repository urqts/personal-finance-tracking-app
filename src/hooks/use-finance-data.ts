"use client";

import { useCallback, useEffect, useState } from "react";
import { listAllTransactions } from "@/services/transactions";
import { listCategories } from "@/services/categories";
import { listBudgets } from "@/services/budgets";
import { listGoals } from "@/services/goals";
import { listJars } from "@/services/jars";
import { listSubscriptions } from "@/services/subscriptions";
import type { TransactionWithCategory, Category, Budget, SavingsGoal, SavingJar, Subscription } from "@/types";

export interface FinanceData {
  transactions: TransactionWithCategory[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  jars: SavingJar[];
  subscriptions: Subscription[];
}

const empty: FinanceData = { transactions: [], categories: [], budgets: [], goals: [], jars: [], subscriptions: [] };

export function useFinanceData() {
  const [data, setData] = useState<FinanceData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [transactions, categories, budgets, goals, jars, subscriptions] = await Promise.all([
        listAllTransactions(),
        listCategories(),
        listBudgets(),
        listGoals(),
        listJars(),
        listSubscriptions(),
      ]);
      setData({ transactions, categories, budgets, goals, jars, subscriptions });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
