import type { ClientStatus } from "../types";

export function StatusBadge({ status }: { status: ClientStatus }) {
  return <span className={`badge badge--${status}`}>{status}</span>;
}
