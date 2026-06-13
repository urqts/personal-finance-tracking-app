import { describe, it, expect } from "vitest";
import { parseTransactionsCsv } from "@/lib/import";
import type { Transaction } from "@/types";

describe("parseTransactionsCsv", () => {
  it("parses rows and detects duplicates", () => {
    const csv = "date,title,amount,type\n2026-01-01,Coffee,4.50,expense\n2026-01-02,Salary,1000,income";
    const existing = [{ title: "Coffee", amount: 4.5, occurred_on: "2026-01-01" } as Transaction];
    const rows = parseTransactionsCsv(csv, existing);
    expect(rows).toHaveLength(2);
    expect(rows[0].data?.title).toBe("Coffee");
    expect(rows[0].isDuplicate).toBe(true);
    expect(rows[1].isDuplicate).toBe(false);
    expect(rows[1].data?.type).toBe("income");
  });

  it("flags invalid rows with an error", () => {
    const csv = "date,title,amount,type\n,,abc,expense";
    const rows = parseTransactionsCsv(csv);
    expect(rows[0].error).toBeTruthy();
  });
});
