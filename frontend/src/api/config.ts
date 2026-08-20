/**
 * Both backends are configured by environment variable so the static build can
 * be pointed at hosted services without a code change. The defaults match the
 * local development ports used in the README.
 */
export const CLIENTS_API_URL =
  import.meta.env.VITE_CLIENTS_API_URL ?? "http://localhost:8000/api";

/**
 * An empty value means "same origin", which is how the hosted demo reaches the
 * Go function deployed alongside it at /api/project-payoff.
 */
export const PAYOFF_API_URL =
  import.meta.env.VITE_PAYOFF_API_URL ?? "http://localhost:8081";

/**
 * Demo builds have no PHP service to talk to, so client records are kept in the
 * browser instead. Payoff projections still go to the real Go service.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
