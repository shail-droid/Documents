import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Fabric Return Notes",
  description: "Track fabric return notes from factory to warehouse"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

