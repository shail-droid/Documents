"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "rounded-md px-3 py-2 text-sm font-medium",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">
            Fabric Return Notes
          </div>
          <div className="truncate text-xs text-slate-500">
            Factory dispatch → Warehouse receipt ledger
          </div>
        </div>
        <nav className="flex shrink-0 items-center gap-2">
          <NavLink href="/new" label="New Return Note" />
          <NavLink href="/logbook" label="Log Book" />
        </nav>
      </div>
    </header>
  );
}

