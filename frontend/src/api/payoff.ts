import { PAYOFF_API_URL } from "./config";
import type { Payoff } from "../types";

export interface PayoffInput {
  enrolled_debt: number;
  settled_amount: number;
  monthly_payment: number;
}

/** Calls the Go microservice for a month-by-month payoff projection. */
export async function projectPayoff(input: PayoffInput): Promise<Payoff> {
  const response = await fetch(`${PAYOFF_API_URL}/api/project-payoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Projection failed (status ${response.status})`);
  }

  return response.json() as Promise<Payoff>;
}
