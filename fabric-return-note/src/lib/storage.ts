"use client";

import { FabricReturnNote } from "@/lib/types";

const STORAGE_KEY = "fabric_return_notes_v1";

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function listNotes(): FabricReturnNote[] {
  if (typeof window === "undefined") return [];
  const raw = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(raw)) return [];
  return raw as FabricReturnNote[];
}

export function saveNotes(notes: FabricReturnNote[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function upsertNote(note: FabricReturnNote) {
  const notes = listNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  const next = idx >= 0 ? notes.map((n) => (n.id === note.id ? note : n)) : [note, ...notes];
  saveNotes(next);
}

export function addNote(note: FabricReturnNote) {
  const notes = listNotes();
  saveNotes([note, ...notes]);
}

export function markReceived(noteId: string) {
  const notes = listNotes();
  const now = Date.now();
  const next = notes.map((n) => {
    if (n.id !== noteId) return n;
    if (n.status === "RECEIVED") return n;
    return { ...n, status: "RECEIVED", receivedAt: now };
  });
  saveNotes(next);
}

