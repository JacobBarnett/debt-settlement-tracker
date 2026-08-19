export type ClientStatus = "enrolled" | "negotiating" | "settled" | "cancelled";

export const CLIENT_STATUSES: ClientStatus[] = [
  "enrolled",
  "negotiating",
  "settled",
  "cancelled",
];

/** A client record as returned by the Laravel API's ClientResource. */
export interface Client {
  id: number;
  name: string;
  email: string;
  enrolled_debt: number;
  settled_amount: number;
  remaining_balance: number;
  progress_percentage: number;
  status: ClientStatus;
  created_at: string | null;
  updated_at: string | null;
}

/** The payload accepted by POST /api/clients. */
export interface NewClient {
  name: string;
  email: string;
  enrolled_debt: number;
  settled_amount: number;
  status: ClientStatus;
}

/** One month of the schedule returned by the Go payoff service. */
export interface PayoffMonth {
  month: number;
  date: string;
  projected_settled: number;
  remaining_balance: number;
}

/** The projection returned by the Go payoff service. */
export interface Payoff {
  months_remaining: number;
  estimated_payoff_date: string;
  total_remaining: number;
  schedule: PayoffMonth[];
}

/**
 * Error carrying per-field validation messages from the Laravel API so the
 * form can show them inline.
 */
export class ValidationError extends Error {
  readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}
