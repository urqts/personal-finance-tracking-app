import ExcelJS from "exceljs";
import type {
  TransactionWithCategory, Budget, SavingsGoal, SavingJarWithCategory, Subscription,
} from "@/types";
import { monthlyTrend, categoryBreakdown, subscriptionMonthlyTotal } from "./analytics";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF18181B" },
};

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
  });
  row.height = 20;
}

function autoSize(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 48);
  });
}

function addTable(ws: ExcelJS.Worksheet, name: string, headers: string[], rows: (string | number)[][]) {
  ws.addTable({
    name,
    ref: "A1",
    headerRow: true,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: headers.map((h) => ({ name: h, filterButton: true })),
    rows: rows.length ? rows : [headers.map(() => "")],
  });
  styleHeader(ws.getRow(1));
  autoSize(ws);
}

export interface ExportPayload {
  transactions?: TransactionWithCategory[];
  budgets?: Budget[];
  goals?: SavingsGoal[];
  jars?: SavingJarWithCategory[];
  subscriptions?: Subscription[];
  currency?: string;
}

export type ExportKind =
  | "transactions" | "budgets" | "goals" | "jars" | "subscriptions" | "analytics" | "full";

function sheetTransactions(wb: ExcelJS.Workbook, txns: TransactionWithCategory[]) {
  const ws = wb.addWorksheet("Transactions");
  addTable(
    ws,
    "Transactions",
    ["Date", "Title", "Type", "Category", "Amount", "Tags", "Description", "Notes"],
    txns.map((t) => [
      t.occurred_on,
      t.title,
      t.type,
      t.category?.name ?? "Uncategorized",
      Number(t.amount),
      (t.tags ?? []).join(", "),
      t.description ?? "",
      t.notes ?? "",
    ])
  );
  ws.getColumn(5).numFmt = "#,##0.00";
}

function sheetBudgets(wb: ExcelJS.Workbook, budgets: Budget[]) {
  const ws = wb.addWorksheet("Budgets");
  addTable(
    ws,
    "Budgets",
    ["Name", "Period", "Amount", "Start Date", "Active"],
    budgets.map((b) => [b.name, b.period, Number(b.amount), b.start_date, b.is_active ? "Yes" : "No"])
  );
  ws.getColumn(3).numFmt = "#,##0.00";
}

function sheetGoals(wb: ExcelJS.Workbook, goals: SavingsGoal[]) {
  const ws = wb.addWorksheet("Savings Goals");
  addTable(
    ws,
    "Goals",
    ["Name", "Target", "Saved", "Progress %", "Target Date", "Completed"],
    goals.map((g) => [
      g.name,
      Number(g.target_amount),
      Number(g.current_amount),
      g.target_amount > 0 ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) : 0,
      g.target_date ?? "",
      g.is_completed ? "Yes" : "No",
    ])
  );
  ws.getColumn(2).numFmt = "#,##0.00";
  ws.getColumn(3).numFmt = "#,##0.00";
}

function sheetJars(wb: ExcelJS.Workbook, jars: SavingJarWithCategory[]) {
  const ws = wb.addWorksheet("Saving Jars");
  addTable(
    ws,
    "Jars",
    ["Name", "Category", "Target", "Saved", "Progress %", "Funded"],
    jars.map((j) => [
      j.name,
      j.category?.name ?? "Uncategorized",
      Number(j.target_amount),
      Number(j.current_amount),
      j.target_amount > 0 ? Math.round((Number(j.current_amount) / Number(j.target_amount)) * 100) : 0,
      j.is_completed ? "Yes" : "No",
    ])
  );
  ws.getColumn(3).numFmt = "#,##0.00";
  ws.getColumn(4).numFmt = "#,##0.00";
}

function sheetSubscriptions(wb: ExcelJS.Workbook, subs: Subscription[]) {
  const ws = wb.addWorksheet("Subscriptions");
  addTable(
    ws,
    "Subscriptions",
    ["Name", "Cost", "Billing Cycle", "Next Renewal", "Active"],
    subs.map((s) => [s.name, Number(s.cost), s.billing_cycle, s.next_renewal, s.is_active ? "Yes" : "No"])
  );
  ws.getColumn(2).numFmt = "#,##0.00";
}

function sheetAnalytics(wb: ExcelJS.Workbook, txns: TransactionWithCategory[], subs: Subscription[]) {
  const ws = wb.addWorksheet("Analytics");
  const trend = monthlyTrend(txns, 6);
  ws.addRow(["Monthly Trend (last 6 months)"]).font = { bold: true, size: 13 };
  const headerRow = ws.addRow(["Month", "Income", "Expenses", "Net"]);
  styleHeader(headerRow);
  trend.forEach((p) => ws.addRow([p.month, p.income, p.expenses, p.net]));
  ws.addRow([]);

  const cats = categoryBreakdown(txns, "expense");
  ws.addRow(["Expenses by Category"]).font = { bold: true, size: 13 };
  const h2 = ws.addRow(["Category", "Amount", "Percentage"]);
  styleHeader(h2);
  cats.forEach((c) => ws.addRow([c.name, c.value, `${c.percentage.toFixed(1)}%`]));
  ws.addRow([]);
  ws.addRow(["Monthly Subscription Total", subscriptionMonthlyTotal(subs)]);
  autoSize(ws);
}

export async function buildWorkbook(kind: ExportKind, data: ExportPayload): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fintrack";
  wb.created = new Date();

  const txns = data.transactions ?? [];
  const budgets = data.budgets ?? [];
  const goals = data.goals ?? [];
  const jars = data.jars ?? [];
  const subs = data.subscriptions ?? [];

  if (kind === "transactions") sheetTransactions(wb, txns);
  else if (kind === "budgets") sheetBudgets(wb, budgets);
  else if (kind === "goals") sheetGoals(wb, goals);
  else if (kind === "jars") sheetJars(wb, jars);
  else if (kind === "subscriptions") sheetSubscriptions(wb, subs);
  else if (kind === "analytics") sheetAnalytics(wb, txns, subs);
  else {
    sheetTransactions(wb, txns);
    sheetBudgets(wb, budgets);
    sheetGoals(wb, goals);
    sheetJars(wb, jars);
    sheetSubscriptions(wb, subs);
    sheetAnalytics(wb, txns, subs);
  }
  return wb;
}

/** Browser-side helper: build the workbook and trigger a download. */
export async function downloadExcel(kind: ExportKind, data: ExportPayload) {
  const wb = await buildWorkbook(kind, data);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fintrack-${kind}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
