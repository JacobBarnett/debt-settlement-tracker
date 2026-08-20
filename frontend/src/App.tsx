import { useCallback, useEffect, useMemo, useState } from "react";
import { AddClientForm } from "./components/AddClientForm";
import { ClientDetailModal } from "./components/ClientDetailModal";
import { ClientTable } from "./components/ClientTable";
import {
  createClient,
  deleteClient,
  fetchClients,
} from "./api/clients";
import { ValidationError, type Client, type NewClient } from "./types";
import { DEMO_MODE } from "./api/config";
import { formatCurrency } from "./format";
import "./App.css";

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setClients(await fetchClients());
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load clients: ${err.message}`
          : "Could not load clients.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  async function handleCreate(payload: NewClient) {
    setFieldErrors({});

    try {
      const created = await createClient(payload);
      setClients((current) => [created, ...current]);
      setError(null);
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err instanceof Error ? err.message : "Could not add client.");
      }
      throw err;
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`Remove ${client.name} from the program?`)) return;

    try {
      await deleteClient(client.id);
      setClients((current) => current.filter((c) => c.id !== client.id));
      if (selected?.id === client.id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete client.");
    }
  }

  // Portfolio-level totals for the header strip.
  const totals = useMemo(() => {
    const enrolled = clients.reduce((sum, c) => sum + c.enrolled_debt, 0);
    const settled = clients.reduce((sum, c) => sum + c.settled_amount, 0);

    return {
      enrolled,
      settled,
      active: clients.filter((c) =>
        c.status === "enrolled" || c.status === "negotiating",
      ).length,
      progress: enrolled > 0 ? (settled / enrolled) * 100 : 0,
    };
  }, [clients]);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Debt Settlement Tracker</h1>
          <p className="page__sub">
            Client enrollment, settlement progress, and projected payoff
            timelines.
          </p>
        </div>
        <div className="page__stats">
          <div className="stat">
            <span className="stat__label">Clients</span>
            <span className="stat__value">{clients.length}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Active</span>
            <span className="stat__value">{totals.active}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Enrolled debt</span>
            <span className="stat__value">
              {formatCurrency(totals.enrolled)}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Settled</span>
            <span className="stat__value">
              {formatCurrency(totals.settled)}{" "}
              <small>({totals.progress.toFixed(1)}%)</small>
            </span>
          </div>
        </div>
      </header>

      <main className="page__body">
        {DEMO_MODE && (
          <div className="alert alert--info">
            <span>
              <strong>Demo build.</strong> Client records are sample data kept in
              your browser, since the PHP/Laravel API runs locally rather than
              hosted. The payoff projections below are calculated by the real Go
              service, deployed here as a serverless function.
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert--error">
            <span>{error}</span>
            <button className="btn btn--ghost" onClick={() => void loadClients()}>
              Retry
            </button>
          </div>
        )}

        <AddClientForm onSubmit={handleCreate} fieldErrors={fieldErrors} />

        <section className="card">
          <div className="card__head">
            <h2 className="card__title">Enrolled clients</h2>
            <button className="btn btn--ghost" onClick={() => void loadClients()}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty">
              <p className="empty__title">Loading clients…</p>
            </div>
          ) : (
            <ClientTable
              clients={clients}
              onSelect={setSelected}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>

      <footer className="page__footer">
        <span>Clients API: PHP 8.3 · Laravel</span>
        <span>Payoff projections: Go</span>
        <span>UI: React · TypeScript · Vite</span>
      </footer>

      {selected && (
        <ClientDetailModal
          client={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
