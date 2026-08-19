import type { Client } from "../types";
import { formatCurrency } from "../format";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

interface ClientTableProps {
  clients: Client[];
  onSelect: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({ clients, onSelect, onDelete }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">No clients enrolled yet</p>
        <p className="empty__hint">
          Add the first client using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Client</th>
            <th className="table__num">Enrolled debt</th>
            <th className="table__num">Settled</th>
            <th className="table__progress">Progress</th>
            <th>Status</th>
            <th className="table__actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>
                <button className="link-cell" onClick={() => onSelect(client)}>
                  {client.name}
                </button>
                <div className="table__sub">{client.email}</div>
              </td>
              <td className="table__num">
                {formatCurrency(client.enrolled_debt)}
              </td>
              <td className="table__num">
                {formatCurrency(client.settled_amount)}
              </td>
              <td className="table__progress">
                <ProgressBar percentage={client.progress_percentage} />
              </td>
              <td>
                <StatusBadge status={client.status} />
              </td>
              <td className="table__actions">
                <button
                  className="btn btn--ghost"
                  onClick={() => onSelect(client)}
                >
                  Projection
                </button>
                <button
                  className="btn btn--danger"
                  onClick={() => onDelete(client)}
                  aria-label={`Delete ${client.name}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
