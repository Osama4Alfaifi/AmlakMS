"use client";

import { quotes as seedQuotes } from "./mock-data";
import type { Quote } from "./types";

const KEY = "amlakms.quotes.extra";

function readExtra(): Quote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Quote[]) : [];
  } catch {
    return [];
  }
}

function writeExtra(list: Quote[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAllQuotes(): Quote[] {
  return [...readExtra(), ...seedQuotes];
}

export function getQuoteById(id: string): Quote | undefined {
  return getAllQuotes().find((q) => q.id === id);
}

export function addQuote(quote: Quote) {
  const extra = readExtra();
  writeExtra([quote, ...extra]);
}

export function nextQuoteNumber(): string {
  const year = new Date().getFullYear();
  const count = getAllQuotes().length + 1;
  return `QT-${year}-${String(200 + count).padStart(3, "0")}`;
}
