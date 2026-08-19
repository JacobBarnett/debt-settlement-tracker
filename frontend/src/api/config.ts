/**
 * Both backends are configured by environment variable so the static build can
 * be pointed at hosted services without a code change. The defaults match the
 * local development ports used in the README.
 */
export const CLIENTS_API_URL =
  import.meta.env.VITE_CLIENTS_API_URL ?? "http://localhost:8000/api";

export const PAYOFF_API_URL =
  import.meta.env.VITE_PAYOFF_API_URL ?? "http://localhost:8081";
