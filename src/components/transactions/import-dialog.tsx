"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { parseTransactionsCsv, type ParsedRow } from "@/lib/import";
import { bulkInsert } from "@/services/transactions";
import { useUser } from "@/hooks/use-user";
import type { Category, Transaction } from "@/types";

export function ImportDialog({ open, onOpenChange, categories, existing, onImported }: {
  open: boolean; onOpenChange: (o: boolean) => void; categories: Category[]; existing: Transaction[]; onImported: () => void;
}) {
  const { user } = useUser();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [skipDupes, setSkipDupes] = useState(true);
  const [importing, setImporting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRows(parseTransactionsCsv(text, existing));
  }

  const valid = rows.filter((r) => r.data && !(skipDupes && r.isDuplicate));
  const errors = rows.filter((r) => r.error).length;
  const dupes = rows.filter((r) => r.isDuplicate).length;

  function findCategory(name?: string) {
    if (!name) return null;
    return categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id ?? null;
  }

  async function doImport() {
    if (!user || valid.length === 0) return;
    setImporting(true);
    try {
      const payload = valid.map((r) => ({
        user_id: user.id,
        title: r.data!.title,
        amount: r.data!.amount,
        type: r.data!.type,
        occurred_on: r.data!.occurred_on,
        category_id: findCategory(r.data!.category),
        description: r.data!.description ?? null,
        tags: r.data!.tags,
      }));
      const n = await bulkInsert(payload);
      toast.success(`Imported ${n} transactions`);
      setRows([]);
      onOpenChange(false);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import transactions</DialogTitle>
          <DialogDescription>Upload a CSV with columns like date, title, amount, type, category.</DialogDescription>
        </DialogHeader>

        <Input2 onChange={handleFile} />

        {rows.length > 0 && (
          <>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="success">{valid.length} ready</Badge>
              {dupes > 0 && <Badge variant="warning">{dupes} duplicates</Badge>}
              {errors > 0 && <Badge variant="destructive">{errors} errors</Badge>}
              <label className="ml-auto flex items-center gap-2 text-xs">
                <Checkbox checked={skipDupes} onCheckedChange={(c) => setSkipDupes(!!c)} /> Skip duplicates
              </label>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{r.data?.occurred_on ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.data?.title ?? Object.values(r.raw)[0]}</TableCell>
                      <TableCell className="text-xs">{r.data?.type ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs">{r.data?.amount ?? "—"}</TableCell>
                      <TableCell>
                        {r.error ? <Badge variant="destructive">Error</Badge> : r.isDuplicate ? <Badge variant="warning">Dup</Badge> : <Badge variant="success">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={doImport} disabled={importing || valid.length === 0}>Import {valid.length || ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Input2({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <input
      type="file"
      accept=".csv,text/csv"
      onChange={onChange}
      className="block w-full cursor-pointer rounded-md border border-dashed p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
    />
  );
}
