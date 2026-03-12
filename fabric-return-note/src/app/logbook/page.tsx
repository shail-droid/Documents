"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { FabricReturnNote } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

function sortNewestFirst(a: FabricReturnNote, b: FabricReturnNote) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.createdAt - a.createdAt;
}

function mapRowToNote(row: any): FabricReturnNote {
  return {
    id: row.id,
    fabricCode: row.fabric_code,
    date: row.date,
    vendorName: row.vendor_name,
    styleCode: row.style_code,
    receivedQuantity: row.received_quantity,
    returnedQuantity: row.returned_quantity,
    uom: row.uom ?? undefined,
    returnReason: row.return_reason,
    challanNo: row.challan_no,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    receivedAt: row.received_at ? new Date(row.received_at).getTime() : undefined
  };
}

export default function LogBookPage() {
  const [notes, setNotes] = useState<FabricReturnNote[]>([]);
  const [pendingAck, setPendingAck] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fabricFilter, setFabricFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uomFilter, setUomFilter] = useState("");

  async function loadNotes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fabric_return_notes")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setMessage("Failed to load notes from Supabase.");
        return;
      }

      const active = (data ?? []).filter((row) => row.is_archived !== true);
      setNotes(active.map(mapRowToNote));
    } catch (err) {
      console.error(err);
      setMessage("Unexpected error while loading notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (fabricFilter.trim()) {
        const q = fabricFilter.trim().toLowerCase();
        if (!n.fabricCode.toLowerCase().includes(q)) return false;
      }
      if (startDate && n.date < startDate) return false;
      if (endDate && n.date > endDate) return false;
      if (uomFilter && n.uom !== uomFilter) return false;
      return true;
    });
  }, [notes, fabricFilter, startDate, endDate, uomFilter]);

  const pendingCount = useMemo(
    () => filteredNotes.filter((n) => n.status === "PENDING").length,
    [filteredNotes]
  );

  const uniqueUoms = useMemo(
    () =>
      Array.from(
        new Set(notes.map((n) => (n.uom || "").trim()).filter((v) => v))
      ).sort(),
    [notes]
  );

  function toggle(id: string, checked: boolean) {
    setPendingAck((m) => ({ ...m, [id]: checked }));
  }

  async function archiveNote(id: string) {
    try {
      const { error } = await supabase
        .from("fabric_return_notes")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) {
        console.error(error);
        setMessage("Failed to archive note. Please try again.");
        window.setTimeout(() => setMessage(null), 2500);
        return;
      }

      await loadNotes();
      setMessage("Note archived.");
      window.setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      console.error(err);
      setMessage("Unexpected error while archiving note.");
      window.setTimeout(() => setMessage(null), 2500);
    }
  }

  function downloadCsv() {
    const rows = filteredNotes;
    if (!rows.length) {
      setMessage("No records to export.");
      window.setTimeout(() => setMessage(null), 2000);
      return;
    }

    const headers = [
      "Status",
      "Date",
      "Fabric Code",
      "Vendor Name",
      "Style Code",
      "Received Qty",
      "Returned Qty",
      "UOM",
      "Return Reason",
      "Challan No."
    ];

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      const escaped = s.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const lines = [
      headers.map(escape).join(","),
      ...rows.map((n) =>
        [
          n.status,
          n.date,
          n.fabricCode,
          n.vendorName,
          n.styleCode,
          n.receivedQuantity,
          n.returnedQuantity,
          n.uom ?? "",
          n.returnReason,
          n.challanNo
        ]
          .map(escape)
          .join(",")
      )
    ];

    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fabric-return-notes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitAck(id: string) {
    const isChecked = !!pendingAck[id];
    if (!isChecked) {
      setMessage("Tick the checkbox first, then submit.");
      window.setTimeout(() => setMessage(null), 2500);
      return;
    }
    try {
      const { error } = await supabase
        .from("fabric_return_notes")
        .update({
          status: "RECEIVED",
          received_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("status", "PENDING");

      if (error) {
        console.error(error);
        setMessage("Failed to update status. Please try again.");
        window.setTimeout(() => setMessage(null), 2500);
        return;
      }

      toggle(id, false);
      await loadNotes();
      setMessage("Marked as Received and locked.");
      window.setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      console.error(err);
      setMessage("Unexpected error while updating status.");
      window.setTimeout(() => setMessage(null), 2500);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Log Book</div>
            <div className="mt-1 text-sm text-slate-600">
              All return notes from Supabase, newest-first. Pending:{" "}
              <span className="font-medium">{pendingCount}</span>
              {loading ? <span className="ml-2 text-xs">Loading…</span> : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-slate-600">
            {message ? <span className="text-slate-900">{message}</span> : null}
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <div className="text-xs font-medium uppercase text-slate-600">
              Fabric Code
            </div>
            <input
              value={fabricFilter}
              onChange={(e) => setFabricFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
              placeholder="Search by code"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium uppercase text-slate-600">
              Start Date
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium uppercase text-slate-600">
              End Date
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-medium uppercase text-slate-600">
              UOM
            </div>
            <select
              value={uomFilter}
              onChange={(e) => setUomFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
            >
              <option value="">All</option>
              {uniqueUoms.map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Fabric Code</th>
                <th className="px-3 py-3">Vendor Name</th>
                <th className="px-3 py-3">Style Code</th>
                <th className="px-3 py-3">Received Qty</th>
                <th className="px-3 py-3">Returned Qty</th>
                <th className="px-3 py-3">UOM</th>
                <th className="px-3 py-3">Return Reason</th>
                <th className="px-3 py-3">Challan No.</th>
                <th className="px-3 py-3">Acknowledge</th>
                <th className="px-3 py-3">Archive</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-slate-500" colSpan={10}>
                    No return notes yet. Create one from{" "}
                    <span className="font-medium">New Return Note</span>.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((n) => {
                  const pending = n.status === "PENDING";
                  const checked = !!pendingAck[n.id];
                  return (
                    <tr
                      key={n.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <StatusBadge status={n.status} />
                      </td>
                      <td className="px-3 py-3 tabular-nums">{n.date}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {n.fabricCode}
                      </td>
                      <td className="px-3 py-3">{n.vendorName}</td>
                      <td className="px-3 py-3">{n.styleCode}</td>
                      <td className="px-3 py-3 tabular-nums">
                        {n.receivedQuantity}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {n.returnedQuantity}
                      </td>
                      <td className="px-3 py-3">{n.uom}</td>
                      <td className="px-3 py-3">{n.returnReason}</td>
                      <td className="px-3 py-3">{n.challanNo}</td>
                      <td className="px-3 py-3">
                        {pending ? (
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 text-slate-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => toggle(n.id, e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300"
                              />
                              <span className="text-xs">Tick</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => submitAck(n.id)}
                              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                            >
                              Submit
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => archiveNote(n.id)}
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

