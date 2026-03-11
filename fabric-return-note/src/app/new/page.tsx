"use client";

import { useMemo, useState } from "react";
import { addNote } from "@/lib/storage";
import { FabricReturnNote } from "@/lib/types";

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type FormState = {
  fabricCode: string;
  date: string;
  vendorName: string;
  styleCode: string;
  receivedQuantity: string;
  returnedQuantity: string;
  returnReason: string;
  challanNo: string;
};

const REASONS = [
  "Excess after cutting",
  "Shade mismatch / rejection",
  "Damage / contamination",
  "Over-supply",
  "Other"
];

export default function NewReturnNotePage() {
  const initial = useMemo<FormState>(
    () => ({
      fabricCode: "",
      date: todayISODate(),
      vendorName: "",
      styleCode: "",
      receivedQuantity: "",
      returnedQuantity: "",
      returnReason: "",
      challanNo: ""
    }),
    []
  );

  const [form, setForm] = useState<FormState>(initial);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.fabricCode.trim()) return "Fabric Code is required.";
    if (!form.date) return "Date is required.";
    if (!form.vendorName.trim()) return "Vendor Name is required.";
    if (!form.styleCode.trim()) return "Style Code is required.";
    const rq = Number(form.receivedQuantity);
    const retq = Number(form.returnedQuantity);
    if (!Number.isFinite(rq) || rq <= 0) return "Received Quantity must be > 0.";
    if (!Number.isFinite(retq) || retq <= 0) return "Returned Quantity must be > 0.";
    if (retq > rq) return "Returned Quantity cannot exceed Received Quantity.";
    if (!form.returnReason.trim()) return "Return Reason is required.";
    if (!form.challanNo.trim()) return "Challan No. is required.";
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const note: FabricReturnNote = {
      id: newId(),
      fabricCode: form.fabricCode.trim(),
      date: form.date,
      vendorName: form.vendorName.trim(),
      styleCode: form.styleCode.trim(),
      receivedQuantity: Number(form.receivedQuantity),
      returnedQuantity: Number(form.returnedQuantity),
      returnReason: form.returnReason.trim(),
      challanNo: form.challanNo.trim(),
      status: "PENDING",
      createdAt: Date.now()
    };

    addNote(note);
    setForm({ ...initial, date: todayISODate() });
    setSuccess("Return Note generated and saved.");
    window.setTimeout(() => setSuccess(null), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-lg font-semibold">New Fabric Return Note</div>
        <div className="mt-1 text-sm text-slate-600">
          Fill the dispatch details and generate a return note.
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-lg border border-slate-200 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Fabric Code</div>
            <input
              value={form.fabricCode}
              onChange={(e) => set("fabricCode", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. FAB-1029"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Date</div>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Vendor Name</div>
            <input
              value={form.vendorName}
              onChange={(e) => set("vendorName", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. ABC Textiles"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Style Code</div>
            <input
              value={form.styleCode}
              onChange={(e) => set("styleCode", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. STY-7781"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Received Quantity</div>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={form.receivedQuantity}
              onChange={(e) => set("receivedQuantity", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. 120"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Returned Quantity</div>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={form.returnedQuantity}
              onChange={(e) => set("returnedQuantity", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. 18"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm font-medium">Return Reason</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <select
                value={REASONS.includes(form.returnReason) ? form.returnReason : ""}
                onChange={(e) => set("returnReason", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Select a reason</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                value={REASONS.includes(form.returnReason) ? "" : form.returnReason}
                onChange={(e) => set("returnReason", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="Or type a custom reason"
              />
            </div>
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm font-medium">Challan No.</div>
            <input
              value={form.challanNo}
              onChange={(e) => set("challanNo", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. CH-000123"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-h-[20px] text-sm">
            {error ? (
              <span className="text-rose-700">{error}</span>
            ) : success ? (
              <span className="text-emerald-700">{success}</span>
            ) : (
              <span className="text-slate-500">
                New entries start as <span className="font-medium">Pending Receipt</span>.
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Generate Return Note
          </button>
        </div>
      </form>
    </div>
  );
}

