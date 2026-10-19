"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";

/* Admin Orders page: download orders as a CSV (opens in Excel / Google
   Sheets) for accounting. Paid orders only unless the box is ticked.
   Defaults (this month so far, India time) come from the server. */
export default function ExportOrders({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [includeUnpaid, setIncludeUnpaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function download(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || from > to) {
      setError("Pick a From date that's on or before the To date.");
      return;
    }
    setError(null);
    const qs = new URLSearchParams({ from, to, ...(includeUnpaid ? { includeUnpaid: "1" } : {}) });
    // The response is a file download, so the page stays where it is.
    window.location.href = `/api/admin/orders/export?${qs}`;
  }

  return (
    <details className="surface-card rounded-2xl px-5 py-4">
      <summary className="text-text-primary cursor-pointer text-sm font-[600]">Export to spreadsheet</summary>
      <form onSubmit={download} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="export-from">From</Label>
            <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="export-to">To</Label>
            <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <label className="text-text-secondary flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeUnpaid} onChange={(e) => setIncludeUnpaid(e.target.checked)} />
          Include unpaid checkouts
        </label>
        <p className="text-text-muted text-xs">
          A CSV file for Excel or Google Sheets, one row per order (India time). It contains customer
          names, phone numbers and addresses, so keep it private.
        </p>
        {error && <p className="text-error text-sm">{error}</p>}
        <div>
          <Button variant="primary" size="md" type="submit">
            Download
          </Button>
        </div>
      </form>
    </details>
  );
}
