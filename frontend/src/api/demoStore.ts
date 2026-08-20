import type { Client, NewClient } from "../types";
import { ValidationError } from "../types";

/**
 * A browser-only stand-in for the Laravel API, used by the hosted demo where
 * there is no PHP service to talk to. It mirrors the real API's behaviour --
 * including its validation rules -- so the UI code paths stay identical.
 *
 * Data lives in localStorage, so a visitor's edits survive a refresh without
 * affecting anyone else.
 */

const STORAGE_KEY = "debt-tracker-demo-clients";

const SEED: Omit<Client, "progress_percentage" | "remaining_balance">[] = [
  {
    id: 1,
    name: "Marcus Hale",
    email: "marcus.hale@example.com",
    enrolled_debt: 24800,
    settled_amount: 9200,
    status: "negotiating",
    created_at: "2026-03-14T10:00:00+00:00",
    updated_at: "2026-08-02T10:00:00+00:00",
  },
  {
    id: 2,
    name: "Priya Raman",
    email: "priya.raman@example.com",
    enrolled_debt: 12400,
    settled_amount: 12400,
    status: "settled",
    created_at: "2026-01-08T10:00:00+00:00",
    updated_at: "2026-07-21T10:00:00+00:00",
  },
  {
    id: 3,
    name: "Devon Brooks",
    email: "devon.brooks@example.com",
    enrolled_debt: 38150.5,
    settled_amount: 4500,
    status: "enrolled",
    created_at: "2026-06-02T10:00:00+00:00",
    updated_at: "2026-08-11T10:00:00+00:00",
  },
  {
    id: 4,
    name: "Ana Castillo",
    email: "ana.castillo@example.com",
    enrolled_debt: 7600,
    settled_amount: 2280,
    status: "negotiating",
    created_at: "2026-05-19T10:00:00+00:00",
    updated_at: "2026-08-09T10:00:00+00:00",
  },
  {
    id: 5,
    name: "Tom Whitfield",
    email: "tom.whitfield@example.com",
    enrolled_debt: 15900,
    settled_amount: 0,
    status: "cancelled",
    created_at: "2026-02-27T10:00:00+00:00",
    updated_at: "2026-04-30T10:00:00+00:00",
  },
];

type StoredClient = (typeof SEED)[number];

/** Mirrors the Client model's accessors so the shapes match the real API. */
function decorate(client: StoredClient): Client {
  const progress =
    client.enrolled_debt > 0
      ? Math.min((client.settled_amount / client.enrolled_debt) * 100, 100)
      : 0;

  return {
    ...client,
    progress_percentage: Math.round(progress * 100) / 100,
    remaining_balance:
      Math.round(Math.max(client.enrolled_debt - client.settled_amount, 0) * 100) / 100,
  };
}

function read(): StoredClient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredClient[];
  } catch {
    // Corrupt or unavailable storage just falls back to the seed data.
  }
  return SEED;
}

function write(clients: StoredClient[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch {
    // Private browsing can reject writes; the in-memory result still stands.
  }
}

/** Applies the same rules as StoreClientRequest on the Laravel side. */
function validate(payload: NewClient, existing: StoredClient[]): void {
  const errors: Record<string, string[]> = {};

  if (!payload.name.trim()) {
    errors.name = ["The name field is required."];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = ["The email field must be a valid email address."];
  } else if (existing.some((c) => c.email === payload.email)) {
    errors.email = ["The email has already been taken."];
  }
  if (!Number.isFinite(payload.enrolled_debt) || payload.enrolled_debt < 0.01) {
    errors.enrolled_debt = ["The enrolled debt must be greater than zero."];
  }
  if (!Number.isFinite(payload.settled_amount) || payload.settled_amount < 0) {
    errors.settled_amount = ["The settled amount field must be a number."];
  } else if (payload.settled_amount > payload.enrolled_debt) {
    errors.settled_amount = ["The settled amount cannot exceed the enrolled debt."];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("The submitted data was invalid.", errors);
  }
}

export function demoFetchClients(): Client[] {
  return read()
    .slice()
    .sort((a, b) => b.id - a.id)
    .map(decorate);
}

export function demoCreateClient(payload: NewClient): Client {
  const clients = read();
  validate(payload, clients);

  const now = new Date().toISOString();
  const created: StoredClient = {
    id: clients.reduce((max, c) => Math.max(max, c.id), 0) + 1,
    name: payload.name,
    email: payload.email,
    enrolled_debt: payload.enrolled_debt,
    settled_amount: payload.settled_amount,
    status: payload.status,
    created_at: now,
    updated_at: now,
  };

  write([...clients, created]);
  return decorate(created);
}

export function demoDeleteClient(id: number): void {
  write(read().filter((client) => client.id !== id));
}
